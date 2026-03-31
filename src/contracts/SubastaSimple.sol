// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Modelo: El ganador puja y paga. El vendedor (owner) retira los fondos y se encarga de enviar el producto.
// Los no ganadores pueden retirar su dinero al finalizar.
contract SubastaSimple {
    error OwnerInvalido();
    error DuracionInvalida();
    error SubastaFinalizada();
    error VendedorNoPuedePujar();
    error SoloUnaPujaPorUsuario();
    error PujaInsuficiente();
    error SubastaNoFinalizada();
    error GanadorNoPuedeRetirar();
    error SinFondosParaRetirar();
    error TransferenciaFallida();
    error SoloVendedor();
    error FondosGanadorYaRetirados();
    error SinPujaGanadora();

    address public owner;
    string public producto;
    uint256 public endTime;
    uint256 public extensionWindow;

    address public highestBidder;
    uint256 public highestBid;

    mapping(address => uint256) public bids;
    bool public fondosGanadorRetirados;

    event NuevaPuja(address indexed bidder, uint256 amount);
    event FondosGanadorRetirados(address indexed to, uint256 amount);
    event SubastaExtendida(uint256 nuevoEndTime);

    constructor(address _owner, string memory _producto, uint256 _duracionMinutos) {
        if (_owner == address(0)) revert OwnerInvalido();
        if (_duracionMinutos == 0) revert DuracionInvalida();
        owner = _owner;
        producto = _producto;
        endTime = block.timestamp + (_duracionMinutos * 1 minutes);
        extensionWindow = 2 minutes;
    }

    function pujar() external payable {
        if (block.timestamp >= endTime) revert SubastaFinalizada();
        if (msg.sender == owner) revert VendedorNoPuedePujar();
        if (bids[msg.sender] != 0) revert SoloUnaPujaPorUsuario();
        if (msg.value <= highestBid) revert PujaInsuficiente();

        // Anti-sniping: si entra una puja en la ventana final, extendemos el cierre.
        if (endTime - block.timestamp <= extensionWindow) {
            endTime += extensionWindow;
            emit SubastaExtendida(endTime);
        }

        bids[msg.sender] = msg.value;
        highestBid = msg.value;
        highestBidder = msg.sender;

        emit NuevaPuja(msg.sender, msg.value);
    }

    function subastaFinalizada() public view returns (bool) {
        return block.timestamp >= endTime;
    }

    function ganador() external view returns (address) {
        if (!subastaFinalizada()) revert SubastaNoFinalizada();
        return highestBidder;
    }

    function retirarNoGanador() external {
        // Solo usuarios que NO ganaron pueden retirar su puja
        if (!subastaFinalizada()) revert SubastaNoFinalizada();
        if (msg.sender == highestBidder) revert GanadorNoPuedeRetirar();

        uint256 amount = bids[msg.sender];
        if (amount == 0) revert SinFondosParaRetirar();

        // CEI: primero actualizar estado, luego transferir.
        bids[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferenciaFallida();
    }

    // Solo el owner (vendedor) puede retirar los fondos de la puja ganadora.
    // Responsable de enviar el producto al ganador.
    function retirarFondosGanador() external {
        if (msg.sender != owner) revert SoloVendedor();
        if (!subastaFinalizada()) revert SubastaNoFinalizada();
        if (fondosGanadorRetirados) revert FondosGanadorYaRetirados();
        if (highestBid == 0) revert SinPujaGanadora();

        fondosGanadorRetirados = true;

        (bool ok,) = payable(owner).call{value: highestBid}("");
        if (!ok) revert TransferenciaFallida();

        emit FondosGanadorRetirados(owner, highestBid);
    }
}
