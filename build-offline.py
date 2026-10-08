from pathlib import Path
import json,re
root=Path(__file__).resolve().parent
assets=root/'dist'
macros=(assets/'macros.mjs').read_text()
engine=(assets/'engine.mjs').read_text()
worker=(assets/'worker.mjs').read_text()
app=(assets/'app.mjs').read_text()
def plain(s):
    s=re.sub(r'^import .*?;\n','',s,flags=re.M)
    return re.sub(r'\bexport (?=function )','',s)
worker_source=plain(macros)+'\n'+plain(engine)+'\n'+plain(worker)
worker_json=json.dumps(worker_source).replace('<','\\u003c')
inline='(()=>{\n'+plain(macros)+'\n'+plain(engine)+'\nconst dataStepWorkerURL=URL.createObjectURL(new Blob([JSON.parse(document.getElementById("worker-source").textContent)],{type:"text/javascript"}));\n'+plain(app).replace("new Worker('worker.mjs',{type:'module'})",'new Worker(dataStepWorkerURL)')+'\n})();'
html=(assets/'index.html').read_text().replace('<title>DATA Step Lab</title>','<title>DATA Step Lab · Offline</title>')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(assets/'style.css').read_text()+'</style>')
html=html.replace('<script type="module" src="app.mjs"></script>', '<script id="worker-source" type="application/json">'+worker_json+'</script><script>'+inline.replace('</script','<\\/script')+'</script>')
assert not re.search(r'<script[^>]+src=|<link[^>]+rel="stylesheet"',html)
(assets/'data-step-lab.html').write_text(html)
print('Self-contained offline HTML created:',len(html.encode()),'bytes')
