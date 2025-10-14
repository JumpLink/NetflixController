/**
 * Source: https://github.com/TSedlar/pseudo-styler
 *
 * MIT License
 * 
 * Copyright (c) 2019 Tyler Sedlar
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

class PseudoStyler {
  styles: any[];
  registered: WeakMap<Element, any>;
  uniqueID: number;
  style: HTMLStyleElement | null = null;

  constructor() {
    this.styles = [];
    this.registered = new WeakMap();
    this.uniqueID = 0;
  }

  async loadDocumentStyles(): Promise<void> {
    let count = document.styleSheets.length;
    for (let i = 0; i < count; i++) {
      let sheet = document.styleSheets[i];
      if (sheet.href) {
        await this.addLink(sheet.href);
      } else {
        if (sheet.ownerNode && sheet.ownerNode.nodeName &&
          sheet.ownerNode.nodeName === "STYLE" && sheet.ownerNode.firstChild) {
          this.addCSS(sheet.ownerNode.firstChild.textContent);
        }
      }
    }
  }

  addCSS(text: string | null): void {
    let copySheet = document.createElement('style');
    copySheet.type = 'text/css';
    copySheet.textContent = text;
    document.head.appendChild(copySheet);
    if (copySheet.sheet) {
      for (let i = 0; i < copySheet.sheet.cssRules.length; i++) {
        const rule = copySheet.sheet.cssRules[i] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText.includes(':')) {
          this.styles.push(rule);
        }
      }
    }
    document.head.removeChild(copySheet);
  }

  async addLink(url: string): Promise<void> {
    const self = this;
    await new Promise((resolve, reject) => {
      fetch(url)
        .then(res => res.text())
        .then(res => {
          self.addCSS(res);
          resolve(self.styles);
        })
        .catch(err => reject(err));
    });
  }

  matches(element: Element, selector: string, pseudoClass: string): boolean {
    selector = selector.replace(new RegExp(pseudoClass, 'g'), '');
    for (let part of selector.split(/ +/)) {
      try {
        if (element.matches(part)) {
          return true;
        }
      } catch (ignored) {
        // reached a non-selector part such as '>'
      }
    }
    return false;
  }

  register(element: Element, pseudoclass: string): void {
    let uuid = this.uniqueID++;
    let customClasses: Record<string, string> = {};
    for (let style of this.styles) {
      if (style.selectorText.includes(pseudoclass)) {
        style.selectorText.split(/\s*,\s*/g)
          .filter((selector: string) => this.matches(element, selector, pseudoclass))
          .forEach((selector: string) => {
            let newSelector = this._getCustomSelector(selector, pseudoclass, uuid);
            customClasses[newSelector] = style.style.cssText.split(/\s*;\s*/).join(';');
          });
      }
    }

    if (!this.style) {
      this._createStyleElement();
    }
    for (let selector in customClasses) {
      let cssClass = selector + ' { ' + customClasses[selector] + ' }';
      if (this.style && this.style.sheet) {
        this.style.sheet.insertRule(cssClass);
      }
    }
    this.registered.get(element).set(pseudoclass, uuid);
  }

  deregister(element: Element, pseudoClass: string): void {
    if (this.registered.has(element) && this.registered.get(element).has(pseudoClass)) {
      let uuid = this.registered.get(element).get(pseudoClass);
      let className = this._getMimicClassName(pseudoClass, uuid);
      let regex = new RegExp(className + '($|\\W)');
      if (this.style && this.style.sheet) {
        for (let i = 0; i < this.style.sheet.cssRules.length; i++) {
          const rule = this.style.sheet.cssRules[i] as CSSStyleRule;
          if (rule.selectorText && regex.test(rule.selectorText)) {
            this.style.sheet.deleteRule(i);
          }
        }
      }
      this.registered.get(element).delete(pseudoClass);
      element.classList.remove(className.substr(1));
    }
  }

  toggleStyle(element: Element, pseudoclass: string, force: boolean): void {
    if (!this.registered.has(element)) {
      this.registered.set(element, new Map());
    }
    if (!this.registered.get(element).has(pseudoclass)) {
      this.register(element, pseudoclass);
    }
    let uuid = this.registered.get(element).get(pseudoclass);
    element.classList.toggle(this._getMimicClassName(pseudoclass, uuid).substr(1), force);
  }

  _getMimicClassName(pseudoClass: string, uuid: number): string {
    return pseudoClass.replace(':', '.') + '-pseudostyler-' + uuid;
  }

  _getCustomSelector(selectorText: string, pseudoClass: string, uuid: number): string {
    return selectorText.replace(new RegExp(pseudoClass, 'g'), this._getMimicClassName(pseudoClass, uuid));
  }

  _createStyleElement(): void {
    const style = document.createElement('style');
    style.type = 'text/css';
    document.head.appendChild(style);
    this.style = style;
  }
}

// ESM export
export default PseudoStyler;