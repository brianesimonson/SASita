from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parent.parent
folder=root/'examples/large-numbers'
results=Path('/tmp/sasita-large-numbers')
if not (results/'precision-report.json').is_file():raise SystemExit('Run build-large-number-pack.mjs and check-large-number-precision.py first.')
entries=[('README.md',folder/'README.md'),('data-step-lab.html',root/'dist/data-step-lab.html')]
entries.extend(('programs/'+p.name,p) for p in sorted(folder.glob('*.sas')))
entries.extend(('results/'+p.name,p) for p in sorted(results.iterdir()) if p.suffix in ('.csv','.json'))
manifest={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in entries}
output=folder/'large-number-tests.zip'
with ZipFile(output,'w',compression=ZIP_DEFLATED,compresslevel=9) as z:
    for name,path in entries:
        info=ZipInfo(name,(2026,10,8,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,path.read_bytes())
    z.writestr('manifest.json',json.dumps(manifest,indent=2)+'\n')
with ZipFile(output) as z:
    assert z.testzip() is None
    for name,expected in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==expected
print(f'Pack checked: {output.name} ({output.stat().st_size:,} bytes).')
