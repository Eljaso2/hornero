// ===== <hornero-chat> — Motor de chat reutilizable =====
// User: bubble verde. App: sin bubble, texto plano + acciones (copiar, reenviar, like/dislike)
// Input bar: fondo claro, attach image/video, export, mic funcional (Web Speech API)
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
      section: String,    // 'consulta', 'contenido', 'debate', 'reporte' — for history tagging
      sessionId: String,  // Current chat session ID
      historyTitle: String, // Custom title for history drawer — default "Historial"
      informeBadge: Boolean, // True = outline grueso + fondo pálido (informe nuevo)
      informesTitle: String, // Custom title for informes drawer — default "Informes"
      persona: String,      // Active persona: companero|abogado|periodista|relator|ia-sindical
      personaPills: Boolean, // Show persona switcher pills (mesa de trabajo UI)
      username: String,      // Login username for per-user data isolation
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
    this.historyTitle = 'Historial';
    this.informeBadge = false;
    this.informesTitle = 'Informes';
    this.persona = 'ia-sindical';
    this.personaPills = false;
    this.username = '';
    this._isRecording = false;  // audio recording state
    this._mediaRecorder = null; // MediaRecorder instance
    this._mediaStream = null;   // MediaStream from getUserMedia
    this._audioChunks = [];     // recorded audio data chunks
    this._audioMimeType = '';   // detected MIME type for MediaRecorder
    this._recordingTimer = null; // setInterval for recording duration display
    this._recordingSeconds = 0;  // seconds elapsed while recording
    this._audioProcessing = false; // "Transcribiendo..." state
    this._detectAudioMimeType(); // detect browser-supported audio format
    this._showHistory = false; // history drawer state
    this._historySessions = []; // cached session list
    this._showInformes = false; // informes drawer state
    this._informesList = [];    // cached informes list
    this._expandedReports = {}; // message index → boolean (expanded/collapsed)
  }

  _detectAudioMimeType() {
    // Detect best MIME type supported by browser's MediaRecorder
    if (typeof MediaRecorder === 'undefined') {
      this._audioMimeType = '';
      return;
    }
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        this._audioMimeType = mime;
        return;
      }
    }
    // Fallback: let browser choose default
    this._audioMimeType = '';
  }

  _audioFileExtension() {
    // Determine file extension from detected MIME type
    if (!this._audioMimeType) return 'webm';
    if (this._audioMimeType.includes('webm')) return 'webm';
    if (this._audioMimeType.includes('ogg')) return 'ogg';
    if (this._audioMimeType.includes('mp4')) return 'mp4';
    return 'webm';
  }

  async _startRecording() {
    // Request mic permission + start MediaRecorder
    if (this._isRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // No getUserMedia support — fallback: focus input field
      const inputField = this.shadowRoot.querySelector('.chat-input-field');
      if (inputField) inputField.focus();
      return;
    }

    try {
      this._mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn('Mic permission denied:', err);
      // Show brief error state then revert
      this._isRecording = false;
      this.render();
      return;
    }

    const options = this._audioMimeType ? { mimeType: this._audioMimeType } : {};
    this._mediaRecorder = new MediaRecorder(this._mediaStream, options);
    this._audioChunks = [];
    this._recordingSeconds = 0;

    this._mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this._audioChunks.push(event.data);
      }
    };

    this._mediaRecorder.onstop = () => {
      // Stop mic stream tracks
      if (this._mediaStream) {
        this._mediaStream.getTracks().forEach(t => t.stop());
        this._mediaStream = null;
      }
      // Build audio blob and emit chat-audio event
      const mimeType = this._audioMimeType || 'audio/webm';
      const audioBlob = new Blob(this._audioChunks, { type: mimeType });
      if (audioBlob.size > 0) {
        this.emit('chat-audio', {
          audioBlob,
          duration: this._recordingSeconds,
          mimeType,
          fileName: `recording.${this._audioFileExtension()}`,
        });
      }
      this._audioChunks = [];
      this._recordingSeconds = 0;
      // _isRecording and _audioProcessing already set in _stopRecording()
      // Just render to update micBtn state
      this.render();
    };

    this._mediaRecorder.onerror = () => {
      this._isRecording = false;
      this._recordingSeconds = 0;
      if (this._mediaStream) {
        this._mediaStream.getTracks().forEach(t => t.stop());
        this._mediaStream = null;
      }
      this.render(); // Re-render micBtn back to idle
    };

    this._mediaRecorder.start(1000); // collect data every 1 second
    this._isRecording = true;
    this.render(); // Re-render micBtn with recording state + timer span

    // Timer: show elapsed seconds + auto-stop at 60s
    this._recordingTimer = setInterval(() => {
      this._recordingSeconds++;
      this._updateRecordingTimerDisplay();
      if (this._recordingSeconds >= 60) {
        this._stopRecording();
      }
    }, 1000);
  }

  _stopRecording() {
    // Stop recording → triggers onstop → emits chat-audio
    if (!this._isRecording || !this._mediaRecorder) return;
    // Immediately mark as not-recording + processing to prevent double-click issues
    this._isRecording = false;
    this._audioProcessing = true;
    clearInterval(this._recordingTimer);
    this._recordingTimer = null;
    this.render(); // Re-render micBtn to processing state immediately
    if (this._mediaRecorder.state === 'recording') {
      this._mediaRecorder.stop();
    }
  }

  _cancelRecording() {
    // Cancel recording without emitting audio event
    if (!this._isRecording || !this._mediaRecorder) return;
    clearInterval(this._recordingTimer);
    this._recordingTimer = null;

    // Override onstop to NOT emit
    this._mediaRecorder.onstop = () => {
      if (this._mediaStream) {
        this._mediaStream.getTracks().forEach(t => t.stop());
        this._mediaStream = null;
      }
      this._audioChunks = [];
      this._isRecording = false;
      this._recordingSeconds = 0;
      this.render(); // Re-render micBtn back to idle
    };

    if (this._mediaRecorder.state === 'recording') {
      this._mediaRecorder.stop();
    }
  }

  _updateMicVisual(state) {
    const micBtn = this.shadowRoot.querySelector('.chat-mic-btn');
    const timerSpan = this.shadowRoot.querySelector('.recording-timer');
    if (!micBtn) return;

    // Remove all state classes first
    micBtn.classList.remove('listening', 'recording', 'processing', 'mic-error');

    switch (state) {
      case 'recording':
        micBtn.classList.add('recording');
        micBtn.title = 'Grabando... click para enviar';
        break;
      case 'processing':
        micBtn.classList.add('processing');
        micBtn.title = 'Transcribiendo...';
        break;
      case 'error':
        micBtn.classList.add('mic-error');
        micBtn.title = 'Mic no disponible';
        // Auto-revert after 3 seconds
        setTimeout(() => {
          micBtn.classList.remove('mic-error');
          micBtn.title = 'Mic';
        }, 3000);
        break;
      case 'idle':
      default:
        micBtn.title = 'Mic';
        break;
    }
  }

  _updateRecordingTimerDisplay() {
    const timerSpan = this.shadowRoot.querySelector('.recording-timer');
    if (timerSpan) {
      const mins = Math.floor(this._recordingSeconds / 60);
      const secs = this._recordingSeconds % 60;
      timerSpan.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Public method: parent components call this when audio processing completes
  // (transcription done, LLM response received) — resets mic to idle state
  resetAudioState() {
    this._audioProcessing = false;
    this._isRecording = false;
    this.render(); // Re-render micBtn back to idle
  }

  _styles() {
    return css`
      :host { display: flex; flex-direction: column; height: 100%;
        background: var(--ho-bg, #F4F3EE); position: relative; }

      /* History button — top-right corner of chat */
      .chat-history-btn { position: absolute; top: 12px; right: 12px; z-index: 20;
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-card, #FBFAF6); border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-history-btn:hover { background: var(--ho-green-pale, #E8EDD7);
        border-color: var(--ho-green-light, #94A867); transform: scale(1.08); }
      .chat-history-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-history-btn:hover svg { stroke: var(--ho-green-dark, #586B33); }

      /* Export button — input toolbar */
      .chat-export-btn { background: var(--ho-green-pale, #E8EDD7); }
      .chat-export-btn svg { stroke: var(--ho-green-dark, #586B33); fill: none; }

      /* Informes button — top-right corner, left of history btn */
      .chat-informes-btn { position: absolute; top: 12px; right: 48px; z-index: 20;
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-card, #FBFAF6); border: 1px solid var(--ho-border, rgba(43,42,38,.12));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-informes-btn:hover { background: var(--ho-green-pale, #E8EDD7);
        border-color: var(--ho-green-light, #94A867); transform: scale(1.08); }
      .chat-informes-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-informes-btn:hover svg { stroke: var(--ho-green-dark, #586B33); }
      /* Badge state: outline grueso + fondo pálido verde */
      .chat-informes-btn.badge { background: var(--ho-green-pale, #E8EDD7);
        border-color: var(--ho-green, #6E8345); border-width: 1.5px;
        transform: scale(1.06); }
      .chat-informes-btn.badge svg { stroke: var(--ho-green-dark, #586B33);
        stroke-width: 2.6; }

      /* Informes drawer overlay */
      .informes-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 60; display: flex;
        justify-content: flex-end; transition: opacity .3s; }

      /* Informes drawer panel */
      .informes-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #F4F3EE); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease;
        touch-action: pan-y; }
      .informes-drawer.swiping { animation: none; transition: none; }
      .informes-drawer.swipe-closing { animation: none; transition: transform .25s ease-out; }

      .informes-header { padding: 16px; display: flex; align-items: center;
        justify-content: space-between; flex: none;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.12)); }
      .informes-header-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #2B2A26); }

      .informes-list { flex: 1; overflow-y: auto; padding: 8px 0; }

      .informes-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(43,42,38,.08));
        display: flex; flex-direction: column; gap: 4px;
        transition: background .2s; }
      .informes-item:hover { background: var(--ho-green-pale, #E8EDD7); }

      .informes-item-title { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #2B2A26); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .informes-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); display: flex; gap: 8px; }
      .informes-item-estado { background: var(--ho-green-pale, #E8EDD7);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #586B33); }
      .informes-item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .informes-item-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 2px 6px; border-radius: 6px; font-weight: 600; }

      .informes-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); }

      .informes-close-btn { background: none; border: none; cursor: pointer;
        width: 28px; height: 28px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center;
        transition: background .2s; }
      .informes-close-btn:hover { background: var(--ho-green-pale, #E8EDD7); }
      .informes-close-btn svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }


      /* History drawer overlay */
      .history-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 50; display: flex;
        justify-content: flex-end; transition: opacity .3s; }
      .history-overlay.hidden { opacity: 0; pointer-events: none; }

      /* History drawer panel */
      .history-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #F4F3EE); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease;
        touch-action: pan-y; /* allow vertical scroll inside, but capture horizontal swipe */ }
      .history-drawer.swiping { animation: none; transition: none; }
      .history-drawer.swipe-closing { animation: none; transition: transform .25s ease-out; }
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
      .history-item-preview { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #2B2A26); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .history-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); display: flex; gap: 8px; }
      .history-item-count { background: var(--ho-green-pale, #E8EDD7);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #586B33); }
      .history-item-user { font-family: 'JetBrains Mono', monospace; font-size: .54rem;
        color: var(--ho-text-light, #9C988D); letter-spacing: .06em;
        background: var(--ho-mid-gray, #ECEAE3); padding: 1px 5px; border-radius: 3px; }

      .history-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); }

      .history-item-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px; }

      .history-item-delete { background: none; border: none; cursor: pointer;
        padding: 4px; display: flex; }
      .history-item-delete svg { width: 14px; height: 14px;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .history-item-delete:hover svg { stroke: var(--ho-gold, #B0863F); }

      /* Export button inside history drawer items */
      .history-item-export { background: none; border: none; cursor: pointer;
        padding: 4px; display: flex; }
      .history-item-export svg { width: 14px; height: 14px;
        stroke: var(--ho-green, #6E8345); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .history-item-export:hover svg { stroke: var(--ho-green-dark, #586B33); transform: scale(1.1); }

      /* Export button inside informes drawer items */
      .informes-item-export { background: none; border: none; cursor: pointer;
        padding: 4px; align-self: flex-end; display: flex; margin-top: 4px; }
      .informes-item-export svg { width: 14px; height: 14px;
        stroke: var(--ho-green, #6E8345); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .informes-item-export:hover svg { stroke: var(--ho-green-dark, #586B33); transform: scale(1.1); }

      /* Section badge colors */
      .section-consulta { color: #6E8345; }
      .section-contenido { color: #B0863F; }
      .section-debate { color: #5A7EA8; }
      .section-reporte { color: #586B33; }

      /* Reporte card — formal document frame */
      .reporte-card { background: var(--ho-card, #FBFAF6);
        border: 2px solid var(--ho-green, #6E8345);
        border-radius: 13px; padding: 0; margin-top: 10px;
        animation: msgin .35s ease; overflow: hidden; }
      .reporte-card-header { display: flex; align-items: center; gap: 8px;
        cursor: pointer; padding: 10px 14px;
        background: var(--ho-green, #6E8345); color: var(--ho-text-off, #F2F1EC); }
      .reporte-card-icon { font-size: 1.1rem; flex: none; }
      .reporte-card-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .88rem; color: var(--ho-text-off, #F2F1EC); flex: 1;
        letter-spacing: .04em; text-transform: uppercase; }
      .reporte-card-toggle { font-family: 'JetBrains Mono', monospace;
        font-size: .66rem; color: var(--ho-text-off, #F2F1EC);
        background: rgba(255,255,255,.15); border-radius: 6px; border: none;
        cursor: pointer; flex: none; padding: 3px 8px; }
      .reporte-card-body { max-height: 60px; overflow: hidden;
        position: relative; transition: max-height .4s ease;
        padding: 14px; }
      .reporte-card-body.expanded { max-height: none; }
      .reporte-card-body .msg-fade { position: absolute; bottom: 0; left: 0;
        right: 0; height: 20px;
        background: linear-gradient(transparent, var(--ho-card, #FBFAF6)); }
      .reporte-card-body.expanded .msg-fade { display: none; }
      .reporte-card-section { margin-bottom: 10px; }
      .reporte-card-section:last-child { margin-bottom: 0; }
      .reporte-card-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #586B33); margin-bottom: 4px;
        text-transform: uppercase; letter-spacing: .06em; }
      .reporte-card-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.5; }
      .reporte-card-divider { height: 1px; background: var(--ho-green-pale, #E8EDD7);
        margin: 10px 0; }
      .reporte-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
        padding: 10px 14px; border-top: 1px solid var(--ho-green-pale, #E8EDD7);
        background: var(--ho-bg, #F4F3EE); }
      .reporte-card-tag { font-family: 'JetBrains Mono', monospace; font-size: .68rem;
        background: var(--ho-green-pale, #E8EDD7); color: var(--ho-green-dark, #586B33);
        padding: 4px 10px; border-radius: 8px; font-weight: 600; }
      .reporte-card-actions { display: flex; gap: 8px;
        padding: 12px 14px; background: var(--ho-bg, #F4F3EE);
        border-top: 1px solid var(--ho-green-pale, #E8EDD7); }
      .reporte-btn { border-radius: 12px; padding: 10px 18px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .86rem;
        cursor: pointer; display: flex; align-items: center; gap: 6px;
        transition: background .2s, border-color .2s; flex: 1; justify-content: center; }
      .reporte-btn-approve { background: var(--ho-green, #6E8345);
        color: var(--ho-text-off, #F2F1EC); border: none; }
      .reporte-btn-approve:hover { background: var(--ho-green-dark, #586B33); }
      .reporte-btn-correct { background: none;
        border: 1.5px solid var(--ho-gold, #B0863F);
        color: var(--ho-gold, #B0863F); }
      .reporte-btn-correct:hover { background: #F0E4CC; }
      .reporte-btn-export { background: none;
        border: 1.5px solid var(--ho-green-light, #94A867);
        color: var(--ho-green-dark, #586B33); }
      .reporte-btn-export:hover { background: var(--ho-green-pale, #E8EDD7); }
      .reporte-card.estado-aceptado { border-color: var(--ho-green-light, #94A867);
        opacity: .85; }
      .reporte-card.estado-aceptado .reporte-btn-approve,
      .reporte-card.estado-aceptado .reporte-btn-correct { display: none; }

      /* Progress bar */
      .chat-progress-wrap { padding: 4px 16px 0; flex: none; }
      .chat-progress-bar { height: 4px; background: var(--ho-mid-gray, #ECEAE3); border-radius: 4px; }
      .chat-progress-fill { height: 100%; background: var(--ho-green, #6E8345);
        border-radius: 4px; transition: width .5s; }
      .chat-progress-label { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 2px; text-align: center; }

      /* Messages scroll */
      .chat-scroll { flex: 1; overflow-y: auto; padding: 16px;
        padding-top: 76px; /* room for history btn + informes btn */
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
      .msg-avatar-emoji { font-size: .72rem; line-height: 1; }
      .msg-avatar-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; }

      /* === Typing avatar: persona-aware === */
      .typing-avatar-emoji { font-size: .72rem; line-height: 1; }

      /* === Persona pills — mesa de trabajo === */
      .chat-persona-pills { display: flex; gap: 8px; padding: 6px 10px;
        background: var(--ho-card, #FBFAF6); border-top: 1px solid var(--ho-border, rgba(43,42,38,.10));
        flex-wrap: wrap; justify-content: center; }
      .persona-pill { display: flex; align-items: center; gap: 5px;
        padding: 4px 10px 4px 4px; border-radius: 20px; cursor: pointer;
        border: 1.5px solid var(--ho-border, rgba(43,42,38,.15));
        background: transparent; transition: all .2s ease; font-family: 'Archivo', sans-serif; }
      .persona-pill:hover { transform: scale(1.05); }
      .persona-pill.active { font-weight: 700; }
      .persona-pill-icon { width: 22px; height: 22px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; overflow: hidden; flex: none; }
      .persona-pill-icon img { width: 14px; height: 14px; }
      .persona-pill-emoji { font-size: .68rem; line-height: 1; }
      .persona-pill-label { font-size: .72rem; }

      .msg-text { font-family: 'Public Sans', sans-serif; font-size: .90rem;
        color: var(--ho-text, #2B2A26); line-height: 1.55;
        margin-bottom: 8px; }
      .msg-text p { margin-bottom: 10px; }
      .msg-text p:last-child { margin-bottom: 0; }
      .msg-text strong { font-weight: 700; color: var(--ho-green-dark, #586B33); }

      /* Markdown-rendered elements — apply to ALL msg contexts */
      .msg-text em, .msg-section-body em, .reporte-card-section-body em
        { font-style: italic; color: var(--ho-text-mid, #6E6A60); }
      .msg-section-body strong, .reporte-card-section-body strong
        { font-weight: 700; color: var(--ho-green-dark, #586B33); }
      .msg-text .msg-md-heading { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--ho-green-dark, #586B33); margin: 14px 0 6px;
        border-bottom: 2px solid var(--ho-green-pale, #E8EDD7); padding-bottom: 4px; }
      .msg-section-body .msg-md-heading, .reporte-card-section-body .msg-md-heading
        { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--ho-green-dark, #586B33); margin: 14px 0 6px;
        border-bottom: 2px solid var(--ho-green-pale, #E8EDD7); padding-bottom: 4px; }
      .msg-text .msg-md-ul { margin: 6px 0 10px; padding-left: 18px;
        list-style: none; }
      .msg-text .msg-md-ul li, .msg-section-body .msg-md-ul li, .reporte-card-section-body .msg-md-ul li
        { position: relative; margin-bottom: 5px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5; }
      .msg-text .msg-md-ul li::before, .msg-section-body .msg-md-ul li::before, .reporte-card-section-body .msg-md-ul li::before
        { content: '•'; position: absolute;
        left: -14px; color: var(--ho-green, #6E8345); font-weight: 700; }
      .msg-text .msg-md-ol { margin: 6px 0 10px; padding-left: 22px;
        list-style: none; counter-reset: md-ol; }
      .msg-text .msg-md-ol li, .msg-section-body .msg-md-ol li, .reporte-card-section-body .msg-md-ol li
        { position: relative; margin-bottom: 5px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        counter-increment: md-ol; }
      .msg-text .msg-md-ol li::before, .msg-section-body .msg-md-ol li::before, .reporte-card-section-body .msg-md-ol li::before
        { content: counter(md-ol) '.';
        position: absolute; left: -20px;
        color: var(--ho-green, #6E8345); font-family: 'JetBrains Mono', monospace;
        font-size: .68rem; font-weight: 600; }
      .msg-section-body .msg-md-ul, .reporte-card-section-body .msg-md-ul
        { margin: 6px 0 10px; padding-left: 18px; list-style: none; }
      .msg-section-body .msg-md-ol, .reporte-card-section-body .msg-md-ol
        { margin: 6px 0 10px; padding-left: 22px; list-style: none; counter-reset: md-ol; }
      .msg-md-code { font-family: 'JetBrains Mono', monospace; font-size: .76rem;
        background: var(--ho-warm-gray, #E6E3DB); padding: 2px 6px;
        border-radius: 4px; color: var(--ho-text, #2B2A26); }

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

      .chat-mic-btn { background: var(--ho-green-pale, #E8EDD7);
        position: relative; overflow: visible; }
      .chat-mic-btn svg { stroke: var(--ho-green-dark, #586B33); fill: none; }

      /* Recording state: red-orange, pulsing, shows timer */
      .chat-mic-btn.recording { background: #E85D3A;
        animation: recordingPulse 1s ease infinite; }
      .chat-mic-btn.recording svg { stroke: #fff; }
      @keyframes recordingPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,93,58,.35) }
        50% { box-shadow: 0 0 0 10px rgba(232,93,58,.1) } }

      /* Processing state: muted green, disabled */
      .chat-mic-btn.processing { background: var(--ho-green, #6E8345);
        opacity: 0.6; pointer-events: none; }
      .chat-mic-btn.processing svg { stroke: var(--ho-text-off, #F2F1EC); }

      /* Error state: brief red flash */
      .chat-mic-btn.mic-error { background: #D32F2F; }
      .chat-mic-btn.mic-error svg { stroke: #fff; }

      /* Recording timer label */
      .recording-timer { font-size: .65rem; font-weight: 700;
        color: #fff; position: absolute; bottom: -14px; left: 50%;
        transform: translateX(-50%); white-space: nowrap;
        font-family: 'Public Sans', sans-serif; }


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

    const typingPersona = this._getPersonaConfig(this.persona || 'ia-sindical');
    const typingAvatarInner = typingPersona.img
      ? `<img src="${typingPersona.img}" alt="H">`
      : `<span class="typing-avatar-emoji">${typingPersona.emoji}</span>`;
    const typingHtml = this.typing ?
      `<div class="typing-row persona-${this.persona || 'ia-sindical'}">
        <div class="typing-avatar" style="background:${typingPersona.bg}">${typingAvatarInner}</div>
        <div class="typing-dots">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>` : '';

    const messagesHtml = (this.messages || []).map((m, i) => this._renderMessage(m, i)).join('');

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

    // Persona pills — mesa de trabajo (who's at the table)
    const personaOptions = ['ia-sindical', 'abogado', 'companero', 'periodista'];
    const personaPillsHtml = this.personaPills ?
      `<div class="chat-persona-pills">
        ${personaOptions.map(p => {
          const cfg = this._getPersonaConfig(p);
          const isActive = this.persona === p;
          const inner = cfg.img
            ? `<img src="${cfg.img}" alt="H">`
            : `<span class="persona-pill-emoji">${cfg.emoji}</span>`;
          return `<button class="persona-pill${isActive ? ' active' : ''}" data-persona="${p}" style="background:${isActive ? cfg.bg : 'transparent'}; border-color:${isActive ? cfg.color : 'var(--ho-border, rgba(43,42,38,.15))'}">
            <span class="persona-pill-icon" style="background:${cfg.bg}">${inner}</span>
            <span class="persona-pill-label" style="color:${isActive ? cfg.color : 'var(--ho-text-mid, #6E6A60)'}">${cfg.name}</span>
          </button>`;
        }).join('')}
      </div>` : '';

    // SVG icons
    const attachSvg = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    const micSvg = '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
    const stopSvg = '<rect x="6" y="6" width="12" height="12" rx="1"/>'; // stop square icon for recording
    const sendSvg = '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9" fill="currentColor" stroke="none"/>';

    // Mic button: show mic or stop icon depending on recording state
    const micIcon = this._isRecording ? stopSvg : micSvg;
    const micTitle = this._isRecording ? 'Enviar audio' : (this._audioProcessing ? 'Transcribiendo...' : 'Mic');

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
    const sectionLabels = { consulta: 'Consulta', contenido: 'Contenido', debate: 'Debate', reporte: 'Reporte' };
    const historyDrawerHtml = this._showHistory ?
      `<div class="history-overlay">
        <div class="history-drawer">
          <div class="history-header">
            <div class="history-header-title">${this.historyTitle || 'Historial'}</div>
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
                  <div class="history-item-preview">${s.preview || 'Nuevo chat'}</div>
                  <div class="history-item-meta">
                    <span>${dateStr} ${timeStr}</span>
                    ${s.username ? '<span class="history-item-user">@' + s.username + '</span>' : ''}
                    <span class="history-item-count">${s.messageCount} msgs</span>
                  </div>
                  <div class="history-item-actions">
                    <button class="history-item-export" data-export-session="${s.sessionId}" title="Exportar chat">
                      <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    <button class="history-item-delete" data-delete-session="${s.sessionId}" title="Borrar chat">
                      <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>` : '';

    // Informes drawer
    const informesDrawerHtml = this._showInformes ?
      `<div class="informes-overlay">
        <div class="informes-drawer">
          <div class="informes-header">
            <div class="informes-header-title">${this.informesTitle || 'Informes'}</div>
            <button class="informes-close-btn">
              <svg viewBox="0 0 24 24">${xSvg}</svg>
            </button>
          </div>
          <div class="informes-list">
            ${this._informesList.length === 0 ?
              '<div class="informes-empty">No hay informes guardados</div>' :
              this._informesList.map(inf => {
                const titleText = inf.sections && inf.sections.length > 0 ?
                  (inf.sections[0].title || inf.sections[0].body || '').substring(0, 80) :
                  (inf.contenido || '').substring(0, 80);
                const dateStr = inf.fecha || '';
                const tags = inf.etiquetas && inf.etiquetas.temas ? inf.etiquetas.temas : [];
                const tagsHtml = tags.length > 0 ?
                  `<div class="informes-item-tags">${tags.map(t => `<span class="informes-item-tag">${t}</span>`).join('')}</div>` : '';
                return `<div class="informes-item" data-informe-id="${inf.id}">
                  <div class="informes-item-title">${titleText || 'Informe gremial'}</div>
                  <div class="informes-item-meta">
                    <span>${dateStr}</span>
                    ${inf.username ? '<span class="history-item-user">@' + inf.username + '</span>' : ''}
                    <span class="informes-item-estado">${inf.estado || 'aceptado'}</span>
                  </div>
                  ${tagsHtml}
                  <button class="informes-item-export" data-export-informe="${inf.id}" title="Exportar informe">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>` : '';

    // Informes SVG icon (document/clipboard)
    const informeSvg = '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>';

    // Export SVG icon (download arrow)
    const exportSvg = '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';

    return html`
      <button class="chat-informes-btn${this.informeBadge ? ' badge' : ''}" id="chatInformesBtn" title="Informes guardados">
        <svg viewBox="0 0 24 24">${informeSvg}</svg>
      </button>

      <button class="chat-history-btn" id="chatHistoryBtn" title="Historial de chats">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>

      ${progressFill}

      <div class="chat-scroll">
        ${messagesHtml}
        ${typingHtml}
      </div>

      ${suggestionsHtml}

      ${personaPillsHtml}

      <div class="chat-input">
        ${attachPreview}
        <input class="chat-input-field" type="text" placeholder="${this.inputPlaceholder}" autocomplete="nope" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore>
        <input class="chat-file-input" type="file" accept="image/*,video/*">
        <div class="chat-toolbar">
          <button class="chat-toolbar-btn chat-attach-btn" title="Adjuntar imagen o video">
            <svg viewBox="0 0 24 24">${attachSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-export-btn" id="chatExportBtn" title="Exportar chat">
            <svg viewBox="0 0 24 24">${exportSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-mic-btn${this._isRecording ? ' recording' : ''}${this._audioProcessing ? ' processing' : ''}" title="${micTitle}">
            <svg viewBox="0 0 24 24">${micIcon}</svg>
            ${this._isRecording ? '<span class="recording-timer">0:00</span>' : ''}
          </button>
          <button class="chat-toolbar-btn chat-send-btn hidden" title="Enviar">
            <svg viewBox="0 0 24 24">${sendSvg}</svg>
          </button>
        </div>
      </div>

      ${historyDrawerHtml}

      ${informesDrawerHtml}
    `;
  }

  // ===== Markdown → HTML formatter =====
  // Converts AI markdown responses into styled Hornero HTML
  _formatMarkdown(text) {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listType = ''; // 'ul' or 'ol'
    let listItems = [];
    let inQuote = false;
    let quoteLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // --- Heading: ## or ### ---
      const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
      if (headingMatch) {
        if (inList) { html += this._closeList(listType, listItems); inList = false; }
        if (inQuote) { html += this._closeQuote(quoteLines); inQuote = false; }
        html += `<div class="msg-md-heading">${this._formatInline(headingMatch[1])}</div>`;
        continue;
      }

      // --- Horizontal rule: --- or *** ---
      if (trimmed.match(/^[-*_]{3,}$/)) {
        if (inList) { html += this._closeList(listType, listItems); inList = false; }
        if (inQuote) { html += this._closeQuote(quoteLines); inQuote = false; }
        html += '<div class="msg-divider"></div>';
        continue;
      }

      // --- Block quote: > text ---
      if (trimmed.startsWith('>')) {
        if (inList) { html += this._closeList(listType, listItems); inList = false; }
        const quoteText = trimmed.replace(/^>\s?/, '');
        if (!inQuote) { inQuote = true; quoteLines = []; }
        quoteLines.push(quoteText);
        continue;
      }
      // Close quote block if line is not a quote continuation
      if (inQuote && !trimmed.startsWith('>')) {
        html += this._closeQuote(quoteLines);
        inQuote = false;
      }

      // --- Unordered list: - item or * item ---
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) { html += this._closeList(listType, listItems); }
          inList = true; listType = 'ul'; listItems = [];
        }
        listItems.push(this._formatInline(ulMatch[1]));
        continue;
      }

      // --- Ordered list: 1. item ---
      const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) { html += this._closeList(listType, listItems); }
          inList = true; listType = 'ol'; listItems = [];
        }
        listItems.push(this._formatInline(olMatch[1]));
        continue;
      }

      // Close list if we hit a non-list line
      if (inList) { html += this._closeList(listType, listItems); inList = false; }

      // --- Empty line = paragraph break ---
      if (trimmed === '') {
        html += '<br>';
        continue;
      }

      // --- Regular paragraph ---
      html += `<p>${this._formatInline(trimmed)}</p>`;
    }

    // Close any remaining blocks
    if (inList) { html += this._closeList(listType, listItems); }
    if (inQuote) { html += this._closeQuote(quoteLines); }

    // Clean up excess <br> and leading <br>
    html = html.replace(/(<br>\s*){2,}/g, '<br>');
    html = html.replace(/^<br>/, '');
    return html;
  }

  // Inline formatting: **bold**, *italic*, `code`
  _formatInline(text) {
    // Bold: **text** → <strong>text</strong>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* → <em>text</em> (single asterisk, not inside strong)
    text = text.replace(/(?<!<strong>.*?)\*(.+?)\*(?!.*<\/strong>)/g, '<em>$1</em>');
    // Fallback italic for cases where the above regex is too strict
    text = text.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    // Inline code: `text` → <code>text</code>
    text = text.replace(/`(.+?)`/g, '<code class="msg-md-code">$1</code>');
    return text;
  }

  _closeList(type, items) {
    const tag = type === 'ol' ? 'ol' : 'ul';
    return `<${tag} class="msg-md-${tag}">${items.map(item => `<li>${item}</li>`).join('')}</${tag}>`;
  }

  _closeQuote(lines) {
    const content = lines.map(l => this._formatInline(l)).join('<br>');
    return `<div class="msg-quote"><span class="msg-quote-icon">❝</span><p>${content}</p></div>`;
  }

  // ===== Persona config: avatar icon, name, colors per persona =====
  _getPersonaConfig(persona) {
    const map = {
      'ia-sindical':  { emoji: '🪶', name: 'IA Sindical', bg: 'var(--ho-green-pale, #E8EDD7)', color: 'var(--ho-green-dark, #586B33)', img: 'assets/hornero-logo.png' },
      'abogado':      { emoji: '⚖️', name: 'Abogado',     bg: '#D4E4F7', color: '#2B5278', img: null },
      'companero':    { emoji: '✊🏾', name: 'Compañero',   bg: '#C89660', color: '#7A3B1E', img: null },
      'periodista':   { emoji: '🎙️', name: 'Periodista',  bg: '#E8E0D7', color: '#5A4A3A', img: null },
      'relator':      { emoji: '📝', name: 'Relator',     bg: '#E0E8D7', color: '#4A6A2C', img: null },
    };
    return map[persona] || map['ia-sindical'];
  }

  _renderMessage(m, msgIndex) {
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

    // Avatar + name row — persona-aware
    const personaCfg = this._getPersonaConfig(m.persona || 'ia-sindical');
    const avatarInner = personaCfg.img
      ? `<img src="${personaCfg.img}" alt="H">`
      : `<span class="msg-avatar-emoji">${personaCfg.emoji}</span>`;
    const avatarRow = `<div class="msg-avatar-row persona-${m.persona || 'ia-sindical'}">
      <div class="msg-avatar" style="background:${personaCfg.bg}">${avatarInner}</div>
      <div class="msg-avatar-name" style="color:${personaCfg.color}">${personaCfg.name}</div>
    </div>`;

    // === REPORTE DESPLEGABLE: if tags include 'reporte-generado' ===
    const tags = m.tags || [];
    const isReporteGenerado = tags.includes('reporte-generado');
    const isReporteAprobado = tags.includes('reporte-aprobado') || tags.includes('informe-guardado');

    if (isReporteGenerado && m.sections && m.sections.length > 0) {
      // Render as expandable report card
      const estadoClass = isReporteAprobado ? 'estado-aceptado' : '';
      const expandedKey = 'report-' + msgIndex;
      const isExpanded = this._expandedReports[expandedKey] || false;

      const titleSection = m.sections[0];
      const cardTitle = titleSection.title || 'Informe Gremial';
      const summary = titleSection.body ? titleSection.body.substring(0, 120) : '';

      const sectionsHtml = m.sections.map((s, i) => {
        let content = '';
        if (i > 0 && s.title) content += `<div class="reporte-card-section-title">${s.title}</div>`;
        else if (i > 0) content += `<div class="reporte-card-section-title">Detalle</div>`;
        if (s.body) content += `<div class="reporte-card-section-body">${this._formatMarkdown(s.body)}</div>`;
        const divider = (i < m.sections.length - 1) ? '<div class="reporte-card-divider"></div>' : '';
        return `<div class="reporte-card-section">${content}</div>${divider}`;
      }).join('');

      // Tags inside card (excluding system tags)
      const visibleTags = tags.filter(t => t !== 'reporte-generado' && t !== 'reporte' && t !== 'reporte-aprobado');
      const tagsHtml = visibleTags.length > 0 ?
        `<div class="reporte-card-tags">${visibleTags.map(t => `<span class="reporte-card-tag">${t}</span>`).join('')}</div>` : '';

      // Action buttons — export always shown; aprobar/corregir only for non-accepted
      const exportBtn = `<button class="reporte-btn reporte-btn-export" data-reporte-action="exportar" data-msg-index="${msgIndex}">📥 Exportar</button>`;
      const actionsHtml = isReporteAprobado ?
        `<div class="reporte-card-actions">${exportBtn}</div>` :
        `<div class="reporte-card-actions">
          ${exportBtn}
          <button class="reporte-btn reporte-btn-approve" data-reporte-action="aprobar" data-msg-index="${msgIndex}">✅ Aprobar</button>
          <button class="reporte-btn reporte-btn-correct" data-reporte-action="corregir" data-msg-index="${msgIndex}">📝 Corregir</button>
        </div>`;

      // Text before the card (like "Leelo con cuidado...")
      const textBefore = m.text ? `<div class="msg-text">${this._formatMarkdown(m.text)}</div>` : '';

      return `<div class="msg-row hornero">
        ${avatarRow}
        <div class="msg-content">
          ${textBefore}
          <div class="reporte-card ${estadoClass}" data-report-key="${expandedKey}">
            <div class="reporte-card-header" data-toggle-report="${expandedKey}">
              <span class="reporte-card-icon">📄</span>
              <span class="reporte-card-title">${cardTitle}</span>
              <button class="reporte-card-toggle">${isExpanded ? '▼ Cerrar' : '▶ Expandir'}</button>
            </div>
            <div class="reporte-card-body${isExpanded ? ' expanded' : ''}">
              ${isExpanded ? '' : `<div class="msg-fade"></div>`}
              ${sectionsHtml}
            </div>
            ${tagsHtml}
            ${actionsHtml}
          </div>
          ${timeHtml}
        </div>
      </div>`;
    }

    let contentHtml = '';
    if (m.text) {
      // Render with markdown formatting
      contentHtml = `<div class="msg-text">${this._formatMarkdown(m.text)}</div>`;
    } else if (m.sections) {
      contentHtml = m.sections.map((s, i, arr) => {
        let content = '';
        if (s.title) content += `<div class="msg-section-title">${s.title}</div>`;
        if (s.body) content += `<div class="msg-section-body">${this._formatMarkdown(s.body)}</div>`;
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

    // === History button (top-right corner) → open drawer ===
    const historyBtn = this.shadowRoot.querySelector('#chatHistoryBtn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this._openHistoryDrawer();
      });
    }

    // === Informes button (top-right, left of history) → open drawer ===
    const informesBtn = this.shadowRoot.querySelector('#chatInformesBtn');
    if (informesBtn) {
      informesBtn.addEventListener('click', () => {
        this._openInformesDrawer();
        this.emit('informes-open', {});
      });
    }

    // === Export button (top-right corner) → export current chat ===
    const exportBtn = this.shadowRoot.querySelector('#chatExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.emit('chat-export', { messages: this.messages, title: this.title, section: this.section, sessionId: this.sessionId });
        // Also download directly from the chat component
        if (this.messages && this.messages.length > 0) {
          const filename = this.title || 'chat-hornero';
          this._downloadHtml(this.messages, this.title, filename);
        }
      });
    }

    // === Toggle mic/send visibility based on input content ===
    if (inputField && micBtn && sendBtn) {
      const updateToolbar = () => {
        const hasText = inputField.value.trim().length > 0 || this._pendingAttachment;
        // When recording or processing audio, keep mic visible (not hidden by send)
        const micBusy = this._isRecording || this._audioProcessing;
        if (hasText && !micBusy) {
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

      // === Mic button — Audio recording (MediaRecorder) ===
      if (micBtn) {
        micBtn.addEventListener('click', () => {
          if (this._audioProcessing) return; // Ignore clicks while processing
          if (this._isRecording) {
            // Currently recording → stop and send audio
            this._stopRecording();
          } else {
            // Not recording → start recording
            this._startRecording();
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

    // === Persona pills → switch persona ===
    this.shadowRoot.querySelectorAll('.persona-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.persona;
        if (p && p !== this.persona) {
          this.persona = p;
          this.emit('persona-switch', { persona: p });
          this.render();
        }
      });
    });

    // === History drawer: close + swipe ===
    const historyOverlay = this.shadowRoot.querySelector('.history-overlay');
    const historyDrawerEl = this.shadowRoot.querySelector('.history-drawer');
    const historyCloseBtn = this.shadowRoot.querySelector('.history-close-btn');
    if (historyOverlay) {
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
    if (historyDrawerEl) {
      this._setupDrawerSwipe(historyDrawerEl, () => this._closeHistoryDrawer());
    }

    // === History drawer: select session ===
    this.shadowRoot.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if delete or export button was clicked
        if (e.target.closest('.history-item-delete') || e.target.closest('.history-item-export')) return;
        const sid = item.dataset.sessionId;
        if (sid) {
          // Emit event FIRST — parent's re-render will close drawer naturally
          this.emit('chat-session-select', { sessionId: sid, section: this.section });
        }
      });
    });

    // === History drawer: export session ===
    this.shadowRoot.querySelectorAll('.history-item-export').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.exportSession;
        if (sid && typeof obtenerChatSessionMessages === 'function') {
          obtenerChatSessionMessages(sid).then(msgs => {
            if (msgs && msgs.length > 0) {
              const preview = (msgs[0].text || '').substring(0, 30).replace(/[?!.]+$/, '');
              this._downloadHtml(msgs, preview || 'chat-hornero', preview || 'chat-hornero');
            }
          }).catch(err => console.warn('Chat: export session failed', err));
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
            // Notify parent that a session was deleted
            this.emit('chat-session-delete', { sessionId: sid, section: this.section });
            this._openHistoryDrawer(); // Refresh drawer
            // After drawer refresh, notify parent to re-sync messages
            this.emit('chat-state-changed', {});
          }).catch((err) => {
            console.warn('Chat: delete session failed', err);
          });
        }
      });
    });

    // === Informes drawer: close + swipe ===
    const informesOverlay = this.shadowRoot.querySelector('.informes-overlay');
    const informesDrawerEl = this.shadowRoot.querySelector('.informes-drawer');
    if (informesOverlay) {
      informesOverlay.addEventListener('click', (e) => {
        if (e.target === informesOverlay) {
          this._closeInformesDrawer();
        }
      });
    }
    const informesCloseBtn = this.shadowRoot.querySelector('.informes-close-btn');
    if (informesCloseBtn) {
      informesCloseBtn.addEventListener('click', () => {
        this._closeInformesDrawer();
      });
    }
    if (informesDrawerEl) {
      this._setupDrawerSwipe(informesDrawerEl, () => this._closeInformesDrawer());
    }

    // === Informes drawer: select informe ===
    this.shadowRoot.querySelectorAll('.informes-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if export button was clicked
        if (e.target.closest('.informes-item-export')) return;
        const infId = item.dataset.informeId;
        if (infId) {
          this.emit('informes-select', { informeId: infId });
          this._closeInformesDrawer();
        }
      });
    });

    // === Informes drawer: export informe ===
    this.shadowRoot.querySelectorAll('.informes-item-export').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const infId = btn.dataset.exportInforme;
        if (infId && typeof obtenerInforme === 'function') {
          obtenerInforme(infId).then(inf => {
            if (inf) {
              // Convert informe to messages format for export
              const msgs = [{
                role: 'hornero',
                text: inf.contenido || '',
                sections: inf.sections || [],
                tags: (inf.etiquetas && inf.etiquetas.temas) ? inf.etiquetas.temas : [],
                time: '',
              }];
              const title = inf.sections && inf.sections.length > 0
                ? inf.sections[0].title || 'Informe Gremial'
                : 'Informe Gremial';
              this._downloadHtml(msgs, title, `informe-${inf.fecha || 'gremial'}`);
            }
          }).catch(err => console.warn('Chat: export informe failed', err));
        } else {
          // Fallback: search in cached informes list
          const inf = this._informesList.find(i => i.id === infId);
          if (inf) {
            const msgs = [{
              role: 'hornero',
              text: inf.contenido || '',
              sections: inf.sections || [],
              tags: (inf.etiquetas && inf.etiquetas.temas) ? inf.etiquetas.temas : [],
              time: '',
            }];
            const title = inf.sections && inf.sections.length > 0
              ? inf.sections[0].title || 'Informe Gremial'
              : 'Informe Gremial';
            this._downloadHtml(msgs, title, `informe-${inf.fecha || 'gremial'}`);
          }
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

    // === Reporte card: expand/collapse toggle ===
    this.shadowRoot.querySelectorAll('[data-toggle-report]').forEach(header => {
      header.addEventListener('click', () => {
        const key = header.dataset.toggleReport;
        this._expandedReports[key] = !this._expandedReports[key];
        // Re-render the card only (not full render to avoid scroll reset)
        const card = this.shadowRoot.querySelector(`[data-report-key="${key}"]`);
        if (card) {
          const body = card.querySelector('.reporte-card-body');
          const toggleBtn = card.querySelector('.reporte-card-toggle');
          const fade = card.querySelector('.msg-fade');
          if (body) {
            if (this._expandedReports[key]) {
              body.classList.add('expanded');
              if (toggleBtn) toggleBtn.textContent = '▼ Cerrar';
              if (fade) fade.style.display = 'none';
            } else {
              body.classList.remove('expanded');
              if (toggleBtn) toggleBtn.textContent = '▶ Expandir';
              if (fade) fade.style.display = '';
            }
          }
        }
      });
    });

    // === Reporte card: approve/correct/export buttons ===
    this.shadowRoot.querySelectorAll('.reporte-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.reporteAction;
        const msgIndex = Number(btn.dataset.msgIndex);
        if (action === 'aprobar') {
          this.emit('reporte-action', { action: 'aprobar', msgIndex });
        } else if (action === 'corregir') {
          this.emit('reporte-action', { action: 'corregir', msgIndex });
        } else if (action === 'exportar') {
          // Export the reporte card as HTML document
          const msg = this.messages[msgIndex];
          if (msg) {
            const msgs = [msg];
            const title = msg.sections && msg.sections[0] ? msg.sections[0].title || 'Informe Gremial' : 'Informe Gremial';
            this._downloadHtml(msgs, title, `reporte-${new Date().toISOString().slice(0,10)}`);
          }
        }
      });
    });

    // Scroll to bottom after render
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  // ===== Export chat as downloadable text/HTML document =====
  _buildChatHtml(messages, title) {
    const msgs = messages || this.messages || [];
    const chatTitle = title || this.title || 'Chat Hornero';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const lines = msgs.map(m => {
      const role = m.role === 'user' ? '→ Trabajador' : '← IA Sindical';
      const time = m.time ? ` [${m.time}]` : '';
      let content = '';

      // Text message
      if (m.text) content = m.text;

      // Sections (structured content)
      if (m.sections && m.sections.length > 0) {
        const sectionLines = m.sections.map(s => {
          let sec = '';
          if (s.title) sec += s.title + '\n';
          if (s.body) sec += s.body;
          if (s.quote) sec += `\n"${s.quote}"`;
          if (s.quoteAuthor) sec += ` — ${s.quoteAuthor}`;
          if (s.quoteSource) sec += ` (${s.quoteSource})`;
          return sec;
        });
        if (content) content += '\n\n' + sectionLines.join('\n---\n');
        else content = sectionLines.join('\n---\n');
      }

      // Tags (exclude system tags)
      const visibleTags = (m.tags || []).filter(t =>
        !['reporte', 'reporte-generado', 'reporte-aprobado', 'informe-guardado',
          'consulta', 'greeting', 'saludo', 'correccion-pendiente'].includes(t)
      );
      if (visibleTags.length > 0) content += `\n[${visibleTags.join(', ')}]`;

      return `${role}${time}\n${content}`;
    });

    const body = lines.join('\n\n' + '─'.repeat(40) + '\n\n');
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${chatTitle}</title>
<style>
body { font-family: 'Public Sans', Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #2B2A26; background: #FBFAF6; line-height: 1.6; }
h1 { font-family: 'Archivo', sans-serif; font-weight: 800; color: #586B33; border-bottom: 2px solid #6E8345; padding-bottom: 8px; margin-bottom: 20px; }
.meta { font-family: monospace; font-size: .8rem; color: #9C988D; margin-bottom: 30px; }
.msg { margin-bottom: 24px; }
.msg-role { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .85rem; color: #6E8345; }
.msg-role.user { color: #6E8345; }
.msg-role.hornero { color: #586B33; }
.msg-time { font-family: monospace; font-size: .7rem; color: #9C988D; }
.msg-content { margin: 6px 0; font-size: .95rem; }
.msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700; color: #586B33; margin-top: 10px; }
.msg-section-body { margin: 4px 0; }
.msg-quote { border-left: 3px solid #6E8345; background: #E8EDD7; padding: 10px 14px; margin: 8px 0; font-style: italic; border-radius: 0 8px 8px 0; }
.msg-quote-author { font-weight: 700; font-style: normal; color: #586B33; }
.msg-quote-source { font-family: monospace; font-size: .7rem; color: #6E6A60; font-style: normal; }
.msg-tags { margin-top: 6px; }
.msg-tag { background: #E8EDD7; color: #586B33; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: .75rem; font-weight: 600; display: inline-block; margin-right: 4px; }
.divider { border: none; border-top: 1px dashed #6E8345; margin: 24px 0; }
footer { font-family: monospace; font-size: .7rem; color: #9C988D; border-top: 1px solid #6E8345; padding-top: 12px; margin-top: 40px; text-align: center; }
</style>
</head>
<body>
<h1>${chatTitle}</h1>
<div class="meta">${dateStr} — ${timeStr}</div>
${msgs.map(m => {
  const role = m.role === 'user' ? 'Trabajador' : 'IA Sindical';
  const roleClass = m.role === 'user' ? 'user' : 'hornero';
  const time = m.time ? ` <span class="msg-time">[${m.time}]</span>` : '';
  let contentHtml = '';

  if (m.text) contentHtml += `<div class="msg-content">${m.text.replace(/\n/g, '<br>')}</div>`;

  if (m.sections && m.sections.length > 0) {
    contentHtml += m.sections.map(s => {
      let sec = '';
      if (s.title) sec += `<div class="msg-section-title">${s.title}</div>`;
      if (s.body) sec += `<div class="msg-section-body">${s.body.replace(/\n/g, '<br>')}</div>`;
      if (s.quote) {
        sec += `<div class="msg-quote">"${s.quote}"`;
        if (s.quoteAuthor) sec += `<div class="msg-quote-author">— ${s.quoteAuthor}</div>`;
        if (s.quoteSource) sec += `<div class="msg-quote-source">${s.quoteSource}</div>`;
        sec += '</div>';
      }
      return sec;
    }).join('<hr class="divider">');
  }

  const visibleTags = (m.tags || []).filter(t =>
    !['reporte','reporte-generado','reporte-aprobado','informe-guardado','consulta','greeting','saludo','correccion-pendiente'].includes(t)
  );
  const tagsHtml = visibleTags.length > 0 ?
    `<div class="msg-tags">${visibleTags.map(t => `<span class="msg-tag">${t}</span>`).join('')}</div>` : '';

  return `<div class="msg">
    <div class="msg-role ${roleClass}">${role}${time}</div>
    ${contentHtml}
    ${tagsHtml}
  </div>`;
}).join('<hr class="divider">')}
<footer>Exportado de Hornero — IA Sindical</footer>
</body>
</html>`;
  }

  // Download as .html file
  _downloadHtml(messages, title, filename) {
    const htmlContent = this._buildChatHtml(messages, title);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || title || 'chat-hornero') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Download as plain .txt file
  _downloadTxt(messages, title, filename) {
    const msgs = messages || this.messages || [];
    const chatTitle = title || this.title || 'Chat Hornero';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const lines = msgs.map(m => {
      const role = m.role === 'user' ? '→ Trabajador' : '← IA Sindical';
      const time = m.time ? ` [${m.time}]` : '';
      let content = '';
      if (m.text) content = m.text;
      if (m.sections && m.sections.length > 0) {
        const sectionLines = m.sections.map(s => {
          let sec = '';
          if (s.title) sec += s.title + '\n';
          if (s.body) sec += s.body;
          if (s.quote) sec += `\n"${s.quote}"`;
          if (s.quoteAuthor) sec += ` — ${s.quoteAuthor}`;
          if (s.quoteSource) sec += ` (${s.quoteSource})`;
          return sec;
        });
        if (content) content += '\n\n' + sectionLines.join('\n---\n');
        else content = sectionLines.join('\n---\n');
      }
      const visibleTags = (m.tags || []).filter(t =>
        !['reporte','reporte-generado','reporte-aprobado','informe-guardado','consulta','greeting','saludo','correccion-pendiente'].includes(t)
      );
      if (visibleTags.length > 0) content += `\n[${visibleTags.join(', ')}]`;
      return `${role}${time}\n${content}`;
    });

    const body = `${chatTitle}\n${dateStr} — ${timeStr}\n${'─'.repeat(60)}\n\n${lines.join('\n\n' + '─'.repeat(40) + '\n\n')}\n\n${'─'.repeat(60)}\nExportado de Hornero — IA Sindical`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || title || 'chat-hornero') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        this._historySessions = await obtenerChatSessions(this.username);
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
    // Emit event so parent re-syncs messages (without triggering another chat render)
    this.emit('chat-state-changed', {});
    // Scroll to bottom after drawer close (delay ensures layout is complete)
    setTimeout(() => {
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }, 100);
  }

  // ===== Informes Drawer =====
  async _openInformesDrawer() {
    try {
      if (typeof obtenerInformesPorEstado === 'function') {
        this._informesList = await obtenerInformesPorEstado('aceptado', this.username);
      } else {
        this._informesList = [];
      }
    } catch(e) { console.warn('Chat: informes load failed', e); this._informesList = []; }
    // Clear badge when user opens the drawer
    this.informeBadge = false;
    this._showInformes = true;
    this.render();
  }

  _closeInformesDrawer() {
    this._showInformes = false;
    this.render();
    // Emit event so parent re-syncs messages (without triggering another chat render)
    this.emit('chat-state-changed', {});
    // Scroll to bottom after drawer close (delay ensures layout is complete)
    setTimeout(() => {
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    }, 100);
  }

  setInformeBadge(bool) {
    this.informeBadge = bool;
    this.render();
  }

  // ===== Swipe-to-dismiss for drawer panels =====
  // Tracks touch on the drawer panel: horizontal swipe right → close
  // Vertical scrolling inside the list is preserved (only horizontal gesture triggers close)
  _setupDrawerSwipe(drawerEl, closeFn) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let swiping = false;
    const THRESHOLD = 80; // px to trigger close

    drawerEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = 0;
      swiping = false;
    }, { passive: true });

    drawerEl.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // Only start swiping if horizontal movement dominates (>2x vertical)
      if (!swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2) {
        swiping = true;
        drawerEl.classList.add('swiping');
      }
      if (!swiping) return;
      // Only allow swipe to the right (dx > 0), clamp
      currentX = Math.max(0, dx);
      drawerEl.style.transform = `translateX(${currentX}px)`;
    }, { passive: true });

    drawerEl.addEventListener('touchend', () => {
      if (!swiping) return;
      drawerEl.classList.remove('swiping');
      if (currentX >= THRESHOLD) {
        // Swipe past threshold → close with animation
        drawerEl.classList.add('swipe-closing');
        drawerEl.style.transform = `translateX(100%)`;
        // Wait for animation then close
        setTimeout(() => {
          drawerEl.classList.remove('swipe-closing');
          drawerEl.style.transform = '';
          closeFn();
        }, 250);
      } else {
        // Didn't reach threshold → snap back
        drawerEl.style.transition = 'transform .2s ease-out';
        drawerEl.style.transform = '';
        // Remove transition after snap-back completes
        setTimeout(() => { drawerEl.style.transition = ''; }, 200);
      }
      swiping = false;
      currentX = 0;
    });
  }
}

customElements.define('hornero-chat', HorneroChat);
