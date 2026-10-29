/* Interfaz del laboratorio de grafos. Funciona sin conexión a Internet. */
(() => {
'use strict';
const A = GraphAlgorithms;
const $ = id => document.getElementById(id);
const ORIGINAL_EDGES = [
 [1,3,1],[1,2,3],[1,4,4],[1,5,1],
 [2,3,6],[2,4,5],[2,6,3],
 [3,6,2],[3,10,7],
 [4,7,9],
 [5,10,3],[5,11,14],
 [6,7,3],[6,9,1],
 [7,8,10],[7,9,11],
 [8,12,1],
 [9,10,18],[9,12,16],
 [10,11,15],[11,12,20]
];
const POSITIONS = {
 1:[102,395],2:[304,395],3:[304,252],4:[304,530],
 5:[618,88],6:[573,395],7:[573,540],8:[859,541],
 9:[840,395],10:[840,254],11:[1026,100],12:[1111,395]
};
function makeOriginal() {
 return { nodes:Array.from({length:12},(_,i)=>i+1),
          edges:ORIGINAL_EDGES.map(([a,b,w])=>({a,b,w})),
          directed:false, positions:structuredClone(POSITIONS) };
}
let graph=makeOriginal(), selected=null, connectFrom=null, mode='move';
let highlightedEdges=new Set(),highlightedNodes=new Set();
let matrixType='adjacency',pointer=null,view={x:0,y:0,w:1200,h:645};
let originalMode=true,displayWeights=true,toastTimer=null;
const svg=$('graphSvg');

function normKey(a,b) {return graph.directed?`${a}>${b}`:`${Math.min(a,b)}-${Math.max(a,b)}`;}
function escapeText(str){return String(str).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function toast(msg) {const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3400);}
function setMode(newMode) {
 mode=newMode;connectFrom=null;
 document.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===mode));
 const hints={move:'Arrastra los nodos para moverlos. Haz clic en un nodo o arista para editarlo.',add:'Haz clic en un espacio vacío del grafo para crear un nodo nuevo.',connect:'Selecciona dos nodos para conectarlos con una arista y asignar un peso.'};
 $('modeHint').textContent=hints[mode];$('canvasTip').textContent=hints[mode];renderGraph();
}
function setTitle(){
 $('graphTitle').textContent=originalMode?'Ejercicio de la pizarra':'Mi grafo';
 $('workspaceHeading').textContent=originalMode?'Grafo original de la pizarra':'Grafo personalizado';
 $('exampleButton').classList.toggle('active',originalMode);
}
function updateStats(){
 $('nodeCount').textContent=graph.nodes.length;
 $('edgeCount').textContent=graph.edges.length;
 $('graphType').textContent=graph.directed?'Dirigido':'No dirigido';
 $('directedToggle').checked=graph.directed;
 $('weightToggle').checked=displayWeights;
 $('exampleButton').querySelector('.nav-count').textContent=graph.nodes.length;
 if(!graph.nodes.length) $('connectedStatus').textContent='Vacío';
 else if(graph.directed){
   const seen=A.traversal(graph,graph.nodes[0]).covered;
   $('connectedStatus').textContent=seen===graph.nodes.length?'Alcanzable':'Parcial';
 }else $('connectedStatus').textContent=A.kruskal(graph).connected?'Conectado':'Desconectado';
 setTitle();
}
function nodesToSelect(){
 for(const id of ['origin','destination']){
   const sel=$(id),prev=Number(sel.value);
   sel.innerHTML=graph.nodes.map(n=>`<option value="${n}">${n}</option>`).join('');
   if(graph.nodes.includes(prev))sel.value=String(prev);
   else if(id==='destination' && graph.nodes.length)sel.value=String(graph.nodes.at(-1));
 }
}
function edgePath(edge) {
 const [x1,y1]=graph.positions[edge.a], [x2,y2]=graph.positions[edge.b];
 if(!graph.directed && normKey(edge.a,edge.b)==='1-5'){
  // Curva superior característica del dibujo de la pizarra.
  const midx=(x1+x2)/2,midxCtrl=midx-24,cy=Math.min(y1,y2)-48;
  return { d:`M${x1},${y1} Q${midxCtrl},${cy} ${x2},${y2}`,
   lx:.25*x1+.5*midxCtrl+.25*x2,ly:.25*y1+.5*cy+.25*y2-23 };
 }
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
 let bias=19;
 if(Math.abs(dx)<60)bias=23;
 return {d:`M${x1},${y1} L${x2},${y2}`,
   lx:(x1+x2)/2-dy/len*bias,ly:(y1+y2)/2+dx/len*bias};
}
function renderGraph(){
 const edges=graph.edges.map((edge,i)=>{
  const path=edgePath(edge),key=normKey(edge.a,edge.b),active=highlightedEdges.has(key),selectedEdge=selected?.type==='edge'&&selected.index===i;
  const c=active?'highlight':selectedEdge?'selected':'';
  return `<g class="edge" data-edge="${i}"><path class="edge-line ${c}" d="${path.d}" ${graph.directed?'marker-end="url(#arrow)"':''}/><path class="edge-hit" data-edge="${i}" d="${path.d}"/></g>`;
 });
 $('edgesLayer').innerHTML=edges.join('');
 $('weightsLayer').innerHTML=displayWeights?graph.edges.map((edge,i)=>{
  const path=edgePath(edge),highlight=highlightedEdges.has(normKey(edge.a,edge.b));
  const label=String(edge.w),width=Math.max(27,13+label.length*11);
  return `<g class="weight-group ${highlight?'highlight':''}" data-weight="${i}" transform="translate(${path.lx},${path.ly})"><rect class="weight-box" x="${-width/2}" y="-14" width="${width}" height="28" rx="8"/><text class="weight-text" y="1">${escapeText(label)}</text></g>`;
 }).join(''):'';
 $('nodesLayer').innerHTML=graph.nodes.map(n=>{
  const [x,y]=graph.positions[n],highlight=highlightedNodes.has(n),active=selected?.type==='node'&&selected.id===n;
  return `<g class="node ${highlight?'highlight':''} ${active?'selected':''} ${connectFrom===n?'node-pick':''}" data-node="${n}" transform="translate(${x},${y})"><circle r="22"/><text y="1">${n}</text></g>`;
 }).join('');
}
function renderMatrix(){
 const m=A.matrices(graph),inc=matrixType==='incidence',headers=inc?m.edgeLabels:m.nodes;
 $('matrixHint').textContent=inc ? (graph.directed?'Origen = −1, destino = +1.':'1 indica incidencia con una arista.'):'Matriz ponderada: — indica ausencia de arista.';
 let html=`<table class="matrix-table"><thead><tr><th></th>${headers.map((h,i)=>`<th title="${inc?'Arista '+(i+1):'Nodo '+h}">${inc?'e'+(i+1):h}</th>`).join('')}</tr></thead><tbody>`;
 const data=inc?m.incidence:m.adjacency;
 data.forEach((row,i)=>{html+=`<tr><td>${m.nodes[i]}</td>${row.map(v=>`<td class="${v!==null&&v!==0?'has-edge':''}">${v===null?'—':v}</td>`).join('')}</tr>`;});
 $('matrixTable').innerHTML=html+'</tbody></table>';
}
function renderProperties(){
 const box=$('properties');
 if(!selected){box.innerHTML='<p>Selecciona un elemento del grafo para ver sus propiedades.</p>';return;}
 if(selected.type==='node'){
  if(!graph.nodes.includes(selected.id)){selected=null;renderProperties();return;}
  const degree=graph.edges.filter(e=>e.a===selected.id||e.b===selected.id).length;
  box.innerHTML=`<div class="property-title">Nodo ${selected.id}</div><p>Conexiones: ${degree}</p><div class="property-actions"><button class="secondary-btn" id="deleteNode">Eliminar nodo</button></div>`;
  $('deleteNode').onclick=deleteSelection;return;
 }
 const edge=graph.edges[selected.index];
 if(!edge){selected=null;renderProperties();return;}
 box.innerHTML=`<div class="property-title">Conexión ${edge.a} ${graph.directed?'→':'–'} ${edge.b}</div><label class="field-label" for="edgeWeight">Peso de la arista</label><input class="field small-field" type="number" min="0" step="any" id="edgeWeight" value="${edge.w}"><div class="property-actions"><button class="secondary-btn" id="saveEdge">Guardar</button><button class="secondary-btn" id="deleteEdge">Eliminar</button></div>`;
 $('saveEdge').onclick=()=>{
  const w=Number($('edgeWeight').value);
  if(!$('edgeWeight').value.trim() || !Number.isFinite(w) || w<0)return toast('Ingresa un peso válido (0 o mayor).');
  edge.w=w;modified();toast(`Peso actualizado: ${w}`);
 };
 $('deleteEdge').onclick=deleteSelection;
}
function renderAll(){updateStats();nodesToSelect();renderGraph();renderMatrix();renderProperties();}
function clearHighlight(silent=false){highlightedNodes.clear();highlightedEdges.clear();if(!silent){$('resultTitle').textContent='Tu grafo está listo';$('resultContent').textContent='Elige un algoritmo para visualizar la solución. Las conexiones resaltadas aparecerán en color verde.';}renderGraph();}
function modified(){originalMode=false;clearHighlight(true);$('resultTitle').textContent='Grafo modificado';$('resultContent').textContent='Los cambios están listos. Selecciona un algoritmo para analizar el grafo actual.';renderAll();}
function selectNode(n){selected={type:'node',id:n};renderProperties();renderGraph();}
function selectEdge(i){selected={type:'edge',index:i};renderProperties();renderGraph();}
function deleteSelection(){
 if(!selected)return toast('Selecciona un nodo o una arista antes de eliminar.');
 if(selected.type==='node'){
  graph.nodes=graph.nodes.filter(n=>n!==selected.id);
  graph.edges=graph.edges.filter(e=>e.a!==selected.id&&e.b!==selected.id);
  delete graph.positions[selected.id];
 } else graph.edges.splice(selected.index,1);
 selected=null;modified();toast('Elemento eliminado.');
}
function addNode(x,y){
 const id=Math.max(0,...graph.nodes)+1;
 graph.nodes.push(id);graph.nodes.sort((a,b)=>a-b);
 graph.positions[id]=[Math.round(Math.min(1170,Math.max(32,x))),Math.round(Math.min(610,Math.max(32,y)))];
 selected={type:'node',id};modified();toast(`Nodo ${id} agregado.`);
}
function connectNodes(a,b){
 if(a===b){connectFrom=null;return toast('Elige dos nodos diferentes.');}
 if(graph.edges.some(e=>normKey(e.a,e.b)===normKey(a,b))){connectFrom=null;return toast('Esa conexión ya existe.');}
 const answer=window.prompt(`Peso de la arista ${a} ${graph.directed?'→':'–'} ${b}:`,'1');
 connectFrom=null;
 if(answer===null){renderGraph();return;}
 if(!answer.trim()||!Number.isFinite(Number(answer))||Number(answer)<0){renderGraph();return toast('Peso inválido. Escribe un número igual o mayor que 0.');}
 graph.edges.push({a,b,w:Number(answer)});selected={type:'edge',index:graph.edges.length-1};modified();toast(`Conexión ${a}–${b} agregada.`);
}
function coords(ev){const pt=new DOMPoint(ev.clientX,ev.clientY);const converted=pt.matrixTransform(svg.getScreenCTM().inverse());return {x:converted.x,y:converted.y};}
function updateView(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);$('zoomLabel').textContent=Math.round(1200/view.w*100)+'%';}
function zoom(factor){
 const old=view.w,newW=Math.max(350,Math.min(2400,view.w*factor)),newH=view.h*newW/old;
 view.x+=(old-newW)/2;view.y+=(view.h-newH)/2;view.w=newW;view.h=newH;updateView();
}
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.91:1.09);},{passive:false});
svg.addEventListener('pointerdown',ev=>{
 if(ev.button!==0)return;
 const node=ev.target.closest('[data-node]'),edge=ev.target.closest('[data-edge]');
 const p=coords(ev);
 pointer={id:ev.pointerId,start:p,last:p,changed:false,kind:node?'node':edge?'edge':'canvas',node:node?Number(node.dataset.node):null,edge:edge?Number(edge.dataset.edge):null};
 svg.setPointerCapture(ev.pointerId);
});
svg.addEventListener('pointermove',ev=>{
 if(!pointer||pointer.id!==ev.pointerId)return;
 const p=coords(ev),dx=p.x-pointer.last.x,dy=p.y-pointer.last.y;
 if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>5)pointer.changed=true;
 if(pointer.kind==='node'&&mode==='move'){
  const pos=graph.positions[pointer.node];
  if(pos){pos[0]=Math.round(pos[0]+dx);pos[1]=Math.round(pos[1]+dy);renderGraph();}
 }else if(pointer.kind==='canvas'&&mode==='move'&&pointer.changed){
  view.x-=dx;view.y-=dy;updateView();
 }
 pointer.last=p;
});
svg.addEventListener('pointerup',ev=>{
 if(!pointer||pointer.id!==ev.pointerId)return;
 const {kind,node,edge,changed}=pointer;
 pointer=null;
 if(changed){if(kind==='node'&&mode==='move')modified();return;}
 if(kind==='node'){
  if(mode==='connect'){
   if(connectFrom===null){connectFrom=node;selectNode(node);toast(`Nodo ${node} seleccionado. Haz clic en el segundo nodo.`);}
   else connectNodes(connectFrom,node);
  }else selectNode(node);
 }else if(kind==='edge'){selectEdge(edge);}
 else if(mode==='add'){const p=coords(ev);addNode(p.x,p.y);}
 else {selected=null;renderProperties();renderGraph();}
});
svg.addEventListener('pointercancel',()=>{pointer=null;});
window.addEventListener('keydown',ev=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if((ev.key==='Delete'||ev.key==='Backspace')&&selected){ev.preventDefault();deleteSelection();}
 if(ev.key==='Escape'){selected=null;connectFrom=null;setMode('move');renderProperties();}
});

function showMetrics(items){return `<div class="metric-row">${items.map(([label,value])=>`<span class="metric">${escapeText(label)}: <b>${escapeText(value)}</b></span>`).join('')}</div>`;}
function spanningEdgesTable(edges){
 const rows=edges.map((edge,index)=>`<tr><td>${index+1}</td><td>N${edge.a} – N${edge.b}</td><td>${escapeText(edge.w)}</td></tr>`).join('');
 return `<div class="spanning-table-wrap"><table class="spanning-table"><thead><tr><th>Orden</th><th>Aristas (nodos)</th><th>Peso</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function showResult(title,html,edges=[],nodes=[]){
 highlightedEdges=new Set(edges.map(e=>normKey(e.a,e.b)));
 highlightedNodes=new Set(nodes);
 for(const e of edges){highlightedNodes.add(e.a);highlightedNodes.add(e.b);}
 $('resultTitle').textContent=title;$('resultContent').innerHTML=html;renderGraph();
}
function calculate(){
 if(!graph.nodes.length)return toast('Primero agrega nodos para resolver.');
 const start=Number($('origin').value),end=Number($('destination').value),kind=$('algorithm').value;
 try{
  if(kind.startsWith('kruskal')||kind.startsWith('prim')){
   const isMax=kind.endsWith('max'),isPrim=kind.startsWith('prim');
   const answer=isPrim?A.prim(graph,start,isMax):A.kruskal(graph,isMax);
   const name=isPrim?'Prim':'Kruskal',type=isMax?'máxima':'mínima';
   const formatted=answer.edges.map(e=>`${e.a}–${e.b} (${e.w})`).join(' · ')||'Ninguna';
   const tree=A.treeCheck({nodes:graph.nodes,edges:answer.edges,directed:false});
   const flag=value=>value?'Sí ✓':'No ✕';
   showResult(`${name} · Expansión ${type}`,
    `<strong>${tree.isTree?'Árbol de expansión':'Bosque de expansión (no cumple todas las condiciones)'}</strong><span class="route-line">${formatted}</span>${showMetrics([['Peso total',answer.cost],['Aristas = V − 1',`${answer.edges.length} = ${graph.nodes.length-1}: ${flag(tree.edgeRule)}`],['Sin ciclos',flag(tree.acyclic)],['Conectado',flag(tree.connected)]])}<h3 class="table-heading">Orden de selección de las aristas</h3>${spanningEdgesTable(answer.edges)}`,
    answer.edges);
  }else if(kind==='bfs'||kind==='dfs'){
   const answer=A.traversal(graph,start,kind==='dfs');
   showResult(kind==='dfs'?'Recorrido en profundidad · DFS':'Recorrido en anchura · BFS',
    `<strong>Orden de visita desde el nodo ${start}</strong><span class="route-line">${answer.order.join(' → ')}</span>${showMetrics([['Nodos visitados',answer.covered],['Total de nodos',answer.total]])}`,
    answer.edges,answer.order);
  }else if(kind==='dijkstra'||kind==='floyd'){
   const answer=kind==='dijkstra'?A.shortestPath(graph,start,end):A.floydWarshall(graph,start,end);
   const valid=Number.isFinite(answer.distance);
   const extra=kind==='floyd'?'<p>Floyd-Warshall calculó la distancia mínima entre todos los pares de nodos.</p>':'';
   showResult(kind==='dijkstra'?'Dijkstra · Camino más corto':'Floyd-Warshall · Camino más corto',
    valid?`<strong>Ruta óptima de ${start} a ${end}</strong><span class="route-line">${answer.path.join(' → ')}</span>${showMetrics([['Distancia total',answer.distance],['Aristas',answer.edges.length]])}${extra}`:
    `No hay camino desde ${start} hasta ${end}.${extra}`,answer.edges,answer.path);
  }
 }catch(error){toast(error.message);$('resultTitle').textContent='No se puede resolver';$('resultContent').textContent=error.message;}
}
function checkTree(){
 try{
  const c=A.treeCheck(graph);
  const flag=v=>v?'Sí ✓':'No ✕';
  showResult('Condiciones para ser un árbol',
   `<strong>${c.isTree?'El grafo sí es un árbol.':'El grafo completo NO es un árbol.'}</strong><p>Para ser árbol debe cumplir simultáneamente las tres condiciones: estar conectado, no tener ciclos y tener exactamente V − 1 aristas.</p>${showMetrics([['Aristas = V − 1',`${graph.edges.length} = ${graph.nodes.length-1}: ${flag(c.edgeRule)}`],['Sin ciclos',flag(c.acyclic)],['Conectado',flag(c.connected)]])}<p>El árbol de expansión obtenido con Prim o Kruskal conserva todos los nodos y debe cumplir las tres condiciones.</p>`,[],[]);
 }catch(error){toast(error.message);}
}
function resetGraph(){graph=makeOriginal();originalMode=true;selected=null;connectFrom=null;view={x:0,y:0,w:1200,h:645};displayWeights=true;setMode('move');clearHighlight();updateView();renderAll();toast('Se restauró el grafo original de la pizarra.');}
function createNew(){
 if(!window.confirm('¿Quieres comenzar un grafo vacío? Puedes restaurar el ejercicio original en cualquier momento.'))return;
 graph={nodes:[],edges:[],positions:{},directed:false};originalMode=false;selected=null;displayWeights=true;connectFrom=null;setMode('add');clearHighlight();view={x:0,y:0,w:1200,h:645};updateView();renderAll();toast('Haz clic en el área del grafo para colocar el primer nodo.');
}
function downloadFile(filename,data,mime){
 const blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportGraph(){downloadFile('grafo_compylex.json',JSON.stringify(graph,null,2),'application/json');toast('Se exportó el grafo a JSON.');}
function exportSvg(){
 const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1600');clone.setAttribute('height','860');
 const style=document.createElementNS('http://www.w3.org/2000/svg','style');
 style.textContent='.edge-line{fill:none;stroke:#6682ab;stroke-width:4}.edge-line.highlight{stroke:#18aa7b;stroke-width:7}.edge-hit{display:none}.weight-box{fill:#eef3fa;stroke:#99acc5}.weight-text{text-anchor:middle;dominant-baseline:middle;font:bold 17px sans-serif;fill:#162d4a}.node circle{fill:#254777;stroke:#4c8cff;stroke-width:4}.node.highlight circle{fill:#098f7a;stroke:#16d9ac}.node text{text-anchor:middle;dominant-baseline:middle;font:bold 24px sans-serif;fill:white}.background-grid{fill:#f6f9fe}';
 clone.insertBefore(style,clone.firstChild);clone.querySelector('pattern')?.remove();
 downloadFile('grafo_pizarra.svg',new XMLSerializer().serializeToString(clone),'image/svg+xml;charset=utf-8');toast('Dibujo exportado como SVG.');
}
async function importGraph(file){
 try{
  const raw=JSON.parse(await file.text()),validated=A.validate(raw);
  const positions={};
  const n=validated.nodes.length;
  validated.nodes.forEach((node,i)=>{
   const p=raw.positions?.[node];
   positions[node]=Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(Number(v)))?p.map(Number):[600+270*Math.cos(i*2*Math.PI/Math.max(1,n)),320+220*Math.sin(i*2*Math.PI/Math.max(1,n))];
  });
  graph={...validated,positions};originalMode=false;selected=null;clearHighlight();renderAll();toast('Se importó el grafo correctamente.');
 }catch(err){toast(`No se pudo importar: ${err.message}`);}finally{$('fileInput').value='';}
}

// Botones y controles
$('resetButton').onclick=resetGraph;$('exampleButton').onclick=resetGraph;$('newGraphButton').onclick=createNew;
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$('deleteSelected').onclick=deleteSelection;
$('directedToggle').onchange=ev=>{graph.directed=ev.target.checked;selected=null;modified();};
$('weightToggle').onchange=ev=>{displayWeights=ev.target.checked;renderGraph();};
$('runButton').onclick=calculate;$('checkTreeButton').onclick=checkTree;
$('clearHighlight').onclick=()=>clearHighlight();
$('plusZoom').onclick=()=>zoom(.80);$('minusZoom').onclick=()=>zoom(1.25);
$('resetZoom').onclick=()=>{view={x:0,y:0,w:1200,h:645};updateView();};
$('focusButton').onclick=()=>{
 const yes=document.body.classList.toggle('focus-mode');$('focusLabel').textContent=yes?'Salir de presentación':'Modo presentación';
};
$('importButton').onclick=()=>$('fileInput').click();
$('fileInput').onchange=ev=>{if(ev.target.files[0])importGraph(ev.target.files[0]);};
$('exportButton').onclick=exportGraph;$('svgButton').onclick=exportSvg;
document.querySelectorAll('[data-matrix]').forEach(b=>b.onclick=()=>{
 matrixType=b.dataset.matrix;document.querySelectorAll('[data-matrix]').forEach(t=>t.classList.toggle('active',t===b));renderMatrix();
});
renderAll();updateView();
})();
