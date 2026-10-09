import {readFile,writeFile} from 'node:fs/promises';
import {portableFiles,portableZip} from '../dist/portable-export.mjs';
import {runtimeAssets} from '../dist/runtime-assets.mjs';
import {parseCSV} from '../dist/engine.mjs';
const code=await readFile(new URL('../examples/project-demo/portable-demo.sas',import.meta.url),'utf8');
const datasets={claims:parseCSV(await readFile(new URL('../examples/claims.csv',import.meta.url),'utf8'))};
const zip=portableZip(portableFiles({code,datasets,libraries:{},chartTitle:''},runtimeAssets()));
await writeFile(new URL('../dist/Sassy-wrapper-demo-v0.4.6.zip',import.meta.url),zip);
console.log('Portable demo ZIP created: '+zip.length.toLocaleString()+' bytes');
