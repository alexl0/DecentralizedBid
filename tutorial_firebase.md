Se ha subido el código a https://studio.firebase.google.com/u/4/decentralizedbid-19784331

Luego, se ha ejecutado:

`firebase login`

`firebase init hosting`

`npm run build`

`firebase deploy`


Cada vez que se hagan cambios:
```
npm run build
firebase deploy
```

Si se ha añadido algún paquete (por ejemplo bootstrap):
```
npm install
```

## Variables de entorno en Firebase (importante)

En este proyecto (Next.js con `output: 'export'`), las variables `NEXT_PUBLIC_*` se inyectan en **build time**.
Eso significa que el valor debe existir antes de ejecutar `npm run build`.

Recomendado para despliegue:

1. Crear `.env.production` en la raiz del proyecto con:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EVENTS_RPC_URL=https://bsc-testnet.publicnode.com
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

Opcional para acelerar historial en `/subasta` cuando se abre por enlace directo:

```dotenv
NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK=0
```

2. Ejecutar:

```bash
npm run build
firebase deploy
```

Notas:
- `.env.local` sirve para desarrollo local.
- Si compilas en otra maquina/CI (por ejemplo Studio), esa maquina tambien necesita estas variables; tu `.env.local` no viaja automaticamente.
- `.env.example` es solo plantilla/documentacion de variables, no se usa automaticamente en runtime.
