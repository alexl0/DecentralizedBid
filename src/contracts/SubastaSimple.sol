// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Modelo: El ganador puja y paga. El vendedor (owner) retira los fondos y se encarga de enviar el producto.
// Los no ganadores pueden retirar su dinero al finalizar.
contract SubastaSimple {
    address public owner;
    string public producto;
    uint256 public endTime;

    address public highestBidder;
    uint256 public highestBid;

    mapping(address => uint256) public bids;
    bool public fondosGanadorRetirados;

    event NuevaPuja(address indexed bidder, uint256 amount);
    event FondosGanadorRetirados(address indexed to, uint256 amount);

    constructor(string memory _producto, uint256 _duracionMinutos) {
        require(_duracionMinutos > 0, "Duracion invalida");
        owner = msg.sender;
        producto = _producto;
        endTime = block.timestamp + (_duracionMinutos * 1 minutes);
    }

    function pujar() external payable {
        require(block.timestamp < endTime, "Subasta finalizada");
        require(msg.sender != owner, "El vendedor no puede pujar");
        require(bids[msg.sender] == 0, "Solo una puja por usuario");
        require(msg.value > highestBid, "La puja debe superar la actual");

        bids[msg.sender] = msg.value;
        highestBid = msg.value;
        highestBidder = msg.sender;

        emit NuevaPuja(msg.sender, msg.value);
    }

    function subastaFinalizada() public view returns (bool) {
        return block.timestamp >= endTime;
    }

    function ganador() external view returns (address) {
        require(subastaFinalizada(), "La subasta aun no termina");
        return highestBidder;
    }

    function retirarNoGanador() external {
        // Solo usuarios que NO ganaron pueden retirar su puja
        require(subastaFinalizada(), "La subasta aun no termina");
        require(msg.sender != highestBidder, "El ganador no puede retirar (el vendedor se encargara del producto)");

        uint256 amount = bids[msg.sender];
        require(amount > 0, "No has pujado o ya retiraste tus fondos");

        // CEI: primero actualizar estado, luego transferir.
        bids[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Error al transferir");
    }

    // Solo el owner (vendedor) puede retirar los fondos de la puja ganadora.
    // Responsable de enviar el producto al ganador.
    function retirarFondosGanador() external {
        require(msg.sender == owner, "Solo el vendedor puede retirar los fondos del ganador");
        require(subastaFinalizada(), "La subasta aun no termina");
        require(!fondosGanadorRetirados, "Fondos ya retirados");
        require(highestBid > 0, "No hay puja ganadora");

        fondosGanadorRetirados = true;

        (bool ok,) = payable(owner).call{value: highestBid}("");
        require(ok, "Error al transferir");

        emit FondosGanadorRetirados(owner, highestBid);
    }
}
