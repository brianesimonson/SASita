// Execute the actual app engine, verify independent expectations, save raw CSVs.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {run,csv,parseCSV} from '../dist/engine.mjs';
const folder=resolve(process.argv[2]||'/tmp/sasita-validation-results');
await mkdir(folder,{recursive:true});
const helper=await readFile('examples/validation/03-sas-comparison.sas','utf8');
const files=[];
for(const program of ['01-calculations.sas','02-merge.sas']) {
  const code=await readFile(`examples/validation/${program}`,'utf8');
  assert.ok(helper.includes(code),`${program}: helper embeds fresh reference program unchanged`);
  const result=run(code,{});
  if(program.startsWith('01')) {
    const inputs=result.datasets.numeric_inputs.rows, rows=result.datasets.numeric_results.rows;
    assert.equal(inputs.length,20000);assert.equal(rows.length,20000);
    const isolated=helper.match(/\/\* BEGIN SAME INPUT CALCULATIONS \*\/([\s\S]*?)\/\* END SAME INPUT CALCULATIONS \*\//);
    assert.ok(isolated,'isolated calculation section exists');
    const snapshot=JSON.stringify(result.datasets);
    const same=run(isolated[1],{...result.datasets,app_numeric_inputs:result.datasets.numeric_inputs});
    assert.equal(JSON.stringify(result.datasets),snapshot,'original reference objects unchanged');
    for(const name of ['numeric_inputs','numeric_results','numeric_summary'])assert.deepEqual(same.datasets[name],result.datasets[name],'original reference datasets preserved');
    assert.deepEqual(same.datasets.same_results,result.datasets.numeric_results,'isolated computations reproduce results');

    const repeat=run(code,{});
    assert.deepEqual(repeat.datasets.numeric_inputs,result.datasets.numeric_inputs,'seeded rerun must reproduce inputs');
    for(let i=1;i<=20000;i++) {
      const r=rows[i-1], x=i,y=i+20000;
      assert.equal(r.id,i);assert.equal(r.systematic_x,x);assert.equal(r.systematic_y,y);
      assert.ok(r.random_x>0&&r.random_x<1&&r.random_y>0&&r.random_y<1);
      assert.equal(r.s_add,2*i+20000);assert.equal(r.s_sum,r.s_add);
      assert.equal(r.s_subtract,20000);assert.equal(r.s_multiply,i*i+20000*i);
      assert.equal(r.s_square,i*i);assert.equal(r.s_cube,i*i*i);
      assert.equal(r.s_mean,i+10000);assert.equal(r.s_min,i);assert.equal(r.s_max,y);
      assert.ok(Math.abs(r.s_sqrt*r.s_sqrt-x)<=1e-10);
      assert.ok(Math.abs(r.s_cuberoot**3-x)<=1e-9);
      assert.ok(Math.abs(r.s_divide*y-x)<=1e-10);
      assert.equal(r.missing_add,i%10===0?null:2*i+20000);
      assert.equal(r.missing_sum,i%10===0?y:2*i+20000);
      assert.equal(r.missing_mean,i%10===0?y:i+10000);
      assert.equal(r.missing_min,i%10===0?y:i);assert.equal(r.missing_max,y);
    }
    const n=20000,sum=n*(n+1)/2,squares=n*(n+1)*(2*n+1)/6;
    assert.deepEqual({...result.datasets.numeric_summary.rows[0]}, {
      count:n,total_x:sum,total_y:sum+20000*n,total_product:squares+20000*sum,total_missing:n/10
    });
  } else {
    const rows=result.datasets.merge_results.rows;
    assert.equal(rows.length,40000);
    let offset=0;
    for(let id=1;id<=15000;id++) {
      const left=id<=10000,right=id>=5001,count=right?3:2;
      for(let index=1;index<=count;index++) {
        const r=rows[offset++],li=left?Math.min(index,2):null,ri=right?index:null;
        assert.equal(r.merge_row,offset);assert.equal(r.id,id);
        assert.equal(r.left_index,li);assert.equal(r.right_index,ri);
        assert.equal(r.has_left,+left);assert.equal(r.has_right,+right);
        assert.equal(r.first_id,+(index===1));assert.equal(r.last_id,+(index===count));
        const lv=left?id*10+li:null,rv=right?id*100+ri:null;
        assert.equal(r.left_value,lv);assert.equal(r.right_value,rv);
        assert.equal(r.shared,right?rv:lv);assert.equal(r.combined,(lv??0)+(rv??0));
      }
    }
    assert.deepEqual({...result.datasets.merge_summary.rows[0]}, {
      row_count:40000,group_count:15000,left_only:10000,matched:15000,right_only:15000
    });
    assert.deepEqual(result.datasets.shared_results.rows.map(r=>r.shared),[100,12,200,22,300,32]);
  }
  const names=program.startsWith('01')?['numeric_inputs','numeric_results','numeric_summary']:['merge_results','merge_summary','shared_results'];
  for(const name of names) {
    const definition=helper.match(new RegExp(`%load_app\\(${name},([\\s\\S]*?)\\);`));
    assert.ok(definition,`SAS helper needs an explicit schema for ${name}`);
    const fields=[...definition[1].matchAll(/(\w+)\s*:\s*(\$16\.|best32\.)/gi)];
    const ds=result.datasets[name];
    assert.deepEqual(fields.map(f=>f[1]),ds.columns,`${name}: SAS input order matches CSV header`);
    for(const [,column,informat] of fields)assert.equal(informat.startsWith('$'),ds.types[column]==='char',`${name}.${column}: SAS input type`);
    assert.ok(definition[1].includes(`expected=${ds.rows.length}`),`${name}: SAS row-count guard`);
    const data=csv(ds)+'\r\n';
    assert.deepEqual(parseCSV(data).rows.map(r=>({...r})),ds.rows.map(r=>({...r})),'raw CSV round-trip');
    await writeFile(`${folder}/${name}.csv`,data);
    files.push({file:`${name}.csv`,rows:ds.rows.length,columns:ds.columns.length,sha256:createHash('sha256').update(data).digest('hex')});
  }
  console.log(`${program}: full-row analytic checks and CSV round-trips passed`);
}
await writeFile(`${folder}/manifest.json`,JSON.stringify({provenance:'Generated by SASita JavaScript engine; NOT SAS reference outputs.',seed:12345,generator:'explicit MT32',rows:20000,files},null,2)+'\n');
console.log('Results saved to '+folder);
