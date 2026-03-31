Blockchain microcredencial

Chrome: extensión metamask



red testnet
url rpc:
https://data-seed-prebsc-1-s1.binance.org:8545/
chain id: 97
block explorer url: https://testnet.bscscan.com


para contratos inteligentes: lenguage de programación solidity

# 2 Despliegue y exploración de contratos

## 2.4 variables y funciones
entorno
    remix ide
    hardhat/trffle
    metamask

estructura básica de un contrato 
// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.8;

contract MiContrato{
    unit public numero;
    bool public activo;
    address public propietario;    

    function setNumero(uint _numero) public {
        numero = _numero;
    }

    function getNumero() public returns (uint) {
        return numero;
    }
}

## 2.5 Visibilidad y mutabilidad
public private internal y external
mutabilidad (de una función): view, pure, payable

## 2.6 Address y Aarray
contract Micontrato{
    address public propietario;

    function saldoPropietario() public view returns (uint) {
        return propietario.balance;
    }
}

contract MiContrato{
    unit[3] public arrayFijo;
    unit[] public arrayDinamico;

    funcion agregar(uint valor) public {
        arrayFijo[0] = valor;
        arrayDinamico.push(valor);
    }
}
tambien hay pop(), length, array[i] (acceso por índice)

se pueden almacenar en estado, memoria o calldata.
STORAGE:
contract MiContrato {
    uint[] public numeros; // Array en 'storage'

    function agregar(uint _valor) public {
        numeros.push(_valor);
    }
}

MEMORY:
contract MiContrato {
    function crearArrayTemporal() public pure returns (uint[3] memory) {
        uint[3] memory temp;

        temp[0] = 10;
        temp[1] = 20;
        temp[2] = 30;

        return temp;
    }
}

CALLDATA:
contract MiContrato {

    function sumaElementos(uint[] calldata datos)
        external
        pure
        returns (uint total)
    {
        for (uint i = 0; i < datos.length; i++) {
            total += datos[i];
        }
    }

}

## 2.7 Objeto msg
contract MiContrato {
    uint public numero;
    function saludar() public view returns (address){
        return msg.sender;
    }

    uint public balance;
    function pagar() public payable {
        balance += msg.value;
    }
}

## 2.8 Constructores, eventos y flujo
contract MiContrato {

    // Constructores
    address public propietario;

    constructor() {
        propietario = msg.sender;
    }


    // Eventos
    uint public numero;
    event NumeroActualizado(uint nuevoNumero);

    function setNumero(uint _numero) public{
        numero = _numero;
        emit NumeroActualizado(_numero);
    }

    // Control de flujo (require, assert, revert)
    function setNumero(uint _numero) public{
        require(_numero > 0, "Debe ser mayor que cero");
        numero = _numero;
        emit NumeroActualizado(_numero);
    }
}

## 2.9 Entorno de desarrollo Remix

## 2.10 Implementación de un contrato con variables globales

## 2.11 Implementación de funciones parte 1

## 2.12 Implementación de funciones 2

## 2.13 Despliegue de contratos

## 2.14 Llamadas a funciones

## 2.15 Despliegue en la BSC de Testnet y uso de una DApp
cada vez que se compila el contrato en remix.ethereum.org, se genera en artifacts el ToDoSimple.json, que es el que usará la app front react para que sepa que funciones hay, que reciben, etc
He desplegado este contrato:
https://testnet.bscscan.com/address/0xaf89cbfbe83d5e570720a5807613849b47f3fb22

nuevo contrato con función todasLasTareas: 
https://testnet.bscscan.com/address/0x75EeC290F921EFC15cF5C296cBA3323eBA6c1D3A













imports para más adelante (en 9 Relacción entre contratos inteligentes):
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";




# 3 Aplicaciones Descentralizadas (DApps) y Conexión con Smart Contracts

## 3.9 Ejemplo de asincronismo
Nosotros para nuestra app no usaremos asincronismo. Por ejemplo un fetch a un http lo haremos con await


## 3.11 Iniciar aplicación React
usaremos el framework de next, que hace react más sencillo pero no se por que.

## 3.25 Control de tiempo
ejemplos
permite weeks, days, minutes, hours
require(block.timestamp >= creationTime + 86400, "no ha pasado un día");
require(block.timestamp >= creationTime + 1 days, "no ha pasado un día");

pragma solidity ^0.8.10;
contract Asistencia{
    address[] public asistentes;
    uint256[] public tiempoEntrada;
    function registrarAsistencia() public {
        require() //se podria añadir un require para ver si ya esta anadido

        asistentes.push(msg.sender);
        tiempoEntrada.push(block.timestamp);
    }
}

## 3.27 Solidity Mapping tablas Hash
Ejemplo:
mapping(address => uint256) public balances;
address[] public usuarios;

funcion depositar() external payable {
    if (balances[msg.sernder] == 0) { //no existe la clave
        usuarios.push(msg.sender);
    }
    balances[msg.sender] += msg.value;
}

function listarUsuarios() external view returns (address[] memory, uint256[] memory) {
    uint256[] memory saldos = new uint256[](usuarios.length);
    for (uint256 i = 0; i < usuarios.length; i++) {
        saldos[i] = balances[usuarios[i]];
    }
    return (usuarios, saldos);
}
# 3 Ampliación Material adicional - no obligatorio - para crear mejores aplicaciones web

## 3.1 Despliegue de aplicación web firebase

# 4 Transfencias y pagos en token nativo de la red

## 4.1 Transferencias

## 4.2 Unidades y address paypable
ejemplos
require(msg.value == 100_000_000_000_000_000, "Monto debe ser 0.1 ETH");
require(msg.value == 0.1 ether, "Monto debe ser 0.1 ETH");

enGwei = msg.value /1000_000_000;
enGwei = msg.value / 1 gwei;

## 4.3 Recepción de fondos
function comprar(string memory _nombre) public payable {
    require(msg.value == 0.5 ether, "Debes enviar 0.5 ETH para comprar);
}
para recibir sin funciones, usar:
    receive() external payable{}
        se ejecuta con transferencias estandar desde carteras
    fallback() external [payable] {}
        acaba ahí si por ejemplo manda dinero a una función que no existe
external
    significa que esa función solo se puede llamar desde fuera del contrato. no desde una función de dentro del contrato o desde otro contrato que herede.
Ejemplo real:
```
contract Receptor {

    event Recibido(address indexed de, uint256 valor, bytes data);

    receive() external payable {
        emit Recibido(msg.sender, msg.value, "");
    }

    fallback() external payable {
        emit Recibido(msg.sender, msg.value, msg.data);
    }

}
```

## 4.4 Ejemplo de recepción de fondos
Crowfunding sería un ejemplo
Ejemplo: Crowfunding.sol en remix

## 4.5 Balances y saldos
Ejemplo: Crowfunding.sol en remix

address(this).balance
someAddress.balance

function saldoDe(address quien) external view returns (uint256){
    return quien.balance;
}

También valdría para el msg.sender: msg.sender.balance

Para llevar la cuenta, se puede hacer así:
contract Inversion {
    address[] public direcciones;
    uint256[] public saldos;
}
function depositar() external payable {
    // buscar el indice en la lista
    int256 indice = -1;
    for (uint256 i = 0; i < direcciones.length; i++) {
        if (direcciones[i] == msg.sender) {
            indice = int256(i);
            break;
        }
    }

    if (indice == -1) { // Nuevo usuario
        direcciones.push(msg.sender);
        saldos.push(msg.value);
    } else { // el usuario existe
        saldos[uint256(indice)] += msg.value;
    }
}

O usando maps, más cómodo.

## 4.6 Transferencias: transfer y send
Transfer:
payable(address).transfer(cantidad_en_wei);
usa 2300 gas
no retorna nada. revierte si falla.
Ejemplo:
```
function retirarFondosPropietario() external{
    require(msg.sender == owner, "Solo el propietario puede retirar");
    uint256 monto = address(this).balance;
    payable(owner).transfer(monto);
}
```


Send
parecid al transfer, se aplica a address payable (al igual que transfer)
usa 2300 gas
retorna booleano (ha sido correcto el envío?) NO REVIERTE SI FALLA.
hay que añadir una condición manualmente para hacer la lógica de fallo y éxito

Ejemplo:
```
function retirarFondosPropietario() external{
    require(msg.sender == owner, "Solo el propietario puede retirar");
    uint256 monto = address(this).balance;
    bool ok, = payable(propietario).send(monto);
    require(ok, "La transferencia de fondos ha fallado.");
}
```
## 4.7 Transferencias: call

(bool ok,) = address.call{value: monto}("");
por defecto reenvía el gas restante.
retorna true/false. no revierte si falla. hay que controlar manualmente.

## 4.8 Ejemplo de retirada de fondos
Crowfunding.sol

## 4.9 Pautas de seguridad en manejo de criptomonedas
Seguir patrón Checks-Effects-Interactions (CEI)
    1- Checks: validaciones y require
    2- Effects: actualiza estado interno
    3- Interactions: llamadas externas (enviar ETH/llamar otros contratos).

Ejemplo:
```
mapping(address => uint256) public saldos;
function retirar(uint256 _cantidad) external {
    //Checks
    require(saldos[msg.sender] >= _cantidad, "Saldo insuficiente");

    //Effects: Reducir el saldo interno del usuario primero
    saldos[msg.sender] -= _cantidad;

    //Interactions: Transferir el ETH del contrato al usuario
    (bool ok,) = payable(msg.sender).call{value: _cantidad}("");
    require(ok, "Fallo en la transferencia");
}
```

Patrón Pull over Push (patrón de retiros)
    - No realizar pagos automáticamente a muchos destinatarios (push)
    - Acredita saldos y deja que cada uno retire (pull)
    - Menos fallos por receptores "problemáticos" y menos superficie de ataque.

Semáforos en funciones
Para evitar se entre en una función crítica mientras se está ejecutando
```
bool private bloqueado;
//Modificador para prevenir ataques de reentrada
modifier noReentrancy(){
    require(!bloqueado, "en uso");
    bloqueado = true;
    _; // Aquí se llama a las funciones delicadas
    bloqueado = false;
}
```

## 4.10 Consideraciones de seguridad y errores
No se puede garantizar 100% que nuestro contrato no va a recibir fondos.
Nunca usar tx.origin, usar msg.sender
No repetir código por ejemplo strings. Reutilizar en una variable, por que así consume menos gas todo.

## 4.11 Etheres: ejecutar una transacción con transferencia de activos
Ejemplo
const tx = await myContract.buy({
    value: ethers.utils.parseEther(0.1)
});
await tx.wait(); // espera confirmacion

## 4.12 Despliegue del contrato
Despliego el contrato:
crowfunding: 0x05F674752C7d3Ae4eD61919f19B36a03459CB2cB
con parámetros: 100000000000, 2

## 4.13 Crear aplicación React

## 4.14 Conexión al contrato









# Probando app definitiva de subastas
- Primer contrato (subasta finalizada):
0x4427fd44874e7b90Ab34EB43809AbFe70682549e

- Segundo contrato:



# Cosas importantes:
Ejecutar con:
```
npm.cmd run build
```

# Para testear:
En remix.ethereum.org se hacen los tests.
Nuevo contrato desplegado para probar: 
contract address: 0xc5050909Bd04bB01529327C553Ec7D511D0260bE
from: 0x4427fd44874e7b90Ab34EB43809AbFe70682549e

saldo actual mio: 0.373 tBNB

saldo actual mio 0.369