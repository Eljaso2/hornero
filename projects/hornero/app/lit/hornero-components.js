// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?v=106';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?v=106';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?v=106';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?v=106';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?v=106';
import './hornero-infomate.js?v=106';
import './hornero-gremial.js?v=106';

// ESFERA 2 — Consulta y asesoramiento
// Consulta IA Sindical (formatos + chat con backend LLM)
import './hornero-consulta.js?v=106';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?v=106';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación política y sindical (placeholder en hornero-app.js)

// ESFERA 4 — Reporte gremial
import './hornero-is.js?v=106';

// ESFERA 5 — Diagnóstico y panorama
import './hornero-condicion.js?v=106';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?v=106';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?v=106';

// Sub-screens
import './hornero-coyuntura.js?v=106';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?v=106';       // Motor de chat reutilizable
import './hornero-ecosistema.js?v=106'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?v=106';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
