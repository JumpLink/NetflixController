/**
 * Represents a CSS style rule with its selector and style properties.
 * Used by the PseudoStyler utility for managing CSS pseudo-classes.
 *
 * @interface StyleRule
 */
export interface StyleRule {
	/** The CSS selector text for this rule */
	selectorText?: string;
	/** The CSS style declaration containing all style properties */
	style: CSSStyleDeclaration;
}
