// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js';

// Shell: <hornero-app> — navigation, auth, state global
import './hornero-app.js';

// Home: <hornero-home> — cards, novedades, entry points
import './hornero-home.js';

// IS: <hornero-is> — Inteligencia Sindical, roles, observaciones, informes
import './hornero-is.js';

// Coyuntura: <hornero-coyuntura> — Clipping semanal, cards, filter
import './hornero-coyuntura.js';

// Chat: <hornero-chat> — Motor de chat reutilizable (typing, bubbles, input, progress)
import './hornero-chat.js';

// Ecosistema: <hornero-ecosistema> — Qué es Hornero, Xiong, cadena de valor
import './hornero-ecosistema.js';

// Condición obrera: <hornero-condicion> — wrapper CE · IFT · Cómo Somos · SMVM
import './hornero-condicion.js';

export { HoComponent, html, css };
