// ===== <hornero-chat> — Motor de chat reutilizable =====
// Typing dots, bubbles (user + hornero), input bar, progress
// Native Web Component — zero dependencies
// Usado por: IS, Derecho, Argumento, Comunicador, CE, SMVM

import { HoComponent, html, css } from './ho-component.js';

class HorneroChat extends HoComponent {
  static get properties() {
    return {
      title: String,
      disclaimer: String,
      messages: Object,   // Array of { role, sections, tags, time }
      inputPlaceholder: String,
      typing: Boolean,
      progress: Number,   // 0-100
    };
  }

  constructor() {
    super();
    this.title = 'Chat';
    this.disclaimer = '⚠️ La IA propone — vos decidís, editás, aprobás';
    this.messages = [];
    this.inputPlaceholder = 'Escribí tu consulta...';
    this.typing = false;
    this.progress = 0;
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); }

      /* Top bar */
      .chat-top { background: var(--ho-dark-surface, #45433E); color: var(--ho-text-off, #F2F1EC);
        padding: 9px 16px 13px; display: flex; align-items: center; gap: 11px; flex: none; }
      .chat-top button { width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-dark-mid, #5A574F); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex: none; }
      .chat-top .title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: 1.02rem; flex: 1; }
      .chat-top .avatar { width: 26px; height: 26px; border-radius: 50%;
        background: var(--ho-green-light, #94A867);
        display: flex; align-items: center; justify-content: center; flex: none; }

      /* Disclaimer */
      .chat-disclaimer { background: var(--ho-green-pale, #E8EDD7); border-radius: 8px;
        padding: 7px 11px; font-size: .72rem; color: var(--ho-green-dark, #586B33);
        margin: 12px 16px; line-height: 1.4; flex: none; }

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

      .msg-row { display: flex; gap: 8px; margin-bottom: 10px; animation: msgin .35s ease; }
      .msg-row.user { justify-content: flex-end; }
      .msg-row.hornero { justify-content: flex-start; }
      .msg-avatar { width: 28px; height: 28px; border-radius: 50%;
        background: var(--ho-green-light, #94A867);
        display: flex; align-items: center; justify-content: center;
        flex: none; align-self: flex-end; }
      .msg-av-inner { width: 12px; height: 12px; border-radius: 50% 50% 50% 2px;
        background: var(--ho-dark-surface, #45433E); }
      .msg-bubble { max-width: 80%; border-radius: 16px; padding: 12px 14px;
        line-height: 1.5; position: relative; }
      .msg-row.user .msg-bubble { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); border-bottom-right-radius: 4px; }
      .msg-row.hornero .msg-bubble { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border); border-bottom-left-radius: 4px; }
      .msg-time { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        opacity: .7; margin-top: 5px; }
      .msg-row.user .msg-time { color: #E1E7D0; text-align: right; }
      .msg-row.hornero .msg-time { color: var(--ho-text-light, #9C988D); }

      /* Sections within a hornero message */
      .msg-section { margin-bottom: 10px; }
      .msg-section:last-child { margin-bottom: 0; }
      .msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #2B2A26); margin-bottom: 5px; }
      .msg-section-body { font-size: .82rem; color: #4A4842; line-height: 1.5; }
      .msg-section-body p { margin-bottom: 4px; }

      /* Quote */
      .msg-quote { background: var(--ho-green-pale, #E8EDD7);
        border-left: 3px solid var(--ho-green, #6E8345);
        border-radius: 0 8px 8px 0; padding: 8px 12px;
        font-size: .82rem; color: #3D3B35; line-height: 1.5;
        margin: 8px 0; font-style: italic; }
      .msg-quote-author { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .74rem; color: var(--ho-green-dark, #586B33);
        margin-bottom: 4px; font-style: normal; }
      .msg-quote-source { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-mid, #6E6A60); margin-top: 4px; font-style: normal; }

      /* Tags */
      .msg-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
      .msg-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 3px 8px; border-radius: 6px; font-weight: 600; }

      /* Typing dots */
      .typing-row { display: flex; gap: 8px; margin-bottom: 10px;
        justify-content: flex-start; animation: msgin .2s ease; }
      .typing-bubble { background: var(--ho-card, #FBFAF6);
        border: 1px solid var(--ho-border); border-radius: 16px;
        border-bottom-left-radius: 4px; padding: 10px 16px;
        display: flex; gap: 5px; align-items: center; }
      .typing-dot { width: 8px; height: 8px; border-radius: 50%;
        background: var(--ho-green-light, #94A867); animation: dotbounce 1.4s ease infinite; }
      .typing-dot:nth-child(2) { animation-delay: .2s; }
      .typing-dot:nth-child(3) { animation-delay: .4s; }

      /* Input bar */
      .chat-input { background: var(--ho-dark-surface, #45433E);
        padding: 10px 12px 14px; display: flex; align-items: center;
        gap: 8px; flex: none; }
      .chat-input-field { flex: 1; background: var(--ho-dark-mid, #5A574F);
        border: 1px solid var(--ho-input-border, rgba(242,241,236,.15));
        border-radius: 999px; padding: 9px 14px; font-size: .82rem;
        color: var(--ho-text-off, #F2F1EC); font-family: 'Public Sans', sans-serif; }
      .chat-input-field::placeholder { color: #9C988C; }
      .chat-send-btn { width: 38px; height: 38px; border-radius: 50%;
        background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        font-size: .95rem; cursor: pointer; flex: none; }
      .chat-mic-btn { width: 38px; height: 38px; border-radius: 50%;
        background: var(--ho-dark-mid, #5A574F); color: var(--ho-text-off, #F2F1EC);
        border: none; display: flex; align-items: center; justify-content: center;
        font-size: .95rem; cursor: pointer; flex: none; }
    `;
  }

  _render() {
    const progressFill = this.progress > 0 ?
      `<div class="chat-progress-wrap">
        <div class="chat-progress-bar"><div class="chat-progress-fill" style="width:${this.progress}%"></div></div>
        <div class="chat-progress-label">${this.progress}%</div>
      </div>` : '';

    const disclaimerHtml = this.disclaimer ?
      `<div class="chat-disclaimer">${this.disclaimer}</div>` : '';

    const typingHtml = this.typing ?
      `<div class="typing-row">
        <div class="msg-avatar"><div class="msg-av-inner"></div></div>
        <div class="typing-bubble">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>` : '';

    const messagesHtml = (this.messages || []).map(m => this._renderMessage(m)).join('');

    return html`
      <div class="chat-top">
        <button title="Volver">←</button>
        <span class="title">${this.title}</span>
        <div class="avatar"><div class="msg-av-inner"></div></div>
      </div>

      ${disclaimerHtml}
      ${progressFill}

      <div class="chat-scroll">
        ${messagesHtml}
        ${typingHtml}
      </div>

      <div class="chat-input">
        <input class="chat-input-field" type="text" placeholder="${this.inputPlaceholder}">
        <button class="chat-mic-btn" title="Mic">🎤</button>
        <button class="chat-send-btn" title="Enviar">➤</button>
      </div>
    `;
  }

  _renderMessage(m) {
    const role = m.role || 'hornero';
    const avatarHtml = role === 'hornero' ?
      '<div class="msg-avatar"><div class="msg-av-inner"></div></div>' : '';
    const timeHtml = m.time ? `<div class="msg-time">${m.time}</div>` : '';

    let bubbleHtml = '';
    if (m.text) {
      // Simple text message
      bubbleHtml = `<div class="msg-bubble">${m.text}${timeHtml}</div>`;
    } else if (m.sections) {
      // Structured message with sections, quotes, tags
      const sectionsHtml = m.sections.map(s => {
        let content = '';
        if (s.title) content += `<div class="msg-section-title">${s.title}</div>`;
        if (s.body) content += `<div class="msg-section-body"><p>${s.body}</p></div>`;
        if (s.quote) {
          content += `<div class="msg-quote">`;
          if (s.quoteAuthor) content += `<div class="msg-quote-author">${s.quoteAuthor}</div>`;
          content += `<p>${s.quote}</p>`;
          if (s.quoteSource) content += `<div class="msg-quote-source">${s.quoteSource}</div>`;
          content += '</div>';
        }
        return `<div class="msg-section">${content}</div>`;
      }).join('');
      const tagsHtml = m.tags ?
        `<div class="msg-tags">${m.tags.map(t => `<span class="msg-tag">${t}</span>`).join('')}</div>` : '';
      bubbleHtml = `<div class="msg-bubble">${sectionsHtml}${tagsHtml}${timeHtml}</div>`;
    }

    return `<div class="msg-row ${role}">${avatarHtml}${bubbleHtml}</div>`;
  }

  _afterRender() {
    // Back button
    const backBtn = this.shadowRoot.querySelector('.chat-top button');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.emit('chat-back');
      });
    }

    // Send button
    const sendBtn = this.shadowRoot.querySelector('.chat-send-btn');
    const inputField = this.shadowRoot.querySelector('.chat-input-field');
    if (sendBtn && inputField) {
      sendBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (text) {
          this.emit('chat-send', { text });
          inputField.value = '';
        }
      });
      // Enter key sends
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = inputField.value.trim();
          if (text) {
            this.emit('chat-send', { text });
            inputField.value = '';
          }
        }
      });
    }
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
}

customElements.define('hornero-chat', HorneroChat);
