"""Package already checked engine outputs. No runtime Python dependency."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
results = Path('/tmp/sasita-validation-results')
entries = [('README.md', root/'examples/validation/README.md'),
           ('data-step-lab.html', root/'dist/data-step-lab.html')]
entries += [('programs/'+p.name,p) for p in sorted((root/'examples/validation').glob('*.sas'))]
entries += [('results/'+p.name,p) for p in sorted(results.iterdir()) if p.suffix in ('.csv','.json')]
if not (results/'manifest.json').is_file():
    raise SystemExit('First run: node scripts/build-validation-pack.mjs')
output = root/'examples/validation/validation-pack.zip'
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name,path in entries:
        info = ZipInfo(name, (2026,10,8,0,0,0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info,path.read_bytes())
print(f'Packaged {len(entries)} files: {output.name} ({output.stat().st_size:,} bytes)')
