import { Browser } from '@capacitor/browser';
import './styles.css';

const CONFIG = {
  rdweb: {
    label: 'RemoteApps',
    url: 'https://rdsapp.gesex.cl/RDWeb/webclient/',
    description: 'Aplicaciones Windows publicadas por GESEX.'
  },
  extranet: {
    label: 'Extranet',
    url: 'https://extranet.gesex.cl/gesex_calidad2/auth/login',
    description: 'Portal de calidad y formularios de trabajo.'
  }
};

const STORAGE_KEY = 'gesex-mobile-preferences';
const state = {
  view: localStorage.getItem('gesex-mobile-last-view') || 'home',
  online: navigator.onLine,
  keyboardPersistent: localStorage.getItem(STORAGE_KEY) === 'keyboard',
  photoUrl: null
};

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
    back: '<path d="m15 18-6-6 6-6"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h4M6 16h12"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.home}</svg>`;
};

document.querySelector('#app').innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <img src="/gesex-logo.jpg" alt="GESEX" class="brand-logo" />
        <div>
          <span class="eyebrow">ESPACIO DE TRABAJO</span>
          <strong>GESEX Mobile</strong>
        </div>
      </div>
      <div class="connection-pill" id="connectionStatus" aria-live="polite"></div>
    </header>

    <main class="content" id="content">
      <section class="view" data-view="home">
        <div class="hero-panel">
          <div>
            <span class="eyebrow lime">ACCESO CENTRALIZADO</span>
            <h1>Tu jornada, en una sola pantalla.</h1>
            <p>Ingresa a tus RemoteApps Windows y al portal Extranet desde tu dispositivo movil.</p>
          </div>
          <div class="hero-orbit"><span>GE</span></div>
        </div>

        <div class="section-heading">
          <div><span class="eyebrow">DESTACADOS</span><h2>Aplicaciones de trabajo</h2></div>
          <span class="availability" id="homeAvailability"></span>
        </div>
        <div class="app-grid">
          <button class="app-card app-card-primary" data-open-external="rdweb">
            <span class="card-icon">${icon('monitor')}</span>
            <span class="card-copy"><b>RemoteApps</b><small>Aplicaciones Windows publicadas</small></span>
            <span class="card-arrow">${icon('arrow')}</span>
          </button>
          <button class="app-card" data-open-external="extranet">
            <span class="card-icon">${icon('globe')}</span>
            <span class="card-copy"><b>Extranet</b><small>Portal de calidad GESEX</small></span>
            <span class="card-arrow">${icon('arrow')}</span>
          </button>
        </div>

        <div class="info-strip">
          <span class="info-icon">${icon('camera')}</span>
          <div><b>Fotografia disponible</b><p>La Extranet puede solicitar camara o galeria en Android, segun el formulario.</p></div>
          <button class="text-button" data-open-view="settings">Probar</button>
        </div>
      </section>

      <section class="view" data-view="rdweb">
        ${launchView('rdweb')}
      </section>

      <section class="view" data-view="extranet">
        ${launchView('extranet')}
      </section>

      <section class="view" data-view="settings">
        <div class="page-heading"><span class="eyebrow">DISPOSITIVO</span><h1>Preferencias</h1><p>Ajusta la experiencia movil sin cambiar la configuracion de RDWeb.</p></div>
        <div class="settings-grid">
          <article class="settings-card">
            <div class="setting-title"><span class="card-icon small">${icon('keyboard')}</span><div><b>Teclado persistente</b><p>Mantiene un campo local listo para activar el teclado del sistema.</p></div><label class="switch"><input type="checkbox" id="keyboardToggle"><span></span></label></div>
            <div class="keyboard-dock" id="keyboardDock" hidden><input id="keyboardAnchor" type="text" placeholder="Campo de teclado" autocomplete="off"><span>El teclado fisico funciona automaticamente.</span></div>
          </article>
          <article class="settings-card camera-card">
            <div class="setting-title"><span class="card-icon small">${icon('camera')}</span><div><b>Prueba de fotografia</b><p>Verifica camara o galeria antes de usar el formulario Extranet.</p></div></div>
            <label class="photo-picker"><input id="photoInput" type="file" accept="image/*" capture="environment"><span>${icon('camera')} Seleccionar fotografia</span></label>
            <div class="photo-result" id="photoResult" hidden><img id="photoPreview" alt="Vista previa de fotografia"><button class="text-button" id="clearPhoto">Quitar</button></div>
          </article>
        </div>
        <div class="notice"><b>Modo sin conexion parcial</b><p>La pantalla, preferencias y esta prueba quedan disponibles sin internet. RDWeb, autenticacion AD, RemoteApps y Extranet requieren conectividad.</p></div>
      </section>
    </main>

    <nav class="bottom-nav" aria-label="Navegacion principal">
      <button data-nav="home">${icon('home')}<span>Inicio</span></button>
      <button data-nav="rdweb">${icon('monitor')}<span>RemoteApps</span></button>
      <button data-nav="extranet">${icon('globe')}<span>Extranet</span></button>
      <button data-nav="settings">${icon('settings')}<span>Ajustes</span></button>
    </nav>
  </div>
  <div class="toast" id="toast" role="status"></div>
`;

function launchView(key) {
  const remote = CONFIG[key];
  const action = key === 'rdweb' ? 'Abrir RemoteApps' : 'Abrir Extranet';
  const iconName = key === 'rdweb' ? 'monitor' : 'globe';
  return `<div class="page-heading"><div><span class="eyebrow">APLICACION GESEX</span><h1>${icon(iconName)}${remote.label}</h1><p>${remote.description}</p></div></div><div class="launch-panel"><div class="launch-symbol">${icon(iconName)}</div><div><span class="eyebrow">ACCESO EXTERNO SEGURO</span><h2>Listo para ingresar</h2><p>El servicio se abrira en la vista segura del dispositivo, conservando el acceso a camara, galeria, teclado y autenticacion.</p><button class="launch-button" data-open-external="${key}">${icon('external')}${action}</button></div></div><div class="url-note"><span>Destino</span><code>${remote.url}</code></div>`;
}

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
  availability.textContent = state.online ? 'SERVICIOS DISPONIBLES' : 'SHELL DISPONIBLE OFFLINE';
  availability.classList.toggle('offline', !state.online);
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => element.classList.remove('visible'), 3500);
}

async function openExternal(key) {
  if (!state.online) {
    toast('Este servicio requiere conexion a internet');
    return;
  }
  const url = CONFIG[key].url;
  try {
    await Browser.open({ url, toolbarColor: '#08284d' });
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
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
showView(['home', 'rdweb', 'extranet', 'settings'].includes(state.view) ? state.view : 'home');
if (state.keyboardPersistent) document.querySelector('#keyboardDock').hidden = false;
