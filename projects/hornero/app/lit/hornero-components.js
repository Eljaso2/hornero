// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?ver=535';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?ver=535';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?ver=535';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?ver=535';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?ver=535';
import './hornero-infomate.js?ver=535';
import './hornero-gremial.js?ver=535';

// ESFERA 2 — Consulta y asesoramiento
// Consulta (formatos + chat con backend LLM)
import './hornero-consulta.js?ver=535';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?ver=535';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación: Historia Obrera
import './hornero-formacion.js?ver=535';

// ESFERA 4 — Reporte gremial
import './hornero-is.js?ver=535';

// ESFERA 5 — Historiador (historia laboral latinoamericana)
import './hornero-historiador.js?ver=535';

// ESFERA 6 — Diagnóstico y panorama
import './hornero-condicion.js?ver=535';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?ver=535';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?ver=535';

// Sub-screens
import './hornero-coyuntura.js?ver=535';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?ver=535';       // Motor de chat reutilizable
import './hornero-ecosistema.js?ver=535'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?ver=535';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
