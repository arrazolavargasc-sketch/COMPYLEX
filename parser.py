# COMPYLEX/parser.py
# FASE 3: Define el 'Parser' (convierte tokens en el árbol binario).

from arbol import Nodo
from lexer import Lexer, Token

class Parser:
    """
    Analizador Sintáctico (Parser).
    Construye un Árbol Binario (Árbol de Sintaxis) [cite: 34, 35] 
    a partir de la secuencia de tokens del Lexer.
    Utiliza análisis descendente recursivo.
    """
    def __init__(self, lexer):
        self.lexer = lexer

    def parse(self):
        """Inicia el proceso de parsing."""
        arbol = self.expr_logica()
        if self.lexer.token_actual.tipo != 'EOF':
            raise Exception(f"Error Sintáctico: Token inesperado al final: {self.lexer.token_actual}")
        return arbol

    def factor(self):
        """Maneja la precedencia más alta: números, variables, paréntesis y unarios[cite: 55, 57]."""
        token = self.lexer.token_actual

        if token.tipo == 'NUMERO':
            self.lexer.consumir('NUMERO')
            return Nodo(float(token.valor))
        
        if token.tipo == 'VARIABLE':
            self.lexer.consumir('VARIABLE')
            return Nodo(token.valor) # Nodo hoja [cite: 55]

        if token.tipo == 'PARENTECIS_IZQ':
            self.lexer.consumir('PARENTECIS_IZQ')
            nodo = self.expr_logica()  # Volver al inicio de la gramática para la expresión agrupada
            self.lexer.consumir('PARENTECIS_DER')
            return nodo

        # Operadores unarios [cite: 57]
        if token.tipo == 'RESTA':
            self.lexer.consumir('RESTA')
            nodo = Nodo('-u') # 'u' por unario
            nodo.derecho = self.factor()
            return nodo
        
        if token.tipo == 'NOT':
            self.lexer.consumir('NOT')
            nodo = Nodo('NOT')
            nodo.derecho = self.factor() # El parser de $NOT [cite: 66] sería unario
            return nodo

        # Error de construcción [cite: 74]
        raise Exception(f"Error Sintáctico: Factor inesperado {token}")

    def potencia(self):
        """Maneja el operador de potencia (**)[cite: 65]."""
        nodo = self.factor()
        while self.lexer.token_actual.tipo == 'POTENCIA':
            op_token = self.lexer.token_actual
            self.lexer.consumir('POTENCIA')
            nodo_der = self.factor()
            
            nuevo_nodo = Nodo(op_token.valor) # Nodo interno [cite: 56]
            nuevo_nodo.izquierdo = nodo
            nuevo_nodo.derecho = nodo_der
            nodo = nuevo_nodo
        return nodo

    def term(self):
        """Maneja operadores de multiplicación y división (*, /)."""
        nodo = self.potencia()
        while self.lexer.token_actual.tipo in ('MULTI', 'DIV'):
            op_token = self.lexer.token_actual
            self.lexer.consumir(op_token.tipo)
            nodo_der = self.potencia()
            
            nuevo_nodo = Nodo(op_token.valor)
            nuevo_nodo.izquierdo = nodo
            nuevo_nodo.derecho = nodo_der
            nodo = nuevo_nodo
        return nodo

    def expr_arit(self):
        """Maneja operadores de suma y resta (+, -)."""
        nodo = self.term()
        while self.lexer.token_actual.tipo in ('SUMA', 'RESTA'):
            op_token = self.lexer.token_actual
            self.lexer.consumir(op_token.tipo)
            nodo_der = self.term()
            
            nuevo_nodo = Nodo(op_token.valor)
            nuevo_nodo.izquierdo = nodo
            nuevo_nodo.derecho = nodo_der
            nodo = nuevo_nodo
        return nodo

    def expr_comp(self):
        """Maneja operadores de comparación (==, !=, >, <)[cite: 66]."""
        nodo = self.expr_arit()
        while self.lexer.token_actual.tipo in ('IGUAL', 'NO_IGUAL', 'MAYOR', 'MENOR'):
            op_token = self.lexer.token_actual
            self.lexer.consumir(op_token.tipo)
            nodo_der = self.expr_arit()
            
            nuevo_nodo = Nodo(op_token.valor)
            nuevo_nodo.izquierdo = nodo
            nuevo_nodo.derecho = nodo_der
            nodo = nuevo_nodo
        return nodo

    def expr_logica(self):
        """Maneja operadores lógicos (AND, OR) [cite: 66] (precedencia más baja)."""
        nodo = self.expr_comp()
        while self.lexer.token_actual.tipo in ('AND', 'OR'):
            op_token = self.lexer.token_actual
            self.lexer.consumir(op_token.tipo)
            nodo_der = self.expr_comp()
            
            nuevo_nodo = Nodo(op_token.valor)
            nuevo_nodo.izquierdo = nodo
            nuevo_nodo.derecho = nodo_der
            nodo = nuevo_nodo
        return nodo