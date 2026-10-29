import dearpygui.dearpygui as dpg
import os
from lexer import Lexer, Token
from parser import Parser
from evaluador import Evaluador
from arbol import recorrido_in_order, recorrido_pre_order, recorrido_post_order
from visualizador import dibujar_arbol

VARIABLES_GLOBALES = {'x': 10, 'y': 5, 'PI': 3.14159}
FONT_PATH = "Roboto-Regular.ttf" 

GLOBAL_ARBOL = None
OFFSET_X = 0
OFFSET_Y = 0
LAST_OFFSET_X = 0
LAST_OFFSET_Y = 0
GLOBAL_SCALE = 1.0 
IS_DRAGGING_CANVAS = False 

COLOR_BG = (37, 37, 38)
COLOR_CHILD_BG = (45, 45, 48)
COLOR_TEXT = (255, 255, 255)
COLOR_ACCENT = (0, 122, 204)
COLOR_ACCENT_HOVER = (0, 150, 255)
COLOR_ERROR = (255, 85, 85)

def aplicar_tema_personalizado():
    """Aplica un tema global coherente y profesional."""
    with dpg.theme() as global_theme:
        with dpg.theme_component(dpg.mvAll):
            dpg.add_theme_color(dpg.mvThemeCol_WindowBg, COLOR_BG)
            dpg.add_theme_color(dpg.mvThemeCol_ChildBg, COLOR_CHILD_BG)
            dpg.add_theme_color(dpg.mvThemeCol_Text, COLOR_TEXT)
            dpg.add_theme_color(dpg.mvThemeCol_Button, COLOR_ACCENT)
            dpg.add_theme_color(dpg.mvThemeCol_ButtonHovered, COLOR_ACCENT_HOVER)
            dpg.add_theme_color(dpg.mvThemeCol_Header, COLOR_ACCENT)
            dpg.add_theme_color(dpg.mvThemeCol_HeaderHovered, COLOR_ACCENT_HOVER)
            dpg.add_theme_color(dpg.mvThemeCol_FrameBg, COLOR_CHILD_BG)
            dpg.add_theme_color(dpg.mvThemeCol_FrameBgHovered, (60, 60, 63))
            dpg.add_theme_color(dpg.mvThemeCol_TitleBgActive, COLOR_ACCENT)
            
            dpg.add_theme_style(dpg.mvStyleVar_FrameRounding, 5.0)
            dpg.add_theme_style(dpg.mvStyleVar_ChildRounding, 5.0)
            dpg.add_theme_style(dpg.mvStyleVar_WindowPadding, 15.0, 15.0)
            dpg.add_theme_style(dpg.mvStyleVar_ItemSpacing, 10.0, 8.0)

    dpg.bind_theme(global_theme)

def cargar_fuente():
    """Carga y bindea una fuente global de alta legibilidad."""
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        font_abs_path = os.path.join(base_path, FONT_PATH)
        
        with dpg.font_registry():
            if os.path.exists(font_abs_path):
                default_font = dpg.add_font(font_abs_path, 16)
                dpg.bind_font(default_font)
            else:
                if os.path.exists(FONT_PATH):
                    default_font = dpg.add_font(FONT_PATH, 16)
                    dpg.bind_font(default_font)
                else:
                    print(f"Advertencia: No se encontró la fuente {FONT_PATH}. Usando fuente por defecto.")
    except Exception as e:
        print(f"Advertencia: No se pudo cargar la fuente personalizada ({e}). Usando fuente por defecto.")

def limpiar_outputs():
    """Limpia todos los campos de salida y errores."""
    dpg.set_value("output_error", "")
    dpg.set_value("output_resultado", "Resultado: N/A")
    dpg.delete_item("canvas_arbol", children_only=True)
    dpg.delete_item("tabla_tokens", children_only=True)
    dpg.delete_item("recorridos_grupo", children_only=True)
    
    # Re-agregar encabezados (columnas) ya que dpg.delete_item los borró
    dpg.add_table_column(label="Tipo", parent="tabla_tokens")
    dpg.add_table_column(label="Valor", parent="tabla_tokens")
    dpg.add_table_column(label="Línea", parent="tabla_tokens")

def callback_drag_arbol(sender, app_data):
    """Maneja el arrastre del mouse para mover el árbol."""
    global OFFSET_X, OFFSET_Y, LAST_OFFSET_X, LAST_OFFSET_Y, GLOBAL_ARBOL, GLOBAL_SCALE, IS_DRAGGING_CANVAS
    
    # Solo mover si hay un árbol, el mouse está sobre el canvas Y se inició el arrastre en el canvas
    if GLOBAL_ARBOL is None or not IS_DRAGGING_CANVAS:
        return

    # app_data puede variar según la versión de Dear PyGui
    # Estructura común 1: (button, dx, dy)
    # Estructura común 2: (button, (dx, dy))
    
    try:
        if len(app_data) < 2:
            return

        button = app_data[0]
        if button != 0: # Solo click izquierdo (0)
            return

        # Intentar extraer dx, dy
        if isinstance(app_data[1], (list, tuple)):
            # Caso (button, (dx, dy))
            dx = app_data[1][0]
            dy = app_data[1][1]
        elif len(app_data) >= 3:
            # Caso (button, dx, dy)
            dx = app_data[1]
            dy = app_data[2]
        else:
            return # Formato desconocido

        OFFSET_X = LAST_OFFSET_X + dx
        OFFSET_Y = LAST_OFFSET_Y + dy
        
        dibujar_arbol("canvas_arbol", GLOBAL_ARBOL, OFFSET_X, OFFSET_Y, GLOBAL_SCALE)
    except Exception as e:
        # Evitar crash si app_data es muy extraño
        print(f"Error en drag: {e}, app_data: {app_data}")

def callback_end_drag(sender, app_data):
    """Actualiza la posición base al soltar el mouse."""
    global LAST_OFFSET_X, LAST_OFFSET_Y, OFFSET_X, OFFSET_Y, IS_DRAGGING_CANVAS
    LAST_OFFSET_X = OFFSET_X
    LAST_OFFSET_Y = OFFSET_Y
    IS_DRAGGING_CANVAS = False

def callback_mouse_down(sender, app_data):
    """Detecta si el clic inicial fue sobre el área de visualización."""
    global IS_DRAGGING_CANVAS
    # Verificar si el mouse está sobre la columna derecha (donde está el canvas)
    # Nota: dpg.is_item_hovered("col_derecha") funciona bien para contenedores
    if dpg.is_item_hovered("col_derecha") or dpg.is_item_hovered("canvas_arbol"):
        IS_DRAGGING_CANVAS = True

def callback_mouse_wheel(sender, app_data):
    """Maneja el zoom con la rueda del mouse."""
    global GLOBAL_SCALE, GLOBAL_ARBOL, OFFSET_X, OFFSET_Y
    
    if GLOBAL_ARBOL is None:
        return

    # app_data es el valor del scroll (positivo o negativo)
    zoom_speed = 0.1
    if app_data > 0:
        GLOBAL_SCALE += zoom_speed
    else:
        GLOBAL_SCALE -= zoom_speed
    # Limitar el zoom mínimo y máximo
    GLOBAL_SCALE = max(0.1, min(GLOBAL_SCALE, 5.0))
    
    dibujar_arbol("canvas_arbol", GLOBAL_ARBOL, OFFSET_X, OFFSET_Y, GLOBAL_SCALE)

def callback_archivo_seleccionado(sender, app_data):
    """Carga el contenido del archivo seleccionado en el input."""
    print(f"DEBUG: app_data={app_data}") # Para depuración
    try:
        # Usar 'selections' es más seguro ya que contiene los archivos realmente seleccionados
        if 'selections' in app_data and app_data['selections']:
            # Iterar sobre las selecciones (aunque sea single select)
            for file_name, file_path in app_data['selections'].items():
                with open(file_path, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                    dpg.set_value("input_codigo", contenido)
                break # Solo cargamos el primer archivo si hay múltiples
        elif 'file_path_name' in app_data:
            # Fallback al método anterior si selections está vacío (raro pero posible)
            file_path = app_data['file_path_name']
            with open(file_path, 'r', encoding='utf-8') as f:
                contenido = f.read()
                dpg.set_value("input_codigo", contenido)
        else:
            dpg.set_value("output_error", "No se seleccionó ningún archivo válido.")
            
    except Exception as e:
        dpg.set_value("output_error", f"Error al abrir archivo: {e}")

def ejecutar_compilacion(sender, app_data, user_data):
    """
    Función principal que se ejecuta al presionar el botón.
    """
    global GLOBAL_ARBOL, OFFSET_X, OFFSET_Y, LAST_OFFSET_X, LAST_OFFSET_Y, GLOBAL_SCALE
    
    limpiar_outputs()
    codigo = dpg.get_value("input_codigo")
    if not codigo:
        return

    try:
        # --- FASE 2: Léxico (Poblar Tabla) ---
        lexer_para_tabla = Lexer(codigo)
        while lexer_para_tabla.token_actual.tipo != 'EOF':
            tok = lexer_para_tabla.token_actual
            with dpg.table_row(parent="tabla_tokens"):
                dpg.add_text(tok.tipo)
                dpg.add_text(str(tok.valor))
                dpg.add_text(str(tok.linea))
            lexer_para_tabla.avanzar()
        # Añadir EOF
        tok = lexer_para_tabla.token_actual
        with dpg.table_row(parent="tabla_tokens"):
            dpg.add_text(tok.tipo)
            dpg.add_text(str(tok.valor))
            dpg.add_text(str(tok.linea))

        # --- FASE 3: Sintáctico (Dibujar Árbol) ---
        lexer_para_parser = Lexer(codigo)
        parser = Parser(lexer_para_parser)
        arbol = parser.parse()
        
        # Guardar estado global para el panning y zoom
        GLOBAL_ARBOL = arbol
        OFFSET_X, OFFSET_Y = 0, 0
        LAST_OFFSET_X, LAST_OFFSET_Y = 0, 0
        GLOBAL_SCALE = 1.0

        # --- FASE 4A: Evaluación ---
        evaluador = Evaluador(VARIABLES_GLOBALES)
        resultado = evaluador.evaluar(arbol)
        dpg.set_value("output_resultado", f"Resultado: {resultado}")

        # --- FASE 4B: Recorridos ---
        with dpg.group(parent="recorridos_grupo"):
            dpg.add_text(f"In-Order (Regla: Izquierda, Raíz, Derecha): {' '.join(recorrido_in_order(arbol))}", wrap=550)
            dpg.add_separator()
            dpg.add_text(f"Pre-Order (Regla: Raíz, Izquierda, Derecha): {' '.join(recorrido_pre_order(arbol))}", wrap=550)
            dpg.add_separator()
            dpg.add_text(f"Post-Order (Regla: Izquierda, Derecha, Raíz): {' '.join(recorrido_post_order(arbol))}", wrap=550)

        # --- FASE 5: Visualización ---
        dibujar_arbol("canvas_arbol", arbol, OFFSET_X, OFFSET_Y, GLOBAL_SCALE)

    except Exception as e:
        dpg.set_value("output_error", f"Error: {e}")


dpg.create_context()
cargar_fuente()

# 2. Configurar Viewport y Ventana Principal
dpg.create_viewport(title='COMPYLEX - Analizador de Expresiones', width=1200, height=700)
with dpg.window(label="COMPYLEX", tag="VentanaPrincipal"):
    
    # --- Encabezado y Entrada ---
    dpg.add_text("COMPYLEX: Analizador de Expresiones", color=COLOR_ACCENT)
    dpg.add_separator()

    with dpg.group(horizontal=True):
        # Dejamos 280px de espacio para los botones
        dpg.add_input_text(tag="input_codigo", width=-280, default_value="(10 + 5) > 12 AND NOT (1 == 2)")
        # Botón para abrir archivo
        dpg.add_button(label="Abrir Archivo", callback=lambda: dpg.show_item("file_dialog_id"), width=110)
        # El botón ocupa el espacio restante (-1)
        dpg.add_button(label="Analizar y Evaluar", callback=ejecutar_compilacion, width=-1)

    vars_str = ", ".join([f"{k}={v}" for k,v in VARIABLES_GLOBALES.items()])
    dpg.add_text(f"Variables: {vars_str}", color=(150, 150, 150))
    dpg.add_text("", tag="output_error", color=COLOR_ERROR, wrap=1180)
    
    dpg.add_separator()

    # --- File Dialog ---
    with dpg.file_dialog(directory_selector=False, show=False, callback=callback_archivo_seleccionado, tag="file_dialog_id", width=700, height=400):
        dpg.add_file_extension(".*")
        dpg.add_file_extension(".txt", color=(0, 255, 0, 255))
        dpg.add_file_extension(".py", color=(255, 255, 0, 255))

    # --- Contenedor principal de dos columnas ---
    with dpg.group(horizontal=True):
        
        # --- Columna Izquierda (Resultados de Texto) ---
        with dpg.child_window(width=580, height=-1, tag="col_izquierda"):
            dpg.add_text("Resultados del Análisis", color=COLOR_TEXT)
            dpg.add_separator()
            
            # Resultado de Evaluación
            dpg.add_text("Resultado: N/A", tag="output_resultado", color=COLOR_TEXT)
            dpg.add_separator()

            # Sección de Tokens (Colapsable)
            with dpg.collapsing_header(label="FASE LÉXICA (Tokens)", default_open=True):
                
                with dpg.table(tag="tabla_tokens", header_row=True, 
                               borders_innerH=True, borders_outerH=True, 
                               borders_innerV=True, borders_outerV=True, 
                               resizable=True, policy=dpg.mvTable_SizingStretchProp):
                
                    dpg.add_table_column(label="Tipo")
                    dpg.add_table_column(label="Valor")
                    dpg.add_table_column(label="Línea")

            # Sección de Recorridos (Colapsable)
            with dpg.collapsing_header(label="Recorridos del Árbol", default_open=False):
                dpg.add_group(tag="recorridos_grupo")

        # --- Columna Derecha (Visualización del Árbol) ---
        with dpg.child_window(width=-1, height=-1, tag="col_derecha", horizontal_scrollbar=True):
            dpg.add_text("Visualización del Árbol de Sintaxis (Arrastra para mover)", color=COLOR_TEXT)
            dpg.add_separator()
            # Canvas para el árbol (Tamaño aumentado para permitir scroll)
            with dpg.drawlist(width=3000, height=2000, tag="canvas_arbol"):
                dpg.draw_text(pos=(5, 5), text="Presione 'Analizar' para generar el árbol.", color=COLOR_TEXT, size=16)

# --- Handlers Globales para Mouse ---
with dpg.handler_registry():
    dpg.add_mouse_down_handler(callback=callback_mouse_down)
    dpg.add_mouse_drag_handler(callback=callback_drag_arbol)
    dpg.add_mouse_release_handler(callback=callback_end_drag)
    dpg.add_mouse_wheel_handler(callback=callback_mouse_wheel)

# 3. Aplicar Tema y Iniciar
aplicar_tema_personalizado()
dpg.setup_dearpygui()
dpg.show_viewport()
dpg.set_primary_window("VentanaPrincipal", True)
dpg.start_dearpygui()
dpg.destroy_context()