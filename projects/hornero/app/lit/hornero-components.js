// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js';

// ESFERA 2 — Consulta y asesoramiento (placeholder en hornero-app.js)

// ESFERA 3 — Formación política y sindical (placeholder en hornero-app.js)

// ESFERA 4 — Gestión y comunicación interna
import './hornero-is.js';

// ESFERA 5 — Diagnóstico y panorama
import './hornero-condicion.js';

// ESFERA 6 — Archivo (placeholder en hornero-app.js)

// Perfil (placeholder en hornero-app.js)

// Sub-screens
import './hornero-coyuntura.js';  // Clipping semanal (legacy, backup)
import './hornero-chat.js';       // Motor de chat reutilizable
import './hornero-ecosistema.js'; // Qué es Hornero, Xiong, cadena de valor

export { HoComponent, html, css };
