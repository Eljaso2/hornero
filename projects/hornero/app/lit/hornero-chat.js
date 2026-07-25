// ===== <hornero-chat> — Motor de chat reutilizable =====
// Typing dots, bubbles (user + hornero), input bar, progress, suggestions, back, copy
// Native Web Component — zero dependencies
// Usado por: IS, Derecho, Argumento, Comunicador, CE, SMVM, Contenido

import { HoComponent, html, css } from './ho-component.js';

class HorneroChat extends HoComponent {
  static get properties() {
    return {
      title: String,
      messages: Object,   // Array of { role, sections, tags, time }
      inputPlaceholder: String,
      typing: Boolean,
      progress: Number,   // 0-100
      suggestions: Array, // Array of strings — quick-reply buttons
      showBack: Boolean,  // Show "← Volver" button
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
    this.showBack = false;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* Back button */
      .chat-back-btn { background: none; border: none; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-size: .78rem;
        color: var(--ho-text-mid, #6E6A60); padding: 10px 16px 4px;
        display: flex; align-items: center; gap: 6px; flex: none; }
      .chat-back-btn svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-back-btn:hover { color: var(--ho-green, #6E8345); }
      .chat-back-btn:hover svg { stroke: var(--ho-green, #6E8345); }

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

      /* Message bubbles */
      @keyframes msgin { from { opacity: 0; transform: translateY(10px) scale(.97) }
        to { opacity: 1; transform: none } }
      @keyframes dotbounce { 0%,80%,100% { opacity:.3 } 40% { opacity:1 } }

      .msg-row { display: flex; gap: 10px; margin-bottom: 14px; animation: msgin .35s ease; }
      .msg-row.user { justify-content: flex-end; }
      .msg-row.hornero { justify-content: flex-start; }

      .msg-avatar { width: 30px; height: 30px; border-radius: 50%;
        background: var(--ho-green-pale, #E8EDD7);
        display: flex; align-items: center; justify-content: center;
        flex: none; align-self: flex-end; overflow: hidden; }
      .msg-avatar img { width: 22px; height: 22px; }

      .msg-bubble { max-width: 82%; border-radius: 18px; padding: 14px 16px;
        line-height: 1.55; position: relative; }

      .msg-row.user .msg-bubble { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC);
        border-bottom-right-radius: 4px; }

      .msg-row.hornero .msg-bubble { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        box-shadow: 0 1px 3px rgba(0,0,0,.04);
        border-bottom-left-radius: 4px; }

      .msg-time { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        opacity: .7; margin-top: 6px; }
      .msg-row.user .msg-time { color: #E1E7D0; text-align: right; }
      .msg-row.hornero .msg-time { color: var(--ho-text-light, #9C988D); }

      /* Sections within a hornero message */
      .msg-section { margin-bottom: 12px; }
      .msg-section:last-child { margin-bottom: 0; }
      .msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .9rem; color: var(--ho-text, #2B2A26); margin-bottom: 6px; }
      .msg-section-body { font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.55; }
      .msg-section-body p { margin-bottom: 4px; }

      /* Divider between sections */
      .msg-divider { height: 1px; background: var(--ho-border, rgba(43,42,38,.12));
        margin: 10px 0; }

      /* Quote */
      .msg-quote { background: var(--ho-green-pale, #E8EDD7);
        border-left: 3px solid var(--ho-green, #6E8345);
        border-radius: 0 10px 10px 0; padding: 10px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
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

      /* Copy button on hornero messages */
      .msg-copy-btn { position: absolute; top: 8px; right: 8px;
        background: none; border: none; cursor: pointer;
        font-size: .72rem; color: var(--ho-text-light, #9C988D);
        opacity: 0; transition: opacity .2s; padding: 2px 4px; }
      .msg-row.hornero:hover .msg-copy-btn { opacity: 1; }
      .msg-copy-btn:hover { color: var(--ho-green, #6E8345); }

      /* Typing dots */
      .typing-row { display: flex; gap: 10px; margin-bottom: 14px;
        justify-content: flex-start; animation: msgin .2s ease; }
      .typing-bubble { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        box-shadow: 0 1px 3px rgba(0,0,0,.04);
        border-radius: 18px; border-bottom-left-radius: 4px;
        padding: 12px 18px; display: flex; gap: 6px; align-items: center; }
      .typing-dot { width: 9px; height: 9px; border-radius: 50%;
        background: var(--ho-green-light, #94A867); animation: dotbounce 1.4s ease infinite; }
      .typing-dot:nth-child(2) { animation-delay: .2s; }
      .typing-dot:nth-child(3) { animation-delay: .4s; }

      /* Suggestion buttons */
      .chat-suggestions { display: flex; gap: 8px; padding: 10px 16px;
        overflow-x: auto; scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch; flex: none; }
      .chat-suggestions::-webkit-scrollbar { display: none; }
      .chat-suggestion-btn { scroll-snap-align: start; flex: none;
        border-radius: 20px; padding: 8px 16px;
        background: var(--ho-green-pale, #E8EDD7);
        border: 1px solid var(--ho-green-light, #94A867);
        color: var(--ho-green-dark, #586B33);
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        font-weight: 600; cursor: pointer;
        transition: background .2s, color .2s, transform .15s; }
      .chat-suggestion-btn:hover { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); transform: translateY(-1px); }
      .chat-suggestion-btn:active { transform: translateY(0); }

      /* Input bar — single button, mic → send when text present */
      .chat-input { background: var(--ho-dark-surface, #45433E);
        padding: 12px 14px calc(16px + env(safe-area-inset-bottom, 0px));
        display: flex; align-items: center; gap: 8px; flex: none; }
      .chat-input-field { flex: 1; background: var(--ho-dark-mid, #5A574F);
        border: 1px solid var(--ho-input-border, rgba(242,241,236,.15));
        border-radius: 999px; padding: 10px 16px; font-size: .84rem;
        color: var(--ho-text-off, #F2F1EC); font-family: 'Public Sans', sans-serif;
        outline: none; transition: border-color .2s; }
      .chat-input-field:focus { border-color: var(--ho-green-light, #94A867); }
      .chat-input-field::placeholder { color: #9C988C; }
      .chat-action-btn { width: 40px; height: 40px; border-radius: 50%;
        background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex: none; transition: background .2s, transform .15s; }
      .chat-action-btn:hover { transform: scale(1.05); }
      .chat-action-btn.mic-state { background: var(--ho-dark-mid, #5A574F); }
      .chat-action-btn svg { width: 18px; height: 18px; stroke: var(--ho-text-off, #F2F1EC);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    `;
  }

  _render() {
    // Back button
    const backHtml = this.showBack ?
      `<button class="chat-back-btn">
        <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver
      </button>` : '';

    const progressFill = this.progress > 0 ?
      `<div class="chat-progress-wrap">
        <div class="chat-progress-bar"><div class="chat-progress-fill" style="width:${this.progress}%"></div></div>
        <div class="chat-progress-label">${this.progress}%</div>
      </div>` : '';

    const typingHtml = this.typing ?
      `<div class="typing-row">
        <div class="msg-avatar"><img src="assets/hornero-logo.png" alt="H"></img></div>
        <div class="typing-bubble">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>` : '';

    const messagesHtml = (this.messages || []).map(m => this._renderMessage(m)).join('');

    // Suggestions row
    const suggestionsHtml = (this.suggestions && this.suggestions.length > 0) ?
      `<div class="chat-suggestions">
        ${this.suggestions.map(s => `<button class="chat-suggestion-btn">${s}</button>`).join('')}
      </div>` : '';

    // Mic SVG icon (waveform style)
    const micSvg = '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
    // Send SVG icon (arrow right)
    const sendSvg = '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9" fill="currentColor" stroke="none"/>';

    return html`
      ${backHtml}
      ${progressFill}

      <div class="chat-scroll">
        ${messagesHtml}
        ${typingHtml}
      </div>

      ${suggestionsHtml}

      <div class="chat-input">
        <input class="chat-input-field" type="text" placeholder="${this.inputPlaceholder}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <button class="chat-action-btn mic-state" title="Mic">
          <svg viewBox="0 0 24 24">${micSvg}</svg>
        </button>
      </div>
    `;
  }

  _renderMessage(m) {
    const role = m.role || 'hornero';
    const avatarHtml = role === 'hornero' ?
      '<div class="msg-avatar"><img src="assets/hornero-logo.png" alt="H"></div>' : '';
    const timeHtml = m.time ? `<div class="msg-time">${m.time}</div>` : '';

    // Copy button for hornero messages
    const copyBtn = role === 'hornero' ?
      `<button class="msg-copy-btn" title="Copiar">📋</button>` : '';

    let bubbleHtml = '';
    if (m.text) {
      // Simple text message
      bubbleHtml = `<div class="msg-bubble">${m.text}${timeHtml}${copyBtn}</div>`;
    } else if (m.sections) {
      // Structured message with sections, quotes, tags
      const sectionsHtml = m.sections.map((s, i, arr) => {
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
        // Add divider between sections (not after last)
        const divider = (i < arr.length - 1) ? '<div class="msg-divider"></div>' : '';
        return `<div class="msg-section">${content}</div>${divider}`;
      }).join('');
      const tagsHtml = m.tags ?
        `<div class="msg-tags">${m.tags.map(t => `<span class="msg-tag">${t}</span>`).join('')}</div>` : '';
      bubbleHtml = `<div class="msg-bubble">${sectionsHtml}${tagsHtml}${timeHtml}${copyBtn}</div>`;
    }

    return `<div class="msg-row ${role}">${avatarHtml}${bubbleHtml}</div>`;
  }

  _afterRender() {
    const actionBtn = this.shadowRoot.querySelector('.chat-action-btn');
    const inputField = this.shadowRoot.querySelector('.chat-input-field');

    if (actionBtn && inputField) {
      // Mic SVG icon path
      const micSvg = '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
      // Send SVG icon
      const sendSvg = '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9" fill="currentColor" stroke="none"/>';

      // Toggle mic → send based on input content
      const updateBtn = () => {
        const hasText = inputField.value.trim().length > 0;
        if (hasText) {
          actionBtn.classList.remove('mic-state');
          actionBtn.title = 'Enviar';
          actionBtn.innerHTML = '<svg viewBox="0 0 24 24">' + sendSvg + '</svg>';
        } else {
          actionBtn.classList.add('mic-state');
          actionBtn.title = 'Mic';
          actionBtn.innerHTML = '<svg viewBox="0 0 24 24">' + micSvg + '</svg>';
        }
      };

      inputField.addEventListener('input', updateBtn);
      // Initial state
      updateBtn();

      // Button click — send if text, mic placeholder otherwise
      actionBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (text) {
          this.emit('chat-send', { text });
          inputField.value = '';
          updateBtn();
          // Clear suggestions when user sends a message
          this.suggestions = [];
          this.render();
        }
      });

      // Enter key sends
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = inputField.value.trim();
          if (text) {
            this.emit('chat-send', { text });
            inputField.value = '';
            updateBtn();
            // Clear suggestions when user sends a message
            this.suggestions = [];
            this.render();
          }
        }
      });
    }

    // Suggestion buttons → emit chat-send with text
    this.shadowRoot.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.textContent.trim();
        if (text) {
          this.emit('chat-send', { text });
          // Clear suggestions after click
          this.suggestions = [];
          this.render();
        }
      });
    });

    // Back button → emit chat-back
    const backBtn = this.shadowRoot.querySelector('.chat-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.emit('chat-back');
      });
    }

    // Copy buttons → copy message text to clipboard
    this.shadowRoot.querySelectorAll('.msg-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const bubble = btn.closest('.msg-bubble');
        if (bubble) {
          const text = bubble.textContent.replace('📋', '').trim();
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
              btn.textContent = '✅';
              setTimeout(() => { btn.textContent = '📋'; }, 1500);
            });
          }
        }
      });
    });

    // Scroll to bottom after render
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  // ===== Public API for parent components =====
  addMessage(msg) {
    const current = this.messages || [];
    current.push(msg);
    this.messages = current;
    this.render();
    // Scroll to bottom
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  showTyping() { this.typing = true; this.render(); }
  hideTyping() { this.typing = false; this.render(); }
  setProgress(pct) { this.progress = pct; this.render(); }

  setSuggestions(arr) {
    this.suggestions = arr || [];
    this.render();
    // Scroll to bottom to show suggestions
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  clearSuggestions() {
    this.suggestions = [];
    this.render();
  }
}

customElements.define('hornero-chat', HorneroChat);
