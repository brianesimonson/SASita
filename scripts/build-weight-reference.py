"""Independent NumPy/SciPy weighted ANCOVA reference, not actual SAS output."""
from pathlib import Path
import json,numpy as np
from scipy.stats import f
root=Path(__file__).resolve().parent.parent
rows=json.loads((root/'fixtures/glm-independent.json').read_text())['rows']
rows=[dict(r,w=.25+(i%7)/2) for i,r in enumerate(rows)]
a=np.array([[1 if r['a']==level else -1 if r['a']=='A3' else 0 for level in ['A1','A2']] for r in rows],float)
b=np.array([1 if r['b']=='B1' else -1 for r in rows]);x=np.array([r['x'] for r in rows]);y=np.array([r['y'] for r in rows]);w=np.array([r['w'] for r in rows]);rootw=np.sqrt(w)
X=np.column_stack([np.ones(len(rows)),a,b,x,a*b[:,None],a*x[:,None]])
Xw=X*rootw[:,None];yw=y*rootw
beta=np.linalg.lstsq(Xw,yw,rcond=None)[0];pred=X@beta;sse=float(np.sum(w*(y-pred)**2));df=len(y)-X.shape[1];cov=np.linalg.inv(Xw.T@Xw)
mean=float(np.sum(w*y)/sum(w));sst=float(np.sum(w*(y-mean)**2));previous=sst;tests=[]
for name,indices,end in [('A',[1,2],3),('B',[3],4),('X',[4],5),('A*B',[5,6],7),('A*X',[7,8],9)]:
 partial=np.linalg.lstsq(Xw[:,:end],yw,rcond=None)[0];rss=float(np.sum((yw-Xw[:,:end]@partial)**2));ss1=previous-rss;previous=rss
 bb=beta[indices];ss3=float(bb@np.linalg.solve(cov[np.ix_(indices,indices)],bb));F=ss3/len(indices)/(sse/df)
 tests.append(dict(source=name,df=len(indices),ss1=ss1,ss3=ss3,f3=F,p3=float(f.sf(F,len(indices),df))))
result=dict(provenance='Independent NumPy '+np.__version__+' weighted least squares and SciPy F tails; not an actual SAS fixture',rows=rows,model='a b x a*b a*x',sse=sse,sst=sst,df_error=df,mean=mean,predicted=pred.tolist(),tests=tests)
(root/'fixtures/weighted-glm-independent.json').write_text(json.dumps(result,indent=2)+'\n')
print('Independent weighted interaction reference created.')
