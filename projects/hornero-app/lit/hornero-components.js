// ===== Hornero Lit Components =====
// Web Components para cada esfera de la App
// Lit se carga como archivo local — sin npm, sin CDN en producción
// Principio: abrir archivo y funciona

// Shell: <hornero-app> — navigation, auth, state global
import { HorneroApp } from './hornero-app.js';

// Home: <hornero-home> — cards, novedades, entry points
import { HorneroHome } from './hornero-home.js';

// Chat motor: <hornero-chat> — reutilizable para IS, Derecho, Argumento, etc.
import { HorneroChat } from './hornero-chat.js';

export { HorneroApp, HorneroHome, HorneroChat };
