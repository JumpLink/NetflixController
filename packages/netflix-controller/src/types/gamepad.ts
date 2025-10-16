// Re-export types from gamecontroller.js
export type { GameControl, GamepadState } from "@ribajs/gamecontroller.js";

/**
 * Represents a gamepad button with its current state
 */
export interface GamepadButton {
	/** Whether the button is currently pressed */
	pressed: boolean;
	/** Whether the button is currently being touched (if supported) */
	touched?: boolean;
	/** The current value of the button (0-1, typically 0 or 1 except for triggers) */
	value: number;
}

export interface GamepadMapping {
	buttonsPath: string;
	buttonImageMapping: string;
}
