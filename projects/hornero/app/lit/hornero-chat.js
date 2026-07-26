// ===== <hornero-chat> — Motor de chat reutilizable =====
// User: bubble verde. App: sin bubble, texto plano + acciones (copiar, reenviar, like/dislike)
// Input bar: fondo claro, attach image/video, mic funcional (Web Speech API)
// Native Web Component — zero dependencies
// Usado por: IS, Derecho, Argumento, Comunicador, CE, SMVM, Contenido

import { HoComponent, html, css } from './ho-component.js';

class HorneroChat extends HoComponent {
  static get properties() {
    return {
      title: String,
      messages: Object,   // Array of { role, sections, tags, time, image, video }
      inputPlaceholder: String,
      typing: Boolean,
      progress: Number,   // 0-100
      suggestions: Array, // Array of strings — quick-reply buttons
      section: String,    // 'consulta', 'contenido', 'debate' — for history tagging
      sessionId: String,  // Current chat session ID
    };
  }

  constructor() {
    super();
    this.title = 'Chat';
    this.messages = [];
    this.inputPlaceholder = 'Escribí tu consulta...';
    this.typing = false;
    this.progress = 0;
    this.suggestions = [];
    this.section = '';
    this.sessionId = '';
    this._isListening = false; // mic state
    this._recognition = null;  // SpeechRecognition instance
    this._showHistory = false; // history drawer state
    this._historySessions = []; // cached session list
    this._initSpeechRecognition();
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this._recognition = new SpeechRecognition();
      this._recognition.lang = 'es-AR';
      this._recognition.continuous = false;
      this._recognition.interimResults = false;
      this._recognition.maxAlternatives = 1;

      this._recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputField = this.shadowRoot.querySelector('.chat-input-field');
        if (inputField) {
          inputField.value = transcript;
          // Trigger input event to update send button
          inputField.dispatchEvent(new Event('input'));
        }
        this._isListening = false;
        this._updateMicVisual(false);
      };

      this._recognition.onerror = () => {
        this._isListening = false;
        this._updateMicVisual(false);
      };

      this._recognition.onend = () => {
        this._isListening = false;
        this._updateMicVisual(false);
      };
    }
  }

  _updateMicVisual(isActive) {
    const micBtn = this.shadowRoot.querySelector('.chat-mic-btn');
    if (micBtn) {
      if (isActive) {
        micBtn.classList.add('listening');
        micBtn.title = 'Escuchando...';
      } else {
        micBtn.classList.remove('listening');
        micBtn.title = 'Mic';
      }
    }
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); position: relative; }


      /* History drawer overlay */
      .history-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 50; display: flex;
        justify-content: flex-end; transition: opacity .3s; }
      .history-overlay.hidden { opacity: 0; pointer-events: none; }

      /* History drawer panel */
      .history-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #F4F3EE); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease; }
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: none; } }

      .history-header { padding: 16px; display: flex; align-items: center;
        justify-content: space-between; flex: none;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.12)); }
      .history-header-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); }
      .history-close-btn { background: none; border: none; cursor: pointer;
        width: 28px; height: 28px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center;
        transition: background .2s; }
      .history-close-btn:hover { background: var(--ho-green-pale, #E8EDD7); }
      .history-close-btn svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }

      .history-list { flex: 1; overflow-y: auto; padding: 8px 0; }

      .history-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.08));
        display: flex; flex-direction: column; gap: 4px;
        transition: background .2s; }
      .history-item:hover { background: var(--ho-green-pale, #E8EDD7); }
      .history-item.active { background: var(--ho-green-pale, #E8EDD7); }

      .history-item-section { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
        color: var(--ho-green-dark, #586B33); }
      .history-item-preview { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text, #2B2A26); line-height: 1.3; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap; }
      .history-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); display: flex; gap: 8px; }
      .history-item-count { background: var(--ho-green-pale, #E8EDD7);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #586B33); }

      .history-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); }

      .history-item-delete { background: none; border: none; cursor: pointer;
        padding: 4px; align-self: flex-end; display: flex; }
      .history-item-delete svg { width: 14px; height: 14px;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .history-item-delete:hover svg { stroke: var(--ho-gold, #B0863F); }

      /* Section badge colors */
      .section-consulta { color: #6E8345; }
      .section-contenido { color: #B0863F; }
      .section-debate { color: #5A7EA8; }

      /* Progress bar */
      .chat-progress-wrap { padding: 4px 16px 0; flex: none; }
      .chat-progress-bar { height: 4px; background: var(--ho-mid-gray, #ECEAE3); border-radius: 4px; }
      .chat-progress-fill { height: 100%; background: var(--ho-green, #6E8345);
        border-radius: 4px; transition: width .5s; }
      .chat-progress-label { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 2px; text-align: center; }

      /* Messages scroll */
      .chat-scroll { flex: 1; overflow-y: auto; padding: 16px;
        -webkit-overflow-scrolling: touch; }

      /* Animations */
      @keyframes msgin { from { opacity: 0; transform: translateY(10px) scale(.97) }
        to { opacity: 1; transform: none } }
      @keyframes dotbounce { 0%,80%,100% { opacity:.3 } 40% { opacity:1 } }

      /* === USER message: bubble (green, right-aligned) === */
      .msg-row { margin-bottom: 14px; animation: msgin .35s ease; }
      .msg-row.user { display: flex; justify-content: flex-end; }

      .msg-row.user .msg-bubble {
        max-width: 82%; background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC);
        border-radius: 18px 18px 4px 18px; padding: 12px 16px;
        font-family: 'Public Sans', sans-serif; font-size: .90rem;
        line-height: 1.5; position: relative; }

      .msg-row.user .msg-time {
        font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: #E1E7D0; opacity: .7; margin-top: 5px; text-align: right; }

      /* User image/video attachment */
      .msg-media { max-width: 220px; margin-bottom: 6px; border-radius: 12px; overflow: hidden; }
      .msg-media img { width: 100%; display: block; border-radius: 12px; }
      .msg-media video { width: 100%; display: block; border-radius: 12px; }

      /* === HORNERO message: NO bubble — plain text block === */
      .msg-row.hornero { display: flex; flex-direction: column; align-items: flex-start; }

      .msg-content { max-width: 90%; animation: msgin .35s ease; }

      .msg-avatar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .msg-avatar { width: 26px; height: 26px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7);
        display: flex; align-items: center; justify-content: center; flex: none; overflow: hidden; }
      .msg-avatar img { width: 18px; height: 18px; }
      .msg-avatar-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-green-dark, #586B33); }

      .msg-text { font-family: 'Public Sans', sans-serif; font-size: .90rem;
        color: var(--ho-text, #2B2A26); line-height: 1.55;
        margin-bottom: 8px; }
      .msg-text p { margin-bottom: 10px; }
      .msg-text p:last-child { margin-bottom: 0; }
      .msg-text strong { font-weight: 700; color: var(--ho-green-dark, #586B33); }

      .msg-section { margin-bottom: 12px; }
      .msg-section:last-child { margin-bottom: 0; }
      .msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .96rem; color: var(--ho-text, #2B2A26); margin-bottom: 6px; }
      .msg-section-body { font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.55; }
      .msg-section-body p { margin-bottom: 4px; }

      /* Divider between sections */
      .msg-divider { height: 1px; background: var(--ho-border, rgba(43,42,38,.12));
        margin: 10px 0; }

      /* Quote */
      .msg-quote { background: var(--ho-green-pale, #E8EDD7);
        border-left: 3px solid var(--ho-green, #6E8345);
        border-radius: 0 10px 10px 0; padding: 10px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: #3D3B35; line-height: 1.55;
        margin: 8px 0; font-style: italic; }
      .msg-quote-icon { font-size: .72rem; color: var(--ho-green, #6E8345);
        margin-bottom: 4px; display: block; }
      .msg-quote-author { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-green-dark, #586B33);
        margin-bottom: 5px; font-style: normal; }
      .msg-quote-source { font-family: 'JetBrains Mono', monospace; font-size: .64rem;
        color: var(--ho-text-mid, #6E6A60); margin-top: 5px; font-style: normal; }

      /* Tags */
      .msg-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
      .msg-tag { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 4px 10px; border-radius: 8px; font-weight: 600; }

      .msg-time.hornero-time { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); opacity: .7; margin-top: 6px; }

      /* === Actions row: copiar, reenviar, like/dislike (after hornero msg) === */
      .msg-actions { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
      .msg-action-btn { background: none; border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 8px; padding: 5px 10px; cursor: pointer;
        font-family: 'Public Sans', sans-serif; font-size: .72rem;
        color: var(--ho-text-mid, #6E6A60); display: flex; align-items: center; gap: 4px;
        transition: border-color .2s, color .2s; }
      .msg-action-btn:hover { border-color: var(--ho-green, #6E8345);
        color: var(--ho-green, #6E8345); }
      .msg-action-btn.liked { color: var(--ho-green, #6E8345);
        border-color: var(--ho-green, #6E8345); background: var(--ho-green-pale, #E8EDD7); }
      .msg-action-btn.disliked { color: var(--ho-gold, #B0863F);
        border-color: var(--ho-gold, #B0863F); background: #F0E4CC; }
      .msg-action-btn svg { width: 14px; height: 14px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .msg-action-btn.liked svg.thumb-up { fill: var(--ho-green, #6E8345); }
      .msg-action-btn.disliked svg.thumb-down { fill: var(--ho-gold, #B0863F); }

      /* Typing indicator — no bubble, just dots inline */
      .typing-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        animation: msgin .2s ease; }
      .typing-avatar { width: 26px; height: 26px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7);
        display: flex; align-items: center; justify-content: center; flex: none; overflow: hidden; }
      .typing-avatar img { width: 18px; height: 18px; }
      .typing-dots { display: flex; gap: 5px; align-items: center; }
      .typing-dot { width: 8px; height: 8px; border-radius: 50%;
        background: var(--ho-green-light, #94A867); animation: dotbounce 1.4s ease infinite; }
      .typing-dot:nth-child(2) { animation-delay: .2s; }
      .typing-dot:nth-child(3) { animation-delay: .4s; }

      /* Suggestion buttons — format options */
      .chat-suggestions { display: grid; grid-template-columns: 1fr 1fr;
        gap: 8px; padding: 10px 16px; flex: none; }
      .chat-suggestions::-webkit-scrollbar { display: none; }
      .chat-suggestion-btn { border-radius: 12px; padding: 12px 10px;
        background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        color: var(--ho-text, #2B2A26);
        font-family: 'Archivo', sans-serif; font-size: .78rem;
        font-weight: 700; cursor: pointer; text-align: center;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        transition: border-color .2s, background .2s; }
      .chat-suggestion-btn:hover { border-color: var(--ho-green, #6E8345);
        background: var(--ho-green-pale, #E8EDD7); }
      .chat-suggestion-btn:active { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); }
      .suggestion-emoji { font-size: 1.4rem; }

      /* === Input bar: fondo CLARO (no gris oscuro) === */
      .chat-input { background: var(--ho-bg, #F4F3EE);
        border-top: 1px solid var(--ho-border, rgba(43,42,38,.12));
        padding: 6px 12px calc(12px + env(safe-area-inset-bottom, 0px));
        display: flex; align-items: center; gap: 6px; flex: none; }

      .chat-input-field { flex: 1; background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        border-radius: 22px; padding: 8px 16px; font-size: .88rem;
        color: var(--ho-text, #2B2A26); font-family: 'Public Sans', sans-serif;
        outline: none; transition: border-color .2s; min-height: 36px;
        resize: none; }
      .chat-input-field:focus { border-color: var(--ho-green, #6E8345); }
      .chat-input-field::placeholder { color: var(--ho-text-light, #9C988D); }

      /* Input toolbar buttons */
      .chat-toolbar { display: flex; align-items: center; gap: 4px; flex: none; }
      .chat-toolbar-btn { width: 36px; height: 36px; border-radius: 50%;
        border: none; cursor: pointer; display: flex; align-items: center;
        justify-content: center; flex: none; transition: background .2s, transform .15s; }
      .chat-toolbar-btn:hover { transform: scale(1.08); }
      .chat-toolbar-btn svg { width: 18px; height: 18px; stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }

      .chat-attach-btn { background: var(--ho-green-pale, #E8EDD7); }
      .chat-attach-btn svg { stroke: var(--ho-green-dark, #586B33); fill: var(--ho-green-dark, #586B33); }

      .chat-mic-btn { background: var(--ho-green-pale, #E8EDD7); }
      .chat-mic-btn svg { stroke: var(--ho-green-dark, #586B33); fill: none; }
      .chat-mic-btn.listening { background: var(--ho-green, #6E8345);
        animation: micpulse 1.2s ease infinite; }
      .chat-mic-btn.listening svg { stroke: var(--ho-text-off, #F2F1EC); }

      @keyframes micpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(110,131,68,.3) }
        50% { box-shadow: 0 0 0 8px rgba(110,131,68,.1) } }

      .chat-send-btn { background: var(--ho-green, #6E8345); }
      .chat-send-btn svg { stroke: var(--ho-text-off, #F2F1EC);
        fill: var(--ho-text-off, #F2F1EC); }

      .chat-mic-btn.hidden { display: none; }
      .chat-send-btn.hidden { display: none; }

      /* Hidden file input for attachments */
      .chat-file-input { display: none; }

      /* Attachment preview in input */
      .chat-attach-preview { max-width: 80px; max-height: 60px; border-radius: 8px;
        overflow: hidden; flex: none; margin-right: 4px; }
      .chat-attach-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .chat-attach-preview video { width: 100%; height: 100%; object-fit: cover; display: block; }
      .chat-attach-remove { position: absolute; top: -4px; right: -4px;
        background: var(--ho-dark, #33312D); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 50%; width: 18px; height: 18px;
        font-size: .62rem; cursor: pointer; display: flex; align-items: center;
        justify-content: center; }
      .chat-attach-preview-wrap { position: relative; flex: none; }
    `;
  }

  _render() {
    // History drawer X icon
    const xSvg = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

    const progressFill = this.progress > 0 ?
      `<div class="chat-progress-wrap">
        <div class="chat-progress-bar"><div class="chat-progress-fill" style="width:${this.progress}%"></div></div>
        <div class="chat-progress-label">${this.progress}%</div>
      </div>` : '';

    const typingHtml = this.typing ?
      `<div class="typing-row">
        <div class="typing-avatar"><img src="assets/hornero-logo.png" alt="H"></div>
        <div class="typing-dots">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>` : '';

    const messagesHtml = (this.messages || []).map(m => this._renderMessage(m)).join('');

    // Suggestions row
    const suggestionsHtml = (this.suggestions && this.suggestions.length > 0) ?
      `<div class="chat-suggestions">
        ${this.suggestions.map(s => {
          // Split emoji icon from label text
          const parts = s.split(/\s+/);
          const emoji = parts[0]; // First part is emoji
          const label = parts.slice(1).join(' ') || parts[0]; // Rest is label, or whole if no emoji
          const isEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✊✍🎙📱📻]/u.test(emoji);
          const emojiHtml = isEmoji ? `<span class="suggestion-emoji">${emoji}</span>` : '';
          const labelText = isEmoji ? label : s;
          return `<button class="chat-suggestion-btn">${emojiHtml}<span>${labelText}</span></button>`;
        }).join('')}
      </div>` : '';

    // SVG icons
    const attachSvg = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    const micSvg = '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
    const sendSvg = '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9" fill="currentColor" stroke="none"/>';

    // Attachment preview (if pending)
    const attachPreview = this._pendingAttachment ?
      `<div class="chat-attach-preview-wrap">
        <div class="chat-attach-preview">
          ${this._pendingAttachment.type === 'image' ?
            `<img src="${this._pendingAttachment.dataUrl}" alt="adjunto">` :
            `<video src="${this._pendingAttachment.dataUrl}" muted></video>`}
        </div>
        <button class="chat-attach-remove" title="Quitar adjunto">✕</button>
      </div>` : '';

    // History drawer
    const sectionLabels = { consulta: 'Consulta', contenido: 'Contenido', debate: 'Debate' };
    const historyDrawerHtml = this._showHistory ?
      `<div class="history-overlay">
        <div class="history-drawer">
          <div class="history-header">
            <div class="history-header-title">Historial</div>
            <button class="history-close-btn">
              <svg viewBox="0 0 24 24">${xSvg}</svg>
            </button>
          </div>
          <div class="history-list">
            ${this._historySessions.length === 0 ?
              '<div class="history-empty">No hay chats guardados</div>' :
              this._historySessions.map(s => {
                const sectionLabel = sectionLabels[s.section] || s.section;
                const isActive = s.sessionId === this.sessionId;
                const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
                const timeStr = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
                return `<div class="history-item${isActive ? ' active' : ''}" data-session-id="${s.sessionId}">
                  <div class="history-item-section section-${s.section || 'consulta'}">${sectionLabel}</div>
                  <div class="history-item-preview">${s.preview || 'Chat sin texto'}</div>
                  <div class="history-item-meta">
                    <span>${dateStr} ${timeStr}</span>
                    <span class="history-item-count">${s.messageCount} msgs</span>
                  </div>
                  <button class="history-item-delete" data-delete-session="${s.sessionId}" title="Borrar chat">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>` : '';

    return html`
      ${progressFill}

      <div class="chat-scroll">
        ${messagesHtml}
        ${typingHtml}
      </div>

      ${suggestionsHtml}

      <div class="chat-input">
        ${attachPreview}
        <input class="chat-input-field" type="text" placeholder="${this.inputPlaceholder}" autocomplete="nope" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore>
        <input class="chat-file-input" type="file" accept="image/*,video/*">
        <div class="chat-toolbar">
          <button class="chat-toolbar-btn chat-attach-btn" title="Adjuntar imagen o video">
            <svg viewBox="0 0 24 24">${attachSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-mic-btn" title="Mic">
            <svg viewBox="0 0 24 24">${micSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-send-btn hidden" title="Enviar">
            <svg viewBox="0 0 24 24">${sendSvg}</svg>
          </button>
        </div>
      </div>

      ${historyDrawerHtml}
    `;
  }

  _renderMessage(m) {
    const role = m.role || 'hornero';

    // === USER message: bubble ===
    if (role === 'user') {
      const timeHtml = m.time ? `<div class="msg-time">${m.time}</div>` : '';
      const mediaHtml = m.image ?
        `<div class="msg-media"><img src="${m.image}" alt="imagen"></div>` :
        m.video ?
        `<div class="msg-media"><video src="${m.video}" controls></video></div>` : '';
      const textHtml = m.text ? m.text : '';
      return `<div class="msg-row user">
        <div class="msg-bubble">${mediaHtml}${textHtml}${timeHtml}</div>
      </div>`;
    }

    // === HORNERO message: NO bubble — plain text ===
    const timeHtml = m.time ? `<div class="msg-time hornero-time">${m.time}</div>` : '';

    // Avatar + name row
    const avatarRow = `<div class="msg-avatar-row">
      <div class="msg-avatar"><img src="assets/hornero-logo.png" alt="H"></div>
      <div class="msg-avatar-name">IA Sindical</div>
    </div>`;

    let contentHtml = '';
    if (m.text) {
      // Split text into paragraphs — double newline = paragraph break
      const paragraphs = m.text.split(/\n\n+/).filter(p => p.trim());
      const paragraphsHtml = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
      contentHtml = `<div class="msg-text">${paragraphsHtml}</div>`;
    } else if (m.sections) {
      contentHtml = m.sections.map((s, i, arr) => {
        let content = '';
        if (s.title) content += `<div class="msg-section-title">${s.title}</div>`;
        if (s.body) content += `<div class="msg-section-body"><p>${s.body}</p></div>`;
        if (s.quote) {
          content += `<div class="msg-quote">`;
          content += `<span class="msg-quote-icon">❝</span>`;
          if (s.quoteAuthor) content += `<div class="msg-quote-author">${s.quoteAuthor}</div>`;
          content += `<p>${s.quote}</p>`;
          if (s.quoteSource) content += `<div class="msg-quote-source">${s.quoteSource}</div>`;
          content += '</div>';
        }
        const divider = (i < arr.length - 1) ? '<div class="msg-divider"></div>' : '';
        return `<div class="msg-section">${content}</div>${divider}`;
      }).join('');
    }
    // Tags rendered for both text and sections modes
    const tagsHtml = m.tags ?
      `<div class="msg-tags">${m.tags.map(t => `<span class="msg-tag">${t}</span>`).join('')}</div>` : '';
    contentHtml += tagsHtml;

    // Actions: copiar, reenviar, like/dislike
    const actionsHtml = `<div class="msg-actions">
      <button class="msg-action-btn" data-action="copy" title="Copiar">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copiar
      </button>
      <button class="msg-action-btn" data-action="forward" title="Reenviar">
        <svg viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 12h16"/></svg>
        Reenviar
      </button>
      <button class="msg-action-btn" data-action="like" title="Me gusta">
        <svg class="thumb-up" viewBox="0 0 24 24"><path d="M7 22V11L2 12V22H7Z"/><path d="M7 11L12 2C13.1 2 14 2.9 14 4V8H20C21.1 8 22 8.9 22 10V20C22 21.1 21.1 22 20 22H7"/></svg>
      </button>
      <button class="msg-action-btn" data-action="dislike" title="No me gusta">
        <svg class="thumb-down" viewBox="0 0 24 24"><path d="M17 2V13L22 12V2H17Z"/><path d="M17 13L12 22C10.9 22 10 21.1 10 19V16H4C2.9 16 2 15.1 2 14V4C2 2.9 2.9 2 4 2H17"/></svg>
      </button>
    </div>`;

    return `<div class="msg-row hornero">
      ${avatarRow}
      <div class="msg-content">
        ${contentHtml}
        ${timeHtml}
        ${actionsHtml}
      </div>
    </div>`;
  }

  _afterRender() {
    const inputField = this.shadowRoot.querySelector('.chat-input-field');
    const micBtn = this.shadowRoot.querySelector('.chat-mic-btn');
    const sendBtn = this.shadowRoot.querySelector('.chat-send-btn');
    const attachBtn = this.shadowRoot.querySelector('.chat-attach-btn');
    const fileInput = this.shadowRoot.querySelector('.chat-file-input');
    const removeAttachBtn = this.shadowRoot.querySelector('.chat-attach-remove');

    // === Toggle mic/send visibility based on input content ===
    if (inputField && micBtn && sendBtn) {
      const updateToolbar = () => {
        const hasText = inputField.value.trim().length > 0 || this._pendingAttachment;
        if (hasText) {
          sendBtn.classList.remove('hidden');
          micBtn.classList.add('hidden');
        } else {
          sendBtn.classList.add('hidden');
          micBtn.classList.remove('hidden');
        }
      };

      inputField.addEventListener('input', updateToolbar);
      updateToolbar();

      // === Send button ===
      sendBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        const detail = { text };
        if (this._pendingAttachment) {
          detail.image = this._pendingAttachment.type === 'image' ? this._pendingAttachment.dataUrl : null;
          detail.video = this._pendingAttachment.type === 'video' ? this._pendingAttachment.dataUrl : null;
          detail.fileName = this._pendingAttachment.fileName;
          this._pendingAttachment = null;
        }
        if (text || detail.image || detail.video) {
          this.emit('chat-send', detail);
          inputField.value = '';
          this.suggestions = [];
          this.render();
        }
      });

      // Enter key sends
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendBtn.click();
        }
      });

      // === Mic button — Web Speech API ===
      if (micBtn) {
        micBtn.addEventListener('click', () => {
          if (this._recognition) {
            if (this._isListening) {
              this._recognition.stop();
              this._isListening = false;
              this._updateMicVisual(false);
            } else {
              this._isListening = true;
              this._updateMicVisual(true);
              this._recognition.start();
            }
          } else {
            // No SpeechRecognition support — fallback: focus input
            inputField.focus();
          }
        });
      }
    }

    // === Attach button — file picker ===
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const type = file.type.startsWith('image') ? 'image' : 'video';
          const reader = new FileReader();
          reader.onload = (ev) => {
            this._pendingAttachment = {
              type: type,
              dataUrl: ev.target.result,
              fileName: file.name,
            };
            this.render();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove attachment preview
    if (removeAttachBtn) {
      removeAttachBtn.addEventListener('click', () => {
        this._pendingAttachment = null;
        this.render();
      });
    }

    // === Suggestion buttons → emit chat-send ===
    this.shadowRoot.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.trim();
        if (text) {
          this.emit('chat-send', { text });
          this.suggestions = [];
          this.render();
        }
      });
    });

    // === History drawer: close ===
    const historyOverlay = this.shadowRoot.querySelector('.history-overlay');
    const historyCloseBtn = this.shadowRoot.querySelector('.history-close-btn');
    if (historyOverlay) {
      // Close on overlay click (outside drawer)
      historyOverlay.addEventListener('click', (e) => {
        if (e.target === historyOverlay) {
          this._closeHistoryDrawer();
        }
      });
    }
    if (historyCloseBtn) {
      historyCloseBtn.addEventListener('click', () => {
        this._closeHistoryDrawer();
      });
    }

    // === History drawer: select session ===
    this.shadowRoot.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if delete button was clicked
        if (e.target.closest('.history-item-delete')) return;
        const sid = item.dataset.sessionId;
        if (sid) {
          // Emit event FIRST — parent's re-render will close drawer naturally
          this.emit('chat-session-select', { sessionId: sid, section: this.section });
        }
      });
    });

    // === History drawer: delete session ===
    this.shadowRoot.querySelectorAll('.history-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.deleteSession;
        if (sid && typeof borrarChatSession === 'function') {
          borrarChatSession(sid).then(() => {
            this._openHistoryDrawer(); // Refresh drawer
          });
        }
      });
    });

    // === Message action buttons (copy, forward, like/dislike) ===
    this.shadowRoot.querySelectorAll('.msg-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const msgContent = btn.closest('.msg-content');

        if (action === 'copy') {
          const text = msgContent ? msgContent.textContent.trim() : '';
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
              const orig = btn.innerHTML;
              btn.innerHTML = '✅ Copiado';
              btn.style.color = 'var(--ho-green, #6E8345)';
              btn.style.borderColor = 'var(--ho-green, #6E8345)';
              setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 1500);
            });
          }
        }

        if (action === 'forward') {
          const text = msgContent ? msgContent.textContent.trim() : '';
          // Web Share API if available, otherwise copy
          if (navigator.share) {
            navigator.share({ title: 'IA Sindical', text: text }).catch(() => {});
          } else {
            // Fallback: copy to clipboard
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ Copiado para reenviar';
                btn.style.color = 'var(--ho-green, #6E8345)';
                setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 1500);
              });
            }
          }
        }

        if (action === 'like') {
          // Toggle like state
          btn.classList.toggle('liked');
          // Remove dislike from sibling
          const dislikeBtn = btn.parentElement.querySelector('[data-action="dislike"]');
          if (dislikeBtn) dislikeBtn.classList.remove('disliked');
          this.emit('chat-feedback', { type: 'like', liked: btn.classList.contains('liked') });
        }

        if (action === 'dislike') {
          // Toggle dislike state
          btn.classList.toggle('disliked');
          // Remove like from sibling
          const likeBtn = btn.parentElement.querySelector('[data-action="like"]');
          if (likeBtn) likeBtn.classList.remove('liked');
          this.emit('chat-feedback', { type: 'dislike', disliked: btn.classList.contains('disliked') });
        }
      });
    });

    // Scroll to bottom after render
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  // ===== Public API =====
  addMessage(msg) {
    const current = this.messages || [];
    current.push(msg);
    this.messages = current;
    this._showHistory = false; // Close drawer when new message arrives
    this.render();
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  showTyping() { this.typing = true; this.render(); }
  hideTyping() { this.typing = false; this.render(); }
  setProgress(pct) { this.progress = pct; this.render(); }

  setSuggestions(arr) {
    this.suggestions = arr || [];
    this.render();
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  clearSuggestions() {
    this.suggestions = [];
    this.render();
  }

  // ===== History Drawer =====
  async _openHistoryDrawer() {
    try {
      if (typeof obtenerChatSessions === 'function') {
        this._historySessions = await obtenerChatSessions();
      } else {
        this._historySessions = [];
      }
    } catch(e) { console.warn('Chat: history sessions load failed', e); this._historySessions = []; }
    this._showHistory = true;
    this.render();
  }

  _closeHistoryDrawer() {
    this._showHistory = false;
    this.render();
  }
}

customElements.define('hornero-chat', HorneroChat);
