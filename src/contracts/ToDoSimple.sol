// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract ToDoSimple {
    string[] public descripciones;
    bool[] public completadas;
    address[] public creadores;

    function agregarTarea ( string memory descripcion ) public {
        descripciones.push(descripcion);
        completadas.push(false);
        creadores.push(msg.sender);
    }

    function completarTarea (uint index) public {
        require(index < descripciones.length, "index invalido");
        require(msg.sender == creadores[index], "No eres el creador de esta tarea"); // solo el creador puede completar la tarea);

        completadas[index] = true;
    }

    function totalTareas() view public returns(uint){
        return descripciones.length;
    }

    function verTarea(uint index) view public returns(string memory, bool, address){
        require ( index < descripciones.length, "index invalido");
        return(
            descripciones[index],
            completadas[index],
            creadores[index]
        );
    }

    function todasLasTareas() view public returns(string[] memory, bool[] memory, address[] memory) {
        return (descripciones, completadas, creadores);
    }
}