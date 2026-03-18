// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Crowdfunding {
    address public owner = 0x4427fd44874e7b90Ab34EB43809AbFe70682549e; // Importante, poner la nuestra de metamask
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalContribution;

    mapping (address => uint256) contributions;

    constructor (uint256 _goal, uint256 _days) {
        goal = _goal;
        deadline = block.timestamp + _days * 1 days;
    }

    function contribute() external payable {
        require(block.timestamp < deadline, "Campana finalizada");
        require(msg.value > 0, "Sin envio de BNB");
        require(msg.sender.balance >= 1 gwei + msg.value, "El saldo de la cuenta origen debe ser mayor a 1 gwei + el valor a donar");
        require(msg.value <= 1 ether, "El envio de BNB debe ser menor a 1 ether");
        require(msg.sender != owner, "El owner no puede contribuir");
        require(contributions[msg.sender] < 1 ether, "Ya has donado suficiente");
        require(totalContribution + msg.value <= goal, "Ya se ha completado el crowfunding");

        totalContribution += msg.value;
        contributions[msg.sender] += msg.value;
    }

    // Si no se llega al goal, cada usuario puede recibir la cantidad aportada
    function refund() external {
        require(totalContribution < goal, "La campana ha llegado al objetivo");
        require(block.timestamp > deadline, "La campana todavia esta abierta");
        require(contributions[msg.sender] > 0, "No has contribuido");

        (bool ok,) = payable(msg.sender).call{value:contributions[msg.sender]}("");
        require(ok, "Fallo al enviar fondos");
        totalContribution = totalContribution - contributions[msg.sender];
        contributions[msg.sender]=0;

    }

    function ownerWithdraw() external {
        require(msg.sender==owner, "Solo el propietario puede ejecutar la funcion");
        require(block.timestamp > deadline, "La campana todavia esta abierta");
        require(totalContribution > goal, "La campana ha llegado al objetivo");

        //payable(owner).call{value:totalContribution}
        (bool ok,) = payable(owner).call{value:address(this).balance}("");
        require(ok, "Fallo al enviar fondos");
        totalContribution = 0;

    }
}