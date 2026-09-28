import { Capacitor, registerPlugin } from '@capacitor/core';
import { InAppBrowser, ToolBarType } from '@capgo/inappbrowser';
import './styles.css';

const CONFIG = {
  rdweb: {
    label: 'RemoteApps',
    url: 'https://rdsapp.gesex.cl/RDWeb/webclient/',
    description: 'Programas de Windows de GESEX.'
  },
  extranet: {
    label: 'Extranet',
    url: 'https://extranet.gesex.cl/gesex_calidad2/auth/login',
    description: 'Portal de calidad y formularios de trabajo.'
  },
  whatsapp: {
    label: 'WhatsApp Web',
    url: 'https://web.whatsapp.com',
    description: 'Chatea desde WhatsApp Web.'
  }
};

const STORAGE_KEY = 'gesex-mobile-preferences';
const state = {
  view: localStorage.getItem('gesex-mobile-last-view') || 'home',
  online: navigator.onLine,
  keyboardPersistent: localStorage.getItem(STORAGE_KEY) === 'keyboard',
  photoUrl: null
};

// Plugin nativo propio (MainActivity.java): en Android mantiene RDWeb y Extranet
// como WebViews persistentes (multitarea real, sin perder sesion al cambiar entre ambas).
const Sessions = registerPlugin('GesexSessions');
const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

const icon = (name) => {
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/>',
    monitor: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    camera: '<path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 5.8 18l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12.8h-.2a2 2 0 1 1 0-4h.2A2 2 0 0 0 3 5.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 1.2V1a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 9h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3.4Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    wifi: '<path d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 20h.01"/>',
    offline: '<path d="m3 3 18 18M10.6 5.2A16 16 0 0 1 21 8.5M5 12a11 11 0 0 1 4.5-2.5M8.5 15.5a6 6 0 0 1 3.5-1M12 20h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h4M6 16h12"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-8.9 8.4 8.5 8.5 0 0 1-4-1L3 20l1.1-5A8.38 8.38 0 0 1 3 11.5 8.4 8.4 0 0 1 11.6 3a8.38 8.38 0 0 1 9.4 8.5Z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.home}</svg>`;
};

const ICON_BY_KEY = { rdweb: 'monitor', extranet: 'globe', whatsapp: 'chat' };
const iconFor = (key) => ICON_BY_KEY[key] || 'globe';
const RETURN_HINT = 'Se abrira en pantalla completa. Para volver aqui, toca dos veces el boton de inicio del borde izquierdo.';

function tile(key) {
  const remote = CONFIG[key];
  return `<button class="resource-card" data-open-external="${key}"><span class="resource-icon ${key}">${icon(iconFor(key))}</span><b>${remote.label}</b><small>${remote.description}</small><span class="resource-open">Abrir ${icon('arrow')}</span></button>`;
}

function launchView(key) {
  const remote = CONFIG[key];
  return `<div class="page-heading"><h1>${remote.label}</h1><p>${remote.description}</p></div><div class="launch-card"><span class="resource-icon big ${key}">${icon(iconFor(key))}</span><div><h2>Listo para ingresar</h2><p>${RETURN_HINT}</p></div><button class="launch-button" data-open-external="${key}">${icon('external')}Abrir ${remote.label}</button></div>`;
}

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <header class="titlebar">
      <div class="brand-lockup">
        <img src="/gesex-logo.jpg" alt="GESEX" class="brand-logo" />
        <strong>GESEX</strong>
      </div>
      <div class="connection-pill" id="connectionStatus" aria-live="polite"></div>
    </header>

    <nav class="nav-rail" aria-label="Navegacion principal">
      <button data-nav="home">${icon('home')}<span>Inicio</span></button>
      <button data-nav="rdweb">${icon('monitor')}<span>RemoteApps</span></button>
      <button data-nav="extranet">${icon('globe')}<span>Extranet</span></button>
      <button data-nav="whatsapp">${icon('chat')}<span>WhatsApp</span></button>
      <button data-nav="settings">${icon('settings')}<span>Ajustes</span></button>
    </nav>

    <main class="content" id="content">
      <section class="view" data-view="home">
        <div class="page-heading">
          <h1>Aplicaciones</h1>
          <p>Toca una aplicacion para abrirla.</p>
          <span class="availability" id="homeAvailability"></span>
        </div>
        <div class="resource-grid">${tile('rdweb')}${tile('extranet')}${tile('whatsapp')}</div>
        <div class="infobar">${icon('info')}<div><b>Como volver a esta pantalla</b><p>${RETURN_HINT}</p></div></div>
        <button class="list-item" data-open-view="settings"><span class="list-icon">${icon('camera')}</span><span><b>Probar camara y teclado</b><small>Verifica que todo funcione antes de empezar</small></span>${icon('chevron')}</button>
      </section>

      <section class="view" data-view="rdweb">${launchView('rdweb')}</section>
      <section class="view" data-view="extranet">${launchView('extranet')}</section>
      <section class="view" data-view="whatsapp">${launchView('whatsapp')}</section>

      <section class="view" data-view="settings">
        <div class="page-heading"><h1>Ajustes</h1><p>Ajusta la experiencia movil sin cambiar la configuracion de RDWeb.</p></div>
        <div class="settings-grid">
          <article class="settings-card">
            <div class="setting-title"><span class="list-icon">${icon('keyboard')}</span><div><b>Teclado persistente</b><p>Mantiene un campo local listo para activar el teclado del sistema.</p></div><label class="switch"><input type="checkbox" id="keyboardToggle"><span></span></label></div>
            <div class="keyboard-dock" id="keyboardDock" hidden><input id="keyboardAnchor" type="text" placeholder="Campo de teclado" autocomplete="off"><span>El teclado fisico funciona automaticamente.</span></div>
          </article>
          <article class="settings-card">
            <div class="setting-title"><span class="list-icon">${icon('camera')}</span><div><b>Prueba de fotografia</b><p>Verifica camara o galeria antes de usar el formulario Extranet.</p></div></div>
            <label class="photo-picker"><input id="photoInput" type="file" accept="image/*" capture="environment"><span>${icon('camera')} Seleccionar fotografia</span></label>
            <div class="photo-result" id="photoResult" hidden><img id="photoPreview" alt="Vista previa de fotografia"><button class="text-button" id="clearPhoto">Quitar</button></div>
          </article>
        </div>
        <div class="infobar">${icon('info')}<div><b>Modo sin conexion parcial</b><p>La pantalla, preferencias y esta prueba quedan disponibles sin internet. RDWeb, autenticacion AD, RemoteApps y Extranet requieren conectividad.</p></div></div>
      </section>
    </main>
  </div>
  <div class="toast" id="toast" role="status"></div>
`;

const views = [...document.querySelectorAll('[data-view]')];
const navItems = [...document.querySelectorAll('[data-nav]')];

function showView(view) {
  state.view = view;
  localStorage.setItem('gesex-mobile-last-view', view);
  views.forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.nav === view));
  document.querySelector('#content').scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'settings' && state.keyboardPersistent) focusKeyboardAnchor();
}

function updateConnection() {
  const status = document.querySelector('#connectionStatus');
  const availability = document.querySelector('#homeAvailability');
  status.innerHTML = state.online ? `${icon('wifi')} En linea` : `${icon('offline')} Sin conexion`;
  status.classList.toggle('offline', !state.online);
  availability.textContent = state.online ? 'Servicios disponibles' : 'Sin conexion: los servicios no estan disponibles';
  availability.classList.toggle('offline', !state.online);
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => element.classList.remove('visible'), 3500);
}

// Se inyecta solo en iOS (ver mas abajo): boton flotante de inicio (doble toque para salir).
// En Android el boton de inicio es nativo (MainActivity.java) y no requiere esto.
// Debe ser autocontenida: se serializa con toString().
function homeButtonScript() {
  if (document.getElementById('gesex-home')) return;
  const b = document.createElement('button');
  b.id = 'gesex-home';
  b.type = 'button';
  b.setAttribute('aria-label', 'Volver al inicio de GESEX');
  const svg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/></svg>';
  const idle = 'position:fixed;left:0;top:50%;z-index:2147483647;height:52px;margin-top:-26px;border:0;border-radius:0 16px 16px 0;display:flex;align-items:center;gap:8px;padding:0 10px;font:600 15px system-ui,sans-serif;color:#fff;touch-action:none;box-shadow:0 4px 14px rgba(0,0,0,.25);';
  let armed = 0;
  let startY = null;
  let moved = false;
  const reset = () => { armed = 0; b.innerHTML = svg; b.style.background = 'rgba(8,40,77,.55)'; };
  b.style.cssText = idle;
  reset();
  const stop = (e) => e.stopPropagation();
  ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach((t) => b.addEventListener(t, stop));
  b.addEventListener('pointerdown', (e) => { e.stopPropagation(); startY = e.clientY; moved = false; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    if (Math.abs(e.clientY - startY) > 8) moved = true;
    if (moved) b.style.top = Math.max(40, Math.min(window.innerHeight - 40, e.clientY)) + 'px';
  });
  b.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    startY = null;
    if (moved) return;
    if (armed) { window.mobileApp && window.mobileApp.close(); return; }
    armed = setTimeout(reset, 3000);
    b.innerHTML = svg + '<span>Toca otra vez para volver</span>';
    b.style.background = '#08284d';
  });
  (document.body || document.documentElement).appendChild(b);
}

const HOME_BUTTON_JS = `(${homeButtonScript.toString()})();`;
let iosBrowserListeners = null;

// iOS no tiene aun el plugin nativo GesexSessions: usa el modal InAppBrowser existente
// (una sesion a la vez; se pierde al cambiar entre RDWeb y Extranet, a diferencia de Android).
async function openExternalIOS(key) {
  const url = CONFIG[key].url;
  if (!iosBrowserListeners) {
    iosBrowserListeners = [
      await InAppBrowser.addListener('browserPageLoaded', () => {
        InAppBrowser.executeScript({ code: HOME_BUTTON_JS }).catch(() => {});
      })
    ];
  }
  await InAppBrowser.openWebView({
    url,
    toolbarType: ToolBarType.BLANK,
    isPresentAfterPageLoad: false,
    activeNativeNavigationForWebview: true
  });
}

async function openExternal(key) {
  if (!state.online) {
    toast('Este servicio requiere conexion a internet');
    return;
  }
  const url = CONFIG[key].url;
  if (!isNative) {
    window.open(url, '_blank');
    return;
  }
  try {
    if (platform === 'android') {
      await Sessions.open({ key, url });
    } else {
      await openExternalIOS(key);
    }
  } catch {
    toast('No se pudo abrir el servicio. Intenta nuevamente.');
  }
}

function focusKeyboardAnchor() {
  const input = document.querySelector('#keyboardAnchor');
  if (input) window.setTimeout(() => input.focus(), 120);
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  const openView = event.target.closest('[data-open-view]');
  const external = event.target.closest('[data-open-external]');
  if (nav) showView(nav.dataset.nav);
  if (openView) showView(openView.dataset.openView);
  if (external) openExternal(external.dataset.openExternal);
  if (event.target.closest('#clearPhoto')) {
    state.photoUrl && URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = null;
    document.querySelector('#photoResult').hidden = true;
    document.querySelector('#photoInput').value = '';
  }
});

document.querySelector('#keyboardToggle').checked = state.keyboardPersistent;
document.querySelector('#keyboardToggle').addEventListener('change', (event) => {
  state.keyboardPersistent = event.target.checked;
  localStorage.setItem(STORAGE_KEY, state.keyboardPersistent ? 'keyboard' : '');
  document.querySelector('#keyboardDock').hidden = !state.keyboardPersistent;
  if (state.keyboardPersistent) focusKeyboardAnchor();
  toast(state.keyboardPersistent ? 'Teclado persistente activado' : 'Teclado persistente desactivado');
});

document.querySelector('#photoInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.photoUrl && URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = URL.createObjectURL(file);
  document.querySelector('#photoPreview').src = state.photoUrl;
  document.querySelector('#photoResult').hidden = false;
  toast('Fotografia seleccionada correctamente');
});

window.addEventListener('online', () => { state.online = true; updateConnection(); toast('Conexion restaurada'); });
window.addEventListener('offline', () => { state.online = false; updateConnection(); toast('Estas sin conexion. El shell sigue disponible.'); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
updateConnection();
showView(['home', 'rdweb', 'extranet', 'whatsapp', 'settings'].includes(state.view) ? state.view : 'home');
if (state.keyboardPersistent) document.querySelector('#keyboardDock').hidden = false;
