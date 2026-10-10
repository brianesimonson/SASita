from pathlib import Path
import json,re,base64
root=Path(__file__).resolve().parent
assets=root/'dist'
# Keep viewed/exported execution sources byte-for-byte aligned with this build.
module_names=['macros.mjs','formats.mjs','random.mjs','engine.mjs','charts.mjs','means.mjs','table-storage.mjs','file-program.mjs']
export_assets={'runtime/'+name:(assets/name).read_text() for name in module_names}
export_assets.update({name:(root/'portable'/name).read_text() for name in ['run.mjs','run.py','README.md']})
(assets/'runtime-assets.mjs').write_text('export function runtimeAssets(){return '+json.dumps(export_assets).replace('<','\\u003c')+';}\n')
example_titles=[('DATA step, SORT and match MERGE','Self-contained generated data; no project folder required.'),('Uniform random numbers (MT32)','Self-contained, explicit seed 12345, two uniform columns and HEX output.'),('Charts: scatter, bars, histogram and pie','Self-contained; renders all five supported chart types.'),('PROC MEANS: totals, subtotals and NWAY','Self-contained; inspect demo_all_types, demo_nway and demo_default_stats.'),('Macro-generated DATA step','Self-contained macro with a keyword argument; inspect Expanded code.'),('Project CSV import and export','Choose the included demo-project folder first. Reads claims.csv and writes reviewed.csv.'),('Permanent JSON libraries','Choose the included demo-project folder first, with its existing tables subfolder.'),('INPUT, PUT and formats','Self-contained numeric/date conversion and display formats.')]
example_entries=[dict(file=path.name,title=title,description=description,code=path.read_text()) for path,(title,description) in zip(sorted((root/'examples/catalog').glob('*.sas')),example_titles)]
assert len(example_entries)==8
(assets/'example-programs.mjs').write_text('export function programExamples(){return '+json.dumps(example_entries).replace('<','\\u003c')+';}\n')
example_programs=(assets/'example-programs.mjs').read_text()
examples_view=(assets/'examples-view.mjs').read_text()
runtime_assets=(assets/'runtime-assets.mjs').read_text()
portable_export=(assets/'portable-export.mjs').read_text()
portable_view=(assets/'portable-view.mjs').read_text()

macros=(assets/'macros.mjs').read_text()
engine=(assets/'engine.mjs').read_text()
formats=(assets/'formats.mjs').read_text()
random=(assets/'random.mjs').read_text()
worker=(assets/'worker.mjs').read_text()
app=(assets/'app.mjs').read_text()
charts=(assets/'charts.mjs').read_text()
means=(assets/'means.mjs').read_text()
chart_view=(assets/'chart-view.mjs').read_text()
syntax_help=(assets/'syntax-help.mjs').read_text()
table_storage=(assets/'table-storage.mjs').read_text()
file_program=(assets/'file-program.mjs').read_text()
project_files=(assets/'project-files.mjs').read_text()
def plain(s):
    s=re.sub(r'^import .*?;\n','',s,flags=re.M)
    return re.sub(r'\bexport (?=(?:async )?function )','',s)
worker_source=plain(macros)+'\n'+plain(formats)+'\n'+plain(random)+'\n'+plain(engine)+'\n'+plain(table_storage)+'\n'+plain(charts)+'\n'+plain(means)+'\n'+plain(file_program)+'\n'+plain(worker)
worker_json=json.dumps(worker_source).replace('<','\\u003c')
vendor='/* PrismJS 1.30.0 — MIT license, Copyright (c) 2012-2025 Lea Verou. Full license below.\n'+(assets/'vendor/PrismJS-LICENSE.txt').read_text()+'*/\n'+(assets/'vendor/prism-core.min.js').read_text()+'\n'+(assets/'vendor/prism-sas.min.js').read_text()+'\n'
vendor+='/* Chart.js 4.5.1, MIT license — full license below.\n'+(assets/'vendor/ChartJS-LICENSE.md').read_text()+'*/\n'+(assets/'vendor/chart.umd.min.js').read_text()+'\n'
inline='(()=>{\n'+vendor+plain(macros)+'\n'+plain(formats)+'\n'+plain(random)+'\n'+plain(engine)+'\n'+plain(table_storage)+'\n'+plain(charts)+'\n'+plain(means)+'\n'+plain(file_program)+'\n'+plain(project_files)+'\nconst dataStepWorkerURL=URL.createObjectURL(new Blob([JSON.parse(document.getElementById("worker-source").textContent)],{type:"text/javascript"}));\n'+plain(chart_view)+'\n'+plain(syntax_help)+'\n'+runtime_assets.replace('export function runtimeAssets','function runtimeAssets',1)+'\n'+plain(portable_export)+'\n'+plain(portable_view)+'\n'+example_programs.replace('export function programExamples','function programExamples',1)+'\n'+plain(examples_view)+'\n'+plain(app).replace("new Worker('worker.mjs',{type:'module'})",'new Worker(dataStepWorkerURL)')+'\n})();'
html=(assets/'index.html').read_text().replace('<script src="vendor/prism-core.min.js" data-manual></script><script src="vendor/prism-sas.min.js"></script>','')
html=html.replace('<script src="vendor/chart.umd.min.js"></script>','')
html=html.replace('src="spi-logo.png"','src="data:image/png;base64,'+base64.b64encode((assets/'spi-logo.png').read_bytes()).decode()+'"')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(assets/'style.css').read_text()+'</style>')
html=html.replace('<script type="module" src="app.mjs"></script>', '<script id="worker-source" type="application/json">'+worker_json+'</script><script>'+inline.replace('</script','<\\/script')+'</script>')
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"',html)
(assets/'data-step-lab.html').write_text(html)
print('Self-contained offline HTML created:',len(html.encode()),'bytes')
