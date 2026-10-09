"""Independent 100-digit decimal reference on exact stored binary inputs."""
import csv,json
from pathlib import Path
from decimal import Decimal,localcontext
folder=Path('/tmp/sasita-large-numbers')
rows=list(csv.DictReader((folder/'big_number_results.csv').open()))
statistics={}
with localcontext() as ctx:
    ctx.prec=100
    for row in rows:
        number=lambda key:Decimal.from_float(float(row[key]))
        x,y,scale=number('x'),number('y'),number('scale')
        reference={'multiply':x*y,'divide':x/y,'square':x*x,'cube':x*x*x,
                   'root':x.sqrt(),'cube_root':x**(Decimal(1)/3),
                   'power_four':(x/scale)**4,'mixed':x*y/(x+y)}
        for operation,expected in reference.items():
            error=abs(number(operation)-expected)
            relative=error/abs(expected)
            entry=statistics.setdefault(operation,{'values':0,'exceeds_10_digits':0,'exceeds_15_digits':0,'max_relative_error':Decimal(0),'max_absolute_error':Decimal(0)})
            entry['values']+=1
            entry['exceeds_10_digits']+=int(relative>Decimal('1e-10'))
            entry['exceeds_15_digits']+=int(relative>Decimal('1e-15'))
            entry['max_relative_error']=max(entry['max_relative_error'],relative)
            entry['max_absolute_error']=max(entry['max_absolute_error'],error)
assert len(rows)==3000
assert all(v['values']==3000 and v['exceeds_10_digits']==0 for v in statistics.values())
for entry in statistics.values():
    for key in ['max_relative_error','max_absolute_error']:entry[key]=f"{entry[key]:.8E}"
report={'reference':'Python decimal arithmetic at 100 digits on exact stored binary inputs; not a SAS runtime reference.','thresholds':'Error thresholds 1e-10 and 1e-15 relative to expected magnitude, not guaranteed decimal places or correctly rounded digits.','input_rows':len(rows),'operations':statistics}
(folder/'precision-report.json').write_text(json.dumps(report,indent=2)+'\n')
with (folder/'precision-summary.csv').open('w',newline='') as out:
    writer=csv.DictWriter(out,fieldnames=['operation',*next(iter(statistics.values())).keys()]);writer.writeheader()
    for operation,entry in statistics.items():writer.writerow({'operation':operation,**entry})
print(json.dumps(report,indent=2))
