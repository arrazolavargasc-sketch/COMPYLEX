# COMPYLEX — Laboratorio de grafos

## Publicar en Vercel (solución al error `PYTHON_ENTRYPOINT_NOT_FOUND`)

COMPYLEX tiene dos partes diferentes:

- **Laboratorio web de grafos**: HTML, CSS y JavaScript; no requiere Python ni backend y es lo que se publica en Vercel.
- **Analizador de expresiones local**: usa Python y Dear PyGui; se mantiene en `escritorio/` para usarlo en Windows. Esa interfaz de escritorio **no funciona dentro de Vercel**.

Los archivos web se trasladaron a `public/`, que contiene `index.html` y todos sus recursos. El lanzador Python y sus dependencias se trasladaron a `escritorio/` para que Vercel no interprete `main.py` de la raíz como una API Python.

`vercel.json` establece `outputDirectory: "public"` y no necesita redirecciones ni rewrites: la ruta `/` encuentra `public/index.html` directamente.

### Instrucciones para tu repositorio GitHub

1. **Copia los archivos de esta versión a la raíz de tu repositorio local.** Reemplaza los antiguos; no dejes en la raíz `main.py`, `requirements.txt`, `grafos.html`, `grafos.js`, `grafo_algoritmos.js`, `grafos.css`, `grafos-tabla.css` ni los módulos `compilador.py`, `lexer.py`, `parser.py`, `arbol.py`, `evaluador.py`, `visualizador.py`. Ya están reubicados en `public/` o `escritorio/`.
2. Abre PowerShell en la carpeta de tu repositorio (la que contiene `.git`). **Elimina los archivos de la versión antigua que quedaron en la raíz**. Es normal que estén ausentes algunos; la versión nueva está en `public/` y `escritorio/`:

   ```powershell
   Remove-Item -ErrorAction SilentlyContinue main.py,requirements.txt,grafos.html,grafos.css,grafos-tabla.css,grafos.js,grafo_algoritmos.js,arbol.py,compilador.py,evaluador.py,lexer.py,parser.py,visualizador.py
   ```

   Después registra también las eliminaciones y sube el cambio:

   ```powershell
   git add -A
   git commit -m "Fix: publicar COMPYLEX como sitio estático en Vercel"
   git push origin main
   ```

   Si tu rama se llama diferente, usa ese nombre en lugar de `main`.
3. En Vercel abre tu proyecto, **Settings → Build and Deployment** (o **Build and Development Settings**): selecciona **Framework Preset = Other**. La **Root Directory** debe ser la que contiene `vercel.json` y la carpeta `public` (normalmente `./`). Desactiva comandos de compilación personalizados que estén configurados para Python. La **Output Directory** será `public`, definida en `vercel.json`.
4. Espera el despliegue de la rama de producción o usa **Deployments → Redeploy** sobre el último commit. Abre el dominio de Vercel: `/` debe cargar el grafo con 12 nodos y 21 aristas.

> **ATENCIÓN:** subir únicamente los archivos nuevos a GitHub sin eliminar los archivos antiguos deja un `main.py` en la raíz y podría provocar el mismo error. Usa `git add -A` para registrar también los archivos eliminados.

### Estructura

```text
COMPYLEX/  ← raíz del repositorio GitHub
├─ vercel.json
├─ public/
│  ├─ index.html
│  ├─ grafos.css
│  ├─ grafos-tabla.css
│  ├─ grafos.js
│  └─ grafo_algoritmos.js
├─ escritorio/
│  ├─ main.py
│  ├─ compilador.py
│  ├─ lexer.py
│  ├─ parser.py
│  ├─ evaluador.py
│  ├─ arbol.py
│  ├─ visualizador.py
│  └─ requirements.txt
├─ INICIAR_GRAFOS.bat
└─ INICIAR_COMPILADOR.bat
```

## Ejecutar localmente (Windows)

- Doble clic en `INICIAR_GRAFOS.bat` o abrir `public/index.html` con Chrome/Edge/Firefox. También puedes ejecutar `python escritorio/main.py` desde la raíz.
- Para abrir el analizador de expresiones original: `INICIAR_COMPILADOR.bat`, o instala sus dependencias con `python -m pip install -r escritorio/requirements.txt` y después ejecuta `python escritorio/compilador.py`.
- No necesitas instalar Python para el laboratorio web de grafos.

## Funciones del laboratorio de grafos (sin modificaciones)

- Grafo inicial de la pizarra, con 12 nodos y 21 aristas ponderadas.
- Mover, agregar, conectar y eliminar nodos, y editar pesos.
- Grafos dirigidos y no dirigidos; exportar e importar JSON; descargar SVG.
- Kruskal y Prim mínimo/máximo; recorridos BFS/DFS; Dijkstra y Floyd-Warshall.
- Matriz de adyacencia e incidencia; verificación de árbol; modo presentación.

## Por qué aparecían los errores

- `PYTHON_ENTRYPOINT_NOT_FOUND`: Vercel detectaba `main.py` en la raíz y esperaba un objeto Python `app`/`application`/`handler`. Aquí `main.py` solo abría una página con `webbrowser`; no exponía servidor.
- `Internal rewrites ...`: la regla `/` → `/grafos.html` ya no es necesaria. `public/index.html` es la entrada directamente y no tenemos rewrites.

> Esta versión se prepara para despliegue estático. Después de subir el commit a GitHub, Vercel podrá construir el sitio.
