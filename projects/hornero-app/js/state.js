// ===== Hornero APP — State Management =====
// Estado global de la aplicación. UI state + IS state.
// Datos de contenido (informes, clipping, etc.) van en IndexedDB, no aquí.

var state = {
  screen: 'home',
  isRole: 1,
  isStep: 0,
  chatStarted: false,
  chatStep: 0,
  derInitStarted: false,
  derInitStep: 0,
  argInitStarted: false,
  argInitStep: 0,
  argStarted: false,
  argStep: 0,
  veInitStarted: false,
  veInitStep: 0,
  veStarted: false,
  veStep: 0,
  comInitStarted: false,
  comInitStep: 0,
  comStarted: false,
  comStep: 0
};

var titles = {
  novedades:'Coyuntura: Clipping e Informes Gremiales',
  documentacion:'Nuestro Derecho',
  'como-somos':'Cómo Somos',
  comoSomosChat:'Cómo Somos · Navegador de Datos',
  comoSomosClase:'Clase Obrera — Cómo Somos',
  comoSomosActivo:'Ejército Activo — Cómo Somos',
  comoSomosReserva:'Ejército de Reserva — Cómo Somos',
  miradorMate1:'Mirador MATE — Informe de Coyuntura',
  accion:'Acción Sindical',
  argumento:'Argumento',
  comunicador:'Comunicador',
  is:'Reporte gremial',
  ve:'Comportamiento Empresarial',
  historia:'Historia Obrera',
  tuhistoria:'Tu historia',
  felicidad:'Índice de Felicidad Laboral (SMVM × ICE)',
  ecosistema:'Ecosistema Hornero',
  condicion:'Panorama',
  chatderecho:'Mi Derecho',
  grado4pub:'Informe Gremial N°1',
  igUOM:'Informe Gremial N°2',
  igATE:'Informe Gremial N°3',
  grado5pub:'Informe Gremial N°4',
  clipping:'Clipping N°2',
  clipping1:'Clipping N°1',
  clipping3:'Clipping N°3',
  argumentoChat:'Argumento — Apriete del supervisor',
  comunicadorChat:'Podcast — Aceitero Reconquista',
  veChat:'CE — Índice ICE Vicentín',
  smvm:'Salario Mínimo Vital y Móvil'
};

var navDef = [
  { id:'home', icon:'🪶', label:'Inicio' },
  { id:'is', icon:'✍️', label:'Reporte' },
  { id:'condicion', icon:'📊', label:'Panorama' },
  { id:'documentacion', icon:'✊', label:'Lucha' },
  { id:'ecosistema', icon:'🪶', label:'Eco' }
];
