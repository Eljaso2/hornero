// ===== Hornero Reactive Component Helper =====
// ~3KB — zero dependencies — "abrir archivo y funciona"
// Provides: Shadow DOM, reactive properties, html/css tagged templates
// Native Web Components — no Lit, no npm, no CDN

// ===== Tagged template helpers =====
// html() and css() are just identity functions — they return the string
// They exist for readability and future optimization (cache parsing)

function html(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (i < values.length ? values[i] : ''), '');
}

function css(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (i < values.length ? values[i] : ''), '');
}

// ===== HoComponent base class =====
// Extends HTMLElement with:
// - Automatic Shadow DOM creation
// - Reactive properties (changes trigger render())
// - html/css tagged template rendering
// - Event dispatching helper

class HoComponent extends HTMLElement {
  // Define reactive properties in subclass:
  // static get properties() { return { screen: String, grade: String }; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._pendingRender = false;
    this._initialized = false;
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      // Initialize reactive properties with defaults
      const props = this._getProperties();
      for (const [name, type] of Object.entries(props)) {
        if (this[name] === undefined) {
          this[name] = type === Boolean ? false :
                       type === Number ? 0 :
                       type === Array ? [] :
                       type === Object ? {} :
                       '';
        }
      }
      this.render();
    }
  }

  // Observe reactive properties
  _getProperties() {
    return this.constructor.properties || {};
  }

  static get observedAttributes() {
    return Object.keys(this.properties || {});
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    const type = this._getProperties()[name];
    if (type === Boolean) {
      this[name] = newVal !== null && newVal !== 'false';
    } else if (type === Number) {
      this[name] = Number(newVal);
    } else if (type === Array || type === Object) {
      try { this[name] = JSON.parse(newVal); } catch { this[name] = type === Array ? [] : {}; }
    } else {
      this[name] = newVal;
    }
    this._scheduleRender();
  }

  // Property setter that triggers re-render
  _scheduleRender() {
    if (!this._pendingRender) {
      this._pendingRender = true;
      requestAnimationFrame(() => {
        this._pendingRender = false;
        this.render();
      });
    }
  }

  set(prop, value) {
    if (this[prop] !== value) {
      this[prop] = value;
      // Reflect to attribute if needed
      const type = this._getProperties()[prop];
      if (type === Boolean) {
        this.setAttribute(prop, value ? '' : 'false');
      } else if (type === Number) {
        this.setAttribute(prop, value);
      } else if (type === Array || type === Object) {
        this.setAttribute(prop, JSON.stringify(value));
      } else {
        this.setAttribute(prop, value);
      }
      this._scheduleRender();
    }
  }

  // ===== Render =====
  // Subclass overrides render() to return html`` template string
  render() {
    const template = this._render ? this._render() : '';
    const styles = this._styles ? this._styles() : '';
    this.shadowRoot.innerHTML = `<style>${styles}</style>${template}`;
    // Call lifecycle hook after render
    if (this._afterRender) this._afterRender();
  }

  // ===== Event dispatching =====
  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true, // crosses Shadow DOM boundary
    }));
  }

  // ===== Navigation helper =====
  goScreen(screen) {
    this.emit('screen-change', { screen });
  }
}

export { HoComponent, html, css };
