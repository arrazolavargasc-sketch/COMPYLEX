# COMPYLEX/visualizador.py
# ACTUALIZADO: Lógica para la visualización gráfica con colores.

import dearpygui.dearpygui as dpg


# --- Constantes de Dibujo (NUEVOS COLORES) ---
NODE_RADIUS = 30 # Aumentado para texto más grande
V_SPACING = 75   # Aumentado un poco para compensar el radio
MIN_H_SPACING = 40
LINE_COLOR = (200, 200, 200)
TEXT_COLOR = (0, 0, 0) # Texto negro para mejor contraste

# Colores para los nodos (Operador vs Literal)
COLOR_OPERADOR = (150, 210, 255) # Celeste
COLOR_LITERAL = (200, 230, 200) # Verde claro

def _obtener_profundidad(nodo):
    """Calcula la profundidad máxima del árbol."""
    if nodo is None:
        return 0
    return 1 + max(_obtener_profundidad(nodo.izquierdo), _obtener_profundidad(nodo.derecho))

def _dibujar_nodo_recursivo(drawlist_tag, nodo, x, y, h_spacing, scale):
    """
    Función recursiva para dibujar un nodo y sus hijos.
    """
    if nodo is None:
        return

    # NUEVO: Determinar el color basado en el tipo de nodo
    # Si tiene hijos, es un operador. Si no, es un literal (hoja).
    es_operador = nodo.izquierdo or nodo.derecho
    
    if es_operador:
        node_fill_color = COLOR_OPERADOR
    else:
        node_fill_color = COLOR_LITERAL

    # Escalar dimensiones
    radius = NODE_RADIUS * scale
    v_spacing = V_SPACING * scale
    font_size = 20 * scale

    # 1. Dibujar el nodo actual (círculo + texto)
    # Convertir coordenadas a int para evitar errores en dpg
    ix, iy = int(x), int(y)
    dpg.draw_circle(center=(ix, iy), radius=radius, color=node_fill_color, fill=node_fill_color, parent=drawlist_tag)
    
    # Ajustar el centrado del texto
    valor_str = str(nodo.valor)
    
    # Estimación de ancho para centrar (aprox 0.5 * size por caracter)
    text_width = len(valor_str) * (font_size * 0.5) 
    
    # Dibujar texto con tamaño específico
    dpg.draw_text(pos=(int(x - text_width / 2), int(y - font_size/2)), text=valor_str, color=TEXT_COLOR, size=font_size, parent=drawlist_tag)

    # 2. Calcular posición del hijo izquierdo
    if nodo.izquierdo:
        x_izq = x - h_spacing
        y_izq = y + v_spacing
        # Dibujar línea al hijo izquierdo
        dpg.draw_line(p1=(ix, iy + radius), p2=(int(x_izq), int(y_izq - radius)), color=LINE_COLOR, thickness=1, parent=drawlist_tag)
        # Llamada recursiva
        _dibujar_nodo_recursivo(drawlist_tag, nodo.izquierdo, x_izq, y_izq, max(h_spacing / 2, MIN_H_SPACING * scale), scale)

    # 3. Calcular posición del hijo derecho
    if nodo.derecho:
        x_der = x + h_spacing
        y_der = y + v_spacing
        # Dibujar línea al hijo derecho
        dpg.draw_line(p1=(ix, iy + radius), p2=(int(x_der), int(y_der - radius)), color=LINE_COLOR, thickness=1, parent=drawlist_tag)
        # Llamada recursiva
        _dibujar_nodo_recursivo(drawlist_tag, nodo.derecho, x_der, y_der, max(h_spacing / 2, MIN_H_SPACING * scale), scale)

def dibujar_arbol(drawlist_tag, arbol, offset_x=0, offset_y=0, scale=1.0):
    """
    Función principal para iniciar el dibujo del árbol.
    Permite offsets para mover el árbol (panning) y escala (zoom).
    """
    
    # Limpiar el canvas anterior
    dpg.delete_item(drawlist_tag, children_only=True)

    if arbol is None:
        return

    try:
        canvas_width = dpg.get_item_configuration(drawlist_tag)["width"]
    except:
        canvas_width = 500 # Valor por defecto si falla

    
    profundidad = _obtener_profundidad(arbol)
    # Escalar el espaciado inicial
    min_h_spacing_scaled = MIN_H_SPACING * scale
    h_spacing_inicial = max(min_h_spacing_scaled * (2**(profundidad - 2)), min_h_spacing_scaled * 2)
    
    # Aplicar el offset al punto de inicio
    start_x = (canvas_width / 2) + offset_x
    start_y = ((NODE_RADIUS * scale) + 20) + offset_y

    _dibujar_nodo_recursivo(drawlist_tag, arbol, start_x, start_y, h_spacing_inicial, scale)