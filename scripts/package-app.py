"""Offline app and a ready-to-select demo folder; no runtime Python needed."""
from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parent.parent
entries=[('data-step-lab.html',root/'dist/data-step-lab.html'),
         ('README.md',root/'docs/project-files.md'),
         ('demo-project/claims.csv',root/'examples/project-demo/claims.csv'),
         ('demo-project/project-demo.sas',root/'examples/project-demo/project-demo.sas')]
output=root/'dist/SASita-v0.4.0.zip'
manifest={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in entries}
with ZipFile(output,'w',compression=ZIP_DEFLATED,compresslevel=9) as z:
    for name,path in entries:
        info=ZipInfo(name,(2026,10,8,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,path.read_bytes())
    info=ZipInfo('manifest.json',(2026,10,8,0,0,0));info.compress_type=ZIP_DEFLATED
    z.writestr(info,json.dumps(manifest,indent=2)+'\n')
with ZipFile(output) as z:
    assert z.testzip() is None
    for name,digest in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest
print(f'Checked {output.name}: {output.stat().st_size:,} bytes.')
