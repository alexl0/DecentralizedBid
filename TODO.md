# Cosas por hacer

## Sistema de depósitos
Ahora mismo, la cuando se decide ganador de la subasta, el owner de la subasta (el creador) puede coger los fondos y marchar corriendo. Para que eso no pase, se debe implementar un sistema de depósito similar al de Bisq (marketplace de btc descentralizado).

## Sacar todos los mensajes a un fichero externo, para internacionalización fácil
Tanto del contrato (SubastaSimple.sol) como de la aplicación
- También mejorar mensajes (Por ejemplo: "La subasta aun no termina")
- Luego, hay otros mensajes como por ejemplo "user rejected transaction" que no aparecen en el contrato, deben ser propios de solidity.

## Workflow de trabajo
Hacer un workflow de trabajo con una vm y agentes claude que permita que tengan acceso a todo (consola de desarrollador del navegador, consola de ejecución de node, etc) para evitar trabas y que puedan desarrollar viendo todos los errores, etc.


## Pequeñeces
- Que al usuario creador, al entrar en la app, se le indique donde está bloqueado pujar, que es por que es el usuario creador (owner), para que lo entienda.
- Que el textbox de cantidad a pujar, tenga un selector para poder elegir bnb, wei, gwei, etc en función de la unidad que se quiera pujar, para no andar con muchos ceros.
- Quitar ToDoSimple de todos los sitios, también su página en la ui
- Hacer menú para crear subasta. Y también, lista de mis subastas (creadas por mi) y lista de subastas en las que participo (como pujador)



