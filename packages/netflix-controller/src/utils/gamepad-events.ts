import type { GamepadState } from "../types/gamepad";
import { BrowserDetection } from "./browser-detection";

/**
 * Configuration for joystick event listeners
 */
export interface JoystickEventConfig {
	/** Callback function to execute when joystick moves */
	callback: (event: { values: number[] }) => void;
	/** Whether this is for the left joystick (true) or right joystick (false) */
	isLeftJoystick: boolean;
}

/**
 * Cross-browser gamepad event utilities
 */
export const GamepadEventManager = {
	/**
	 * Adds a joystick event listener that works across all browsers
	 *
	 * @param gamepad - The gamepad instance to attach the listener to
	 * @param config - Configuration for the joystick event listener
	 */
	addJoystickListener(
		gamepad: GamepadState,
		config: JoystickEventConfig,
	): void {
		const { callback, isLeftJoystick } = config;
		const horizontalIndex = isLeftJoystick ? 0 : 2;
		const verticalIndex = isLeftJoystick ? 1 : 3;

		if (BrowserDetection.isFirefox()) {
			// Firefox requires array indices for joystick events
			gamepad.addEventListener(
				"joystickmove",
				(e: unknown) => callback(e as { values: number[] }),
				[horizontalIndex, verticalIndex] as number[],
			);
		} else {
			// Chrome and other browsers
			if (this.hasAddJoystickEventListener(gamepad)) {
				// Use addJoystickEventListener if available
				this.callAddJoystickEventListener(
					gamepad,
					"joystickmove",
					(e: unknown) => callback(e as { values: number[] }),
					horizontalIndex,
					verticalIndex,
				);
			} else {
				// Fallback: use regular addEventListener without indices
				gamepad.addEventListener("joystickmove", (e: unknown) =>
					callback(e as { values: number[] }),
				);
			}
		}
	},

	/**
	 * Adds button event listeners (works the same across all browsers)
	 *
	 * @param gamepad - The gamepad instance to attach the listener to
	 * @param onButtonPress - Callback for button press events
	 * @param onButtonRelease - Callback for button release events
	 */
	addButtonListeners(
		gamepad: GamepadState,
		onButtonPress: (index: number) => void,
		onButtonRelease: (index: number) => void,
	): void {
		gamepad.addEventListener("buttonpress", (e: unknown) =>
			onButtonPress((e as { index: number }).index),
		);
		gamepad.addEventListener("buttonrelease", (e: unknown) =>
			onButtonRelease((e as { index: number }).index),
		);
	},

	/**
	 * Checks if the gamepad has the addJoystickEventListener method
	 *
	 * @param gamepad - The gamepad instance to check
	 * @returns True if the method exists
	 */
	hasAddJoystickEventListener(gamepad: GamepadState): boolean {
		return "addJoystickEventListener" in gamepad;
	},

	/**
	 * Calls the addJoystickEventListener method with proper typing
	 *
	 * @param gamepad - The gamepad instance
	 * @param type - Event type
	 * @param listener - Event listener callback
	 * @param horizontalIndex - Horizontal axis index
	 * @param verticalIndex - Vertical axis index
	 */
	callAddJoystickEventListener(
		gamepad: GamepadState,
		type: string,
		listener: (event: unknown) => void,
		horizontalIndex: number,
		verticalIndex: number,
	): void {
		(
			gamepad as unknown as {
				addJoystickEventListener: (
					type: string,
					listener: (event: unknown) => void,
					horizontalIndex: number,
					verticalIndex: number,
				) => void;
			}
		).addJoystickEventListener(type, listener, horizontalIndex, verticalIndex);
	},
} as const;
