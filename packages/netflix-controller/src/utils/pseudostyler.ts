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

import type { StyleRule } from "../types";

/**
 * Maps pseudo-class names to their unique identifiers for an element.
 * Used internally to track which pseudo-classes are registered for each element.
 * @interface PseudoRegistration
 */
interface PseudoRegistration extends Map<string, number> {}

/**
 * Allows for forcing an element to be styled with a pseudo-class.
 *
 * This script will grab all of the stylesheets in the current document, obtain their href links,
 * and pass the CSS sources into a hidden stylesheet to be parsed. It then creates custom CSS
 * classes that mimic pseudo-class behavior by applying them directly to elements.
 *
 * @example
 * ```javascript
 * (async () => {
 *   let styler = new PseudoStyler();
 *   await styler.loadDocumentStyles();
 *   document.getElementById('button').addEventListener('click', () => {
 *     const element = document.querySelector('#test');
 *     styler.toggleStyle(element, ':hover');
 *   });
 * })();
 * ```
 *
 * @see {@link https://github.com/TSedlar/pseudo-styler} Original repository
 * @see {@link https://codepen.io/tsedlar/pen/EGrBqm} Live example
 */
export class PseudoStyler {
	/** Array of CSS style rules that contain pseudo-classes */
	styles: StyleRule[];
	/** WeakMap tracking which pseudo-classes are registered for each element */
	registered: WeakMap<Element, PseudoRegistration>;
	/** Counter for generating unique identifiers for pseudo-class registrations */
	uniqueID: number;
	/** The dynamically created style element for injected CSS rules */
	style: HTMLStyleElement | null = null;

	/**
	 * Creates a new PseudoStyler instance.
	 * Initializes empty arrays and maps for tracking styles and registrations.
	 */
	constructor() {
		this.styles = [];
		this.registered = new WeakMap();
		this.uniqueID = 0;
	}

	/**
	 * Asynchronously loads all styles from the current document to be parsed for pseudo class rules.
	 *
	 * This method iterates through all stylesheets in the document, fetches external CSS files,
	 * and parses inline styles to extract rules containing pseudo-classes.
	 *
	 * @returns Promise that resolves when all styles have been loaded and parsed
	 *
	 * @example
	 * ```javascript
	 * const styler = new PseudoStyler();
	 * await styler.loadDocumentStyles();
	 * // Now styler has access to all pseudo-class rules from the document
	 * ```
	 */
	async loadDocumentStyles(): Promise<void> {
		const count = document.styleSheets.length;
		for (let i = 0; i < count; i++) {
			const sheet = document.styleSheets[i];
			if (sheet.href) {
				await this.addLink(sheet.href);
			} else {
				if (
					sheet.ownerNode?.nodeName &&
					sheet.ownerNode.nodeName === "STYLE" &&
					sheet.ownerNode.firstChild
				) {
					this.addCSS(sheet.ownerNode.firstChild.textContent);
				}
			}
		}
	}

	/**
	 * Adds CSS to this style sheet's rules that are checked for pseudo classes.
	 *
	 * Creates a temporary style element, parses the CSS text, extracts rules containing
	 * pseudo-classes, and adds them to the internal styles array.
	 *
	 * @param text - The CSS text to parse and add
	 *
	 * @example
	 * ```javascript
	 * styler.addCSS('.button:hover { background-color: red; }');
	 * ```
	 */
	addCSS(text: string | null): void {
		const copySheet = document.createElement("style");
		copySheet.type = "text/css";
		copySheet.textContent = text;
		document.head.appendChild(copySheet);
		if (copySheet.sheet) {
			for (let i = 0; i < copySheet.sheet.cssRules.length; i++) {
				const rule = copySheet.sheet.cssRules[i] as CSSStyleRule;
				if (rule.selectorText?.includes(":")) {
					this.styles.push(rule);
				}
			}
		}
		document.head.removeChild(copySheet);
	}

	/**
	 * Fetches the CSS resource and adds its CSS to the styler.
	 *
	 * Downloads CSS from the provided URL and parses it for pseudo-class rules.
	 *
	 * @param url - The URL of the CSS file to fetch
	 * @returns Promise that resolves when the CSS has been fetched and parsed
	 *
	 * @example
	 * ```javascript
	 * await styler.addLink('https://example.com/styles.css');
	 * ```
	 */
	async addLink(url: string): Promise<void> {
		await new Promise((resolve, reject) => {
			fetch(url)
				.then((res) => res.text())
				.then((res) => {
					this.addCSS(res);
					resolve(this.styles);
				})
				.catch((err) => reject(err));
		});
	}

	/**
	 * Checks if an element matches a CSS selector after removing the pseudo-class.
	 *
	 * This is a helper method used internally to determine if a CSS rule applies
	 * to a specific element by testing the selector without the pseudo-class.
	 *
	 * @param element - The DOM element to test
	 * @param selector - The CSS selector to match against
	 * @param pseudoClass - The pseudo-class to remove from the selector
	 * @returns True if the element matches the selector, false otherwise
	 */
	matches(element: Element, selector: string, pseudoClass: string): boolean {
		selector = selector.replace(new RegExp(pseudoClass, "g"), "");
		for (const part of selector.split(/ +/)) {
			try {
				if (element.matches(part)) {
					return true;
				}
			} catch (_ignored) {
				// reached a non-selector part such as '>'
			}
		}
		return false;
	}

	/**
	 * Finds any applicable CSS pseudo class rules for the element and adds them to a separate style sheet.
	 *
	 * This method is called automatically by `toggleStyle`. It creates custom CSS classes
	 * that mimic pseudo-class behavior by generating unique class names and injecting
	 * the corresponding styles into the document.
	 *
	 * @param element - The DOM element to register pseudo-class styles for
	 * @param pseudoclass - The pseudo-class to register (e.g., ':hover', ':focus')
	 *
	 * @example
	 * ```javascript
	 * const button = document.querySelector('#myButton');
	 * styler.register(button, ':hover');
	 * ```
	 */
	register(element: Element, pseudoclass: string): void {
		const uuid = this.uniqueID++;
		const customClasses: Record<string, string> = {};
		for (const style of this.styles) {
			if (style.selectorText?.includes(pseudoclass)) {
				style.selectorText
					.split(/\s*,\s*/g)
					.filter((selector: string) =>
						this.matches(element, selector, pseudoclass),
					)
					.forEach((selector: string) => {
						const newSelector = this._getCustomSelector(
							selector,
							pseudoclass,
							uuid,
						);
						customClasses[newSelector] = style.style.cssText
							.split(/\s*;\s*/)
							.join(";");
					});
			}
		}

		if (!this.style) {
			this._createStyleElement();
		}
		for (const selector in customClasses) {
			const cssClass = `${selector} { ${customClasses[selector]} }`;
			if (this.style?.sheet) {
				this.style.sheet.insertRule(cssClass);
			}
		}
		this.registered.get(element)?.set(pseudoclass, uuid);
	}

	/**
	 * Removes the element's mimicked pseudo class from the styler's stylesheet.
	 *
	 * This method can be useful to clear the mimicked rules in case the element's
	 * style has changed. It removes both the CSS rules and the class from the element.
	 *
	 * @param element - The DOM element to deregister pseudo-class styles for
	 * @param pseudoClass - The pseudo-class to deregister (e.g., ':hover', ':focus')
	 *
	 * @example
	 * ```javascript
	 * const button = document.querySelector('#myButton');
	 * styler.deregister(button, ':hover');
	 * ```
	 */
	deregister(element: Element, pseudoClass: string): void {
		const elementRegistration = this.registered.get(element);
		if (elementRegistration?.has(pseudoClass)) {
			const uuid = elementRegistration.get(pseudoClass);
			if (uuid !== undefined) {
				const className = this._getMimicClassName(pseudoClass, uuid);
				const regex = new RegExp(`${className}($|\\W)`);
				if (this.style?.sheet) {
					for (let i = 0; i < this.style.sheet.cssRules.length; i++) {
						const rule = this.style.sheet.cssRules[i] as CSSStyleRule;
						if (rule.selectorText && regex.test(rule.selectorText)) {
							this.style.sheet.deleteRule(i);
						}
					}
				}
				elementRegistration.delete(pseudoClass);
				element.classList.remove(className.substr(1));
			}
		}
	}

	/**
	 * Toggles a pseudo class on an element.
	 *
	 * If the optional `force` parameter is specified, then if `true`, toggle the pseudo class on;
	 * if `false`, toggle the pseudo class off. This method automatically calls `register`
	 * if the pseudo-class hasn't been registered for the element yet.
	 *
	 * @param element - The DOM element to toggle the pseudo-class on
	 * @param pseudoclass - The pseudo-class to toggle (e.g., ':hover', ':focus')
	 * @param force - Optional boolean to force the pseudo-class on (true) or off (false)
	 *
	 * @example
	 * ```javascript
	 * const button = document.querySelector('#myButton');
	 * // Toggle hover effect
	 * styler.toggleStyle(button, ':hover');
	 *
	 * // Force hover effect on
	 * styler.toggleStyle(button, ':hover', true);
	 *
	 * // Force hover effect off
	 * styler.toggleStyle(button, ':hover', false);
	 * ```
	 */
	toggleStyle(element: Element, pseudoclass: string, force?: boolean): void {
		if (!this.registered.has(element)) {
			this.registered.set(element, new Map());
		}
		const elementRegistration = this.registered.get(element);
		if (!elementRegistration) return; // Should never happen
		if (!elementRegistration.has(pseudoclass)) {
			this.register(element, pseudoclass);
		}
		const uuid = elementRegistration.get(pseudoclass);
		if (uuid !== undefined) {
			element.classList.toggle(
				this._getMimicClassName(pseudoclass, uuid).substr(1),
				force,
			);
		}
	}

	/**
	 * Generates a unique class name for mimicking a pseudo-class.
	 *
	 * @private
	 * @param pseudoClass - The pseudo-class to mimic (e.g., ':hover')
	 * @param uuid - Unique identifier for this registration
	 * @returns The generated class name (e.g., '.hover-pseudostyler-123')
	 */
	private _getMimicClassName(pseudoClass: string, uuid: number): string {
		return `${pseudoClass.replace(":", ".")}-pseudostyler-${uuid}`;
	}

	/**
	 * Creates a custom CSS selector by replacing pseudo-classes with mimic class names.
	 *
	 * @private
	 * @param selectorText - The original CSS selector
	 * @param pseudoClass - The pseudo-class to replace
	 * @param uuid - Unique identifier for this registration
	 * @returns The modified selector with mimic class names
	 */
	private _getCustomSelector(
		selectorText: string,
		pseudoClass: string,
		uuid: number,
	): string {
		return selectorText.replace(
			new RegExp(pseudoClass, "g"),
			this._getMimicClassName(pseudoClass, uuid),
		);
	}

	/**
	 * Creates and appends a style element to the document head for injecting CSS rules.
	 *
	 * @private
	 */
	private _createStyleElement(): void {
		const style = document.createElement("style");
		style.type = "text/css";
		document.head.appendChild(style);
		this.style = style;
	}
}
