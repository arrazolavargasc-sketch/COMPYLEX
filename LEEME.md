# COMPYLEX — Laboratorio de grafos

## Inicio del programa

- En Windows, abre **INICIAR_GRAFOS.bat** o ejecuta `python main.py` desde esta carpeta.
- También puedes abrir **grafos.html** con Chrome, Edge o Firefox.
- No se necesitan instalaciones, conexión a Internet ni servidor web para usar los grafos.

## Publicar en Vercel

El laboratorio de grafos es una aplicación estática HTML/CSS/JavaScript; `main.py` solo sirve para abrirla localmente y no es una API web. El archivo `vercel.json` configura el preset **Other**, publica los archivos de esta carpeta y dirige la ruta `/` a `grafos.html`.

En Vercel, selecciona como **Root Directory** la carpeta que contiene `vercel.json` (la raíz del repositorio si subiste el contenido de `COMPYLEX`) y vuelve a desplegar. No configures un runtime Python para este proyecto.

El inicio muestra **el grafo ponderado de la foto del pizarrón**, con **12 nodos y 21 aristas**. La posición inicial respeta aproximadamente la distribución de la foto; puedes mover los nodos, y el botón **Restaurar ejemplo** recupera el grafo de la pizarra.

## Algoritmos y funciones

- Kruskal mínimo y máximo.
- Prim mínimo y máximo.
- BFS y DFS desde un nodo.
- Dijkstra y Floyd-Warshall (camino más corto con origen y destino elegibles).
- Verificación de árbol y de los resultados de Kruskal/Prim: conectado, sin ciclos y con exactamente V−1 aristas. Un grafo vacío no se considera árbol.
- Matrices de adyacencia (ponderada) e incidencia.
- Tabla del árbol de expansión mínimo/máximo con el orden de selección, las aristas (nodos conectados) y sus pesos.
- Agregar, conectar, eliminar y mover nodos; editar pesos desde el panel izquierdo.
- Grafos dirigidos/no dirigidos y exportación/importación JSON.
- Descargar el dibujo como SVG y **modo presentación** para proyectar.

Para conectar nodos, elige **Conectar**, pulsa el nodo inicial y luego el nodo final; aparecerá la entrada de peso. En modo **Mover**, haz clic sobre una arista para editar su peso, o pulsa **Eliminar** para quitar el elemento seleccionado. También puedes eliminarlo con `Supr`.

**Nota:** los pesos que no estaban presentes en la primera descripción textual sí se han incluido de la imagen más reciente. El grafo original tiene ciclos; un árbol de expansión lo transforma en un conjunto de 11 aristas sin ciclos.

## El analizador original sigue incluido

El antiguo **COMPYLEX — Analizador de Expresiones** se preservó como `compilador.py`. Para ejecutarlo:

```powershell
python -m pip install -r requirements.txt
python main.py --compilador
```

O con **INICIAR_COMPILADOR.bat**. Sus archivos (`lexer.py`, `parser.py`, `evaluador.py`, `arbol.py`, `visualizador.py`) se mantienen sin alteraciones.

## Archivos principales

- `main.py`: arranque por defecto del laboratorio de grafos.
- `grafos.html`: interfaz de usuario del laboratorio.
- `grafos.css`: estilos y modo presentación.
- `grafos.js`: interactividad y distribución inicial del grafo.
- `grafo_algoritmos.js`: implementación de los algoritmos.
- `compilador.py`: analizador de expresiones original.

## Conexiones y pesos transcritos de la pizarra

```text
1–3: 1    1–2: 3    1–4: 4    1–5: 1
2–3: 6    2–4: 5    2–6: 3
3–6: 2    3–10: 7
4–7: 9
5–10: 3   5–11: 14
6–7: 3    6–9: 1
7–8: 10   7–9: 11
8–12: 1
9–10: 18  9–12: 16
10–11: 15  11–12: 20
```

**Resultados de control:** Kruskal mínimo = **43**, Kruskal máximo = **118**, Dijkstra de **1** a **12** = **17** (ruta 1–3–6–7–8–12). La tabla de Kruskal muestra, en orden, las 11 aristas seleccionadas y sus pesos. Para presentación, usa **Modo presentación** en el programa y opcionalmente `F11` en tu navegador.
