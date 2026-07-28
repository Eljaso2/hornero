// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?v=186';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?v=186';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?v=186';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?v=186';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?v=186';
import './hornero-infomate.js?v=186';
import './hornero-gremial.js?v=186';

// ESFERA 2 — Consulta y asesoramiento
// Consulta IA Sindical (formatos + chat con backend LLM)
import './hornero-consulta.js?v=186';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?v=186';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación: Historia Obrera
import './hornero-formacion.js?v=186';

// ESFERA 4 — Reporte gremial
import './hornero-is.js?v=186';

// ESFERA 5 — Historiador (historia laboral latinoamericana)
import './hornero-historiador.js?v=186';

// ESFERA 6 — Diagnóstico y panorama
import './hornero-condicion.js?v=186';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?v=186';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?v=186';

// Sub-screens
import './hornero-coyuntura.js?v=186';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?v=186';       // Motor de chat reutilizable
import './hornero-ecosistema.js?v=186'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?v=186';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
