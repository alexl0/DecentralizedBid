// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./SubastaSimple.sol";

contract SubastaFactory {
    address[] private subastas;
    mapping(address => address[]) private subastasPorOwner;

    event SubastaCreada(address indexed owner, address indexed subasta, string producto, uint256 duracionMinutos);

    function crearSubasta(string memory _producto, uint256 _duracionMinutos) external returns (address) {
        require(bytes(_producto).length > 0, "Producto invalido");
        require(_duracionMinutos > 0, "Duracion invalida");

        SubastaSimple subasta = new SubastaSimple(msg.sender, _producto, _duracionMinutos);
        address subastaAddress = address(subasta);

        subastas.push(subastaAddress);
        subastasPorOwner[msg.sender].push(subastaAddress);

        emit SubastaCreada(msg.sender, subastaAddress, _producto, _duracionMinutos);
        return subastaAddress;
    }

    function getSubastas() external view returns (address[] memory) {
        return subastas;
    }

    function getSubastasPorOwner(address _owner) external view returns (address[] memory) {
        return subastasPorOwner[_owner];
    }
}
