// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?ver=651';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?ver=651';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?ver=651';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?ver=651';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?ver=651';
import './hornero-infomate.js?ver=651';
import './hornero-gremial.js?ver=651';

// ESFERA 2 — Consulta y asesoramiento
// Consulta (formatos + chat con backend LLM)
import './hornero-consulta.js?ver=651';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?ver=651';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación: Historia Obrera
import './hornero-formacion.js?ver=651';

// ESFERA 4 — Reporte gremial
import './hornero-is.js?ver=651';

// ESFERA 5 — Historiador (historia laboral latinoamericana)
import './hornero-historiador.js?ver=651';

// ESFERA 6 — Diagnóstico y panorama
import './hornero-condicion.js?ver=651';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?ver=651';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?ver=651';

// Admin panel (verificación gremial + testers)
import './hornero-admin.js?ver=651';

// Sub-screens
import './hornero-coyuntura.js?ver=651';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?ver=651';       // Motor de chat reutilizable
import './hornero-ecosistema.js?ver=651'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?ver=651';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
