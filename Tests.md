# Tests de Entrega

## Contrato Solidity

Casos mínimos verificados con:
- Remix Unit Testing / Hardhat

1. ✓ Constructor guarda producto y duración
2. ✓ Primera puja válida se acepta
3. ✓ Segunda puja mismo usuario se rechaza
4. ✓ Puja menor que actual se rechaza
5. ✓ Ganador solo consultable al finalizar
6. ✓ No ganador puede retirar
7. ✓ Ganador no puede retirar

## DApp React

Pruebas manuales:
- Con 2 cuentas de testnet diferente
- En http://localhost:3000/subasta


### Conexión
 - MetaMask no conectado → muestra warning.
 - MetaMask en red incorrecta → muestra warning.
 - MetaMask en BSC Testnet → conecta y muestra "Wallet conectada".

### Puja
 - Input vacío → botón deshabilitado.
 - Input no numérico (ej. "abc") → rechaza entrada.
 - Monto 0 → botón deshabilitado.
 - Monto válido → puja enviada, estado refresca.
 - Segunda puja mismo usuario → error "Solo una puja".
 - Puja menor que actual → error "debe superar".

### Subasta finalizada
 - Input de puja deshabilitado.
 - Botón de puja deshabilitado.
 - Aparece botón "Consultar ganador" habilitado.
### Retirada
 - No ganador puede retirar → éxito.
 - Intento 2ª retirada → error "No has pujado...".
 - Ganador no ve botón de retirada (solo "Eres el ganador").

### Mensajes
 - Puja enviada → "Esperando confirmacion...".
 - Puja exitosa → "Puja registrada correctamente".
 - Error → muestra mensaje claro (no hex).

