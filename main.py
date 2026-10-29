"""Entrada principal de COMPYLEX.

Abre automáticamente el nuevo laboratorio de grafos (incluye el grafo de la
pizarra). El analizador original permanece accesible con --compilador.
"""
from pathlib import Path
import subprocess
import sys
import webbrowser


BASE = Path(__file__).resolve().parent


def main():
    if '--compilador' in sys.argv:
        # Se mantiene la aplicación original hecha en Dear PyGui.
        return subprocess.call([sys.executable, str(BASE / 'compilador.py')])
    path = BASE / 'grafos.html'
    if not path.exists():
        print('No se encontró grafos.html en la carpeta del programa.')
        return 1
    print('Abriendo COMPYLEX - Laboratorio de grafos...')
    print('También puedes abrir directamente:', path)
    if not webbrowser.open_new_tab(path.as_uri()):
        print('Abre manualmente grafos.html con Chrome, Edge o Firefox.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
