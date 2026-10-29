# COMPYLEX/lexer.py
# FASE 2: Define 'Token' y el 'Lexer' (convierte texto en tokens).

import re

# --- Definición de Tipos de Token ---
# Basado en la gramática [cite: 65, 66]
TIPOS_TOKEN = {
    'NUMERO': r'\d+(\.\d*)?',
    'VARIABLE': r'[a-zA-Z_][a-zA-Z0-9_]*',
    'SUMA': r'\+',
    'RESTA': r'-',
    'POTENCIA': r'\*\*',
    'MULTI': r'\*',
    'DIV': r'/',
    'PARENTECIS_IZQ': r'\(',
    'PARENTECIS_DER': r'\)',
    'IGUAL': r'==',
    'NO_IGUAL': r'!=',
    'MAYOR': r'>',
    'MENOR': r'<',
    # Nota: se menciona $NOT[cite: 66], pero usaremos 'NOT' estándar
    # que se mapeará de la regex 'VARIABLE'
    'ESPACIO': r'[ \t]+',
    'NUEVALINEA': r'\n',
    'NO_RECONOCIDO': r'.',
}

# Compilar las expresiones regulares en un solo patrón
patron_token = '|'.join(f'(?P<{tipo}>{regex})' for tipo, regex in TIPOS_TOKEN.items())

# --- Clase Token ---
class Token:
    """
    Representa una ficha léxica (token)[cite: 29].
    """
    def __init__(self, tipo, valor, linea=1):
        self.tipo = tipo
        self.valor = valor
        self.linea = linea

    def __repr__(self):
        return f"Token({self.tipo}, {self.valor!r})"

# --- Clase Lexer ---
class Lexer:
    """
    Analizador Léxico. Recibe el código fuente y genera tokens[cite: 25].
    """
    def __init__(self, texto):
        self.texto = texto
        self.tokens = self._generar_tokens(texto)
        self.pos_actual = -1
        self.token_actual = None
        self.avanzar()

    def _generar_tokens(self, texto):
        """Generador que produce tokens uno por uno."""
        linea = 1
        # Palabras clave reservadas
        palabras_clave = {'AND': 'AND', 'OR': 'OR', 'NOT': 'NOT'}

        for mo in re.finditer(patron_token, texto):
            tipo = mo.lastgroup
            valor = mo.group()

            if tipo == 'NUEVALINEA':
                linea += 1
            elif tipo == 'ESPACIO':
                continue  # Ignorar espacios
            elif tipo == 'VARIABLE':
                # Es una palabra clave (AND, OR, NOT)? [cite: 66]
                tipo = palabras_clave.get(valor.upper(), 'VARIABLE')
            elif tipo == 'NO_RECONOCIDO':
                # Error léxico [cite: 72]
                raise ValueError(f"Error Léxico: Símbolo no reconocido '{valor}' en línea {linea}")

            yield Token(tipo, valor, linea)
        
        yield Token('EOF', None, linea)  # Token de fin de archivo

    def avanzar(self):
        """Consume el token actual y avanza al siguiente."""
        try:
            self.pos_actual += 1
            self.token_actual = next(self.tokens)
        except StopIteration:
            self.token_actual = Token('EOF', None, getattr(self.token_actual, 'linea', 1))

    def consumir(self, tipo_esperado):
        """
        Verifica que el token actual sea del tipo esperado y avanza.
        Si no, lanza un error sintáctico[cite: 73].
        """
        if self.token_actual.tipo == tipo_esperado:
            self.avanzar()
        else:
            raise Exception(
                f"Error Sintáctico: Se esperaba {tipo_esperado} "
                f"pero se encontró {self.token_actual.tipo} ('{self.token_actual.valor}') "
                f"en línea {self.token_actual.linea}"
            )