const syntaxEntries=[
{
  "id": "means",
  "label": "PROC MEANS",
  "group": "Procedures",
  "syntax": "PROC MEANS DATA=table [NWAY] [MISSING] [NOPRINT] [VARDEF=DF|N] [MAXDEC=7] N NMISS SUM MEAN MIN MAX RANGE VAR STD STDERR CSS USS CV;\nCLASS category \u2026; BY [DESCENDING] variable \u2026; VAR numeric \u2026;\nOUTPUT OUT=summary N= MEAN= STD= VAR= / AUTONAME; RUN;",
  "description": "Unweighted statistics. Default N/MEAN/STD/MIN/MAX report. CLASS OUTPUT includes all _TYPE_ combinations and _FREQ_; inactive class values are blank/missing. NWAY removes subtotals. Missing CLASS rows excluded unless MISSING; analysis missing values handled per variable. OUTPUT without requests uses five _STAT_ rows. BY must be sorted. Up to 8 CLASS variables. WEIGHT/FREQ/quantiles/TYPES/WAYS are not supported.",
  "template": "proc means data=input_table n nmiss mean std var;\n    class category;\n    var value;\n    output out=summary n= mean= std= var= / autoname;\nrun;\n"
},
  {
    "id": "sort",
    "label": "PROC SORT",
    "group": "Procedures",
    "syntax": "PROC SORT DATA=table [OUT=table] [NODUPKEY] [EQUALS];\nBY [DESCENDING] variable …;\nRUN;",
    "description": "DATA= is required. OUT= defaults to the input. Stable sorting; NODUPKEY keeps the first row of each complete BY key. Missing numeric values sort first ascending.",
    "template": "proc sort data=input_table out=sorted_table;\n    by variable;\nrun;\n"
  },
  {
    "id": "import",
    "label": "PROC IMPORT",
    "group": "Procedures",
    "syntax": "PROC IMPORT DATAFILE='relative.csv' OUT=table DBMS=CSV [REPLACE];\n[GETNAMES=YES;] [GUESSINGROWS=MAX;]\nRUN;",
    "description": "Choose a project folder first. DATAFILE can also use a FILENAME alias. Only CSV, GETNAMES=YES and GUESSINGROWS=MAX. Named-library imports require REPLACE.",
    "template": "proc import datafile='inputs.csv' out=work.imported dbms=csv replace;\n    getnames=yes;\n    guessingrows=max;\nrun;\n"
  },
  {
    "id": "export",
    "label": "PROC EXPORT",
    "group": "Procedures",
    "syntax": "PROC EXPORT DATA=table OUTFILE='relative.csv' DBMS=CSV [REPLACE];\nRUN;",
    "description": "Choose a project folder first. OUTFILE can also use a FILENAME alias. Raw values are exported; existing files require REPLACE. Writes are staged until the program succeeds.",
    "template": "proc export data=work.results outfile='results.csv' dbms=csv replace;\nrun;\n"
  },
  {
    "id": "sgplot",
    "label": "PROC SGPLOT",
    "group": "Procedures",
    "syntax": "PROC SGPLOT DATA=table;\nSCATTER X=x Y=y / GROUP=category;\nHBAR category / RESPONSE=value STAT=SUM GROUP=group GROUPDISPLAY=STACK;\nVBAR category / RESPONSE=value STAT=MEAN GROUPDISPLAY=CLUSTER;\nHISTOGRAM value / NBINS=12 SCALE=COUNT;\nXAXIS LABEL='text'; YAXIS LABEL='text';\nRUN;",
    "description": "Use exactly ONE plot statement per procedure. SCATTER: optional GROUP. Bars: optional RESPONSE, STAT=FREQ/SUM/MEAN, GROUP, GROUPDISPLAY=STACK/CLUSTER. Default FREQ without RESPONSE, SUM with RESPONSE. Histogram: NBINS=1–100; SCALE=COUNT/PERCENT/PROPORTION (default PERCENT). Only axis LABEL supported. Missing values omitted. Automatic bins and rendering are not certified SAS equivalents.",
    "template": "proc sgplot data=work.results;\n    scatter x=x y=y;\n    xaxis label='X';\n    yaxis label='Y';\nrun;\n"
  },
  {
    "id": "sgpie",
    "label": "PROC SGPIE",
    "group": "Procedures",
    "syntax": "PROC SGPIE DATA=table;\nPIE category / RESPONSE=value STAT=SUM;\nRUN;",
    "description": "PIE only. Optional RESPONSE and STAT=FREQ/SUM/MEAN. Default FREQ without RESPONSE, SUM with RESPONSE. No GROUP or axis statements. Nonnegative slices and positive total required.",
    "template": "proc sgpie data=work.results;\n    pie category / response=value stat=sum;\nrun;\n"
  },
  {
    "id": "fn-abs",
    "label": "ABS",
    "group": "Functions",
    "syntax": "ABS(x)",
    "description": "Absolute value.",
    "template": "abs(-5)"
  },
  {
    "id": "fn-sqrt",
    "label": "SQRT",
    "group": "Functions",
    "syntax": "SQRT(x)",
    "description": "Square root; negative input returns numeric missing.",
    "template": "sqrt(9)"
  },
  {
    "id": "fn-ceil",
    "label": "CEIL",
    "group": "Functions",
    "syntax": "CEIL(x)",
    "description": "Round upward to an integer.",
    "template": "ceil(2.1)"
  },
  {
    "id": "fn-floor",
    "label": "FLOOR",
    "group": "Functions",
    "syntax": "FLOOR(x)",
    "description": "Round downward to an integer.",
    "template": "floor(2.9)"
  },
  {
    "id": "fn-int",
    "label": "INT",
    "group": "Functions",
    "syntax": "INT(x)",
    "description": "Truncate toward zero.",
    "template": "int(-2.9)"
  },
  {
    "id": "fn-round",
    "label": "ROUND",
    "group": "Functions",
    "syntax": "ROUND(x [, unit])",
    "description": "Round to a multiple of unit; default unit is 1. Ties follow JavaScript Math.round.",
    "template": "round(12.3,0.5)"
  },
  {
    "id": "fn-mod",
    "label": "MOD",
    "group": "Functions",
    "syntax": "MOD(x, divisor)",
    "description": "Remainder; zero divisor returns missing. Negative values follow JavaScript remainder semantics.",
    "template": "mod(10,3)"
  },
  {
    "id": "fn-sum",
    "label": "SUM",
    "group": "Functions",
    "syntax": "SUM(x, …)",
    "description": "Sum nonmissing numeric arguments; all missing returns missing.",
    "template": "sum(1,.,3)"
  },
  {
    "id": "fn-mean",
    "label": "MEAN",
    "group": "Functions",
    "syntax": "MEAN(x, …)",
    "description": "Mean of nonmissing numeric arguments.",
    "template": "mean(1,.,3)"
  },
  {
    "id": "fn-min",
    "label": "MIN",
    "group": "Functions",
    "syntax": "MIN(x, …)",
    "description": "Smallest nonmissing numeric argument.",
    "template": "min(1,.,3)"
  },
  {
    "id": "fn-max",
    "label": "MAX",
    "group": "Functions",
    "syntax": "MAX(x, …)",
    "description": "Largest nonmissing numeric argument.",
    "template": "max(1,.,3)"
  },
  {
    "id": "fn-missing",
    "label": "MISSING",
    "group": "Functions",
    "syntax": "MISSING(x)",
    "description": "1 for a missing value, otherwise 0.",
    "template": "missing(.)"
  },
  {
    "id": "fn-n",
    "label": "N",
    "group": "Functions",
    "syntax": "N(x, …)",
    "description": "Number of nonmissing numeric arguments.",
    "template": "n(1,.,3)"
  },
  {
    "id": "fn-nmiss",
    "label": "NMISS",
    "group": "Functions",
    "syntax": "NMISS(x, …)",
    "description": "Number of missing arguments; this implementation also counts empty strings.",
    "template": "nmiss(1,.,3)"
  },
  {
    "id": "fn-coalesce",
    "label": "COALESCE",
    "group": "Functions",
    "syntax": "COALESCE(x, …)",
    "description": "First nonmissing argument, or numeric missing. Numeric-only arguments are not enforced.",
    "template": "coalesce(.,7)"
  },
  {
    "id": "fn-coalescec",
    "label": "COALESCEC",
    "group": "Functions",
    "syntax": "COALESCEC(text, …)",
    "description": "First nonmissing argument, or an empty string. Character-only arguments are not enforced.",
    "template": "coalescec(\"\",\"ok\")"
  },
  {
    "id": "fn-upcase",
    "label": "UPCASE",
    "group": "Functions",
    "syntax": "UPCASE(text)",
    "description": "Convert to uppercase.",
    "template": "upcase(\"Ab\")"
  },
  {
    "id": "fn-lowcase",
    "label": "LOWCASE",
    "group": "Functions",
    "syntax": "LOWCASE(text)",
    "description": "Convert to lowercase.",
    "template": "lowcase(\"Ab\")"
  },
  {
    "id": "fn-strip",
    "label": "STRIP",
    "group": "Functions",
    "syntax": "STRIP(text)",
    "description": "Remove leading and trailing JavaScript whitespace.",
    "template": "strip(\"  abc  \")"
  },
  {
    "id": "fn-trim",
    "label": "TRIM",
    "group": "Functions",
    "syntax": "TRIM(text)",
    "description": "Remove trailing JavaScript whitespace.",
    "template": "trim(\"abc  \")"
  },
  {
    "id": "fn-left",
    "label": "LEFT",
    "group": "Functions",
    "syntax": "LEFT(text)",
    "description": "Remove leading whitespace; does not preserve SAS fixed-length padding.",
    "template": "left(\"  abc\")"
  },
  {
    "id": "fn-length",
    "label": "LENGTH",
    "group": "Functions",
    "syntax": "LENGTH(text)",
    "description": "Length after trailing whitespace removal; returns at least 1.",
    "template": "length(\"\")"
  },
  {
    "id": "fn-lengthn",
    "label": "LENGTHN",
    "group": "Functions",
    "syntax": "LENGTHN(text)",
    "description": "Length after trailing whitespace removal; empty text returns 0.",
    "template": "lengthn(\"\")"
  },
  {
    "id": "fn-substr",
    "label": "SUBSTR",
    "group": "Functions",
    "syntax": "SUBSTR(text, start [, count])",
    "description": "1-based substring; omitted count returns the rest. Assignment-form SUBSTR is unavailable.",
    "template": "substr(\"abcd\",2,2)"
  },
  {
    "id": "fn-index",
    "label": "INDEX",
    "group": "Functions",
    "syntax": "INDEX(text, search)",
    "description": "1-based position of first match; 0 if not found.",
    "template": "index(\"abcd\",\"bc\")"
  },
  {
    "id": "fn-cats",
    "label": "CATS",
    "group": "Functions",
    "syntax": "CATS(text, …)",
    "description": "Trim each argument and concatenate.",
    "template": "cats(\" a \",\" b \")"
  },
  {
    "id": "fn-catx",
    "label": "CATX",
    "group": "Functions",
    "syntax": "CATX(separator, text, …)",
    "description": "Trim arguments, omit empty ones, and join with separator.",
    "template": "catx(\"-\",\" a \",\"\",\" b \")"
  },
  {
    "id": "fn-today",
    "label": "TODAY",
    "group": "Functions",
    "syntax": "TODAY()",
    "description": "Current UTC date as days since 1960-01-01; browser timezone behavior can differ from SAS.",
    "template": "today()"
  },
  {
    "id": "fn-mdy",
    "label": "MDY",
    "group": "Functions",
    "syntax": "MDY(month, day, year)",
    "description": "Create a date in days since 1960-01-01. Use four-digit years; SAS YEARCUTOFF is unavailable.",
    "template": "mdy(1,1,2026)"
  },
  {
    "id": "fn-year",
    "label": "YEAR",
    "group": "Functions",
    "syntax": "YEAR(date)",
    "description": "Extract the UTC year from a SAS date.",
    "template": "year(\"01JAN2026\"d)"
  },
  {
    "id": "fn-month",
    "label": "MONTH",
    "group": "Functions",
    "syntax": "MONTH(date)",
    "description": "Extract the UTC month, 1–12.",
    "template": "month(\"01JAN2026\"d)"
  },
  {
    "id": "fn-day",
    "label": "DAY",
    "group": "Functions",
    "syntax": "DAY(date)",
    "description": "Extract the UTC day of month.",
    "template": "day(\"01JAN2026\"d)"
  },
  {
    "id": "fn-input",
    "label": "INPUT",
    "group": "Functions",
    "syntax": "INPUT(text, informat.)",
    "description": "Read text using a supported numeric, date/time, or character informat. Optional ? suppresses invalid-input notes; ?? also prevents setting _ERROR_. Width limits the text read.",
    "template": "input('1,234', comma8.)"
  },
  {
    "id": "fn-put",
    "label": "PUT",
    "group": "Functions",
    "syntax": "PUT(value, format.)",
    "description": "Return formatted text, with padding to the width. Optional -L, -C, or -R selects alignment. Format type must match the source.",
    "template": "put(1234, comma8.)"
  },
  {
    "id": "fn-rand",
    "label": "RAND",
    "group": "Functions",
    "syntax": "RAND('UNIFORM' [, a [, b]])",
    "description": "Use CALL STREAMINIT('MT32', positive_seed); first. MT2002 is an alias. First initialization wins within a DATA step. The MT19937 integer core is verified; uniform values match all 40,000 draws in the supplied SAS seed-12345 fixture. Other seeds and the polar normal sampler remain unverified against SAS sequences. Default MTHYBRID and other generators/distributions fail clearly.",
    "template": "rand('uniform')"
  },
  {
    "id": "fmt-0",
    "label": "w.d / Fw.d",
    "group": "Formats",
    "syntax": "w.d / Fw.d",
    "description": "Fixed decimal text; PUT pads to width.",
    "template": ""
  },
  {
    "id": "fmt-1",
    "label": "Zw.d",
    "group": "Formats",
    "syntax": "Zw.d",
    "description": "Leading zeros; negative signs preserved.",
    "template": ""
  },
  {
    "id": "fmt-2",
    "label": "BESTw.",
    "group": "Formats",
    "syntax": "BESTw.",
    "description": "Ordinary number text, not full SAS BEST adaptive precision.",
    "template": ""
  },
  {
    "id": "fmt-3",
    "label": "COMMAw.d",
    "group": "Formats",
    "syntax": "COMMAw.d",
    "description": "US grouping; default precision 0.",
    "template": ""
  },
  {
    "id": "fmt-4",
    "label": "DOLLARw.d",
    "group": "Formats",
    "syntax": "DOLLARw.d",
    "description": "US dollar prefix; default precision 2.",
    "template": ""
  },
  {
    "id": "fmt-5",
    "label": "PERCENTw.d",
    "group": "Formats",
    "syntax": "PERCENTw.d",
    "description": "Display a fraction as a percent; default precision 0.",
    "template": ""
  },
  {
    "id": "fmt-6",
    "label": "HEX16.",
    "group": "Formats",
    "syntax": "HEX16.",
    "description": "IEEE-754 double bit representation. Other HEX widths are unavailable.",
    "template": ""
  },
  {
    "id": "fmt-7",
    "label": "DATEw.",
    "group": "Formats",
    "syntax": "DATEw.",
    "description": "Day and month, with 2/4-digit year or hyphens according to width 5–11.",
    "template": ""
  },
  {
    "id": "fmt-8",
    "label": "MMDDYYw.",
    "group": "Formats",
    "syntax": "MMDDYYw.",
    "description": "Month/day/year. B/C/D/N/P/S separator variants supported.",
    "template": ""
  },
  {
    "id": "fmt-9",
    "label": "DDMMYYw.",
    "group": "Formats",
    "syntax": "DDMMYYw.",
    "description": "Day/month/year. B/C/D/N/P/S separator variants supported.",
    "template": ""
  },
  {
    "id": "fmt-10",
    "label": "YYMMDDw.",
    "group": "Formats",
    "syntax": "YYMMDDw.",
    "description": "Year/month/day. Variants include YYMMDDN8. → 20180315.",
    "template": ""
  },
  {
    "id": "fmt-11",
    "label": "MONYYw.",
    "group": "Formats",
    "syntax": "MONYYw.",
    "description": "Widths 5–7 choose 2/4-digit year.",
    "template": ""
  },
  {
    "id": "fmt-12",
    "label": "TIMEw.d",
    "group": "Formats",
    "syntax": "TIMEw.d",
    "description": "Seconds since midnight, or signed duration; full clock widths only.",
    "template": ""
  },
  {
    "id": "fmt-13",
    "label": "HHMMw.d",
    "group": "Formats",
    "syntax": "HHMMw.d",
    "description": "Hours/minutes, including fractional minutes. Values outside 0–24 hours show stars.",
    "template": ""
  },
  {
    "id": "fmt-14",
    "label": "DATETIMEw.d",
    "group": "Formats",
    "syntax": "DATETIMEw.d",
    "description": "Seconds since 1960-01-01; full date/time widths only.",
    "template": ""
  },
  {
    "id": "fmt-15",
    "label": "E8601DA10.",
    "group": "Formats",
    "syntax": "E8601DA10.",
    "description": "ISO date, timezone independent.",
    "template": ""
  },
  {
    "id": "fmt-16",
    "label": "E8601DTw.d",
    "group": "Formats",
    "syntax": "E8601DTw.d",
    "description": "ISO datetime; full width only, no timezone suffix.",
    "template": ""
  },
  {
    "id": "fmt-17",
    "label": "$w. / $Fw.",
    "group": "Formats",
    "syntax": "$w. / $Fw.",
    "description": "Character width truncation and padding in PUT.",
    "template": ""
  },
  {
    "id": "fmt-18",
    "label": "$CHARw.",
    "group": "Formats",
    "syntax": "$CHARw.",
    "description": "Character text; leading blanks preserved.",
    "template": ""
  },
  {
    "id": "fmt-19",
    "label": "$UPCASEw.",
    "group": "Formats",
    "syntax": "$UPCASEw.",
    "description": "Uppercase character text with width handling.",
    "template": ""
  },
  {
    "id": "data",
    "label": "DATA step",
    "group": "Statements",
    "syntax": "DATA output; SET input;\n/* assignments and statements */\nRUN;",
    "description": "Supported: SET, match MERGE with BY, IF/THEN/ELSE, subsetting IF, DO/END and indexed DO/TO/BY, DELETE, STOP, OUTPUT (named outputs), KEEP, DROP, RETAIN, sum statements, character LENGTH and FORMAT. Input KEEP=, DROP=, RENAME= and IN= supported; output dataset options and arrays unsupported. FIRST.variable/LAST.variable require sorted BY data.",
    "template": "data results;\n    set input_table;\n    new_value = value * 2;\nrun;\n"
  },
  {
    "id": "libname",
    "label": "LIBNAME",
    "group": "Statements",
    "syntax": "LIBNAME alias 'relative-folder';\nLIBNAME alias CLEAR;",
    "description": "Existing project subfolders or root ('.') only. Named tables persist as versioned .sassy-table.json files; WORK is temporary. Reassign after reopening. Choose project folder before running.",
    "template": "libname saved 'tables';\n"
  },
  {
    "id": "filename",
    "label": "FILENAME",
    "group": "Statements",
    "syntax": "FILENAME alias 'relative.csv';",
    "description": "Scoped CSV aliases for PROC IMPORT/EXPORT. Absolute paths, URLs and parent traversal unavailable.",
    "template": "filename source 'inputs.csv';\n"
  },
  {
    "id": "title",
    "label": "TITLE",
    "group": "Statements",
    "syntax": "TITLE 'Chart title';\nTITLE;",
    "description": "Sets or resets the chart title across successful runs. Maximum 200 characters.",
    "template": "title 'Chart title';\n"
  },
  {
    "id": "streaminit",
    "label": "CALL STREAMINIT",
    "group": "Statements",
    "syntax": "CALL STREAMINIT('MT32', seed);",
    "description": "Explicit MT32 generator. Seed-12345 uniform draws have a 40,000-draw SAS fixture; normal sequences and other seeds have not been validated against SAS.",
    "template": "call streaminit('MT32', 12345);\n"
  },
  {
    "id": "macros",
    "label": "Macros",
    "group": "Macros",
    "syntax": "%LET name=value;\n%MACRO name(arg, option=value); … %MEND name;\n%name(argument);",
    "description": "Supported: %LET, &name / &name., %MACRO/%MEND positional and keyword arguments, %LOCAL/%GLOBAL, %IF/%THEN/%ELSE, %DO/%END with %TO/%BY, %PUT, integer %EVAL and %UPCASE. Definitions reset each Run. No %SYSFUNC, macro quoting or indirect && references.",
    "template": "%macro transform(source, out);\n    data &out;\n        set &source;\n    run;\n%mend transform;\n%transform(input_table, results);\n"
  }
];
export function syntaxCatalog(){return syntaxEntries;}
// Tolerant cursor scanner: skip comments and quoted text, never execute or expand source.
export function syntaxContext(source, cursor=source.length){
 const text=source.slice(0,cursor), tokens=[];
 const re=/\/\*[\s\S]*?(?:\*\/|$)|(?:^|(?<=;))\s*\*[^;]*(?:;|$)|%\*[^;]*(?:;|$)|'(?:''|[^'])*(?:'|$)|"(?:""|[^"])*(?:"|$)|%?[a-z_]\w*|[();]/gi;
 for(const m of text.matchAll(re)){const t=m[0].trim();if(t.startsWith('/*')||t.startsWith('*')||t.startsWith('%*')||t.startsWith("'")||t.startsWith('"'))continue;tokens.push(t.toLowerCase());}
 let block=null,statement=[],stack=[],macroActive=false;
 for(let i=0;i<tokens.length;i++){
  const t=tokens[i];statement.push(t);
  if(t==='(')stack.push(tokens[i-1]);else if(t===')')stack.pop();
  if(statement[0]==='proc'&&statement.length===2)block=syntaxEntries.find(e=>e.id===t&&e.group==='Procedures')?.id||null;
  if(statement[0]==='data')block='data';
  if(statement[0]==='%macro')macroActive=true;
  if(statement[0]==='%mend')macroActive=false;
  if(t===';'){if(['run','quit'].includes(statement[0]))block=null;statement=[];stack=[];}
 }
 const current=tokens.at(-1),fn=syntaxEntries.find(e=>e.id==='fn-'+current)||[...stack].reverse().map(n=>syntaxEntries.find(e=>e.id==='fn-'+n)).find(Boolean);
 if(fn)return fn.id;
 if(statement[0]==='call'&&statement[1]==='streaminit')return 'streaminit';
 if(['libname','filename','title'].includes(statement[0]))return statement[0];
 if(statement[0]?.startsWith('%'))return 'macros';
 if(statement[0]==='format')return 'formats';
 return block||(macroActive?'macros':null);
}
export function createSyntaxHelp(){
 const get=id=>document.getElementById(id),code=get('code'),panel=get('syntaxpanel'),toggle=get('syntaxhelp');
 let following=true,current=null;
 function render(){
  get('syntaxcontext').textContent=following?'Cursor context':'Browsing catalog';
  const selected=get('syntaxentry').value;current=syntaxEntries.find(e=>e.id===selected);
  get('syntaxtitle').textContent=current?.label||'Supported syntax';
  get('syntaxspec').textContent=current?.syntax||'Select an entry or move the cursor into a supported procedure or function.';
  get('syntaxdescription').textContent=current?.description||'This catalog describes Sassy’s implemented subset, not the complete SAS language. Templates contain example names: edit them before Run.';
  get('syntaxinsert').disabled=!current?.template;
 }
 function filter(selected){const search=get('syntaxsearch').value.trim().toLowerCase();get('syntaxentry').replaceChildren();for(const entry of syntaxEntries.filter(e=>(e.label+' '+e.group+' '+e.description).toLowerCase().includes(search))){const opt=document.createElement('option');opt.value=entry.id;opt.textContent=entry.group+' · '+entry.label;get('syntaxentry').append(opt);}if(selected&&[...get('syntaxentry').options].some(o=>o.value===selected))get('syntaxentry').value=selected;render();}
 function update(){if(panel.hidden||!following)return;const context=syntaxContext(code.value,code.selectionStart);get('syntaxcontext').textContent=context?'Cursor context':'Browse supported syntax';get('syntaxsearch').value='';filter(context==='formats'?syntaxEntries.find(e=>e.group==='Formats')?.id:context);if(!context){get('syntaxentry').selectedIndex=-1;render();}}
 toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));update();};
 get('syntaxclose').onclick=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();};
 get('syntaxfollow').onchange=()=>{following=get('syntaxfollow').checked;update();};
 get('syntaxsearch').oninput=()=>{following=false;get('syntaxfollow').checked=false;filter();};
 get('syntaxentry').onchange=()=>{following=false;get('syntaxfollow').checked=false;render();};
 get('syntaxinsert').onclick=()=>{if(!current?.template)return;code.setRangeText(current.template,code.selectionStart,code.selectionEnd,'end');code.dispatchEvent(new Event('input'));code.focus();};
 let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(update,80);};
 for(const event of ['input','click','keyup','select','focus'])code.addEventListener(event,schedule);
 code.addEventListener('keydown',e=>{if(e.ctrlKey&&e.code==='Space'){e.preventDefault();panel.hidden=false;toggle.setAttribute('aria-expanded','true');following=true;get('syntaxfollow').checked=true;update();}});
 filter();
}
