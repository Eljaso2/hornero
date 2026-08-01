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
      persona: String,      // Active persona: companero|abogado|periodista|historiador
      theme: String,        // 'dark' or 'light' — theme-aware persona icons
      username: String,      // Login username for per-user data isolation
      grade: String,         // User grade (B.a, B.b, B.c, B.d) — controls Reportes Recibidos icon
      streamingText: String, // Live streaming text being built token-by-token
      hidePersonaBar: Boolean, // Hide persona icons in top bar (e.g. Historia Obrera)
      hideInformesBtn: Boolean, // Hide Mis Reportes button in top bar
      hideRecibidosBtn: Boolean, // Hide Reportes recibidos button in top bar (e.g. Historia Obrera)
      centerLogo: String,      // URL for a small logo in the top bar center (when persona bar is hidden)
      noAutoScroll: Boolean,   // Disable auto-scroll (e.g. when banner is visible above)
      topBarAccent: Boolean,   // Light mode: colored top bar (only Historia Obrera when banner hidden)
    };
  }

  constructor() {
    super();
    this.title = 'Chat';
    this.messages = [];
    this.inputPlaceholder = 'Qué pensás...';
    this.typing = false;
    this.progress = 0;
    this.suggestions = [];
    this.section = '';
    this.sessionId = '';
    this.historyTitle = 'Historial';
    this.informeBadge = false;
    this.informesTitle = 'Mis Reportes';
    this.persona = 'companero'; // Default — parent components override via attribute
    this.theme = localStorage.getItem('hornero-theme') || 'dark';
    this.username = '';
    this.grade = 'A';
    this.hidePersonaBar = false;
    this.hideInformesBtn = false;
    this.hideRecibidosBtn = false;
    this.centerLogo = '';
    this.noAutoScroll = false;
    this.topBarAccent = false;
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
    this._historyDrawerStable = false; // prevent slideIn replay on re-render
    this._historySessions = []; // cached session list
    this._showInformes = false; // informes drawer state
    this._informesDrawerStable = false; // prevent slideIn replay on re-render
    this._informesList = [];    // cached informes list (own informes)
    this._informesEntrantes = []; // incoming informes from lower grades (cross-user)
    this._expandedReports = {}; // message index → boolean (expanded/collapsed)
    this._exportInProgress = false; // debounce guard for export button
    this._showRecibidos = false; // recibidos drawer state
    this._recibidosDrawerStable = false; // prevent slideIn replay on re-render
    this._recibidosBadge = false; // badge on recibidos icon
    this._plusMenuOpen = false; // + dropdown menu state
    this._plusMenuCloseHandler = null; // persistent outside-click handler
    this.streamingText = ''; // Live streaming text — when non-empty, shows as "in progress" message
    this._streamingPersona = ''; // Persona for the streaming message
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

  // Public method: update streaming text WITHOUT full re-render
  // Only updates the DOM element — avoids flicker during progressive reveal
  updateStreamingText(text) {
    this.streamingText = text;
    const streamingEl = this.shadowRoot.querySelector('.streaming-text');
    if (streamingEl) {
      streamingEl.innerHTML = this._formatMarkdown(text);
      // Auto-scroll to bottom
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      if (scroll) {
        this._autoScroll();
      }
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
        background: var(--ho-bg, #1E2321); position: relative; }

      /* Download toast — centered overlay that appears briefly after export */
      .download-toast { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 1000; background: var(--ho-green-dark, #3D6B56); color: #fff;
        padding: 16px 28px; border-radius: 12px; font-family: 'Archivo', sans-serif;
        font-weight: 700; font-size: .9rem; text-align: center; line-height: 1.4;
        opacity: 0; transition: opacity .3s ease; pointer-events: none;
        box-shadow: 0 4px 20px rgba(43,42,38,.3); }
      .download-toast.show { opacity: 1; }

      /* Share menu overlay — for reporte card share button */
      .share-menu-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 900; background: rgba(43,42,38,.5); display: flex;
        align-items: center; justify-content: center; }
      .share-menu { background: var(--ho-card, #2A3230); border-radius: 16px;
        padding: 20px; width: 260px; box-shadow: 0 8px 32px rgba(43,42,38,.2); }
      .share-menu-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); margin-bottom: 12px; }
      .share-menu-item { display: flex; align-items: center; gap: 10px;
        padding: 10px 14px; border: none; background: none; cursor: pointer;
        border-radius: 10px; font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .86rem; color: var(--ho-text, #E8E6E0); width: 100%;
        transition: background .2s; }
      .share-menu-item:hover { background: var(--ho-green-pale, #E0F0EB); }
      .share-menu-icon { font-size: 1.1rem; }
      .share-menu-cancel { display: block; margin-top: 8px; padding: 8px;
        border: none; background: none; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); width: 100%; text-align: center; }

      /* History button — inside top bar */
      .chat-history-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-history-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-history-btn svg { width: 18px; height: 18px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-history-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }

      /* Export button — input toolbar */
      .chat-export-btn { background: var(--ho-green-pale, #E0F0EB); }
      .chat-export-btn svg { stroke: var(--ho-green-dark, #3D6B56); fill: none; }

      /* Informes button — inside top bar */
      .chat-informes-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-informes-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-informes-btn svg { width: 18px; height: 18px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-informes-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      /* Badge state: outline grueso + fondo pálido verde */
      .chat-informes-btn.badge { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green, #4E9978); border-width: 1.5px;
        transform: scale(1.06); }
      .chat-informes-btn.badge svg { stroke: var(--ho-green-dark, #3D6B56);
        stroke-width: 2.6; }

      /* Reportes Recibidos button — inside top bar */
      .chat-recibidos-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; overflow: hidden; }
      .chat-recibidos-btn:hover { background: #F0E4CC;
        border-color: var(--ho-gold, #B0863F); transform: scale(1.08); }
      .chat-recibidos-btn svg { width: 18px; height: 18px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-recibidos-btn:hover svg { stroke: var(--ho-gold, #B0863F); }
      .chat-recibidos-btn.badge { background: #F0E4CC;
        border-color: var(--ho-gold, #B0863F); border-width: 1.5px;
        transform: scale(1.06); }
      .chat-recibidos-btn.badge svg { stroke: var(--ho-gold, #B0863F);
        stroke-width: 2.6; }

      /* Recibidos drawer overlay */
      .recibidos-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 70; display: flex;
        justify-content: flex-end; transition: opacity .3s; }

      /* Recibidos drawer panel */
      .recibidos-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #1E2321); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease;
        touch-action: pan-y; }
      .recibidos-drawer.stable { animation: none; }

      /* Informes drawer overlay */
      .informes-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 60; display: flex;
        justify-content: flex-end; transition: opacity .3s; }

      /* Informes drawer panel */
      .informes-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #1E2321); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease;
        touch-action: pan-y; }
      .informes-drawer.stable { animation: none; }
      .informes-drawer.swiping { animation: none; transition: none; }
      .informes-drawer.swipe-closing { animation: none; transition: transform .25s ease-out; }

      .informes-header { padding: 16px; display: flex; align-items: center;
        justify-content: space-between; flex: none; gap: 10px;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .informes-header-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); flex: 1; }
      .informes-back-btn { width: 32px; height: 32px; border-radius: 50%;
        background: var(--ho-dark-mid, #3A4340); border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--ho-text-off, #F2F1EC); flex: none; }
      .informes-back-btn svg { width: 18px; height: 18px; }

      /* Informes drawer section headers */
      .informes-section-header { padding: 10px 16px 6px;
        font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .72rem; letter-spacing: .04em; text-transform: uppercase;
        color: var(--ho-green-dark, #3D6B56);
        background: var(--ho-green-pale, #E0F0EB);
        border-radius: 8px 8px 0 0; margin-top: 8px; }
      .informes-section-header.entrantes { color: var(--ho-gold, #B0863F);
        background: #F0E4CC; }

      .informes-list { flex: 1; overflow-y: auto; padding: 8px 0; }

      .informes-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.06));
        display: flex; flex-direction: column; gap: 4px;
        transition: background .2s; }
      .informes-item:hover { background: var(--ho-green-pale, #E0F0EB); }

      .informes-item-title { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .informes-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); display: flex; gap: 8px; align-items: center; }
      .informes-item-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); letter-spacing: .06em;
        background: var(--ho-mid-gray, #ECEAE3); padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-item-grado { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #D4E4F7; color: #2B5278; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-item-estado { background: var(--ho-green-pale, #E0F0EB);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #3D6B56); }
      .informes-item-estado.estado-pendiente { background: #F0E4CC; color: #856404; }
      .informes-item-estado.estado-aceptado { background: #E0F0EB; color: #3D6B56; }
      .informes-item-estado.estado-visto { background: #F0E4CC; color: #856404; }
      .informes-item-estado.estado-aprobado { background: #C5D9A0; color: #3D6B1A; }
      .informes-item-estado.estado-corregido { background: #D4E4F7; color: #2B5278; }
      .informes-item-estado.estado-con-cambios { background: #D4E4F7; color: #2B5278; }

      .informes-item-footer { display: flex; align-items: center;
        gap: 8px; margin-top: 4px; }
      .informes-item-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); }
      .informes-item-actions { display: flex; gap: 4px; }
      .informes-action-btn { width: 28px; height: 28px; border-radius: 8px;
        background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; }
      .informes-action-btn svg { width: 14px; height: 14px;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .informes-action-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .informes-action-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .informes-action-btn:disabled { opacity: .3; pointer-events: none; }

      .informes-item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .informes-item-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .informes-separator { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 700; color: var(--ho-text-light, #9C988D);
        padding: 8px 16px 4px; border-top: 2px solid var(--ho-border, rgba(43,42,38,.18));
        margin-top: 6px; letter-spacing: .04em; text-transform: uppercase; }

      .informes-item-reviewed { opacity: .55; }

      /* Informes item review buttons (aprobar/corregir for incoming G1) — subtle, icon-only */
      .informes-review-actions { display: flex; gap: 6px; margin-top: 6px; }
      .informes-review-btn { border-radius: 8px; padding: 6px 8px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .72rem;
        cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
        transition: background .2s, border-color .2s;
        background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        color: var(--ho-text-light, #9C988D); }
      .informes-review-btn svg { width: 14px; height: 14px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .informes-review-btn:hover { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-text-mid, #6E6A60); }
      .informes-review-btn.corregir:hover { background: #F0E4CC; color: #B0863F; }

      .informes-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); }

      .informes-close-btn { background: none; border: none; cursor: pointer;
        width: 28px; height: 28px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center;
        transition: background .2s; }
      .informes-close-btn:hover { background: var(--ho-green-pale, #E0F0EB); }
      .informes-close-btn svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }


      /* History drawer overlay */
      .history-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(43,42,38,.35); z-index: 50; display: flex;
        justify-content: flex-end; transition: opacity .3s; }
      .history-overlay.hidden { opacity: 0; pointer-events: none; }

      /* History drawer panel */
      .history-drawer { width: 85%; max-width: 340px; height: 100%;
        background: var(--ho-bg, #1E2321); display: flex; flex-direction: column;
        box-shadow: -4px 0 20px rgba(0,0,0,.15); animation: slideIn .3s ease;
        touch-action: pan-y; /* allow vertical scroll inside, but capture horizontal swipe */ }
      .history-drawer.stable { animation: none; }
      .history-drawer.swiping { animation: none; transition: none; }
      .history-drawer.swipe-closing { animation: none; transition: transform .25s ease-out; }
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: none; } }

      .history-header { padding: 16px; display: flex; align-items: center;
        justify-content: space-between; flex: none; gap: 10px;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .history-header-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .92rem; color: var(--ho-text, #E8E6E0); flex: 1; }
      .history-new-btn { background: none; border: none;
        border-radius: 8px; padding: 4px 10px; cursor: pointer; display: flex;
        align-items: center; justify-content: center; transition: background .2s;
        margin-left: 8px; }
      .history-new-btn svg { width: 14px; height: 14px; stroke: var(--ho-text, #E8E6E0);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .history-new-btn:hover { background: var(--ho-green-pale, #E0F0EB); }
      .history-close-btn { background: none; border: none; cursor: pointer;
        width: 28px; height: 28px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center;
        transition: background .2s; }
      .history-close-btn:hover { background: var(--ho-green-pale, #E0F0EB); }
      .history-close-btn svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60);
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }

      .history-list { flex: 1; overflow-y: auto; padding: 8px 0; }

      .history-item { padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.06));
        display: flex; flex-direction: column; gap: 5px;
        transition: background .2s; }
      .history-item:hover { background: var(--ho-green-pale, #E0F0EB); }
      .history-item.active { background: var(--ho-green-pale, #E0F0EB); }

      .history-item-section { display: flex; align-items: center; gap: 5px; }
      .history-item-section-icon { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
      .history-item-persona-img { width: 100%; height: 100%; object-fit: cover; }
      .history-item-persona-img.periodista-full { object-fit: contain; }
      .history-item-section-emoji { font-size: .82rem; line-height: 1; }
      .history-item-section-label { font-family: 'Archivo', sans-serif; font-size: .72rem;
        font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .section-consulta .history-item-section-label { color: #4E9978; }
      .section-contenido .history-item-section-label { color: #B0863F; }
      .section-debate .history-item-section-label { color: #5A7EA8; }
      .section-reporte .history-item-section-label { color: #3D6B56; }
      .section-default .history-item-section-label { color: var(--ho-green-dark, #3D6B56); }

      .history-item-preview { font-family: 'Archivo', sans-serif; font-size: .86rem;
        font-weight: 700; color: var(--ho-text, #E8E6E0); line-height: 1.3;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .history-item-meta { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); display: flex; gap: 8px; align-items: center; }
      .history-item-count { background: var(--ho-green-pale, #E0F0EB);
        padding: 2px 8px; border-radius: 8px; font-weight: 600;
        color: var(--ho-green-dark, #3D6B56); }
      .history-item-footer { display: flex; align-items: center;
        justify-content: space-between; margin-top: 2px; }
      .history-item-date { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); }
      .history-item-actions { display: flex; gap: 4px; }
      .history-action-btn { width: 28px; height: 28px; border-radius: 8px;
        background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; }
      .history-action-btn svg { width: 14px; height: 14px;
        stroke: var(--ho-text-light, #9C988D); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .history-action-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .history-action-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .history-action-btn[data-action="delete"]:hover { background: #FDECEA;
        border-color: #D32F2F; }
      .history-action-btn[data-action="delete"]:hover svg { stroke: #D32F2F; }

      .history-item-user { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); letter-spacing: .06em;
        background: var(--ho-mid-gray, #ECEAE3); padding: 2px 8px; border-radius: 6px; font-weight: 600; }

      .history-empty { padding: 40px 20px; text-align: center;
        font-family: 'Archivo', sans-serif; font-size: .82rem;
        color: var(--ho-text-light, #9C988D); }

      /* Section badge colors */
      .section-consulta { color: #4E9978; }
      .section-contenido { color: #B0863F; }
      .section-debate { color: #5A7EA8; }
      .section-reporte { color: #3D6B56; }

      /* Reporte card — formal document frame */
      .reporte-card { background: #F5F3EE;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 13px; padding: 0; margin-top: 10px;
        animation: msgin .35s ease; overflow: hidden; }
      .reporte-card-header { display: flex; align-items: center; gap: 8px;
        cursor: pointer; padding: 10px 14px;
        background: #EDEAE3; color: var(--ho-text, #E8E6E0); }
      .reporte-card-icon { font-size: 1.1rem; flex: none; }
      .reporte-card-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: .88rem; color: var(--ho-green-dark, #3D6B56); flex: 1;
        letter-spacing: .04em; text-transform: uppercase; }
      .reporte-card-toggle { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; color: var(--ho-text-mid, #6E6A60);
        background: rgba(255,255,255,.25); border-radius: 6px; border: none;
        cursor: pointer; flex: none; padding: 2px 8px; }
      .reporte-card-body { max-height: 60px; overflow: hidden;
        position: relative; transition: max-height .4s ease;
        padding: 14px; }
      .reporte-card-body.expanded { max-height: none; }
      .reporte-card-body .msg-fade { position: absolute; bottom: 0; left: 0;
        right: 0; height: 20px;
        background: linear-gradient(transparent, var(--ho-card, #2A3230)); }
      .reporte-card-body.expanded .msg-fade { display: none; }
      .reporte-card-section { margin-bottom: 10px; }
      .reporte-card-section:last-child { margin-bottom: 0; }
      .reporte-card-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .84rem; color: var(--ho-green-dark, #3D6B56); margin-bottom: 4px;
        text-transform: uppercase; letter-spacing: .06em; }
      .reporte-card-section-body { font-family: 'Public Sans', sans-serif;
        font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.5; }

      /* Relato section — narrative style */
      .reporte-card-section[data-section-type="relato"] .reporte-card-section-body {
        font-family: 'Public Sans', sans-serif; font-size: .84rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.6; }

      /* Clasificación section — structured labels with inline tag badges */
      .reporte-card-section[data-section-type="clasificacion"] .reporte-card-section-body {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5; }
      .reporte-card-section[data-section-type="clasificacion"] .reporte-card-section-body strong {
        color: var(--ho-green-dark, #3D6B56); font-weight: 700; }
      .reporte-card-section[data-section-type="clasificacion"] .clasif-tag {
        display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600;
        vertical-align: middle; margin: 0 2px; line-height: 1.4; }

      /* Extractos del diálogo section — quote style */
      .reporte-card-section[data-section-type="extractos"] .reporte-card-section-body {
        font-family: 'Public Sans', sans-serif; font-size: .80rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5;
        font-style: italic; border-left: 3px solid var(--ho-green, #4E9978);
        padding-left: 12px; background: rgba(78,153,120,.06);
        border-radius: 0 8px 8px 0; }
      .reporte-card-section[data-section-type="transcript"] .reporte-card-section-body {
        font-family: 'Public Sans', sans-serif; font-size: .82rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.6;
        border-left: 3px solid var(--ho-green, #4E9978);
        padding-left: 12px; background: rgba(78,153,120,.06);
        border-radius: 0 8px 8px 0; }

      /* Ficha del reportante section — compact card style */
      .reporte-card-section[data-section-type="ficha"] .reporte-card-section-body {
        font-family: 'JetBrains Mono', monospace; font-size: .74rem;
        color: var(--ho-text-light, #9C988D); line-height: 1.7;
        background: var(--ho-bg, #1E2321); border-radius: 8px;
        padding: 10px 14px; }
      .reporte-card-section[data-section-type="ficha"] .reporte-card-section-body strong {
        color: var(--ho-text-mid, #6E6A60); font-weight: 600; }
      .reporte-card-divider { height: 1px; background: rgba(255,255,255,.06);
        margin: 10px 0; }
      .reporte-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
        padding: 10px 14px; border-top: 1px solid var(--ho-green-pale, #E0F0EB);
        background: var(--ho-bg, #1E2321); }
      .reporte-card-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: #EDEAE3; color: var(--ho-text, #E8E6E0);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }
      .reporte-card-actions { display: flex; gap: 6px;
        padding: 8px 12px 4px; justify-content: flex-end; }
      .reporte-card-prompt { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text, #E8E6E0); padding: 0; line-height: 1.5; }
      .reporte-card-prompt em { font-style: italic; color: var(--ho-text-mid, #6E6A60); }
      .reporte-btn { border-radius: 8px; padding: 6px 8px;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .72rem;
        cursor: pointer; transition: background .2s; display: inline-flex;
        align-items: center; justify-content: center; gap: 4px; min-width: 32px;
        background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        color: var(--ho-text-light, #9C988D); }
      .reporte-btn:hover { background: var(--ho-green-pale, #E0F0EB); color: var(--ho-text-mid, #6E6A60); }
      .reporte-btn svg { width: 14px; height: 14px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .reporte-btn-delete { border-color: transparent; }
      .reporte-btn-delete:hover { color: #D32F2F; border-color: rgba(211,47,47,.2); background: #FDECEA; }
      .reporte-btn-delete svg { stroke-width: 1.8; }
      .reporte-btn-corregir { border: 1.5px solid #B0863F; color: #B0863F; }
      .reporte-btn-corregir:hover { background: #F0E4CC; }
      .reporte-btn-aprobar { width: 100%; padding: 8px 14px;
        border-radius: 8px; border: 1px solid var(--ho-green, #4E9978); cursor: pointer;
        background: transparent; color: var(--ho-green, #4E9978);
        font-family: 'Archivo', sans-serif; font-weight: 600;
        font-size: .78rem; display: flex; align-items: center;
        justify-content: center;
        transition: background .2s; }
      .reporte-btn-aprobar:hover { background: var(--ho-green-pale, #E0F0EB); }
      .reporte-card.estado-aceptado { border-color: rgba(43,42,38,.2);
        opacity: .85; }
      .reporte-card.estado-aceptado .reporte-btn[data-reporte-action="aprobar"],
      .reporte-card.estado-aceptado .reporte-btn[data-reporte-action="corregir"],
      .reporte-card.estado-aceptado .reporte-card-prompt { display: none; }

      /* Correccion badges — grade-colored indicators */
      .correccion-badge { display: inline-block; font-family: 'JetBrains Mono', monospace;
        font-size: .58rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;
        margin-left: 6px; vertical-align: middle; }
      .correccion-badge.grado-2 { background: #E0F0EB; color: #3D6B56; }
      .correccion-badge.grado-3 { background: #D7E8F3; color: #2C5A8A; }
      .correccion-badge.grado-4 { background: #E8DCF0; color: #5A3D7A; }

      /* Section with grade-colored left border */
      .reporte-card-section.modificado-grado-2 .reporte-card-section-body { border-left: 3px solid #4E9978; padding-left: 10px; }
      .reporte-card-section.modificado-grado-3 .reporte-card-section-body { border-left: 3px solid #2C5A8A; padding-left: 10px; }
      .reporte-card-section.modificado-grado-4 .reporte-card-section-body { border-left: 3px solid #5A3D7A; padding-left: 10px; }

      /* Historial de cambios section */
      .reporte-card-historial { margin-top: 12px; padding: 10px 12px;
        background: rgba(0,0,0,.03); border-radius: 8px;
        border-top: 2px dashed rgba(0,0,0,.08); }
      .reporte-card-historial-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-text-mid, #6E6A60); margin-bottom: 8px; }
      .reporte-card-historial-entry { padding: 6px 0;
        border-bottom: 1px solid rgba(0,0,0,.05); }
      .reporte-card-historial-entry:last-child { border-bottom: none; }
      .reporte-card-historial-grado { font-family: 'JetBrains Mono', monospace;
        font-size: .62rem; font-weight: 700; margin-bottom: 2px; }
      .reporte-card-historial-grado.grado-2 { color: #4E9978; }
      .reporte-card-historial-grado.grado-3 { color: #2C5A8A; }
      .reporte-card-historial-grado.grado-4 { color: #5A3D7A; }
      .reporte-card-historial-resumen { font-family: 'Public Sans', sans-serif;
        font-size: .78rem; color: var(--ho-text-light, #9C988D); line-height: 1.4; }
      .reporte-card-historial-secciones { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .reporte-card-historial-seccion { font-family: 'JetBrains Mono', monospace;
        font-size: .56rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
      .reporte-card-historial-seccion.grado-2 { background: #E0F0EB; color: #3D6B56; }
      .reporte-card-historial-seccion.grado-3 { background: #D7E8F3; color: #2C5A8A; }
      .reporte-card-historial-seccion.grado-4 { background: #E8DCF0; color: #5A3D7A; }

      /* Progress bar */
      .chat-progress-wrap { padding: 4px 16px 0; flex: none; }
      .chat-progress-bar { height: 4px; background: var(--ho-mid-gray, #ECEAE3); border-radius: 4px; }
      .chat-progress-fill { height: 100%; background: var(--ho-green, #4E9978);
        border-radius: 4px; transition: width .5s; }
      .chat-progress-label { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        color: var(--ho-text-light, #9C988D); margin-top: 2px; text-align: center; }

      /* Messages scroll */
      .chat-scroll { flex: 1; overflow-y: auto; padding: 16px;
        padding-top: 64px; /* 56px top bar + 8px gap */
        -webkit-overflow-scrolling: touch; }

      /* Animations */
      @keyframes msgin { from { opacity: 0; transform: translateY(10px) scale(.97) }
        to { opacity: 1; transform: none } }
      @keyframes dotbounce { 0%,80%,100% { opacity:.3 } 40% { opacity:1 } }

      /* === USER message: bubble (green, right-aligned) === */
      .msg-row { margin-bottom: 14px; animation: msgin .35s ease; }
      .msg-row.hornero + .msg-row.hornero { margin-top: 24px; }
      .msg-row.user { display: flex; flex-direction: column; align-items: flex-end; }

      .msg-row.user .msg-bubble {
        max-width: 82%; background: var(--ho-green-light, #80CCA0);
        color: var(--ho-bg, #1E2321);
        border-radius: 18px 18px 4px 18px; padding: 10px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        font-weight: 600;
        line-height: 1.35; position: relative;
        display: inline-block; }

      .msg-row.user .msg-time {
        font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-green-dark, #3D6B56); opacity: .7; }

      /* User image/video attachment */
      .msg-media { max-width: 220px; margin-bottom: 6px; border-radius: 12px; overflow: hidden; }
      .msg-media img { width: 100%; display: block; border-radius: 12px; }
      .msg-media video { width: 100%; display: block; border-radius: 12px; }

      /* AI file download card — clickable file attachment in chat */
      .msg-download-card {
        display: flex; align-items: center; padding: 12px 16px;
        background: var(--ho-green-pale, #E0F0EB); border-radius: 12px;
        cursor: pointer; transition: background .2s; margin-bottom: 8px; max-width: 280px;
      }
      .msg-download-card:hover { background: var(--ho-green-light, #D4DCC0); }
      .msg-download-icon { font-size: 1.5rem; margin-right: 12px; flex: none; }
      .msg-download-info { flex: 1; min-width: 0; }
      .msg-download-filename { font-weight: 600; font-size: .85rem; color: var(--ho-green-dark, #3D6B56); display: block; }
      .msg-download-label { font-size: .70rem; color: var(--ho-text-muted, #8A8A74); }

      /* === HORNERO message: NO bubble — plain text block === */
      .msg-row.hornero { display: flex; flex-direction: column; align-items: flex-start; }

      .msg-content { max-width: 90%; animation: msgin .35s ease; }

      .msg-avatar-row { display: flex; flex-direction: row; align-items: center; gap: 6px; margin-bottom: 6px; }
      .msg-avatar { width: 32px; height: 32px; flex: none;
        display: flex; align-items: center; justify-content: center; }
      .msg-avatar img { width: 32px; height: 32px; object-fit: cover; object-position: center 25%;
        filter: var(--ho-persona-filter, none); }
      .msg-avatar img.periodista-full { object-fit: contain; object-position: center; }
      :host(.theme-light) .msg-avatar-row.persona-hornero .msg-avatar img { filter: brightness(0.35); }
      .msg-avatar-emoji { font-size: .72rem; line-height: 1; }
      .msg-avatar-name { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .72rem; white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; }

      /* === Typing avatar: persona-aware === */
      .typing-avatar-emoji { font-size: .72rem; line-height: 1; }

      /* === Chat top bar (cintillo) — tira scrolleable de actores + acciones === */
      .chat-top-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 20;
        height: 56px; display: flex; align-items: center;
        padding: 0; background: color-mix(in srgb, var(--ho-bg, #1E2321) 80%, transparent);
        border-bottom: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .chat-top-bar-left { display: flex; align-items: center; padding-left: 8px; flex-shrink: 0; z-index: 2; }
      .chat-top-bar-center { flex: 1; overflow-x: auto; display: flex; align-items: center;
        scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; gap: 0; padding: 0 4px;
        justify-content: center; }
      .chat-top-bar-center::-webkit-scrollbar { width: 0; }
      .chat-top-bar-logo { height: 22px; width: auto; object-fit: contain; }
      :host(.theme-light) .chat-top-bar-logo { filter: brightness(0); }
      .chat-top-bar-right { display: flex; align-items: center; gap: 4px; padding-right: 8px; flex-shrink: 0; z-index: 2; position: relative; }

      /* + button in cintillo right side */
      .chat-plus-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-plus-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-plus-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-plus-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-plus-btn.open { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .chat-plus-btn.open svg { stroke: var(--ho-green-dark, #3D6B56); transform: rotate(45deg); transition: transform .2s; }

      /* Dropdown container — rectangular frame that wraps + and items below */
      .chat-plus-menu { position: absolute; top: 0; right: 0;
        background: color-mix(in srgb, var(--ho-dark-surface, #2A2F2D) 92%, transparent);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--ho-border, rgba(255,255,255,.1));
        border-radius: 12px; padding: 6px; z-index: 30;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        box-shadow: 0 4px 16px rgba(0,0,0,.3);
        animation: menuSlideDown .15s ease; }
      :host(.theme-light) .chat-plus-menu {
        background: color-mix(in srgb, var(--ho-bg, #F8F6F0) 92%, transparent);
        box-shadow: 0 4px 16px rgba(0,0,0,.12); }
      @keyframes menuSlideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      .chat-plus-menu .chat-plus-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s; }
      .chat-plus-menu .chat-plus-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); }
      .chat-plus-menu .chat-plus-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-plus-menu .chat-plus-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-plus-menu .chat-plus-btn.open svg { stroke: var(--ho-green-dark, #3D6B56); transform: rotate(45deg); }
      .chat-plus-divider { width: 24px; height: 1px; background: var(--ho-border, rgba(255,255,255,.08)); }
      .chat-plus-item { display: flex; flex-direction: column; align-items: center;
        gap: 2px; padding: 4px 0; background: none; border: none; cursor: pointer;
        text-align: center; font-family: 'Archivo', sans-serif;
        font-size: .52rem; font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        transition: opacity .2s; position: relative; }
      .chat-plus-item:hover { opacity: .8; }
      .chat-plus-item .item-icon { width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .chat-plus-item .item-icon svg { width: 16px; height: 16px; stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-plus-item:hover .item-icon { border-color: var(--ho-green-light, #80CCA0); }
      .chat-plus-item:hover .item-icon svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-plus-item:hover { color: var(--ho-green, #4E9978); }
      .chat-plus-item .item-label { white-space: nowrap; }
      .chat-plus-item .item-badge { position: absolute; top: 2px; right: 0;
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--ho-green, #4E9978); }
      .chat-plus-item .item-badge.gold { background: var(--ho-gold, #B0863F); }

      /* History/Informes/Recibidos as cintillo items — inside scrollable center (legacy, kept for reference) */
      .chat-cintillo-action { display: flex; flex-direction: column; align-items: center;
        gap: 2px; background: none; border: none; cursor: pointer;
        padding: 4px 6px; transition: opacity .2s; position: relative;
        flex-shrink: 0; scroll-snap-align: center; }
      .chat-cintillo-action:hover { opacity: .8; }
      .chat-cintillo-action .cintillo-action-inner { width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 1px solid var(--ho-border, rgba(255,255,255,.08)); }
      .chat-cintillo-action .cintillo-action-inner svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-cintillo-action:hover .cintillo-action-inner { border-color: var(--ho-green-light, #80CCA0); }
      .chat-cintillo-action:hover .cintillo-action-inner svg { stroke: var(--ho-green-dark, #3D6B56); }
      .chat-cintillo-action .cintillo-action-label { font-family: 'Archivo', sans-serif;
        font-size: .52rem; font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        white-space: nowrap; }
      .chat-cintillo-action:hover .cintillo-action-label { color: var(--ho-green, #4E9978); }
      .chat-cintillo-action .cintillo-action-inner.badge { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green, #4E9978); border-width: 1.5px; }
      .chat-cintillo-action .cintillo-action-inner.badge svg { stroke: var(--ho-green-dark, #3D6B56);
        stroke-width: 2.6; }

      /* Back button inside top bar */
      .chat-back-btn { width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background .2s, border-color .2s, transform .15s; }
      .chat-back-btn:hover { background: var(--ho-green-pale, #E0F0EB);
        border-color: var(--ho-green-light, #80CCA0); transform: scale(1.08); }
      .chat-back-btn svg { width: 16px; height: 16px;
        stroke: var(--ho-text-mid, #6E6A60); stroke-width: 2.5;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .chat-back-btn:hover svg { stroke: var(--ho-green-dark, #3D6B56); }

      /* Persona icons — cintillo scrolleable (sin línea divisoria) */
      .chat-persona-icon { display: flex; flex-direction: column; align-items: center;
        gap: 4px; background: none; border: none; cursor: pointer;
        padding: 4px 2px; transition: opacity .2s; position: relative;
        flex-shrink: 0; scroll-snap-align: center; opacity: .45; }
      .chat-persona-icon:hover { opacity: .75; }
      .chat-persona-icon.active { opacity: 1; }
      .persona-icon-inner { width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; }
      .persona-icon-inner img { width: 28px; height: 28px; object-fit: contain;
        object-position: center; filter: var(--ho-persona-filter, none); }
      .persona-icon-inner img.periodista-full { object-fit: contain; object-position: center; }
      .persona-icon-inner .msg-avatar-emoji { font-size: .62rem; line-height: 1; }
      .chat-persona-icon.active .persona-icon-inner { }
      .chat-persona-icon .persona-cintillo-label { font-family: 'Archivo', sans-serif;
        font-size: .52rem; font-weight: 600; color: var(--ho-text-mid, #6E6A60);
        white-space: nowrap; }
      .chat-persona-icon.active .persona-cintillo-label { color: var(--ho-green, #4E9978); }

      /* === Redirect derivation button in message === */
      .msg-redirect-btn { display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 14px 6px 6px; border-radius: 20px; cursor: pointer;
        border: 1.5px solid; font-family: 'Archivo', sans-serif;
        font-weight: 700; font-size: .78rem; margin-top: 10px;
        transition: transform .15s, box-shadow .2s; }
      .msg-redirect-btn:hover { transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(255,255,255,.1); }
      .msg-redirect-icon-circle { width: 22px; height: 22px;
        display: flex; align-items: center; justify-content: center; flex: none; }
      .msg-redirect-icon-circle img { width: 22px; height: 22px; object-fit: cover; object-position: center 25%;
        filter: var(--ho-persona-filter, none); }
      .msg-redirect-icon-circle img.periodista-full { object-fit: contain; object-position: center; }
      .msg-redirect-emoji { font-size: .68rem; line-height: 1; }

      /* "Ver mis informes" button in message — opens informes drawer */
      .msg-informes-btn { display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 18px; border-radius: 14px; cursor: pointer;
        border: 1.5px solid var(--ho-green, #4E9978); background: var(--ho-green-pale, #E0F0EB);
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .84rem;
        color: var(--ho-green-dark, #3D6B56); margin-top: 12px;
        transition: background .2s, transform .15s, box-shadow .2s; }
      .msg-informes-btn:hover { background: var(--ho-green-light, #D4DCC0);
        transform: scale(1.04); box-shadow: 0 2px 8px rgba(255,255,255,.1); }

      .msg-text { font-family: 'Public Sans', sans-serif; font-size: .90rem;
        color: var(--ho-text, #E8E6E0); line-height: 1.55;
        margin-bottom: 8px; }
      .msg-text p { margin-bottom: 10px; }
      .msg-text p:last-child { margin-bottom: 0; }
      .msg-text strong { font-weight: 700; color: var(--ho-green-dark, #3D6B56); }

      /* Markdown-rendered elements — apply to ALL msg contexts */
      .msg-text em, .msg-section-body em, .reporte-card-section-body em
        { font-style: italic; color: var(--ho-text-mid, #6E6A60); }
      .msg-section-body strong, .reporte-card-section-body strong
        { font-weight: 700; color: var(--ho-green-dark, #3D6B56); }
      .msg-text .msg-md-heading { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--ho-green-dark, #3D6B56); margin: 14px 0 6px;
        border-bottom: 2px solid var(--ho-green-pale, #E0F0EB); padding-bottom: 4px; }
      .msg-section-body .msg-md-heading, .reporte-card-section-body .msg-md-heading
        { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--ho-green-dark, #3D6B56); margin: 14px 0 6px;
        border-bottom: 2px solid var(--ho-green-pale, #E0F0EB); padding-bottom: 4px; }
      .msg-text .msg-md-ul { margin: 6px 0 10px; padding-left: 18px;
        list-style: none; }
      .msg-text .msg-md-ul li, .msg-section-body .msg-md-ul li, .reporte-card-section-body .msg-md-ul li
        { position: relative; margin-bottom: 5px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.5; }
      .msg-text .msg-md-ul li::before, .msg-section-body .msg-md-ul li::before, .reporte-card-section-body .msg-md-ul li::before
        { content: '•'; position: absolute;
        left: -14px; color: var(--ho-green, #4E9978); font-weight: 700; }
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
        color: var(--ho-green, #4E9978); font-family: 'JetBrains Mono', monospace;
        font-size: .68rem; font-weight: 600; }
      .msg-section-body .msg-md-ul, .reporte-card-section-body .msg-md-ul
        { margin: 6px 0 10px; padding-left: 18px; list-style: none; }
      .msg-section-body .msg-md-ol, .reporte-card-section-body .msg-md-ol
        { margin: 6px 0 10px; padding-left: 22px; list-style: none; counter-reset: md-ol; }
      .msg-md-code { font-family: 'JetBrains Mono', monospace; font-size: .76rem;
        background: var(--ho-warm-gray, #E6E3DB); padding: 2px 6px;
        border-radius: 4px; color: var(--ho-text, #E8E6E0); }

      .msg-section { margin-bottom: 12px; }
      .msg-section:last-child { margin-bottom: 0; }
      .msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .88rem; color: var(--ho-text, #E8E6E0); margin-bottom: 6px; }
      .msg-section-body { font-family: 'Public Sans', sans-serif; font-size: .86rem;
        color: var(--ho-text-mid, #6E6A60); line-height: 1.4; }
      .msg-section-body p { margin-bottom: 4px; }

      /* Divider between sections */
      .msg-divider { height: 1px; background: var(--ho-border, rgba(255,255,255,.08));
        margin: 10px 0; }

      /* Quote */
      .msg-quote { background: var(--ho-green-pale, #E0F0EB);
        border-left: 3px solid var(--ho-green, #4E9978);
        border-radius: 0 10px 10px 0; padding: 10px 14px;
        font-family: 'Public Sans', sans-serif; font-size: .88rem;
        color: #E8E6E0; line-height: 1.55;
        margin: 8px 0; font-style: italic; }
      .msg-quote-icon { font-size: .72rem; color: var(--ho-green, #4E9978);
        margin-bottom: 4px; display: block; }
      .msg-quote-author { font-family: 'Archivo', sans-serif; font-weight: 700;
        font-size: .78rem; color: var(--ho-green-dark, #3D6B56);
        margin-bottom: 5px; font-style: normal; }
      .msg-quote-source { font-family: 'JetBrains Mono', monospace; font-size: .64rem;
        color: var(--ho-text-mid, #6E6A60); margin-top: 5px; font-style: normal; }

      /* Tags */
      .msg-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
      .msg-tag { font-family: 'JetBrains Mono', monospace; font-size: .62rem;
        background: var(--ho-green-pale, #E0F0EB); color: var(--ho-green-dark, #3D6B56);
        padding: 2px 8px; border-radius: 6px; font-weight: 600; }

      .msg-time.hornero-time { font-family: 'JetBrains Mono', monospace; font-size: .58rem;
        color: var(--ho-text-light, #9C988D); opacity: .7; margin-top: 6px; }

      /* === Actions row: copiar, reenviar, like/dislike (after hornero msg) === */
      .msg-actions { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
      .msg-action-btn { background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 8px; padding: 5px; cursor: pointer;
        font-family: 'Public Sans', sans-serif; font-size: .72rem;
        color: var(--ho-text-mid, #6E6A60); display: flex; align-items: center; justify-content: center;
        transition: border-color .2s, color .2s; }
      .msg-action-btn:hover { border-color: var(--ho-green, #4E9978);
        color: var(--ho-green, #4E9978); }
      .msg-action-btn.liked { color: var(--ho-green, #4E9978);
        border-color: var(--ho-green, #4E9978); background: var(--ho-green-pale, #E0F0EB); }
      .msg-action-btn.disliked { color: var(--ho-gold, #B0863F);
        border-color: var(--ho-gold, #B0863F); background: #F0E4CC; }
      .msg-action-btn svg { width: 14px; height: 14px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .msg-action-btn.liked svg.thumb-up { fill: var(--ho-green, #4E9978); }
      .msg-action-btn.disliked svg.thumb-down { fill: var(--ho-gold, #B0863F); }

      /* Typing indicator — no bubble, just dots inline */
      .typing-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        animation: msgin .2s ease; }
      .typing-avatar { width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center; flex: none; }
      .typing-avatar img { width: 32px; height: 32px; object-fit: cover; object-position: center 25%;
        filter: var(--ho-persona-filter, none); }
      .typing-avatar img.periodista-full { object-fit: contain; object-position: center; }
      :host(.theme-light) .typing-row.persona-hornero .typing-avatar img { filter: brightness(0.35); }
      .typing-dots { display: flex; gap: 5px; align-items: center; }
      .typing-dot { width: 8px; height: 8px; border-radius: 50%;
        background: var(--ho-green-light, #80CCA0); animation: dotbounce 1.4s ease infinite; }
      .typing-dot:nth-child(2) { animation-delay: .2s; }
      .typing-dot:nth-child(3) { animation-delay: .4s; }

      /* Streaming message — live text with cursor */
      .streaming-text { line-height: 1.5; }
      .streaming-cursor { display: inline-block; width: 2px; height: 1em;
        background: var(--ho-green-light, #80CCA0); margin-left: 2px;
        animation: blink 1s step-end infinite; vertical-align: text-bottom; }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

      /* Suggestion buttons — format options */
      .chat-suggestions { display: grid; grid-template-columns: 1fr 1fr;
        gap: 8px; padding: 10px 16px; flex: none; }
      .chat-suggestions::-webkit-scrollbar { display: none; }
      .chat-suggestion-btn { border-radius: 12px; padding: 12px 10px;
        background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        color: var(--ho-text, #E8E6E0);
        font-family: 'Archivo', sans-serif; font-size: .78rem;
        font-weight: 700; cursor: pointer; text-align: center;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        transition: border-color .2s, background .2s; }
      .chat-suggestion-btn:hover { border-color: var(--ho-green, #4E9978);
        background: var(--ho-green-pale, #E0F0EB); }
      .chat-suggestion-btn:active { background: var(--ho-green, #4E9978);
        color: var(--ho-text-off, #F2F1EC); }
      .suggestion-emoji { font-size: 1.4rem; }

      /* === Input bar: fondo CLARO (no gris oscuro) — compact === */
      .chat-input { background: var(--ho-bg, #1E2321);
        border-top: 1px solid var(--ho-border, rgba(255,255,255,.08));
        padding: 6px 10px calc(8px + env(safe-area-inset-bottom, 0px));
        display: flex; align-items: center; gap: 6px; flex: none; }

      .chat-input-field { flex: 1; background: var(--ho-card, #2A3230);
        border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 22px; padding: 6px 14px; font-size: .88rem;
        color: var(--ho-text, #E8E6E0); font-family: 'Public Sans', sans-serif;
        outline: none; transition: border-color .2s;
        min-height: 34px; max-height: 120px;
        resize: none; overflow-y: hidden;
        line-height: 20px; box-sizing: border-box; }
      .chat-input-field:focus { border-color: var(--ho-green, #4E9978); }
      .chat-input-field::placeholder { color: var(--ho-text-light, #9C988D); }

      /* Input toolbar buttons — compact */
      .chat-toolbar { display: flex; align-items: center; gap: 3px; flex: none; align-self: center; }
      .chat-toolbar-btn { width: 32px; height: 32px; border-radius: 50%;
        border: none; cursor: pointer; display: flex; align-items: center;
        justify-content: center; flex: none; transition: background .2s, transform .15s; }
      .chat-toolbar-btn:hover { transform: scale(1.08); }
      .chat-toolbar-btn svg { width: 16px; height: 16px; stroke-width: 2;
        fill: none; stroke-linecap: round; stroke-linejoin: round; }

      .chat-attach-btn { background: var(--ho-green-pale, #E0F0EB); }
      .chat-attach-btn svg { stroke: var(--ho-green-dark, #3D6B56); fill: var(--ho-green-dark, #3D6B56); }

      .chat-mic-btn { background: var(--ho-green-pale, #E0F0EB);
        position: relative; overflow: visible; }
      .chat-mic-btn svg { stroke: var(--ho-green-dark, #3D6B56); fill: none; }

      /* Recording state: red-orange, pulsing, shows timer */
      .chat-mic-btn.recording { background: #E85D3A;
        animation: recordingPulse 1s ease infinite; }
      .chat-mic-btn.recording svg { stroke: #fff; }
      @keyframes recordingPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,93,58,.35) }
        50% { box-shadow: 0 0 0 10px rgba(232,93,58,.1) } }

      /* Processing state: muted green, disabled */
      .chat-mic-btn.processing { background: var(--ho-green, #4E9978);
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


      .chat-send-btn { background: var(--ho-green, #4E9978); }
      .chat-send-btn svg { stroke: var(--ho-text-off, #F2F1EC);
        fill: var(--ho-text-off, #F2F1EC); }

      .chat-mic-btn.hidden { display: none; }
      .chat-send-btn.hidden { display: none; }

      /* Hidden file input for attachments */
      .chat-file-input { display: none; }

      /* Delete message button — icon only, always below message */
      .msg-delete-btn { background: none; border: none; cursor: pointer;
        padding: 2px; color: var(--ho-text-light, #9C988D); opacity: .5;
        display: flex; align-items: center; transition: opacity .2s, color .2s; }
      .msg-delete-btn:hover { opacity: 1; color: #D32F2F; }
      .msg-delete-btn svg { width: 12px; height: 12px; stroke: currentColor;
        stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }

      /* Delete button for user bubbles — positioned below bubble */
      .msg-row.user .msg-meta-row { display: flex; justify-content: flex-end;
        align-items: center; gap: 6px; margin-top: 3px; }

      /* Attachment preview in input */
      .chat-attach-preview { max-width: 80px; max-height: 60px; border-radius: 8px;
        overflow: hidden; flex: none; margin-right: 4px; }
      .chat-attach-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .chat-attach-preview video { width: 100%; height: 100%; object-fit: cover; display: block; }
      .chat-attach-remove { position: absolute; top: -4px; right: -4px;
        background: var(--ho-dark, #1E2321); color: var(--ho-text-off, #F2F1EC);
        border: none; border-radius: 50%; width: 18px; height: 18px;
        font-size: .62rem; cursor: pointer; display: flex; align-items: center;
        justify-content: center; }
      .chat-attach-preview-wrap { position: relative; flex: none; }

      /* Export confirmation popup — modal overlay */
      .export-confirm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 950; background: rgba(43,42,38,.55); display: flex;
        align-items: center; justify-content: center; }
      .export-confirm-dialog { background: var(--ho-card, #2A3230); border-radius: 18px;
        padding: 24px 22px 18px; width: 280px; text-align: center;
        box-shadow: 0 8px 32px rgba(43,42,38,.25);
        animation: msgin .25s ease; }
      .export-confirm-icon { font-size: 2rem; margin-bottom: 8px; }
      .export-confirm-title { font-family: 'Archivo', sans-serif; font-weight: 800;
        font-size: 1rem; color: var(--ho-text, #E8E6E0); margin-bottom: 6px; }
      .export-confirm-subtitle { font-family: 'Public Sans', sans-serif;
        font-size: .82rem; color: var(--ho-text-mid, #6E6A60); line-height: 1.4;
        margin-bottom: 18px; }
      .export-confirm-actions { display: flex; gap: 10px; justify-content: center; }
      .export-confirm-cancel { background: none; border: 1px solid var(--ho-border, rgba(255,255,255,.08));
        border-radius: 10px; padding: 10px 20px; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .84rem;
        color: var(--ho-text-light, #9C988D); transition: background .2s; }
      .export-confirm-cancel:hover { background: var(--ho-green-pale, #E0F0EB); }
      .export-confirm-ok { background: var(--ho-green, #4E9978); border: none;
        border-radius: 10px; padding: 10px 20px; cursor: pointer;
        font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .84rem;
        color: var(--ho-text-off, #F2F1EC); transition: background .2s; }
      .export-confirm-ok:hover { background: var(--ho-green-dark, #3D6B56); }
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

    const typingPersona = this._getPersonaConfig(this.persona);
    const typingAvatarInner = typingPersona.img
      ? `<img src="${typingPersona.img}" alt="H" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="typing-avatar-emoji" style="display:none">${typingPersona.emoji}</span>`
      : `<span class="typing-avatar-emoji">${typingPersona.emoji}</span>`;
    const typingHtml = this.typing && !this.streamingText ?
      `<div class="typing-row persona-${this.persona}">
        <div class="typing-avatar">${typingAvatarInner}</div>
        <div class="typing-dots">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>` : '';

    // Streaming message — live text building token-by-token
    const streamingPersona = this._streamingPersona || this.persona;
    const streamingPersonaCfg = this._getPersonaConfig(streamingPersona);
    const streamingAvatarInner = streamingPersonaCfg.img
      ? `<img src="${streamingPersonaCfg.img}" alt="H" class="${streamingPersona === 'periodista' ? 'periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="msg-avatar-emoji" style="display:none">${streamingPersonaCfg.emoji}</span>`
      : `<span class="msg-avatar-emoji">${streamingPersonaCfg.emoji}</span>`;
    const streamingHtml = this.streamingText ?
      `<div class="msg-row hornero streaming">
        <div class="msg-avatar-row persona-${streamingPersona}">
          <div class="msg-avatar">${streamingAvatarInner}</div>
          <div class="msg-avatar-name" style="color:${streamingPersonaCfg.color}">${streamingPersonaCfg.name}</div>
        </div>
        <div class="msg-content">
          <div class="msg-text streaming-text">${this._formatMarkdown(this.streamingText)}</div>
          <div class="streaming-cursor"></div>
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

    // Persona icons — top-left corner (all 5 always visible, active one highlighted)
    const allPersonas = ['companero', 'abogado', 'periodista', 'historiador', 'sociologo'];
    // Screen mapping for navigation
    const personaScreenMap = {
      'abogado': { screen: 'consulta', persona: 'abogado' },
      'periodista': { screen: 'contenido', persona: 'periodista' },
      'companero': { screen: 'gremial', persona: 'companero' },
      'historiador': { screen: 'formacion', persona: 'historiador' },
      'sociologo': { screen: 'condicion', persona: 'sociologo' },
    };
    const personaIconsHtml = allPersonas.map((p, idx) => {
      const cfg = this._getPersonaConfig(p);
      const isActive = p === this.persona;
      const inner = cfg.img
        ? `<img src="${cfg.img}" alt="${cfg.name}" class="${p === 'periodista' ? 'periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="msg-avatar-emoji" style="display:none">${cfg.emoji}</span>`
        : `<span class="msg-avatar-emoji">${cfg.emoji}</span>`;
      const navData = personaScreenMap[p] || { screen: 'consulta', persona: p };
      // Short label for cintillo
      const shortLabels = { 'companero': 'Compañero/a', 'abogado': 'Derecho', 'periodista': 'Periodista', 'historiador': 'Historiadora', 'sociologo': 'Investigador/a' };
      const label = shortLabels[p] || cfg.name;
      return `<button class="chat-persona-icon${isActive ? ' active' : ''}" data-persona="${p}" data-nav-screen="${navData.screen}" data-nav-persona="${navData.persona || p}">
        <span class="persona-icon-inner">${inner}</span>
        <span class="persona-cintillo-label">${label}</span>
      </button>`;
    }).join('');

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

    // History drawer — section icons mapping (matches _getPersonaConfig)
    const sectionConfig = {
      consulta:  { emoji: '📖', label: 'Derecho',    color: '#2B5278', persona: 'abogado' },
      contenido: { emoji: '🎙️', label: 'Contenido', color: '#5A4A3A', persona: 'periodista' },
      debate:    { emoji: '✊', label: 'Compañero/a', color: '#7A3B1E', persona: 'companero' },
      reporte:   { emoji: '✊', label: 'Compañero/a', color: '#7A3B1E', persona: 'companero' },
      historia:  { emoji: '📜', label: 'Historia',   color: '#4A3A5A', persona: 'historiador' },
      panorama:  { emoji: '🔬', label: 'Panorama',  color: '#2D5A3D', persona: 'sociologo' },
      ecosistema: { emoji: '🪶', label: 'Ecosistema', color: '#4E9978', persona: 'hornero' },
    };
    const defaultSection = { emoji: '✊', label: 'Hornero', color: '#7A3B1E', persona: 'abogado' };

    const historyDrawerHtml = this._showHistory ?
      `<div class="history-overlay">
        <div class="history-drawer${this._historyDrawerStable ? ' stable' : ''}">
          <div class="history-header">
            <div class="history-header-title">${this.historyTitle || 'Historial'}</div>
            <button class="history-new-btn" title="Nuevo chat">
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="history-close-btn">
              <svg viewBox="0 0 24 24">${xSvg}</svg>
            </button>
          </div>
          <div class="history-list">
            ${this._historySessions.length === 0 ?
              '<div class="history-empty">No hay chats guardados</div>' :
              this._historySessions.map(s => {
                const sec = sectionConfig[s.section] || defaultSection;
                const sectionClass = s.section ? `section-${s.section}` : 'section-default';
                const isActive = s.sessionId === this.sessionId;
                const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '';
                const timeStr = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
                // Use persona from session data (if available), fallback to sectionConfig
                const personaKey = s.persona || sec.persona;
                const personaCfg = this._getPersonaConfig(personaKey);
                const iconInner = personaCfg.img
                  ? `<img src="${personaCfg.img}" alt="${sec.label}" class="history-item-persona-img${personaKey === 'periodista' ? ' periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="history-item-section-emoji" style="display:none">${sec.emoji}</span>`
                  : `<span class="history-item-section-emoji">${sec.emoji}</span>`;
                // SVG icons for action buttons
                const downloadIcon = '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
                const reenviarIcon = '<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>';
                const deleteIcon = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>';
                return `<div class="history-item${isActive ? ' active' : ''}" data-session-id="${s.sessionId}">
                  <div class="history-item-section ${sectionClass}">
                    <span class="history-item-section-icon">${iconInner}</span>
                    <span class="history-item-section-label">${sec.label}</span>
                  </div>
                  <div class="history-item-preview">${s.preview || 'Nuevo chat'}</div>
                  <div class="history-item-meta">
                    ${s.username ? '<span class="history-item-user">@' + s.username + '</span>' : ''}
                    <span class="history-item-count">${s.messageCount} msgs</span>
                  </div>
                  <div class="history-item-footer">
                    <span class="history-item-date">${dateStr} · ${timeStr}</span>
                    <div class="history-item-actions">
                      <button class="history-action-btn" data-action="download" data-session-id="${s.sessionId}" title="Descargar">
                        <svg viewBox="0 0 24 24">${downloadIcon}</svg>
                      </button>
                      <button class="history-action-btn" data-action="reenviar" data-session-id="${s.sessionId}" title="Reenviar">
                        <svg viewBox="0 0 24 24">${reenviarIcon}</svg>
                      </button>
                      <button class="history-action-btn" data-action="delete" data-session-id="${s.sessionId}" title="Borrar">
                        <svg viewBox="0 0 24 24">${deleteIcon}</svg>
                      </button>
                    </div>
                  </div>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>` : '';

    // Informes drawer — estado labels (3 estados claros)
    const estadoLabelMap = {
      'pendiente': '⏳ Pendiente de revisión',
      'aprobado': '✅ Aprobado sin cambios',
      'aprobado-con-cambios': '📝 Aprobado con cambios',
      // Legacy compat
      'aprobado-delegado': '✅ Aprobado sin cambios',
      'corregido-delegado': '📝 Aprobado con cambios',
      'visto': '⏳ Pendiente de revisión',
      'aceptado': '✅ Aprobado sin cambios',
      'corregido': '📝 Aprobado con cambios',
    };
    const estadoClassMap = {
      'pendiente': 'estado-pendiente',
      'aprobado': 'estado-aprobado',
      'aprobado-con-cambios': 'estado-con-cambios',
      // Legacy compat
      'aprobado-delegado': 'estado-aprobado',
      'corregido-delegado': 'estado-con-cambios',
      'visto': 'estado-pendiente',
      'aceptado': 'estado-aprobado',
      'corregido': 'estado-con-cambios',
    };
    const informesDrawerHtml = this._showInformes ?
      `<div class="informes-overlay">
        <div class="informes-drawer${this._informesDrawerStable ? ' stable' : ''}">
          <div class="informes-header">
            <button class="informes-back-btn" id="informesBackBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="informes-header-title">${this.informesTitle || 'Mis Reportes'}</div>
            <button class="informes-close-btn">
              <svg viewBox="0 0 24 24">${xSvg}</svg>
            </button>
          </div>
          <div class="informes-list">
            ${this._informesList.length === 0 ?
              '<div class="informes-empty">No hay informes guardados</div>' :
              this._informesList.map(inf => {
                const numero = inf.numero || '';
                const titleText = numero ? 'Reporte Gremial N°' + numero :
                  (inf.sections && inf.sections.length > 0 ?
                    (inf.sections[0].title || inf.sections[0].body || '').substring(0, 80) :
                    (inf.contenido || '').substring(0, 80));
                const dateStr = inf.fecha || '';
                const displayEstado = inf.estado || 'pendiente';
                const estadoClass = estadoClassMap[displayEstado] || '';
                const estadoLabel = estadoLabelMap[displayEstado] || displayEstado;
                const gradoBadge = inf.grado ? `<span class="informes-item-grado">G${inf.grado}</span>` : '';
                // Corregir: activo solo para pendiente/aceptado, disabled para visto+
                const corregirDisabled = (displayEstado !== 'pendiente' && displayEstado !== 'aceptado') ? ' disabled' : '';
                // SVG icons for action buttons
                const downloadIcon = '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
                const reenviarIcon = '<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>';
                const corregirIcon = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
                return `<div class="informes-item" data-informe-id="${inf.id}">
                  <div class="informes-item-title">${titleText || 'Informe gremial'}</div>
                  <div class="informes-item-meta">
                    ${inf.username ? '<span class="informes-item-user">@' + inf.username + '</span>' : ''}
                    ${gradoBadge}
                    <span class="informes-item-estado ${estadoClass}">${estadoLabel}</span>
                  </div>
                  <div class="informes-item-footer">
                    <span class="informes-item-date">${dateStr}</span>
                    <div class="informes-item-actions">
                      <button class="informes-action-btn" data-action="download" data-informe-id="${inf.id}" title="Descargar">
                        <svg viewBox="0 0 24 24">${downloadIcon}</svg>
                      </button>
                      <button class="informes-action-btn" data-action="reenviar" data-informe-id="${inf.id}" title="Reenviar">
                        <svg viewBox="0 0 24 24">${reenviarIcon}</svg>
                      </button>
                      <button class="informes-action-btn" data-action="corregir" data-informe-id="${inf.id}" title="Corregir"${corregirDisabled}>
                        <svg viewBox="0 0 24 24">${corregirIcon}</svg>
                      </button>
                    </div>
                  </div>
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>` : '';

    // Informes SVG icon (document/clipboard)
    const informeSvg = '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>';

    // Export SVG icon (download arrow)
    const exportSvg = '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';

    // Recibidos SVG icon (inbox — arrow down into tray)
    const recibidosSvg = '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0018.56 4H5.44a2 2 0 00-1.99 1.11z"/>';

    // Show recibidos icon only for grades B.b, B.c, B.d (not B.a or A) and not hidden
    const isHigherGrade = this.grade === 'B.b' || this.grade === 'B.c' || this.grade === 'B.d';

    return html`
      <div class="chat-top-bar"${this.hidePersonaBar && !this.centerLogo ? ' style="display:none"' : ''}>
        <div class="chat-top-bar-left">
          <button class="chat-back-btn" id="chatBackBtn" title="Volver">
            <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
        </div>
        <div class="chat-top-bar-center">
          ${this.hidePersonaBar ? (this.centerLogo ? html`<img class="chat-top-bar-logo" src="${this.centerLogo}" alt="">` : '') : personaIconsHtml}
        </div>
        <div class="chat-top-bar-right">
          ${this.hidePersonaBar ? '' : this._plusMenuOpen ? html`
            <div class="chat-plus-menu" id="chatPlusMenu">
              <button class="chat-plus-btn open" id="chatPlusBtn" title="Cerrar">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <div class="chat-plus-divider"></div>
              <button class="chat-plus-item" id="chatHistoryBtn" title="Mis Conversaciones">
                <span class="item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <span class="item-label">Historial</span>
              </button>
              ${!this.hideInformesBtn ? html`
                <button class="chat-plus-item" id="chatInformesBtn" title="Mis Reportes">
                  <span class="item-icon"><svg viewBox="0 0 24 24">${informeSvg}</svg></span>
                  <span class="item-label">Reportes</span>
                  ${this.informeBadge ? html`<span class="item-badge"></span>` : ''}
                </button>
              ` : ''}
              ${isHigherGrade && !this.hideRecibidosBtn ? html`
                <button class="chat-plus-item" id="chatRecibidosBtn" title="Reportes recibidos">
                  <span class="item-icon"><svg viewBox="0 0 24 24">${recibidosSvg}</svg></span>
                  <span class="item-label">Recibidos</span>
                  ${this._recibidosBadge ? html`<span class="item-badge gold"></span>` : ''}
                </button>
              ` : ''}
            </div>
          ` : html`
            <button class="chat-plus-btn" id="chatPlusBtn" title="Más opciones">
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          `}
        </div>
      </div>

      ${progressFill}

      <div class="chat-scroll">
        ${messagesHtml}
        ${streamingHtml}
        ${typingHtml}
      </div>

      ${suggestionsHtml}

      <div class="chat-input">
        ${attachPreview}
        <textarea class="chat-input-field" rows="1" placeholder="${this.inputPlaceholder}" autocomplete="nope" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore></textarea>
        <input class="chat-file-input" type="file" accept="image/*,video/*">
        <div class="chat-toolbar">
          <button class="chat-toolbar-btn chat-attach-btn" title="Adjuntar imagen o video">
            <svg viewBox="0 0 24 24">${attachSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-mic-btn${this._isRecording ? ' recording' : ''}${this._audioProcessing ? ' processing' : ''}" title="${micTitle}">
            <svg viewBox="0 0 24 24">${micIcon}</svg>
            ${this._isRecording ? '<span class="recording-timer">0:00</span>' : ''}
          </button>
          <button class="chat-toolbar-btn chat-export-btn" id="chatExportBtn" title="Exportar chat">
            <svg viewBox="0 0 24 24">${exportSvg}</svg>
          </button>
          <button class="chat-toolbar-btn chat-send-btn hidden" title="Enviar">
            <svg viewBox="0 0 24 24">${sendSvg}</svg>
          </button>
        </div>
      </div>

      ${historyDrawerHtml}

      ${informesDrawerHtml}

      ${isHigherGrade ? (this._showRecibidos ?
        `<div class="recibidos-overlay">
          <div class="recibidos-drawer${this._recibidosDrawerStable ? ' stable' : ''}">
            <div class="informes-header">
              <div class="informes-header-title">Reportes Recibidos</div>
              <button class="informes-close-btn" id="recibidosCloseBtn">
                <svg viewBox="0 0 24 24">${xSvg}</svg>
              </button>
            </div>
            <div class="informes-list">
              ${(() => {
                const pendientes = this._informesEntrantes.filter(inf => inf.estado === 'pendiente');
                const revisados = this._informesEntrantes.filter(inf => inf.estado !== 'pendiente');
                if (this._informesEntrantes.length === 0) return '<div class="informes-empty">No hay reportes recibidos</div>';

                const renderItem = (inf, isReviewed) => {
                  const numero = inf.numero || '';
                  const titleText = numero ? 'Reporte Gremial N°' + numero :
                    (inf.sections && inf.sections.length > 0 ?
                      (inf.sections[0].title || inf.sections[0].body || '').substring(0, 80) :
                      (inf.contenido || '').substring(0, 80));
                  const dateStr = inf.fecha || '';
                  const tags = inf.etiquetas && inf.etiquetas.temas ? inf.etiquetas.temas : [];
                  const tagsHtml = tags.length > 0 ?
                    `<div class="informes-item-tags">${tags.map(t => `<span class="informes-item-tag">${t}</span>`).join('')}</div>` : '';
                  const gradoBadge = inf.grado ? `<span class="informes-item-tag" style="background:#D4E4F7;color:#2B5278">G${inf.grado}</span>` : '';
                  const empresaLabel = inf.empresa ? `<span class="informes-item-tag">${inf.empresa}</span>` : '';
                  const estadoLabelMap = {
                    'pendiente': '⏳ Pendiente',
                    'aprobado': '✅ Aprobado sin cambios',
                    'aprobado-con-cambios': '📝 Con cambios',
                    'aprobado-delegado': '✅ Aprobado sin cambios',
                    'corregido-delegado': '📝 Con cambios',
                    'visto': '⏳ Pendiente',
                  };
                  const estadoClassMap = {
                    'pendiente': 'estado-pendiente',
                    'aprobado': 'estado-aprobado',
                    'aprobado-con-cambios': 'estado-con-cambios',
                    'aprobado-delegado': 'estado-aprobado',
                    'corregido-delegado': 'estado-con-cambios',
                    'visto': 'estado-pendiente',
                  };
                  const estadoLabel = estadoLabelMap[inf.estado] || inf.estado;
                  const estadoClass = estadoClassMap[inf.estado] || '';
                  const fadeClass = isReviewed ? ' informes-item-reviewed' : '';
                  const reviewBtnHtml = !isReviewed ? `<div class="informes-review-actions">
                    <button class="informes-review-btn aprobar" data-review-informe="${inf.id}" data-review-action="aprobar" title="Aprobar"><svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round"><polyline points="20 6 9 17 4 12"/></svg></button>
                    <button class="informes-review-btn corregir" data-review-informe="${inf.id}" data-review-action="corregir" title="Corregir"><svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  </div>` : '';
                  return `<div class="informes-item${fadeClass}" data-informe-id="${inf.id}">
                    <div class="informes-item-title">${titleText || 'Informe gremial'}</div>
                    <div class="informes-item-meta">
                      <span>${dateStr}</span>
                      ${inf.username ? '<span class="history-item-user">@' + inf.username + '</span>' : ''}
                      ${gradoBadge} ${empresaLabel}
                      <span class="informes-item-estado ${estadoClass}">${estadoLabel}</span>
                    </div>
                    ${tagsHtml}
                    ${reviewBtnHtml}
                  </div>`;
                };

                let html = '';
                if (pendientes.length > 0) {
                  html += pendientes.map(inf => renderItem(inf, false)).join('');
                }
                if (revisados.length > 0) {
                  html += `<div class="informes-separator">Revisados</div>`;
                  html += revisados.map(inf => renderItem(inf, true)).join('');
                }
                return html;
              })()}
            </div>
          </div>
        </div>` : '') : ''}

      <div class="download-toast" id="downloadToast">📥 Descargado como TXT</div>
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

      // --- Empty line = paragraph separator (skip: <p> margin already handles it) ---
      if (trimmed === '') {
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
    // Links: [text](url) → <a href="url" target="_blank">text</a>
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--ho-green,#4E9978);font-weight:600;text-decoration:none">$1</a>');
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
    const isLight = this.theme === 'light';
    const map = {
      'abogado':      { emoji: '📖', name: 'Abogado/a',     bg: '#D4E4F7', color: '#2B5278', img: 'assets/personajes/a03.png' },
      'companero':    { emoji: '✊', name: 'Compañero/a',    bg: '#C89660', color: '#7A3B1E', img: 'assets/personajes/a02.png' },
      'periodista':   { emoji: '🎙️', name: 'Periodista',   bg: '#E8E0D7', color: '#5A4A3A', img: 'assets/personajes/a04.png' },
      'historiador':  { emoji: '📜', name: 'Historiadora',   bg: '#D7D4E8', color: '#4A3A5A', img: 'assets/personajes/a01.png' },
      'sociologo':    { emoji: '🔬', name: 'Investigador/a', bg: '#D4E8D7', color: '#2D5A3D', img: 'assets/personajes/a05.png' },
      'hornero':      { emoji: '🪶', name: 'Hornero',        bg: '#D4E8D7', color: '#4E9978', img: 'assets/hornero-logo-nobg.png' },
    };
    return map[persona] || map['abogado'];
  }

  _renderMessage(m, msgIndex) {
    const role = m.role || 'hornero';

    // === USER message: bubble + delete ===
    if (role === 'user') {
      const timeHtml = m.time ? `<div class="msg-time">${m.time}</div>` : '';
      const mediaHtml = m.image ?
        `<div class="msg-media"><img src="${m.image}" alt="imagen"></div>` :
        m.video ?
        `<div class="msg-media"><video src="${m.video}" controls></video></div>` : '';
      const textHtml = m.text ? m.text : '';
      const deleteSvg = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/>';
      return `<div class="msg-row user">
        <div class="msg-bubble">${mediaHtml}${textHtml}</div>
        <div class="msg-meta-row">
          ${timeHtml}
          <button class="msg-delete-btn" data-action="delete" data-msg-index="${msgIndex}" title="Borrar mensaje">
            <svg viewBox="0 0 24 24">${deleteSvg}</svg>
          </button>
        </div>
      </div>`;
    }

    // === HORNERO message: NO bubble — plain text ===
    const timeHtml = m.time ? `<div class="msg-time hornero-time">${m.time}</div>` : '';

    // Avatar + name row — persona-aware
    const personaCfg = this._getPersonaConfig(m.persona || this.persona);
    const avatarInner = personaCfg.img
      ? `<img src="${personaCfg.img}" alt="H" class="${(m.persona || this.persona) === 'periodista' ? 'periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="msg-avatar-emoji" style="display:none">${personaCfg.emoji}</span>`
      : `<span class="msg-avatar-emoji">${personaCfg.emoji}</span>`;
    const avatarRow = `<div class="msg-avatar-row persona-${m.persona || this.persona}">
      <div class="msg-avatar">${avatarInner}</div>
      <div class="msg-avatar-name" style="color:${personaCfg.color}">${personaCfg.name}</div>
    </div>`;

    // === REPORTE DESPLEGABLE: if tags include 'reporte-generado' or looks like a reporte ===
    const tags = m.tags || [];
    const isReporteGenerado = tags.includes('reporte-generado');
    const isReporteAprobado = tags.includes('reporte-aprobado');
    // Fallback: detect reportes without 'reporte-generado' tag (IA didn't include it)
    const looksLikeReporte = !isReporteGenerado && m.sections && m.sections.length >= 2 &&
      m.sections.some(s => (s.title || '').toLowerCase().includes('relato'));

    if ((isReporteGenerado || looksLikeReporte) && m.sections && m.sections.length > 0) {
      // Render as expandable report card
      const estadoClass = isReporteAprobado ? 'estado-aceptado' : '';
      const expandedKey = 'report-' + msgIndex;
      const isExpanded = this._expandedReports[expandedKey] || false;

      const titleSection = m.sections[0];
      const isModificado = tags.includes('correccion-modificado');
      const cardTitle = (titleSection.title || 'Informe Gremial') + (isModificado ? ' (Modificado)' : '');
      const summary = titleSection.body ? titleSection.body.substring(0, 120) : '';

      const sectionsHtml = m.sections.map((s, i) => {
        let content = '';
        // Detect section type for styling based on title
        const sectionTitle = (s.title || '').toLowerCase();
        let sectionType = 'default';
        if (sectionTitle.includes('relato')) sectionType = 'relato';
        else if (sectionTitle.includes('clasificación') || sectionTitle.includes('clasificacion') || sectionTitle.includes('etiqueta')) sectionType = 'clasificacion';
        else if (sectionTitle.includes('transcript')) sectionType = 'transcript';
        else if (sectionTitle.includes('extracto') || sectionTitle.includes('diálogo') || sectionTitle.includes('dialogo')) sectionType = 'extractos';
        else if (sectionTitle.includes('ficha') || sectionTitle.includes('reportante')) sectionType = 'ficha';
        if (i > 0 && s.title) content += `<div class="reporte-card-section-title">${s.title}</div>`;
        else if (i > 0) content += `<div class="reporte-card-section-title">Detalle</div>`;
        if (s.body) {
          // Clean AI confirmation text from section body (not part of the informe)
          let cleanBody = s.body
            .replace(/\n*---\s*\n.*$/s, '')
            .replace(/\n*¿Es esto lo que querías.*$/s, '')
            .replace(/\n*respuesta-libre\s*$/s, '')
            .replace(/[\s\n]+$/, '');
          let bodyHtml = this._formatMarkdown(cleanBody);
          // In Clasificación section: convert #tag patterns into visual tag badges
          if (sectionType === 'clasificacion') {
            bodyHtml = bodyHtml.replace(/#([a-záéíóúñ_]+)/g, '<span class="reporte-card-tag clasif-tag">#$1</span>');
          }
          content += `<div class="reporte-card-section-body">${bodyHtml}</div>`;
        }
        const divider = (i < m.sections.length - 1) ? '<div class="reporte-card-divider"></div>' : '';
        return `<div class="reporte-card-section" data-section-type="${sectionType}">${content}</div>${divider}`;
      }).join('');

      // Tags inside card (excluding system tags)
      const visibleTags = tags.filter(t => t !== 'reporte-generado' && t !== 'reporte' && t !== 'reporte-aprobado' && t !== 'respuesta-libre');
      const tagsHtml = visibleTags.length > 0 ?
        `<div class="reporte-card-tags">${visibleTags.map(t => `<span class="reporte-card-tag">${t}</span>`).join('')}</div>` : '';

      // Action buttons — icon-only, subtle SVGs; aprobado shares same card with different actions
      const trashSvg = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>';
      const shareSvg = '<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>';
      const approveSvg = '<polyline points="20 6 9 17 4 12"/>';
      const editSvg = '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
      const shareBtn = `<button class="reporte-btn reporte-btn-share" data-reporte-action="compartir" data-msg-index="${msgIndex}" title="Compartir"><svg viewBox="0 0 24 24">${shareSvg}</svg></button>`;
      const deleteBtn = `<button class="reporte-btn reporte-btn-delete" data-reporte-action="borrar" data-msg-index="${msgIndex}" title="Borrar"><svg viewBox="0 0 24 24">${trashSvg}</svg></button>`;
      const promptText = isReporteAprobado
        ? '' // No prompt for already-approved reports
        : '<div class="reporte-card-prompt">Revisá el informe. Si está todo bien, tocá <strong>Aprobar</strong>.</div>';
      const actionsHtml = isReporteAprobado ?
        '' :
        `<button class="reporte-btn-aprobar" data-reporte-action="aprobar" data-msg-index="${msgIndex}" title="Aprobar">Aprobar</button>`;

      // Text before the card (like "Leelo con cuidado...")
      const textBefore = m.text ? `<div class="msg-text">${this._formatMarkdown(m.text)}</div>` : '';

      return `<div class="msg-row hornero">
        ${avatarRow}
        <div class="msg-content">
          ${textBefore}
          ${promptText}
          <div class="reporte-card ${estadoClass}" data-report-key="${expandedKey}">
            <div class="reporte-card-header">
              <span class="reporte-card-icon">📄</span>
              <span class="reporte-card-title">${cardTitle}</span>
            </div>
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
    // Tags rendered for both text and sections modes (hide respuesta-libre in live chat)
    const visibleTags = (m.tags || []).filter(t => t !== 'respuesta-libre');
    const tagsHtml = visibleTags.length > 0 ?
      `<div class="msg-tags">${visibleTags.map(t => `<span class="msg-tag">${t}</span>`).join('')}</div>` : '';
    contentHtml += tagsHtml;

    // Download card — clickable file attachment for exported chats
    const downloadHtml = m.download ?
      `<div class="msg-download-card" data-action="download-file" data-msg-index="${msgIndex}">
        <span class="msg-download-icon">📄</span>
        <div class="msg-download-info">
          <span class="msg-download-filename">${m.download.filename}</span>
          <span class="msg-download-label">Click para descargar</span>
        </div>
      </div>` : '';

    // Actions: copiar, reenviar, like/dislike, borrar
    const deleteSvg = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/>';
    const actionsHtml = `<div class="msg-actions">
      <button class="msg-action-btn" data-action="copy" title="Copiar">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
      <button class="msg-action-btn" data-action="forward" title="Reenviar">
        <svg viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 12h16"/></svg>
      </button>
      <button class="msg-action-btn" data-action="like" title="Me gusta">
        <svg class="thumb-up" viewBox="0 0 24 24"><path d="M7 22V11L2 12V22H7Z"/><path d="M7 11L12 2C13.1 2 14 2.9 14 4V8H20C21.1 8 22 8.9 22 10V20C22 21.1 21.1 22 20 22H7"/></svg>
      </button>
      <button class="msg-action-btn" data-action="dislike" title="No me gusta">
        <svg class="thumb-down" viewBox="0 0 24 24"><path d="M17 2V13L22 12V2H17Z"/><path d="M17 13L12 22C10.9 22 10 21.1 10 19V16H4C2.9 16 2 15.1 2 14V4C2 2.9 2.9 2 4 2H17"/></svg>
      </button>
      <button class="msg-delete-btn" data-action="delete" data-msg-index="${msgIndex}" title="Borrar mensaje">
        <svg viewBox="0 0 24 24">${deleteSvg}</svg>
      </button>
    </div>`;

    // Redirect derivation button — if message has redirect_persona
    const redirectPersona = m.redirect_persona || '';
    const redirectBtnHtml = redirectPersona ? (() => {
      const targetCfg = this._getPersonaConfig(redirectPersona);
      const targetInner = targetCfg.img
        ? `<img src="${targetCfg.img}" alt="H" class="${redirectPersona === 'periodista' ? 'periodista-full' : ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="msg-redirect-emoji" style="display:none">${targetCfg.emoji}</span>`
        : `<span class="msg-redirect-emoji">${targetCfg.emoji}</span>`;
      return `<button class="msg-redirect-btn" data-redirect-persona="${redirectPersona}" style="background:transparent; border-color:${targetCfg.color}; color:${targetCfg.color}">
        <span class="msg-redirect-icon-circle" style="background:transparent">${targetInner}</span>
        Chatear con ${targetCfg.name}
      </button>`;
    })() : '';

    // "Ver mis informes" button — opens informes drawer
    const openInformes = m.open_informes || false;
    const informesBtnHtml = openInformes ?
      `<button class="msg-informes-btn" data-action="open-informes">📄 Ver mis informes</button>` : '';

    return `<div class="msg-row hornero">
      ${avatarRow}
      <div class="msg-content">
        ${downloadHtml}
        ${contentHtml}
        ${redirectBtnHtml}
        ${informesBtnHtml}
        ${timeHtml}
        ${actionsHtml}
      </div>
    </div>`;
  }

  _afterRender() {
    // === Apply theme class to host for CSS selectors ===
    if (this.theme === 'light') {
      this.classList.add('theme-light');
    } else {
      this.classList.remove('theme-light');
    }
    // === Top bar accent: only Historia Obrera when banner is hidden ===
    if (this.topBarAccent) {
      this.classList.add('topbar-accent');
    } else {
      this.classList.remove('topbar-accent');
    }

    // === Mark drawers as stable after first render (prevent slideIn replay) ===
    if (this._showHistory) this._historyDrawerStable = true;
    if (this._showInformes) this._informesDrawerStable = true;
    if (this._showRecibidos) this._recibidosDrawerStable = true;

    const inputField = this.shadowRoot.querySelector('.chat-input-field');
    const micBtn = this.shadowRoot.querySelector('.chat-mic-btn');
    const sendBtn = this.shadowRoot.querySelector('.chat-send-btn');
    const attachBtn = this.shadowRoot.querySelector('.chat-attach-btn');
    const fileInput = this.shadowRoot.querySelector('.chat-file-input');
    const removeAttachBtn = this.shadowRoot.querySelector('.chat-attach-remove');

    // === Visual Viewport: adjust chat height when keyboard opens ===
    // Prevents the entire page from scrolling up (losing conversation)
    // Only listens to 'resize' (not 'scroll') to avoid miscalculations
    // when the user scrolls the chat messages
    if (!this._visualViewportSetup) {
      this._visualViewportSetup = true;
      if (window.visualViewport) {
        const onViewportResize = () => {
          const kbHeight = window.innerHeight - window.visualViewport.height;
          if (kbHeight > 50) {
            // Keyboard is open — shrink chat to fit above keyboard
            const rect = this.getBoundingClientRect();
            this.style.height = (window.visualViewport.height - rect.top) + 'px';
          } else {
            // Keyboard closed — restore full height
            this.style.height = '';
          }
        };
        window.visualViewport.addEventListener('resize', onViewportResize);
      }
    }

    // === Back button → navigate to chat landing ===
    const backBtn = this.shadowRoot.querySelector('#chatBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.emit('chat-back', {});
      });
    }

    // === + button (cintillo right) → toggle dropdown menu ===
    const plusBtn = this.shadowRoot.querySelector('#chatPlusBtn');
    if (plusBtn) {
      plusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._plusMenuOpen = !this._plusMenuOpen;
        this.render();
      });
    }

    // === Close dropdown on outside click (persistent handler) ===
    // Remove previous handler if any
    if (this._plusMenuCloseHandler) {
      document.removeEventListener('click', this._plusMenuCloseHandler);
      this._plusMenuCloseHandler = null;
    }
    if (this._plusMenuOpen) {
      this._plusMenuCloseHandler = (e) => {
        const menu = this.shadowRoot.querySelector('#chatPlusMenu');
        if (menu && !menu.contains(e.target)) {
          this._plusMenuOpen = false;
          this._plusMenuCloseHandler = null;
          this.render();
        }
      };
      setTimeout(() => document.addEventListener('click', this._plusMenuCloseHandler), 0);
    }

    // === Input focus → emit event (parent can hide banner etc) ===
    if (inputField) {
      inputField.addEventListener('focus', () => {
        this.emit('chat-input-focus', {});
      });
    }

    // === History button (dropdown menu item) → open drawer ===
    const historyBtn = this.shadowRoot.querySelector('#chatHistoryBtn');
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this._plusMenuOpen = false;
        this._openHistoryDrawer();
      });
    }

    // === Informes button (dropdown menu item) → open drawer ===
    const informesBtn = this.shadowRoot.querySelector('#chatInformesBtn');
    if (informesBtn) {
      informesBtn.addEventListener('click', () => {
        this._plusMenuOpen = false;
        this._openInformesDrawer();
        this.emit('informes-open', {});
      });
    }

    // === Recibidos button (dropdown menu item) → open drawer ===
    const recibidosBtn = this.shadowRoot.querySelector('#chatRecibidosBtn');
    if (recibidosBtn) {
      recibidosBtn.addEventListener('click', () => {
        this._plusMenuOpen = false;
        this._openRecibidosDrawer();
      });
    }

    // === Export button (input toolbar) → confirm popup + download TXT ===
    const exportBtn = this.shadowRoot.querySelector('#chatExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this._exportInProgress) return; // Debounce guard
        if (!this.messages || this.messages.length === 0) return;
        this._exportInProgress = true;
        // Show confirmation popup before downloading
        this._showExportConfirm();
        setTimeout(() => { this._exportInProgress = false; }, 2000);
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

      // === Auto-resize textarea: shrink to fit content, grow as needed ===
      const autoResize = () => {
        // Shrink to force accurate scrollHeight measurement
        inputField.style.height = '0';
        const scrollH = inputField.scrollHeight;
        // +2px compensates border (1px top + 1px bottom) not in scrollHeight
        const targetH = Math.min(scrollH + 2, 120);
        inputField.style.height = targetH + 'px';
        inputField.style.overflowY = targetH >= 120 ? 'auto' : 'hidden';
      };
      inputField.addEventListener('input', autoResize);
      // Start at single-line height — only grow when user types

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
          inputField.style.height = '34px';
          inputField.style.padding = '0 14px';
          inputField.style.lineHeight = '34px';
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

    // === Persona icon buttons → navigate to that persona's screen ===
    this.shadowRoot.querySelectorAll('.chat-persona-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.navScreen;
        const persona = btn.dataset.navPersona;
        if (screen) {
          this.emit('persona-navigate', { persona, screen });
        }
      });
      // Scroll active persona into view
      if (btn.classList.contains('active')) {
        btn.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }
    });

    // === Redirect derivation buttons → switch persona / navigate ===
    this.shadowRoot.querySelectorAll('.msg-redirect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPersona = btn.dataset.redirectPersona;
        if (targetPersona) {
          this.emit('persona-redirect', { persona: targetPersona });
        }
      });
    });

    // === "Ver mis informes" button → open informes drawer ===
    this.shadowRoot.querySelectorAll('.msg-informes-btn[data-action="open-informes"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._openInformesDrawer();
      });
    });

    // === History drawer: close + swipe ===
    const historyOverlay = this.shadowRoot.querySelector('.history-overlay');
    const historyDrawerEl = this.shadowRoot.querySelector('.history-drawer');
    const historyCloseBtn = this.shadowRoot.querySelector('.history-close-btn');
    const historyNewBtn = this.shadowRoot.querySelector('.history-new-btn');
    if (historyOverlay) {
      historyOverlay.addEventListener('click', (e) => {
        if (e.target === historyOverlay) {
          this._closeHistoryDrawer();
        }
      });
    }
    if (historyNewBtn) {
      historyNewBtn.addEventListener('click', () => {
        this.emit('chat-new-session', {});
        this._closeHistoryDrawer();
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
        // Don't trigger if action button was clicked
        if (e.target.closest('.history-action-btn')) return;
        const sid = item.dataset.sessionId;
        if (sid) {
          this.emit('chat-session-select', { sessionId: sid, section: this.section });
          this._closeHistoryDrawer();
        }
      });
    });

    // === History drawer: action buttons (download, reenviar, delete) ===
    this.shadowRoot.querySelectorAll('.history-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const sid = btn.dataset.sessionId;
        if (!action || !sid) return;

        if (action === 'download') {
          if (typeof obtenerChatSessionMessages === 'function') {
            obtenerChatSessionMessages(sid).then(msgs => {
              if (msgs && msgs.length > 0) {
                const preview = (msgs[0].text || '').substring(0, 30).replace(/[?!.]+$/, '');
                this._downloadTxt(msgs, preview || 'chat-hornero', preview || 'chat-hornero');
              }
            }).catch(err => console.warn('Chat: export session failed', err));
          }
        } else if (action === 'reenviar') {
          this.emit('chat-session-reenviar', { sessionId: sid, section: this.section });
          this._closeHistoryDrawer();
        } else if (action === 'delete') {
          if (typeof borrarChatSession === 'function') {
            borrarChatSession(sid).then(() => {
              this.emit('chat-session-delete', { sessionId: sid, section: this.section });
              this._openHistoryDrawer();
              this.emit('chat-state-changed', {});
            }).catch((err) => {
              console.warn('Chat: delete session failed', err);
            });
          }
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
    const informesBackBtn = this.shadowRoot.querySelector('#informesBackBtn');
    if (informesBackBtn) {
      informesBackBtn.addEventListener('click', () => {
        this._closeInformesDrawer();
        this.emit('chat-back', {});
      });
    }
    if (informesDrawerEl) {
      this._setupDrawerSwipe(informesDrawerEl, () => this._closeInformesDrawer());
    }

    // === Recibidos drawer: close + swipe ===
    const recibidosOverlay = this.shadowRoot.querySelector('.recibidos-overlay');
    const recibidosDrawerEl = this.shadowRoot.querySelector('.recibidos-drawer');
    if (recibidosOverlay) {
      recibidosOverlay.addEventListener('click', (e) => {
        if (e.target === recibidosOverlay) {
          this._closeRecibidosDrawer();
        }
      });
    }
    const recibidosCloseBtn = this.shadowRoot.querySelector('#recibidosCloseBtn');
    if (recibidosCloseBtn) {
      recibidosCloseBtn.addEventListener('click', () => {
        this._closeRecibidosDrawer();
      });
    }
    if (recibidosDrawerEl) {
      this._setupDrawerSwipe(recibidosDrawerEl, () => this._closeRecibidosDrawer());
    }

    // === Recibidos drawer: approve / correct actions ===
    this.shadowRoot.querySelectorAll('[data-review-informe]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const infId = btn.dataset.reviewInforme;
        const action = btn.dataset.reviewAction;
        if (!infId) return;
        if (action === 'aprobar') {
          // Aprobar sin cambios: emitir evento al parent
          this.emit('informes-approve', { informeId: infId });
          this._closeRecibidosDrawer();
        } else if (action === 'corregir') {
          // Corregir: abrir informe en chat para edición con IA
          this.emit('informes-edit', { informeId: infId });
          this._closeRecibidosDrawer();
        }
      });
    });

    // === Informes drawer: select informe (delegate viewing transition) ===
    this.shadowRoot.querySelectorAll('.informes-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if action button was clicked
        if (e.target.closest('.informes-action-btn')) return;
        const infId = item.dataset.informeId;
        if (infId) {
          // Delegate viewing: if grade is B.b/B.c/B.d and informe is pendiente → transition to 'visto'
          try {
            const session = JSON.parse(localStorage.getItem('hornero-session'));
            const delegateGrades = ['B.b', 'B.c', 'B.d'];
            const inf = this._informesList.find(i => i.id === infId);
            if (session && delegateGrades.includes(session.grade) && inf && inf.estado === 'pendiente') {
              if (typeof actualizarEstadoInforme === 'function') {
                actualizarEstadoInforme(infId, 'visto').then(() => {
                  this.emit('informes-select', { informeId: infId });
                  if (this._showRecibidos) this._closeRecibidosDrawer();
                  else this._closeInformesDrawer();
                });
                return;
              }
            }
          } catch(e) {}
          this.emit('informes-select', { informeId: infId });
          if (this._showRecibidos) this._closeRecibidosDrawer();
          else this._closeInformesDrawer();
        }
      });
    });

    // === Informes drawer: action buttons (download, reenviar, corregir) ===
    this.shadowRoot.querySelectorAll('.informes-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const infId = btn.dataset.informeId;
        if (!action || !infId) return;

        if (action === 'download') {
          if (typeof obtenerInforme === 'function') {
            obtenerInforme(infId).then(inf => {
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
                this._downloadTxt(msgs, title, `informe-${inf.fecha || 'gremial'}`);
              }
            }).catch(err => console.warn('Chat: export informe failed', err));
          } else {
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
              this._downloadTxt(msgs, title, `informe-${inf.fecha || 'gremial'}`);
            }
          }
        } else if (action === 'reenviar') {
          this.emit('informes-reenviar', { informeId: infId });
          if (this._showRecibidos) this._closeRecibidosDrawer();
          else this._closeInformesDrawer();
        } else if (action === 'corregir') {
          if (btn.disabled) return;
          this.emit('informes-edit', { informeId: infId });
          if (this._showRecibidos) this._closeRecibidosDrawer();
          else this._closeInformesDrawer();
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
              btn.style.color = 'var(--ho-green, #4E9978)';
              btn.style.borderColor = 'var(--ho-green, #4E9978)';
              setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 1500);
            });
          }
        }

        if (action === 'forward') {
          const text = msgContent ? msgContent.textContent.trim() : '';
          // Web Share API if available, otherwise copy
          if (navigator.share) {
            navigator.share({ title: 'Hornero', text: text }).catch(() => {});
          } else {
            // Fallback: copy to clipboard
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ Copiado para reenviar';
                btn.style.color = 'var(--ho-green, #4E9978)';
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
          this.emit('chat-feedback', {
            type: 'like',
            liked: btn.classList.contains('liked'),
            messageIndex: msgIndex,
            persona: this.persona,
            sessionId: this.sessionId,
            messageText: (this.messages[msgIndex] || {}).text?.substring(0, 200) || '',
          });
        }

        if (action === 'dislike') {
          // Toggle dislike state
          btn.classList.toggle('disliked');
          // Remove like from sibling
          const likeBtn = btn.parentElement.querySelector('[data-action="like"]');
          if (likeBtn) likeBtn.classList.remove('liked');
          this.emit('chat-feedback', {
            type: 'dislike',
            disliked: btn.classList.contains('disliked'),
            messageIndex: msgIndex,
            persona: this.persona,
            sessionId: this.sessionId,
            messageText: (this.messages[msgIndex] || {}).text?.substring(0, 200) || '',
          });
        }
      });
    });

    // === Message delete buttons (user + hornero messages) ===
    this.shadowRoot.querySelectorAll('.msg-delete-btn[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msgIndex = Number(btn.dataset.msgIndex);
        if (msgIndex >= 0 && msgIndex < this.messages.length) {
          if (confirm('¿Borrar este mensaje?')) {
            this.deleteMessage(msgIndex);
          }
        }
      });
    });

    // === Download file cards (clickable file attachment in chat) ===
    // Direct download to device — no browser preview, opens with Notes/text editor
    this.shadowRoot.querySelectorAll('.msg-download-card[data-action="download-file"]').forEach(card => {
      card.addEventListener('click', () => {
        const msgIndex = Number(card.dataset.msgIndex);
        const msg = this.messages[msgIndex];
        if (msg && msg.download && msg.download.content) {
          const blob = new Blob([msg.download.content], { type: 'text/plain;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = msg.download.filename || 'chat-hornero.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 5000);
          this._showDownloadToast(msg.download.filename || 'chat-hornero');
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
    this.shadowRoot.querySelectorAll('.reporte-btn, .reporte-btn-aprobar').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.reporteAction;
        const msgIndex = Number(btn.dataset.msgIndex);
        if (action === 'aprobar') {
          this.emit('reporte-action', { action: 'aprobar', msgIndex });
        } else if (action === 'corregir') {
          this.emit('reporte-action', { action: 'corregir', msgIndex });
        } else if (action === 'compartir') {
          // Show share menu (WhatsApp, Email, Download TXT)
          this._showShareMenu(msgIndex);
        } else if (action === 'borrar') {
          if (msgIndex >= 0 && msgIndex < this.messages.length) {
            if (confirm('¿Borrar este informe?')) {
              this.deleteMessage(msgIndex);
            }
          }
        }
      });
    });

    // Scroll to bottom after render
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    this._autoScroll();
  }

  _autoScroll() {
    if (this.noAutoScroll) return;
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
      const role = m.role === 'user' ? '→ Trabajador' : '← Hornero';
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
body { font-family: 'Public Sans', Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #E8E6E0; background: #2A3230; line-height: 1.6; }
h1 { font-family: 'Archivo', sans-serif; font-weight: 800; color: #3D6B56; border-bottom: 2px solid #4E9978; padding-bottom: 8px; margin-bottom: 20px; }
.meta { font-family: monospace; font-size: .8rem; color: #9C988D; margin-bottom: 30px; }
.msg { margin-bottom: 24px; }
.msg-role { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: .85rem; color: #4E9978; }
.msg-role.user { color: #4E9978; }
.msg-role.hornero { color: #3D6B56; }
.msg-time { font-family: monospace; font-size: .7rem; color: #9C988D; }
.msg-content { margin: 6px 0; font-size: .95rem; }
.msg-section-title { font-family: 'Archivo', sans-serif; font-weight: 700; color: #3D6B56; margin-top: 10px; }
.msg-section-body { margin: 4px 0; }
.msg-quote { border-left: 3px solid #4E9978; background: #E0F0EB; padding: 10px 14px; margin: 8px 0; font-style: italic; border-radius: 0 8px 8px 0; }
.msg-quote-author { font-weight: 700; font-style: normal; color: #3D6B56; }
.msg-quote-source { font-family: monospace; font-size: .7rem; color: #6E6A60; font-style: normal; }
.msg-tags { margin-top: 6px; }
.msg-tag { background: #E0F0EB; color: #3D6B56; padding: 2px 8px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: .62rem; font-weight: 600; display: inline-block; margin-right: 4px; }
.divider { border: none; border-top: 1px dashed #4E9978; margin: 24px 0; }
footer { font-family: monospace; font-size: .7rem; color: #9C988D; border-top: 1px solid #4E9978; padding-top: 12px; margin-top: 40px; text-align: center; }
</style>
</head>
<body>
<h1>${chatTitle}</h1>
<div class="meta">${dateStr} — ${timeStr}</div>
${msgs.map(m => {
  const role = m.role === 'user' ? 'Trabajador' : 'Hornero';
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
<footer>Exportado de Hornero</footer>
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

  // Generate TXT content string (for use in download cards or export)
  // Render historial de cambios section for a reporte card
  _renderHistorialCambios(correcciones) {
    if (!correcciones || correcciones.length === 0) return '';
    // Group by grado
    const byGrado = {};
    correcciones.forEach(c => {
      const g = c.correctorGrado || 2;
      if (!byGrado[g]) byGrado[g] = [];
      byGrado[g].push(c);
    });
    const entries = Object.entries(byGrado).sort((a, b) => a[0] - b[0]);
    const entriesHtml = entries.map(([grado, corrs]) => {
      const gradoLabel = 'G' + grado;
      const gradoClass = 'grado-' + grado;
      const secciones = corrs.map(c => `<span class="reporte-card-historial-seccion ${gradoClass}">${c.seccionTitle || c.resumen || 'Cambio'}</span>`).join('');
      const resumen = corrs.length === 1 ? corrs[0].resumen : corrs.length + ' cambios realizados';
      return `<div class="reporte-card-historial-entry">
        <div class="reporte-card-historial-grado ${gradoClass}">${gradoLabel} — ${corrs[0].correctorUsername || ''} — ${corrs[0].fecha || ''}</div>
        <div class="reporte-card-historial-resumen">${resumen}</div>
        <div class="reporte-card-historial-secciones">${secciones}</div>
      </div>`;
    }).join('');
    return `<div class="reporte-card-historial">
      <div class="reporte-card-historial-title">📝 Historial de cambios</div>
      ${entriesHtml}
    </div>`;
  }

  _generateTxtContent(messages, title) {
    const msgs = messages || this.messages || [];
    const chatTitle = title || this.title || 'Chat Hornero';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const lines = msgs.map(m => {
      const role = m.role === 'user' ? '→ Trabajador' : '← Hornero';
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

    return `${chatTitle}\n${dateStr} — ${timeStr}\n${'─'.repeat(60)}\n\n${lines.join('\n\n' + '─'.repeat(40) + '\n\n')}\n\n${'─'.repeat(60)}\nExportado de Hornero`;
  }

  // Download as plain .txt file
  _downloadTxt(messages, title, filename) {
    const body = this._generateTxtContent(messages, title);
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || title || 'chat-hornero') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this._showDownloadToast(filename || title || 'chat-hornero');
  }

  // ===== Export confirmation popup =====
  // Custom modal: "¿Descargar la conversación?" → Descargar TXT / Cancelar
  _showExportConfirm() {
    const existing = this.shadowRoot.querySelector('.export-confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'export-confirm-overlay';
    overlay.innerHTML = `
      <div class="export-confirm-dialog">
        <div class="export-confirm-title">¿Descargar la conversación?</div>
        <div class="export-confirm-subtitle">Se guardará como archivo de texto en tu dispositivo</div>
        <div class="export-confirm-actions">
          <button class="export-confirm-cancel">Cancelar</button>
          <button class="export-confirm-ok">Descargar TXT</button>
        </div>
      </div>
    `;
    this.shadowRoot.appendChild(overlay);

    // Cancel button
    overlay.querySelector('.export-confirm-cancel').addEventListener('click', () => {
      overlay.remove();
    });

    // Confirm → download TXT directly
    overlay.querySelector('.export-confirm-ok').addEventListener('click', () => {
      overlay.remove();
      this._downloadTxt(this.messages, this.title, this.title || 'chat-hornero');
    });

    // Click outside dialog → close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  // Show brief toast notification confirming the download
  _showDownloadToast(filename) {
    const toast = this.shadowRoot.querySelector('#downloadToast');
    if (!toast) return;
    toast.textContent = `📥 "${filename}.txt" descargado`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
  }

  // ===== Public API: Drawer state preservation =====
  // Parent components call getDrawerState() before re-rendering,
  // then restoreDrawerState() after the new <hornero-chat> is created.
  // This prevents drawers from closing when the parent re-renders.

  getDrawerState() {
    return {
      showHistory: this._showHistory,
      showInformes: this._showInformes,
      showRecibidos: this._showRecibidos,
      historyDrawerStable: this._historyDrawerStable,
      informesDrawerStable: this._informesDrawerStable,
      recibidosDrawerStable: this._recibidosDrawerStable,
      historySessions: this._historySessions,
      informesList: this._informesList,
      informesEntrantes: this._informesEntrantes,
    };
  }

  restoreDrawerState(state) {
    if (!state) return;
    this._showHistory = state.showHistory || false;
    this._showInformes = state.showInformes || false;
    this._showRecibidos = state.showRecibidos || false;
    this._historyDrawerStable = state.historyDrawerStable || false;
    this._informesDrawerStable = state.informesDrawerStable || false;
    this._recibidosDrawerStable = state.recibidosDrawerStable || false;
    if (state.historySessions) this._historySessions = state.historySessions;
    if (state.informesList) this._informesList = state.informesList;
    if (state.informesEntrantes) this._informesEntrantes = state.informesEntrantes;
    // Re-render to show the restored drawer state
    this.render();
  }

  // ===== Public API =====
  addMessage(msg) {
    const current = this.messages || [];
    current.push(msg);
    this.messages = current;
    // Do NOT close drawers when a new message arrives — keep them open
    this.render();
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    this._autoScroll();
  }

  deleteMessage(msgIndex) {
    const current = this.messages || [];
    if (msgIndex >= 0 && msgIndex < current.length) {
      const deletedMsg = current[msgIndex];
      current.splice(msgIndex, 1);
      this.messages = current;
      // Emit event so parent component can persist deletion to IndexedDB
      this.emit('chat-message-delete', { msgIndex, msg: deletedMsg });
      this.render();
      // Scroll to bottom after deletion
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      this._autoScroll();
    }
  }

  showTyping() { this.typing = true; this.render(); }
  hideTyping() { this.typing = false; this.render(); }
  setProgress(pct) { this.progress = pct; this.render(); }

  setSuggestions(arr) {
    this.suggestions = arr || [];
    this.render();
    const scroll = this.shadowRoot.querySelector('.chat-scroll');
    this._autoScroll();
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
    this._historyDrawerStable = false; // animate on open
    this._showHistory = true;
    this.render();
  }

  _closeHistoryDrawer() {
    this._showHistory = false;
    this._historyDrawerStable = false; // reset for next open
    this.render();
    // Emit event so parent re-syncs messages (without triggering another chat render)
    this.emit('chat-state-changed', {});
    // Scroll to bottom after drawer close (delay ensures layout is complete)
    setTimeout(() => {
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      this._autoScroll();
    }, 100);
  }

  // ===== Informes Drawer =====
  async _openInformesDrawer() {
    try {
      // Grade-aware loading: show own informes + incoming from lower grades
      const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
      const userGrade = session.grade || 'A';
      const userEmpresa = (session.agremiacion && session.agremiacion.empresa) || '';
      const userTerritory = session.territory || '';

      // Load own informes (all estados)
      if (typeof obtenerInformesTodos === 'function') {
        this._informesList = await obtenerInformesTodos(this.username);
      } else {
        this._informesList = [];
      }

      // Load incoming informes from lower grades (for B.b/B.c/B.d)
      if (typeof obtenerInformesEntrantes === 'function' && userGrade !== 'B.a' && userGrade !== 'A') {
        this._informesEntrantes = await obtenerInformesEntrantes(userGrade, userTerritory, userEmpresa);
      } else {
        this._informesEntrantes = [];
      }
    } catch(e) { console.warn('Chat: informes load failed', e); this._informesList = []; this._informesEntrantes = []; }
    // Clear badge when user opens the drawer
    this.informeBadge = false;
    this._informesDrawerStable = false; // animate on open
    this._showInformes = true;
    this.render();
  }

  _closeInformesDrawer() {
    this._showInformes = false;
    this._informesDrawerStable = false; // reset for next open
    this.render();
    // Emit event so parent re-syncs messages (without triggering another chat render)
    this.emit('chat-state-changed', {});
    // Scroll to bottom after drawer close (delay ensures layout is complete)
    setTimeout(() => {
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      this._autoScroll();
    }, 100);
  }

  setInformeBadge(bool) {
    this.informeBadge = bool;
    this.render();
  }

  // ===== Recibidos Drawer =====
  async _openRecibidosDrawer() {
    try {
      const session = JSON.parse(localStorage.getItem('hornero-session') || '{}');
      const userGrade = session.grade || 'A';
      const userEmpresa = (session.agremiacion && session.agremiacion.empresa) || '';
      const userTerritory = session.territory || '';
      if (typeof obtenerInformesEntrantes === 'function' && userGrade !== 'B.a' && userGrade !== 'A') {
        this._informesEntrantes = await obtenerInformesEntrantes(userGrade, userTerritory, userEmpresa);
      } else {
        this._informesEntrantes = [];
      }
    } catch(e) { console.warn('Chat: recibidos load failed', e); this._informesEntrantes = []; }
    this._recibidosBadge = false;
    this._recibidosDrawerStable = false; // animate on open
    this._showRecibidos = true;
    this.render();
  }

  _closeRecibidosDrawer() {
    this._showRecibidos = false;
    this._recibidosDrawerStable = false; // reset for next open
    this.render();
    this.emit('chat-state-changed', {});
    setTimeout(() => {
      const scroll = this.shadowRoot.querySelector('.chat-scroll');
      this._autoScroll();
    }, 100);
  }

  // ===== Share menu for reporte cards (WhatsApp, Email, Download TXT) =====
  _showShareMenu(msgIndex) {
    const msg = this.messages[msgIndex];
    if (!msg) return;

    // Generate TXT content from the reporte message
    const txtContent = this._generateTxtContent([msg], msg.sections && msg.sections[0] ? msg.sections[0].title || 'Informe Gremial' : 'Informe Gremial');
    const title = msg.sections && msg.sections[0] ? msg.sections[0].title || 'Informe Gremial' : 'Informe Gremial';

    // Create share menu overlay inside shadow DOM
    const existingMenu = this.shadowRoot.querySelector('.share-menu-overlay');
    if (existingMenu) existingMenu.remove();

    const overlay = document.createElement('div');
    overlay.className = 'share-menu-overlay';
    overlay.innerHTML = `
      <div class="share-menu">
        <div class="share-menu-title">Compartir informe</div>
        <button class="share-menu-item" data-share-action="whatsapp">
          <span class="share-menu-icon">💬</span> WhatsApp
        </button>
        <button class="share-menu-item" data-share-action="email">
          <span class="share-menu-icon">📧</span> Email
        </button>
        <button class="share-menu-item" data-share-action="download">
          <span class="share-menu-icon">📥</span> Descargar TXT
        </button>
        <button class="share-menu-cancel">Cancelar</button>
      </div>
    `;
    this.shadowRoot.appendChild(overlay);

    // Handle share actions
    overlay.querySelectorAll('.share-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const shareAction = btn.dataset.shareAction;
        if (shareAction === 'whatsapp') {
          // WhatsApp share: open wa.me with text
          const whatsappText = encodeURIComponent(txtContent.substring(0, 1000)); // WhatsApp limit
          window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
        } else if (shareAction === 'email') {
          // Email share: open mailto with subject + body
          const subject = encodeURIComponent(title);
          const body = encodeURIComponent(txtContent);
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        } else if (shareAction === 'download') {
          // Download TXT: generate blob and trigger download directly (no browser preview)
          const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = title + '.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => { URL.revokeObjectURL(blobUrl); }, 5000);
          this._showDownloadToast(title);
        }
        overlay.remove();
      });
    });

    overlay.querySelector('.share-menu-cancel').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
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
