// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?v=174';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?v=174';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?v=174';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?v=174';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?v=174';
import './hornero-infomate.js?v=174';
import './hornero-gremial.js?v=174';

// ESFERA 2 — Consulta y asesoramiento
// Consulta IA Sindical (formatos + chat con backend LLM)
import './hornero-consulta.js?v=174';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?v=174';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación: Historia Obrera
import './hornero-formacion.js?v=174';

// ESFERA 4 — Reporte gremial
import './hornero-is.js?v=174';

// ESFERA 5 — Historiador (historia laboral latinoamericana)
import './hornero-historiador.js?v=174';

// ESFERA 6 — Diagnóstico y panorama
import './hornero-condicion.js?v=174';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?v=174';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?v=174';

// Sub-screens
import './hornero-coyuntura.js?v=174';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?v=174';       // Motor de chat reutilizable
import './hornero-ecosistema.js?v=174'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?v=174';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
