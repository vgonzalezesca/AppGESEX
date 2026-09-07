# GESEX Mobile

Aplicacion hibrida para Android 11+ y iOS 18+ que centraliza el acceso a:

- RDWeb: `https://rdsapp.gesex.cl/RDWeb/webclient/`
- Extranet: `https://extranet.gesex.cl/gesex_calidad2/auth/login`

## Desarrollo web/PWA

Requisitos: Node.js 20+.

```powershell
npm install
npm run dev
```

Para generar el paquete web:

```powershell
npm run build
npm run preview
```

El shell, la navegacion, preferencias y la prueba de fotografia quedan cacheados para uso offline parcial. Las paginas remotas, autenticacion de Active Directory y RemoteApps requieren internet.

## Android e iOS

```powershell
npm install
npx cap add android
npx cap add ios
npm run cap:sync
npm run cap:android
npm run cap:ios
```

`cap add ios` debe ejecutarse en macOS con Xcode. Android requiere Android Studio y SDK instalado.

## Integracion remota

Los servicios remotos se abren mediante el navegador interno seguro de Capacitor. No se usa `iframe`: RDWeb responde con `X-Frame-Options: SAMEORIGIN`, y el navegador interno conserva el flujo de autenticacion AD, camara, galeria y teclado.

La seleccion de fotografia usa `accept="image/*"` y `capture="environment"`, por lo que Android puede ofrecer camara o galeria. Para que funcione dentro del formulario Extranet, el formulario debe usar un input equivalente y el WebView debe recibir permiso de camara.

El teclado fisico es gestionado por el sistema operativo. La opcion `Teclado persistente` mantiene enfocado un campo local para facilitar su activacion; no puede forzar el teclado del sistema sobre una RemoteApp, ya que esa superficie es controlada por RDWeb/RDP.
