/**
 * Read-only review of a revised master workbook, including ALL source sheets.
 *   node scripts/review-workbook.mjs [updated.xlsx] [previous.xlsx]
 *   node scripts/review-workbook.mjs --panel-only
 * Prints JSON; never writes or recalculates source workbooks. Full comparison
 * may need about two minutes because the original source sheets are large.
 */
import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const panelOnly=args.includes('--panel-only');
const paths=args.filter(a=>!a.startsWith('--'));
const files=[paths[1]||'New findex_Master_Data collection.xlsx',paths[0]||'18 Oct_New findex_Master_Data collection.xlsx'].map(f=>resolve(ROOT,f));
const books=files.map(f=>XLSX.readFile(f,{cellFormula:true,...(panelOnly?{sheets:['OIC_2024 origin','OIC_2024 clear','OIC_2024 norm','Malaysia','2025 ranked','ref','GII 2020']}: {})}));
const [oldWb,newWb]=books;
const simple=c=>c?{type:c.t,value:c.v??null,...(c.t==='e'?{error:c.w||`Excel error ${c.v}`} :{}),...(c.f?{formula:c.f}:{})}:null;
const cellKeys=ws=>Object.keys(ws).filter(c=>!c.startsWith('!'));

function panel(wb){
 const ws=wb.Sheets['OIC_2024 norm'];
 const codes={};const range=XLSX.utils.decode_range(ws['!ref']);
 for(let c=0;c<=range.e.c;c++){
  const v=ws[XLSX.utils.encode_cell({r:3,c})]?.v;
  if(v!==undefined)codes[String(v).trim()]=XLSX.utils.encode_col(c);
 }
 const observations=[];
 for(let r=8;r<=range.e.r+1;r++){
  const country=ws['B'+r]?.v,year=ws['C'+r]?.v;
  if(typeof country!=='string'||typeof year!=='number')continue;
  observations.push({country,year,row:r,adei:ws[codes.ADEI+r]?.v,workbookRank:ws[codes.Rank+r]?.t==='n'?ws[codes.Rank+r].v:null,scores:Object.fromEntries(Object.entries(codes).filter(([c])=>/^\d+(\.\d+)*$/.test(c)).map(([c,col])=>[c,ws[col+r]?.t==='n'?ws[col+r].v:null]))});
 }
 const years=[...new Set(observations.map(o=>o.year))].sort();
 const annual=years.map(year=>{
  const rows=observations.filter(o=>o.year===year).sort((a,b)=>b.adei-a.adei);
  const clusters={Advanced:0,Emerging:0,Foundational:0};for(const o of rows)clusters[o.adei>=60?'Advanced':o.adei>=40?'Emerging':'Foundational']++;
  return {year,countries:rows.length,average:rows.reduce((sum,o)=>sum+o.adei,0)/rows.length,clusters,top3:rows.slice(0,3).map((o,i)=>({country:o.country,adei:o.adei,rank:i+1}))};
 });
 const gaps=observations.flatMap(o=>Object.entries(o.scores).filter(([,v])=>v===null).map(([code])=>({country:o.country,year:o.year,code,cell:codes[code]+o.row,source:ws[codes[code]+o.row]?.v??null})));
 return {countryCount:new Set(observations.map(o=>o.country)).size,observations:observations.length,years,annual,malaysia:observations.filter(o=>o.country==='Malaysia').sort((a,b)=>a.year-b.year).map(o=>({year:o.year,adei:o.adei,workbookRank:o.workbookRank,workforce:o.scores['3'],education:o.scores['3.1'],collaboration:o.scores['5.2'],innovation:o.scores['5'],marketCapitalization:o.scores['8.2'],financialMarket:o.scores['8']})),gaps,rows:observations,codes};
}

const panels=books.map(panel);
const changedSheets=[],unchangedSheets=[],addedSheets=[],removedSheets=[];
for(const s of newWb.SheetNames){
 const aa=oldWb.Sheets[s],bb=newWb.Sheets[s];
 if(!aa&&!bb)continue;
 if(!aa){addedSheets.push({sheet:s,range:bb['!ref'],cells:cellKeys(bb).length});continue}
 if(!bb)continue;
 let values=0,formulas=0,types=0,formulaOnly=0;const changes=[];
 for(const c of new Set([...cellKeys(aa),...cellKeys(bb)])){
  const valueChanged=JSON.stringify(aa[c]?.v)!==JSON.stringify(bb[c]?.v);
  const formulaChanged=aa[c]?.f!==bb[c]?.f;
  if(valueChanged)values++;
  if(formulaChanged)formulas++;
  if(formulaChanged&&!valueChanged)formulaOnly++;
  if(aa[c]?.t!==bb[c]?.t)types++;
  if(!valueChanged&&!formulaChanged)continue;
  const {r,col}=(()=>{const q=XLSX.utils.decode_cell(c);return{r:q.r+1,col:XLSX.utils.encode_col(q.c)}})();
  const code=s==='OIC_2024 norm'?Object.entries(panels[1].codes).find(([,c])=>c===col)?.[0]:bb[col+'4']?.v;
  const isObservation=typeof bb['C'+r]?.v==='number'&&bb['C'+r].v>=2000;
  changes.push({cell:c,...(isObservation?{country:bb['B'+r]?.v,year:bb['C'+r].v}:{}),...(code?{code}:{}),old:simple(aa[c]),updated:simple(bb[c])});
 }
 if(values||formulas||types)changedSheets.push({sheet:s,values,formulas,types,formulaOnly,changes});
 else unchangedSheets.push(s);
}
for(const s of oldWb.SheetNames)if(!newWb.SheetNames.includes(s))removedSheets.push(s);
const scoreDifferences=[];
for(const o of panels[1].rows){const old=panels[0].rows.find(a=>a.country===o.country&&a.year===o.year);if(!old)continue;for(const code of Object.keys(o.scores))if(old.scores[code]!==o.scores[code])scoreDifferences.push({country:o.country,year:o.year,code,old:old.scores[code],updated:o.scores[code]});}
const profile=newWb.Sheets.Malaysia;
const malaysiaProfile=profile?{range:profile['!ref'],role:'Linked country profile; populated data cells refer to OIC_2024 norm.',rows:[6,7,8,9,10].map(r=>({row:r,country:profile['A'+r]?.v,year:profile['B'+r]?.v,adei:simple(profile['BN'+r]),rank:simple(profile['BO'+r]),omittedColumns:['AE','AF','AG','AH','BD'].filter(c=>!profile[c+r])}))}:null;
const errorCells=books.map((wb,i)=>({workbook:relative(ROOT,files[i]),sheets:Object.entries(wb.Sheets).filter(([,ws])=>ws).flatMap(([sheet,ws])=>{const cells=cellKeys(ws).filter(c=>ws[c].t==='e');return cells.length?[{sheet,count:cells.length,examples:cells.slice(0,5).map(cell=>({cell,...simple(ws[cell])}))}]:[]})}));
const report={scope:panelOnly?'Selected dashboard and supporting sheets':'All sheets; values, formulas, and cell types',workbooks:books.map((wb,i)=>({file:relative(ROOT,files[i]),sheetCount:wb.SheetNames.length,panel:((({rows,codes,...rest})=>rest)(panels[i]))})),totals:{valueChanges:changedSheets.reduce((s,o)=>s+o.values,0),formulaChanges:changedSheets.reduce((s,o)=>s+o.formulas,0),formulaOnlyChanges:changedSheets.reduce((s,o)=>s+o.formulaOnly,0),changedSheets:changedSheets.length,unchangedSharedSheets:unchangedSheets.length},changedSheets,unchangedSheets,addedSheets,removedSheets,scoreDifferences,malaysiaProfile,errorCells};
console.log(JSON.stringify(report,null,2));
