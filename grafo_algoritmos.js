/* Algoritmos de grafos sin dependencias. Ejecutables en navegador o Node.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GraphAlgorithms = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function adjacency(graph) {
    const map = new Map(graph.nodes.map(n => [n, []]));
    for (const { a, b, w } of graph.edges) {
      if (!map.has(a) || !map.has(b)) throw Error('Arista con nodo inexistente.');
      map.get(a).push({ to: b, w, a, b });
      if (!graph.directed) map.get(b).push({ to: a, w, a, b });
    }
    for (const links of map.values()) links.sort((u, v) => u.to - v.to);
    return map;
  }

  function validate(graph) {
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw Error('JSON de grafo inválido.');
    const nodes = graph.nodes.map(Number);
    if (nodes.some(n => !Number.isSafeInteger(n) || n <= 0) || new Set(nodes).size !== nodes.length)
      throw Error('Los nodos deben ser números enteros positivos y únicos.');
    const keys = new Set();
    const directed = Boolean(graph.directed);
    const edges = graph.edges.map((edge) => {
      const a = Number(edge.a), b = Number(edge.b), w = Number(edge.w);
      if (!nodes.includes(a) || !nodes.includes(b)) throw Error(`La arista ${a}-${b} contiene nodos inexistentes.`);
      if (a === b) throw Error('Este editor no admite lazos de un nodo consigo mismo.');
      if (!Number.isFinite(w) || w < 0) throw Error('Los pesos deben ser números finitos no negativos.');
      const key = directed ? `${a}>${b}` : `${Math.min(a,b)}-${Math.max(a,b)}`;
      if (keys.has(key)) throw Error(`Conexión duplicada: ${key}.`);
      keys.add(key);
      return { a, b, w };
    });
    return { nodes: nodes.sort((a,b) => a-b), edges, directed };
  }

  function traversal(graph, start, depthFirst = false) {
    const adj = adjacency(graph);
    if (!adj.has(start)) throw Error('Selecciona un nodo de origen válido.');
    const visited = new Set([start]), order = [], edges = [];
    if (!depthFirst) {
      const q = [start];
      for (let i = 0; i < q.length; i++) {
        const at = q[i]; order.push(at);
        for (const e of adj.get(at)) {
          if (!visited.has(e.to)) { visited.add(e.to); q.push(e.to); edges.push({a:at,b:e.to}); }
        }
      }
    } else {
      // Pila de iteradores: recorrido DFS determinista con vecinos ascendentes.
      const stack = [{ node: start, index: 0 }];
      order.push(start);
      while (stack.length) {
        const top = stack[stack.length - 1];
        const neighbors = adj.get(top.node);
        if (top.index >= neighbors.length) { stack.pop(); continue; }
        const next = neighbors[top.index++].to;
        if (!visited.has(next)) {
          visited.add(next); order.push(next); edges.push({a:top.node,b:next});
          stack.push({node:next,index:0});
        }
      }
    }
    return { order, edges, covered: visited.size, total:graph.nodes.length };
  }

  function shortestPath(graph, start, end) {
    const adj = adjacency(graph);
    if (!adj.has(start) || !adj.has(end)) throw Error('Selecciona nodos de origen y destino válidos.');
    const dist = new Map(graph.nodes.map(v => [v, Infinity]));
    const parent = new Map(), done = new Set();
    dist.set(start, 0);
    while (done.size < graph.nodes.length) {
      let at = null;
      for (const v of graph.nodes) if (!done.has(v) && (at === null || dist.get(v) < dist.get(at))) at = v;
      if (at === null || !Number.isFinite(dist.get(at))) break;
      done.add(at);
      if (at === end) break;
      for (const e of adj.get(at)) {
        const alt = dist.get(at) + e.w;
        if (alt < dist.get(e.to)) { dist.set(e.to,alt); parent.set(e.to,at); }
      }
    }
    if (!Number.isFinite(dist.get(end))) return {distance:Infinity,path:[],edges:[],distances:dist};
    const path = [end];
    while (path[0] !== start) path.unshift(parent.get(path[0]));
    return { distance:dist.get(end), path, edges:path.slice(1).map((v,i)=>({a:path[i],b:v})), distances:dist };
  }

  function kruskal(graph, maximize=false) {
    if (graph.directed) throw Error('Kruskal requiere un grafo no dirigido.');
    const parent = new Map(graph.nodes.map(n => [n,n]));
    const rank = new Map(graph.nodes.map(n => [n,0]));
    const find = n => { let r=n; while (parent.get(r)!==r) r=parent.get(r); while(n!==r){const p=parent.get(n);parent.set(n,r);n=p;} return r; };
    const unite = (a,b) => {
      let x=find(a), y=find(b);if(x===y)return false;
      if(rank.get(x)<rank.get(y)) [x,y]=[y,x];
      parent.set(y,x);if(rank.get(x)===rank.get(y)) rank.set(x,rank.get(x)+1);
      return true;
    };
    const sorted = [...graph.edges].sort((u,v) => (maximize ? v.w-u.w : u.w-v.w) || Math.min(u.a,u.b)-Math.min(v.a,v.b) || Math.max(u.a,u.b)-Math.max(v.a,v.b));
    const edges = [], rejected=[]; let cost=0;
    for (const e of sorted) {
      if(unite(e.a,e.b)) { edges.push(e);cost+=e.w; }
      else rejected.push(e);
    }
    const components = new Set(graph.nodes.map(find)).size;
    return { edges, rejected, cost, connected:components <= 1, components };
  }

  function prim(graph, start, maximize=false) {
    if (graph.directed) throw Error('Prim requiere un grafo no dirigido.');
    if (!graph.nodes.includes(start)) throw Error('Selecciona un nodo de origen válido.');
    const adj = adjacency(graph), visited = new Set(), edges=[]; let cost=0;
    // En grafos desconectados produce un bosque de expansión.
    for(const seed of [start, ...graph.nodes.filter(n => n!==start)]) {
      if(visited.has(seed)) continue;
      visited.add(seed);
      while(true) {
        const opts=[];
        for(const v of visited) for(const e of adj.get(v)) {
          if(!visited.has(e.to)) opts.push({a:v,b:e.to,w:e.w});
        }
        if(!opts.length)break;
        opts.sort((u,v)=>(maximize?v.w-u.w:u.w-v.w)||u.a-v.a||u.b-v.b);
        const best=opts[0];visited.add(best.b);edges.push(best);cost+=best.w;
      }
    }
    return { edges,cost,connected:edges.length===graph.nodes.length-1,components:graph.nodes.length-edges.length };
  }

  function floydWarshall(graph,start,end) {
    const nodes=[...graph.nodes],n=nodes.length,index=new Map(nodes.map((v,i)=>[v,i]));
    const dist=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:Infinity));
    const next=Array.from({length:n},()=>Array(n).fill(null));
    for (const e of graph.edges) {
      const i=index.get(e.a),j=index.get(e.b);
      if(e.w<dist[i][j]){dist[i][j]=e.w;next[i][j]=j;}
      if(!graph.directed && e.w<dist[j][i]){dist[j][i]=e.w;next[j][i]=i;}
    }
    for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      if(dist[i][k]+dist[k][j]<dist[i][j]) {dist[i][j]=dist[i][k]+dist[k][j];next[i][j]=next[i][k];}
    }
    const si=index.get(start),ei=index.get(end);
    if(si===undefined||ei===undefined) throw Error('Selecciona nodos de origen y destino válidos.');
    const path=[];
    if(Number.isFinite(dist[si][ei])){
      let i=si;path.push(nodes[i]);
      while(i!==ei){i=next[i][ei];if(i===null)break;path.push(nodes[i]);if(path.length>n+1)throw Error('Error reconstruyendo el camino.');}
    }
    return { nodes,matrix:dist,distance:dist[si][ei],path,edges:path.slice(1).map((v,i)=>({a:path[i],b:v})) };
  }

  function matrices(graph) {
    const nodes=[...graph.nodes],index=new Map(nodes.map((n,i)=>[n,i]));
    const adjacency=Array.from({length:nodes.length},()=>Array(nodes.length).fill(null));
    const incidence=Array.from({length:nodes.length},()=>Array(graph.edges.length).fill(0));
    graph.edges.forEach((e,j)=>{
      const a=index.get(e.a),b=index.get(e.b);
      adjacency[a][b]=e.w;
      if(!graph.directed)adjacency[b][a]=e.w;
      incidence[a][j]=graph.directed?-1:1;
      incidence[b][j]=1;
    });
    return { nodes,adjacency,incidence,edgeLabels:graph.edges.map(e=>`${e.a}${graph.directed?'→':'–'}${e.b}`) };
  }

  function treeCheck(graph) {
    const adj=adjacency(graph);
    if(graph.directed)throw Error('La prueba de árbol se realiza sobre grafos no dirigidos.');
    const seen=new Set(),parent=new Map(),stack=graph.nodes.length?[graph.nodes[0]]:[],cycles=[];
    if(stack.length) {seen.add(stack[0]);parent.set(stack[0],null);}
    while(stack.length){
      const v=stack.pop();
      for(const e of adj.get(v)){
        if(!seen.has(e.to)){seen.add(e.to);parent.set(e.to,v);stack.push(e.to);}
        else if(parent.get(v)!==e.to)cycles.push([v,e.to]);
      }
    }
    const connected=graph.nodes.length>0 && seen.size===graph.nodes.length,
      acyclic=cycles.length===0,
      edgeRule=graph.nodes.length>0 && graph.edges.length===graph.nodes.length-1;
    return {connected,acyclic,edgeRule,isTree:connected&&acyclic&&edgeRule};
  }

  return {adjacency,validate,traversal,shortestPath,kruskal,prim,floydWarshall,matrices,treeCheck};
});
