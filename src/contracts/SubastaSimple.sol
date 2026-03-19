// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract SubastaSimple {
    string public producto;
    uint256 public endTime;

    address public highestBidder;
    uint256 public highestBid;

    mapping(address => uint256) public bids;

    event NuevaPuja(address indexed bidder, uint256 amount);

    constructor(string memory _producto, uint256 _duracionMinutos) {
        require(_duracionMinutos > 0, "Duracion invalida");
        producto = _producto;
        endTime = block.timestamp + (_duracionMinutos * 1 minutes);
    }

    function pujar() external payable {
        require(block.timestamp < endTime, "Subasta finalizada");
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
        require(subastaFinalizada(), "La subasta aun no termina");
        require(msg.sender != highestBidder, "El ganador no puede retirar");

        uint256 amount = bids[msg.sender];
        require(amount > 0, "No tienes fondos para retirar");

        // CEI: primero actualizar estado, luego transferir.
        bids[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Error al transferir");
    }
}
