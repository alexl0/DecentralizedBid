# Proyecto Evaluable: Creación de un Sistema de Subastas Descentralizado

**Peso en la nota:** 100% del curso

---

## Descripción
El objetivo de este proyecto es diseñar y desarrollar un sistema de subastas descentralizado utilizando tecnología blockchain. Los estudiantes deberán implementar un **contrato inteligente en Solidity** desplegado en la **testnet de Binance Smart Chain (BSC Testnet)** y desarrollar una **aplicación web (DApp en React con ethers.js)** que permita a los usuarios interactuar con dicho contrato.

Este proyecto busca integrar los conocimientos adquiridos sobre:

- Contratos inteligentes
- Interacciones desde el front-end con la blockchain
- Seguridad y transparencia

aplicados en un **caso de uso real**.

---

## Funcionalidades mínimas requeridas

### 1. Contrato inteligente (Solidity)

**1.1 Registro de subasta**  
- Creación de una subasta indicando el nombre de un producto y un tiempo límite (en minutos).  
- Estos valores pueden incluirse en el constructor del propio contrato.

**1.2 Participación en subasta**  
- Los usuarios pueden realizar ofertas (**bids**) siempre que la subasta esté dentro del plazo.  
- Deben enviar la criptomoneda **BNB** como parte de la llamada a la función.  
- Se debe guardar en un **mapping** la cantidad pujada por cada usuario (`address`).  
- No se permite pujar a un usuario más de una vez.  
- La oferta se admite si la cantidad aportada por el usuario es mayor que la puja más alta actualmente; de lo contrario, no debe admitirse.

**1.3 Comprobación del ganador**  
- Función de consulta: si la subasta está acabada, indica quién ha sido el ganador (`address`).

**1.4 Devolución de fondos**  
- Función que ejecuta un usuario no ganador en la puja; se le devuelve la cantidad aportada en la puja.

**1.5 Eventos**  
- Registrar cada nueva puja válida con un evento específico, emitiendo un **Event**.

---

### 2. Aplicación Web descentralizada (React + ethers.js)

**2.1 Conexión a la wallet**  
- Conectar MetaMask a la BSC Testnet.

**2.2 Interacción en tiempo real**  
- Posibilidad de realizar pujas desde la interfaz.  
- Posibilidad de solicitar la devolución de fondos.  
- Posibilidad de ejecutar la comprobación de ganador.

---

## Forma de entrega

- El proyecto debe entregarse en **dos partes**:
  1. Contrato inteligente: código fuente en Solidity (`.sol`)  
  2. Aplicación Web (DApp): proyecto en React con integración de ethers.js  

- Todo el código debe comprimirse en un archivo `.zip` y subirse a **OneDrive de la universidad** (compartiendo el enlace) o bien a un **repositorio público en GitHub**, compartiendo el enlace del repositorio.

---

## Criterios de evaluación

1. Reunión telemática con el alumno para analizar la entrega.  
2. Correcta implementación y despliegue del contrato inteligente.  
3. Funcionamiento completo de la aplicación React conectada al contrato.  
4. Seguridad y validaciones implementadas en el contrato.