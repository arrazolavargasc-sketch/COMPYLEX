# COMPYLEX/evaluador.py
# FASE 4A: Define el 'Evaluador' (recorre el árbol y calcula un resultado).



class Evaluador:
    """
    Recorre el Árbol Binario y calcula el resultado de las expresiones.
    """
    def __init__(self, variables=None):
        # Un simple almacén para variables (ej: x = 10)
        self.variables = variables if variables else {}

    def evaluar(self, nodo):
        """
        Función recursiva para evaluar el subárbol a partir de 'nodo'.
        """
        # Caso base: Nodos hoja (literales o variables) [cite: 55]
        if nodo.izquierdo is None and nodo.derecho is None:
            if isinstance(nodo.valor, (int, float)):
                return nodo.valor  # Es un número literal
            elif isinstance(nodo.valor, str):
                # Es una variable, buscar en el almacén
                if nodo.valor not in self.variables:
                    raise ValueError(f"Error de Evaluación: Variable '{nodo.valor}' no definida.")
                return self.variables[nodo.valor]

        # Caso: Nodos unarios (NOT, -u) [cite: 57]
        if nodo.izquierdo is None and nodo.derecho is not None:
            val_der = self.evaluar(nodo.derecho)
            if nodo.valor == 'NOT':
                return not val_der
            if nodo.valor == '-u':
                return -val_der
            raise ValueError(f"Operador unario desconocido: {nodo.valor}")

        # Caso: Nodos internos (operadores binarios) [cite: 56]
        val_izq = self.evaluar(nodo.izquierdo)
        val_der = self.evaluar(nodo.derecho)

        # --- Expresiones aritméticas [cite: 65] ---
        if nodo.valor == '+':
            return val_izq + val_der
        elif nodo.valor == '-':
            return val_izq - val_der
        elif nodo.valor == '*':
            return val_izq * val_der
        elif nodo.valor == '/':
            if val_der == 0:
                raise ValueError("Error de Evaluación: División por cero.")
            return val_izq / val_der
        elif nodo.valor == '**':
            return val_izq ** val_der
        
        # --- Expresiones lógicas [cite: 66] ---
        elif nodo.valor == '==':
            return val_izq == val_der
        elif nodo.valor == '!=':
            return val_izq != val_der
        elif nodo.valor == '>':
            return val_izq > val_der
        elif nodo.valor == '<':
            return val_izq < val_der
        elif nodo.valor == 'AND':
            return val_izq and val_der
        elif nodo.valor == 'OR':
            return val_izq or val_der
        
        raise ValueError(f"Operador binario desconocido: {nodo.valor}")