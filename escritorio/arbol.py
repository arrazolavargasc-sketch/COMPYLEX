# COMPYLEX/arbol.py
# FASE 1: Define la clase 'Nodo' y los recorridos.
# ACTUALIZADO: Para incluir los 3 recorridos.

class Nodo:
    """
    Define la estructura del Nodo para el árbol binario.
    """
    def __init__(self, valor):
        self.valor = valor  # Token o valor almacenado
        self.izquierdo = None  # Referencia al hijo izquierdo
        self.derecho = None  # Referencia al hijo derecho

    def __repr__(self):
        return f"Nodo({self.valor})"

# --- Operaciones del Árbol Binario (Recorridos) ---

def recorrido_in_order(nodo):
    """
    Recorrido In-order (notación infija).
    Retorna una lista de los valores.
    """
    elementos = []
    if nodo:
        elementos.extend(recorrido_in_order(nodo.izquierdo))
        elementos.append(str(nodo.valor))
        elementos.extend(recorrido_in_order(nodo.derecho))
    return elementos

def recorrido_pre_order(nodo):
    """
    Recorrido Pre-order.
    Retorna una lista de los valores.
    """
    elementos = []
    if nodo:
        elementos.append(str(nodo.valor))
        elementos.extend(recorrido_pre_order(nodo.izquierdo))
        elementos.extend(recorrido_pre_order(nodo.derecho))
    return elementos

def recorrido_post_order(nodo):
    """
    Recorrido Post-order (notación polaca inversa).
    Retorna una lista de los valores.
    """
    elementos = []
    if nodo:
        elementos.extend(recorrido_post_order(nodo.izquierdo))
        elementos.extend(recorrido_post_order(nodo.derecho))
        elementos.append(str(nodo.valor))
    return elementos