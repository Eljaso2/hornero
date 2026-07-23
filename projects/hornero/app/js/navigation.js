// ===== Hornero APP — Navigation =====
// Screen stack, goScreen, goBack, goHome, renderNav

var screenStack = [];

function goScreen(id) {
  screenStack.push(state.screen);
  // Reset module states on screen change
  if (id === 'is') { state.isRole = 1; state.isStep = 0; }
  if (id === 'chatderecho') { state.chatStarted = false; state.chatStep = 0; }
  if (id === 'documentacion') { state.derInitStarted = false; state.derInitStep = 0; }
  if (id === 'argumento') { state.argInitStarted = false; state.argInitStep = 0; }
  if (id === 'argumentoChat') { state.argStarted = false; state.argStep = 0; }
  if (id === 've') { state.veInitStarted = false; state.veInitStep = 0; }
  if (id === 'veChat') { state.veStarted = false; state.veStep = 0; }
  if (id === 'comunicador') { state.comInitStarted = false; state.comInitStep = 0; }
  if (id === 'comunicadorChat') { state.comStarted = false; state.comStep = 0; }
  state.screen = id;
  render();
  saveState();
}

function goHome() {
  screenStack = [];
  state.screen = 'home';
  render();
  saveState();
}

function goBack() {
  if (screenStack.length > 0) {
    state.screen = screenStack.pop();
    render();
  } else {
    goHome();
  }
  saveState();
}

function goISReport(role, step) {
  state.isRole = role;
  state.isStep = step;
  state.screen = 'is';
  render();
  saveState();
}

function setRole(r) {
  state.isRole = r;
  state.isStep = 0;
  if (typeof renderIS === 'function') renderIS();
  saveState();
}

function setStep(i) {
  state.isStep = i;
  if (typeof renderIS === 'function') renderIS();
  saveState();
}

// ===== Render =====
var outsideIds = ['is','chatderecho','documentacion','argumento','argumentoChat','ve','veChat','comunicador','comunicadorChat','smvm','felicidad','como-somos','comoSomosClase','comoSomosActivo','comoSomosReserva','comoSomosChat','miradorMate1','accion'];

function render() {
  // Remove all active classes
  document.querySelectorAll('.screen-content').forEach(function(el) {
    el.classList.remove('active');
    el.classList.remove('active-flex');
  });

  var bodyScroll = document.getElementById('bodyScroll');
  var isOutside = outsideIds.indexOf(state.screen) !== -1;

  if (isOutside) {
    if (bodyScroll) bodyScroll.style.display = 'none';
    var activeEl = document.getElementById(state.screen);
    if (activeEl) activeEl.classList.add('active-flex');
  } else {
    outsideIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active-flex');
    });
    if (bodyScroll) bodyScroll.style.display = '';
    var cur = document.getElementById(state.screen);
    if (cur) cur.classList.add('active');
  }

  // Top bar back button
  var topBackBtn = document.getElementById('topBackBtn');
  if (topBackBtn) {
    topBackBtn.style.display = (state.screen === 'home' || screenStack.length === 0) ? 'none' : 'flex';
  }

  // Bottom nav
  renderNav();

  // IS dynamic content (safe call — module may not exist yet)
  if (state.screen === 'is') {
    if (typeof isChatInit === 'function') isChatInit();
    if (typeof renderIS === 'function') renderIS();
  }

  // Module-specific inits (safe calls — modules may not exist yet)
  if (state.screen === 'chatderecho' && !state.chatStarted) {
    state.chatStarted = true;
    if (typeof chatReset === 'function') chatReset();
    setTimeout(function() { if (typeof chatRunStep === 'function') chatRunStep(0); }, 1200);
  }
  if (state.screen === 'documentacion' && !state.derInitStarted) {
    state.derInitStarted = true; state.derInitStep = 0;
    if (typeof derInitRunStep === 'function') derInitRunStep();
  }
  if (state.screen === 'argumento' && !state.argInitStarted) {
    state.argInitStarted = true; state.argInitStep = 0;
    if (typeof argInitRunStep === 'function') argInitRunStep();
  }
  if (state.screen === 'argumentoChat' && !state.argStarted) {
    state.argStarted = true; state.argStep = 0;
    if (typeof argChatRunStep === 'function') argChatRunStep(0);
  }
  if (state.screen === 've' && !state.veInitStarted) {
    state.veInitStarted = true; state.veInitStep = 0;
    if (typeof veInitRunStep === 'function') veInitRunStep();
  }
  if (state.screen === 'veChat' && !state.veStarted) {
    state.veStarted = true; state.veStep = 0;
    if (typeof veChatRunStep === 'function') veChatRunStep(0);
  }
  if (state.screen === 'comunicador' && !state.comInitStarted) {
    state.comInitStarted = true; state.comInitStep = 0;
    if (typeof comInitRunStep === 'function') comInitRunStep();
  }
  if (state.screen === 'comunicadorChat' && !state.comStarted) {
    state.comStarted = true; state.comStep = 0;
    if (typeof comRunStep === 'function') comRunStep(0);
  }
}

// ===== Bottom Nav =====
function renderNav() {
  var navEl = document.getElementById('bottomNav');
  if (!navEl) return;
  var html = '';
  navDef.forEach(function(l) {
    var active = l.id === state.screen;
    var labelStyle = active ? 'color:#94A867;font-weight:700' : 'color:#9C988D';
    html += '<button class="nav-btn" onclick="goScreen(\'' + l.id + '\')">';
    html += '<span class="icon" style="' + (active ? '' : 'opacity:.5') + '">' + l.icon + '</span>';
    html += '<span class="label" style="' + labelStyle + '">' + l.label + '</span>';
    html += '</button>';
  });
  navEl.innerHTML = html;
}

// ===== Coyuntura filter =====
function filterCoyuntura(type) {
  var cards = document.querySelectorAll('.coyCard');
  var btns = {
    todos: document.getElementById('coyFilterTodos'),
    clipping: document.getElementById('coyFilterClipping'),
    reporte: document.getElementById('coyFilterReporte'),
    mate: document.getElementById('coyFilterMate')
  };
  // Reset all buttons
  Object.keys(btns).forEach(function(k) {
    if (btns[k]) { btns[k].style.background = '#E6E3DB'; btns[k].style.color = '#6E6A60'; }
  });
  // Active button
  if (type === 'todos' && btns.todos) { btns.todos.style.background = '#45433E'; btns.todos.style.color = '#F2F1EC'; }
  else if (type === 'clipping' && btns.clipping) { btns.clipping.style.background = '#6E8345'; btns.clipping.style.color = '#F2F1EC'; }
  else if (type === 'reporte' && btns.reporte) { btns.reporte.style.background = '#45433E'; btns.reporte.style.color = '#F2F1EC'; }
  else if (type === 'mate' && btns.mate) { btns.mate.style.background = '#B0863F'; btns.mate.style.color = '#F2F1EC'; }
  // Show/hide cards
  cards.forEach(function(el) {
    if (type === 'todos') el.style.display = 'block';
    else if (el.getAttribute('data-type') === type) el.style.display = 'block';
    else el.style.display = 'none';
  });
}

// ===== Hamburger Menu =====
function toggleMenu() {
  var overlay = document.getElementById('menuOverlay');
  if (overlay.style.display === 'none') {
    overlay.style.display = '';
    var links = [
      {icon:'🪶',label:'Inicio',id:'home'},
      {icon:'✍️',label:'Reporte gremial',id:'is'},
      {icon:'📊',label:'Panorama',id:'condicion'},
      {icon:'✊',label:'Acción Sindical',id:'accion'},
      {icon:'⚖️',label:'Nuestro Derecho',id:'documentacion'},
      {icon:'💡',label:'Argumento',id:'argumento'},
      {icon:'🎙️',label:'Comunicador',id:'comunicador'},
      {icon:'🏭',label:'Comportamiento Empresarial',id:'ve'},
      {icon:'💰',label:'SMVM',id:'smvm'},
      {icon:'🌿',label:'Felicidad Laboral',id:'felicidad'},
      {icon:'📰',label:'Coyuntura',id:'novedades'},
      {icon:'🪶',label:'Ecosistema Hornero',id:'ecosistema'}
    ];
    var html = '';
    links.forEach(function(l) {
      var active = l.id === state.screen;
      html += '<div class="menu-link' + (active ? ' active' : '') + '" onclick="goScreen(\'' + l.id + '\');toggleMenu()">';
      html += '<span style="font-size:1.05rem;flex:none">' + l.icon + '</span>';
      html += '<span>' + l.label + '</span>';
      html += '</div>';
    });
    document.getElementById('menuLinks').innerHTML = html;
  } else {
    overlay.style.display = 'none';
  }
}

// ===== State Persistence =====
function saveState() {
  try {
    var saved = {
      screen: state.screen,
      isRole: state.isRole,
      isStep: state.isStep,
      chatStarted: state.chatStarted,
      chatStep: state.chatStep,
      derInitStarted: state.derInitStarted,
      argInitStarted: state.argInitStarted,
      argStarted: state.argStarted,
      veInitStarted: state.veInitStarted,
      veStarted: state.veStarted,
      comInitStarted: state.comInitStarted,
      comStarted: state.comStarted
    };
    localStorage.setItem('hornero-state', JSON.stringify(saved));
  } catch(e) {}
}

function loadState() {
  try {
    var saved = JSON.parse(localStorage.getItem('hornero-state'));
    if (saved) {
      Object.keys(saved).forEach(function(k) { if (state.hasOwnProperty(k)) state[k] = saved[k]; });
    }
  } catch(e) {}
}
