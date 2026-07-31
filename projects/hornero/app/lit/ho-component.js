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
    // Include both camelCase (property name) and kebab-case (HTML attribute name)
    const props = Object.keys(this.properties || {});
    return props.concat(props.map(p => p.replace(/([A-Z])/g, '-$1').toLowerCase()));
  }

  // Map kebab-case attribute name back to camelCase property name
  static _attrToProp(name) {
    const props = Object.keys(this.properties || {});
    const kebabMap = {};
    props.forEach(p => { kebabMap[p.replace(/([A-Z])/g, '-$1').toLowerCase()] = p; });
    return kebabMap[name] || name;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    const propName = this.constructor._attrToProp(name);
    const type = this._getProperties()[propName];
    if (type === Boolean) {
      this[propName] = newVal !== null && newVal !== 'false';
    } else if (type === Number) {
      this[propName] = Number(newVal);
    } else if (type === Array || type === Object) {
      try { this[propName] = JSON.parse(newVal); } catch { this[propName] = type === Array ? [] : {}; }
    } else {
      this[propName] = newVal;
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
    try {
      const template = this._render ? this._render() : '';
      const styles = this._styles ? this._styles() : '';
      this.shadowRoot.innerHTML = `<style>${styles}</style>${template}`;
      // Call lifecycle hook after render
      if (this._afterRender) this._afterRender();
    } catch(e) {
      console.error('Render error in', this.tagName, e);
      this.shadowRoot.innerHTML = `<div style="padding:20px;color:#E8E6E0;font-family:sans-serif;font-size:14px">
        <p style="color:#F87171;font-weight:bold">Error de renderizado</p>
        <p style="color:#9C988D;font-size:12px">${e.message}</p></div>`;
    }
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
