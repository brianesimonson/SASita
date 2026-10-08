// A bounded common-format/informat subset. Date arithmetic always uses UTC.
const formatEpoch = Date.UTC(1960,0,1), formatDay = 86400000;
const formatMonths = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const informatDefaults = {comma:1,dollar:1,percent:6,date:7,mmddyy:6,ddmmyy:6,yymmdd:6,datetime:18};
const formatDefaults = {f:12,z:1,best:12,comma:12,dollar:12,percent:8,date:7,mmddyy:8,ddmmyy:8,yymmdd:8,yymmddn:8,monyy:5,time:8,hhmm:5,datetime:16,e8601da:10,e8601dt:19,hex:16};
for (const root of ['mmddyy','ddmmyy','yymmdd']) for (const suffix of ['b','c','d','n','p','s']) formatDefaults[root+suffix]=8;

export function parseFormat(spec, mode = 'format') {
  if (typeof spec !== 'string') throw new Error('A literal format/informat specification is required');
  const s = spec.toLowerCase();
  let name, width, decimals, explicitDecimals = false;
  let m = s.match(/^\$(char|upcase|f)?(\d*)\.?$/);
  if (m) {
    name = '$'+(m[1] === 'f' ? '' : (m[1] || ''));
    width = m[2] ? +m[2] : 8;
    decimals = 0;
  } else {
    m = s.match(/^(\d+)\.(\d*)$/);
    if (m) {name='f';width=+m[1];decimals=+(m[2]||0);explicitDecimals=Boolean(m[2]);}
    else {
      const match = Object.keys(formatDefaults).sort((a,b)=>b.length-a.length).find(n=>new RegExp('^'+n+'(?:\\d+)?(?:\\.\\d*)?$').test(s));
      if (!match) throw new Error('Unsupported '+mode+' '+spec);
      name=match;
      m=s.slice(name.length).match(/^(\d*)(?:\.(\d*))?$/);
      width=m[1] ? +m[1] : (mode==='informat' ? informatDefaults[name] ?? formatDefaults[name] : formatDefaults[name]);
      explicitDecimals=Boolean(m[2]);
      decimals=explicitDecimals ? +m[2] : (mode==='format' && name==='dollar' ? 2 : 0);
    }
  }
  if (!Number.isInteger(width) || width < 1 || width > (name.startsWith('$') ? 32767 : (name==='datetime' || name==='e8601dt' ? 40 : 32)))
    throw new Error('Invalid width for '+spec);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 15 || mode==='format' && decimals >= width)
    throw new Error('Decimal precision must be 0–15 and less than the width: '+spec);
  if (!['f','z','best','comma','dollar','percent','time','hhmm','datetime','e8601dt'].includes(name) && explicitDecimals)
    throw new Error('Decimal precision is not supported for '+spec);
  const dateRanges={date:[5,11],mmddyy:[2,10],ddmmyy:[2,10],yymmdd:[2,10],monyy:[5,7]};
  for (const root of ['mmddyy','ddmmyy','yymmdd']) for (const suffix of ['b','c','d','n','p','s']) dateRanges[root+suffix]=[2,suffix==='n'?8:10];
  if (dateRanges[name] && mode==='format' && (width<dateRanges[name][0] || width>dateRanges[name][1]))
    throw new Error('Unsupported width for '+spec);
  if (mode==='informat' && !['f','best','comma','dollar','percent','date','mmddyy','ddmmyy','yymmdd','time','datetime','e8601da','e8601dt','$','$char','$upcase'].includes(name))
    throw new Error('Unsupported informat '+spec);
  const inputMin={date:7,mmddyy:6,ddmmyy:6,yymmdd:6,time:5,datetime:13};
  if(mode==='informat' && inputMin[name] && width<inputMin[name])throw new Error('Invalid informat width for '+spec);
  if ((name==='e8601da' && width!==10) || (name==='e8601dt' && width !== 19+(decimals ? 1+decimals : 0)))
    throw new Error('ISO format width must fit the full representation: '+spec);
  if (name==='hex' && width!==16) throw new Error('Only HEX16. floating-point output is implemented');
  if (name==='hhmm' && width<5+(decimals?1+decimals:0)) throw new Error('HHMM requires width at least 5 plus fractional precision');
  if (name==='time' && mode==='format' && width < 8+(decimals ? 1+decimals : 0))
    throw new Error('TIME requires width at least 8 plus fractional precision');
  if (name==='datetime' && mode==='format' && width < 16+(decimals ? 1+decimals : 0))
    throw new Error('DATETIME requires a full date/time width; shortened forms are not implemented');
  return {name,width,decimals};
}

function formatDateParts(value, seconds = false) {
  const d = new Date(formatEpoch + (seconds ? value*1000 : Math.floor(value)*formatDay));
  if (!Number.isFinite(+d) || d.getUTCFullYear()<1 || d.getUTCFullYear()>9999) return null;
  return {date:d,year:String(d.getUTCFullYear()).padStart(4,'0'),month:String(d.getUTCMonth()+1).padStart(2,'0'),day:String(d.getUTCDate()).padStart(2,'0'),mon:formatMonths[d.getUTCMonth()]};
}
function formatClock(value, decimals) {
  const rounded = Number(Math.abs(value).toFixed(decimals));
  const hours=Math.floor(rounded/3600), minutes=Math.floor(rounded/60)%60, seconds=(rounded%60).toFixed(decimals).padStart(decimals ? 3+decimals : 2,'0');
  return `${value<0?'-':''}${hours}:${String(minutes).padStart(2,'0')}:${seconds}`;
}
function formatDateText(parts, name, width) {
  const {year,month,day,mon}=parts;
  if (name==='date') return width>=11 ? `${day}-${mon}-${year}` : `${day}${mon}`+(width>=9?year:width>=7?year.slice(-2):'');
  if (name==='monyy') return mon+(width>=7?year:year.slice(-2));
  if (name==='e8601da') return `${year}-${month}-${day}`;
  const root=name.slice(0,6), suffix=name.slice(6);
  const noSeparator=suffix==='n';
  const yy = width>=(noSeparator?8:10) ? year : year.slice(-2);
  const fields = root==='mmddyy' ? [month,day,yy] : root==='ddmmyy' ? [day,month,yy] : [yy,month,day];
  if(width<=3)return fields[0];
  if(width===4)return fields.slice(0,2).join('');
  const separator=({b:' ',c:':',d:'-',n:'',p:'.',s:'/'})[suffix] ?? (root==='yymmdd'?'-':'/');
  if(width===5)return fields.slice(0,2).join(separator);
  return fields.join(width<=7 ? '' : separator);
}
export function formatValue(value, spec, options = {}) {
  const f = typeof spec==='string' ? parseFormat(spec) : spec;
  const char = f.name.startsWith('$');
  let result;
  if (char) {
    if (typeof value!=='string') throw new Error('Character format requires a character value');
    result = String(value ?? '');
    if (f.name==='$upcase') result=result.toUpperCase();
    result=result.slice(0,f.width);
  } else {
    if (value==null || Number.isNaN(value)) result='.';
    else {
      if (typeof value!=='number' || !Number.isFinite(value)) throw new Error('Numeric format requires a finite numeric value');
      if (['f','z','comma','dollar','percent'].includes(f.name)) {
        const n=f.name==='percent'?value*100:value;
        if(!Number.isFinite(n))result='*'.repeat(f.width);
        else if (['comma','dollar'].includes(f.name))result=(f.name==='dollar'?'$':'')+n.toLocaleString('en-US',{minimumFractionDigits:f.decimals,maximumFractionDigits:f.decimals});
        else result=n.toFixed(f.decimals)+(f.name==='percent'?'%':'');
        if(f.name==='z' && result.length<=f.width)result=result.startsWith('-')?'-'+result.slice(1).padStart(f.width-1,'0'):result.padStart(f.width,'0');
      } else if(f.name==='hex'){const b=new ArrayBuffer(8),view=new DataView(b);view.setFloat64(0,value,false);result=Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();}
      else if(f.name==='best')result=String(value); // Deliberately bounded, not SAS BEST's adaptive algorithm.
      else if(f.name==='time')result=formatClock(value,f.decimals);
      else if(f.name==='hhmm') {
        const minutes=Number((Math.abs(value)/60).toFixed(f.decimals));
        result=value<0||value>=86400?'*'.repeat(f.width):`${Math.floor(minutes/60)}:${(minutes%60).toFixed(f.decimals).padStart(f.decimals?3+f.decimals:2,'0')}`;
      } else if(f.name==='datetime' || f.name==='e8601dt') {
        const rounded=Number(value.toFixed(f.decimals));
        const parts=formatDateParts(Math.floor(rounded),true);
        if (!parts)result='*'.repeat(f.width);
        else {
          const hours=String(parts.date.getUTCHours()).padStart(2,'0'), minutes=String(parts.date.getUTCMinutes()).padStart(2,'0'), seconds=String(parts.date.getUTCSeconds()).padStart(2,'0');
          const fraction=f.decimals ? '.'+Math.round((rounded-Math.floor(rounded))*10**f.decimals).toString().padStart(f.decimals,'0') : '';
          const date=f.name==='e8601dt'?`${parts.year}-${parts.month}-${parts.day}`:`${parts.day}${parts.mon}${f.width-f.decimals-(f.decimals?1:0)>=19?parts.year:parts.year.slice(-2)}`;
          result=date+(f.name==='e8601dt'?'T':':')+`${hours}:${minutes}:${seconds}${fraction}`;
        }
      } else {
        const parts=formatDateParts(value);
        result=parts?formatDateText(parts,f.name,f.width):'*'.repeat(f.width);
      }
      if(result.length>f.width)result='*'.repeat(f.width); // No silent precision loss/adaptive SAS fallback.
    }
  }
  if(options.padded) {
    const alignment=options.alignment || (char?'l':'r');
    if (alignment==='l')return (options.alignment==='l'?result.trimStart():result).padEnd(f.width,' ');
    if (alignment==='c') {result=result.trim();return result.padStart(result.length+Math.floor((f.width-result.length)/2),' ').padEnd(f.width,' ');}
    return (char && options.alignment==='r' ? result.trim() : result).padStart(f.width,' ');
  }
  return result;
}
function formatYear(year) {
  // Fixed subset policy; a SAS session's YEARCUTOFF setting can differ.
  if(year>=0 && year<100)return year<26?2000+year:1900+year;
  return year;
}
function formatMakeDate(year, month, day) {
  if(![year,month,day].every(Number.isInteger) || year<1 || year>9999)return null;
  const d = new Date(0);d.setUTCHours(0,0,0,0);d.setUTCFullYear(year,month-1,day);
  return d.getUTCFullYear()===year && d.getUTCMonth()===month-1 && d.getUTCDate()===day ? (+d-formatEpoch)/formatDay : null;
}
export function readFormatted(value, spec) {
  const f=typeof spec==='string'?parseFormat(spec,'informat'):spec;
  if(typeof value!=='string')throw new Error('INPUT requires a character source');
  const raw=String(value??'').slice(0,f.width);
  if(f.name.startsWith('$'))return f.name==='$upcase'?raw.trimStart().toUpperCase():f.name==='$char'?raw:raw.trimStart();
  const s=raw.trim();
  if(!s || s==='.')return {value:null,invalid:false};
  let result=null;
  if(['f','best','comma','dollar','percent'].includes(f.name)) {
    let text=s;
    if(['comma','dollar','percent'].includes(f.name))text=text.replace(/[,\s$]/g,'');
    if(text.startsWith('(')&&text.endsWith(')'))text='-'+text.slice(1,-1);
    const percentage=f.name==='percent' && text.endsWith('%');
    if(percentage)text=text.slice(0,-1);
    if(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
      result=Number(text);
      if(!/[.eE]/.test(text) && f.decimals)result/=10**f.decimals;
      if(percentage)result/=100;
    }
  } else if(['date','mmddyy','ddmmyy','yymmdd','yymmddn','e8601da'].includes(f.name)) {
    let y,m,d,match;
    if(f.name==='date' && (match=s.match(/^(\d{1,2})[- ]?([a-z]{3})[- ]?(\d{2}|\d{4})$/i))) {
      d=+match[1];m=formatMonths.indexOf(match[2].toUpperCase())+1;y=formatYear(+match[3]);
    } else {
      let fields=s.split(/[-/ .]+/);
      if(fields.length===1 && /^\d+$/.test(s) && [6,8].includes(s.length)) {
        if(f.name.startsWith('yymmdd'))fields=[s.slice(0,s.length-4),s.slice(-4,-2),s.slice(-2)];
        else fields=[s.slice(0,2),s.slice(2,4),s.slice(4)];
      }
      if(fields.length===3 && fields.every(v=>/^\d+$/.test(v)) && (f.name!=='e8601da' || /^\d{4}-\d{2}-\d{2}$/.test(s))) {
        const ns=fields.map(Number);
        if(f.name==='mmddyy')[m,d,y]=ns;
        else if(f.name==='ddmmyy')[d,m,y]=ns;
        else if(['yymmdd','yymmddn','e8601da'].includes(f.name))[y,m,d]=ns;
        y=formatYear(y);
      }
    }
    if(y!=null)result=formatMakeDate(y,m,d);
  } else if(f.name==='time') {
    const m=s.match(/^(-)?(\d+):(\d{2})(?::(\d{2}(?:\.\d+)?))?(?:\s*(AM|PM))?$/i);
    if(m && +m[3]<60 && +(m[4]||0)<60 && (!m[5] || (!m[1] && +m[2]>=1 && +m[2]<=12))){let h=+m[2];if(m[5])h=h%12+(m[5].toUpperCase()==='PM'?12:0);result=(m[1]?-1:1)*(h*3600 + +m[3]*60 + +(m[4]||0));}
  } else if(f.name==='datetime' || f.name==='e8601dt') {
    let m,y,mo,d,h,mi,se;
    if(f.name==='datetime' && (m=s.match(/^(\d{1,2})([a-z]{3})(\d{2}|\d{4}):(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)$/i)))
      [d,mo,y,h,mi,se]=[+m[1],formatMonths.indexOf(m[2].toUpperCase())+1,formatYear(+m[3]),+m[4],+m[5],+m[6]];
    if(f.name==='e8601dt' && (m=s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)$/)))
      [y,mo,d,h,mi,se]=m.slice(1).map(Number);
    const date=y!=null?formatMakeDate(y,mo,d):null;
    if(date!=null && h<24 && mi<60 && se<60)result=date*86400+h*3600+mi*60+se;
  }
  return {value: typeof result==='number' && Number.isFinite(result)?result:null,invalid:result==null || !Number.isFinite(result)};
}
