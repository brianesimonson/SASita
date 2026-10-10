"""Offline app and a ready-to-select demo folder; no runtime Python needed."""
from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parent.parent
entries=[('data-step-lab.html',root/'dist/data-step-lab.html'),
         ('README.md',root/'docs/app-guide.md'),
         ('project-files.md',root/'docs/project-files.md'),
         ('native-tables.md',root/'docs/native-tables.md'),
         ('charts.md',root/'docs/charts.md'),
         ('means.md',root/'docs/means.md'),
         ('means-validation.zip',root/'examples/means-validation/means-validation.zip'),
         ('portable-demo.md',root/'docs/portable-demo.md'),
         ('ChartJS-LICENSE.md',root/'dist/vendor/ChartJS-LICENSE.md'),
         ('native-table-v1.schema.json',root/'docs/schemas/native-table-v1.schema.json'),
         ('PrismJS-LICENSE.txt',root/'dist/vendor/PrismJS-LICENSE.txt'),
         ('demo-project/claims.csv',root/'examples/project-demo/claims.csv'),
         ('demo-project/project-demo.sas',root/'examples/project-demo/project-demo.sas'),
         ('demo-project/library-demo.sas',root/'examples/project-demo/library-demo.sas'),
         ('demo-project/charts-demo.sas',root/'examples/project-demo/charts-demo.sas'),
         ('demo-project/portable-demo.sas',root/'examples/project-demo/portable-demo.sas'),
         ('demo-project/tables/README.txt',root/'examples/project-demo/tables/README.txt')]
entries.extend(('example-programs/'+path.name,path) for path in sorted((root/'examples/catalog').glob('*.sas')))
version=json.loads((root/'package.json').read_text())['version']
output=root/f'dist/Sassy-v{version}.zip'
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
