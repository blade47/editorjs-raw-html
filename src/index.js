/**
 * Build styles
 */
import './index.css';

import { IconHtml } from '@codexteam/icons';

/**
 * Raw HTML Tool for CodeX Editor
 *
 * @author CodeX (team@codex.so)
 * @copyright CodeX 2018
 * @license The MIT License (MIT)
 */

/**
 *
 */
export default class RawTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Should this tool be displayed at the Editor's Toolbox
   *
   * @returns {boolean}
   * @public
   */
  static get displayInToolbox() {
    return true;
  }

  /**
   * Allow to press Enter inside the RawTool textarea
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: IconHtml,
      title: 'Raw HTML',
    };
  }

  /**
   * @typedef {object} RawData — plugin saved data
   * @param {string} html - previously saved HTML code
   * @property
   */

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {RawData} data — previously saved HTML data
   * @param {object} config - user config for Tool
   * @param {object} api - CodeX Editor API
   * @param {boolean} readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    this.placeholder = config.placeholder || RawTool.DEFAULT_PLACEHOLDER;

    this.CSS = {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      wrapper: 'ce-rawtool',
      textarea: 'ce-rawtool__textarea',
    };

    this.data = {
      html: data.html || '',
    };

    this.textarea = null;
    this.resizeDebounce = null;
  }

  /**
   * Return Tool's view
   *
   * @returns {HTMLDivElement} this.element - RawTool's wrapper
   * @public
   */
  render() {
    const wrapper = document.createElement('div');
    const renderingTime = 100;

    this.textarea = document.createElement('textarea');

    wrapper.classList.add(this.CSS.baseClass, this.CSS.wrapper);

    this.textarea.classList.add(this.CSS.textarea, this.CSS.input);
    this.textarea.textContent = this.data.html;
    this.textarea.placeholder = this.placeholder;

    if (this.readOnly) {
      this.textarea.disabled = true;
      this.textarea.hidden = true;
    } else {
      this.textarea.addEventListener('input', () => {
        this.onInput();
      });
    }

    wrapper.appendChild(this.textarea);
    if (this.readOnly) {
      const c = document.createElement('div');
      c.innerHTML = this.data.html;
      wrapper.appendChild(c);

      // Scripts inserted via innerHTML don't execute (HTML5 spec).
      // Re-create them as fresh <script> elements after the block is in the DOM.
      setTimeout(() => {
        this._executeScripts(c);
      }, renderingTime);
    }
    setTimeout(() => {
      this.resize();
    }, renderingTime);

    return wrapper;
  }

  /**
   * Extract Tool's data from the view
   *
   * @param {HTMLDivElement} rawToolsWrapper - RawTool's wrapper, containing textarea with raw HTML code
   * @returns {RawData} - raw HTML code
   * @public
   */
  save(rawToolsWrapper) {
    return {
      html: rawToolsWrapper.querySelector('textarea').value,
    };
  }

  /**
   * Default placeholder for RawTool's textarea
   *
   * @public
   * @returns {string}
   */
  static get DEFAULT_PLACEHOLDER() {
    return 'Enter HTML code';
  }

  /**
   * Automatic sanitize config
   */
  static get sanitize() {
    return {
      html: true, // Allow HTML tags
    };
  }

  /**
   * Execute script tags that were inserted via innerHTML.
   * External scripts are loaded sequentially so that dependencies resolve in order.
   *
   * @param {HTMLElement} container
   */
  _executeScripts(container) {
    const scripts = Array.from(container.querySelectorAll('script'));

    const runNext = (index) => {
      if (index >= scripts.length) return;

      const oldScript = scripts[index];
      const newScript = document.createElement('script');

      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      newScript.textContent = oldScript.textContent;

      if (newScript.src) {
        newScript.onload = () => runNext(index + 1);
        newScript.onerror = () => runNext(index + 1);
      }

      oldScript.parentNode.replaceChild(newScript, oldScript);

      if (!newScript.src) {
        runNext(index + 1);
      }
    };

    runNext(0);
  }

  /**
   * Textarea change event
   *
   * @returns {void}
   */
  onInput() {
    if (this.resizeDebounce) {
      clearTimeout(this.resizeDebounce);
    }

    this.resizeDebounce = setTimeout(() => {
      this.resize();
    }, 200);
  }

  /**
   * Resize textarea to fit whole height
   *
   * @returns {void}
   */
  resize() {
    this.textarea.style.height = 'auto';
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }
}
