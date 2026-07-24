// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?v=21';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?v=21';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?v=21';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?v=21';

// ESFERA 2 — Consulta y asesoramiento (placeholder en hornero-app.js)

// ESFERA 3 — Formación política y sindical (placeholder en hornero-app.js)

// ESFERA 4 — Gestión y comunicación interna
import './hornero-is.js?v=21';

// ESFERA 5 — Diagnóstico y panorama
import './hornero-condicion.js?v=21';

// ESFERA 6 — Archivo (placeholder en hornero-app.js)

// Perfil (placeholder en hornero-app.js)

// Sub-screens
import './hornero-coyuntura.js?v=21';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?v=21';       // Motor de chat reutilizable
import './hornero-ecosistema.js?v=21'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?v=21';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
