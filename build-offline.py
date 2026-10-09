from pathlib import Path
import json,re,base64
root=Path(__file__).resolve().parent
assets=root/'dist'
macros=(assets/'macros.mjs').read_text()
engine=(assets/'engine.mjs').read_text()
formats=(assets/'formats.mjs').read_text()
random=(assets/'random.mjs').read_text()
worker=(assets/'worker.mjs').read_text()
app=(assets/'app.mjs').read_text()
charts=(assets/'charts.mjs').read_text()
chart_view=(assets/'chart-view.mjs').read_text()
syntax_help=(assets/'syntax-help.mjs').read_text()
table_storage=(assets/'table-storage.mjs').read_text()
file_program=(assets/'file-program.mjs').read_text()
project_files=(assets/'project-files.mjs').read_text()
def plain(s):
    s=re.sub(r'^import .*?;\n','',s,flags=re.M)
    return re.sub(r'\bexport (?=(?:async )?function )','',s)
worker_source=plain(macros)+'\n'+plain(formats)+'\n'+plain(random)+'\n'+plain(engine)+'\n'+plain(table_storage)+'\n'+plain(charts)+'\n'+plain(file_program)+'\n'+plain(worker)
worker_json=json.dumps(worker_source).replace('<','\\u003c')
vendor='/* PrismJS 1.30.0 — MIT license, Copyright (c) 2012-2025 Lea Verou. Full license below.\n'+(assets/'vendor/PrismJS-LICENSE.txt').read_text()+'*/\n'+(assets/'vendor/prism-core.min.js').read_text()+'\n'+(assets/'vendor/prism-sas.min.js').read_text()+'\n'
vendor+='/* Chart.js 4.5.1, MIT license — full license below.\n'+(assets/'vendor/ChartJS-LICENSE.md').read_text()+'*/\n'+(assets/'vendor/chart.umd.min.js').read_text()+'\n'
inline='(()=>{\n'+vendor+plain(macros)+'\n'+plain(formats)+'\n'+plain(random)+'\n'+plain(engine)+'\n'+plain(table_storage)+'\n'+plain(charts)+'\n'+plain(file_program)+'\n'+plain(project_files)+'\nconst dataStepWorkerURL=URL.createObjectURL(new Blob([JSON.parse(document.getElementById("worker-source").textContent)],{type:"text/javascript"}));\n'+plain(chart_view)+'\n'+plain(syntax_help)+'\n'+plain(app).replace("new Worker('worker.mjs',{type:'module'})",'new Worker(dataStepWorkerURL)')+'\n})();'
html=(assets/'index.html').read_text().replace('<script src="vendor/prism-core.min.js" data-manual></script><script src="vendor/prism-sas.min.js"></script>','')
html=html.replace('<script src="vendor/chart.umd.min.js"></script>','')
html=html.replace('src="spi-logo.png"','src="data:image/png;base64,'+base64.b64encode((assets/'spi-logo.png').read_bytes()).decode()+'"')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(assets/'style.css').read_text()+'</style>')
html=html.replace('<script type="module" src="app.mjs"></script>', '<script id="worker-source" type="application/json">'+worker_json+'</script><script>'+inline.replace('</script','<\\/script')+'</script>')
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"',html)
(assets/'data-step-lab.html').write_text(html)
print('Self-contained offline HTML created:',len(html.encode()),'bytes')
