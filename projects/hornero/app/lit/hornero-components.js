// ===== Hornero Web Components =====
// Native Web Components — zero dependencies — "abrir archivo y funciona"
// ho-component.js provides: Shadow DOM, reactive properties, html/css tagged templates

// Core helper
import { HoComponent, html, css } from './ho-component.js?ver=395';

// Shell: <hornero-app> — navigation, auth, state global, 8 nav buttons
import './hornero-app.js?ver=395';

// Home: <hornero-home> — cards de entry points a las 6 esferas
import './hornero-home.js?ver=395';

// ESFERA 1 — Actualidad y agenda
import './hornero-actualidad.js?ver=395';
// Sub-screens: Clipping, InfoMate, Reporte Gremial
import './hornero-clipping.js?ver=395';
import './hornero-infomate.js?ver=395';
import './hornero-gremial.js?ver=395';

// ESFERA 2 — Consulta y asesoramiento
// Consulta (formatos + chat con backend LLM)
import './hornero-consulta.js?ver=395';
// Sub-screen: Contenido sindical (podcast, reel, columna, entrevista)
import './hornero-contenido.js?ver=395';

// (Debate y Consulta: placeholder en hornero-app.js)

// ESFERA 3 — Formación: Historia Obrera
import './hornero-formacion.js?ver=395';

// ESFERA 4 — Reporte gremial
import './hornero-is.js?ver=395';

// ESFERA 5 — Historiador (historia laboral latinoamericana)
import './hornero-historiador.js?ver=395';

// ESFERA 6 — Diagnóstico y panorama
import './hornero-condicion.js?ver=395';

// ESFERA 6 — Archivo / Biblioteca del sindicato
import './hornero-archivo.js?ver=395';

// Perfil (nombre, email, sector/sindicato)
import './hornero-perfil.js?ver=395';

// Sub-screens
import './hornero-coyuntura.js?ver=395';  // Clipping semanal (legacy, backup)
import './hornero-chat.js?ver=395';       // Motor de chat reutilizable
import './hornero-ecosistema.js?ver=395'; // Qué es Hornero, Xiong, cadena de valor
import './hornero-login.js?ver=395';      // Login screen (client-side auth para piloto)

export { HoComponent, html, css };
