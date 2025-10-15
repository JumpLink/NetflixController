// Gamepad related types

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

/**
 * Represents the state and interface of a gamepad
 */
export interface GamepadState {
	/** Array of axis values (-1 to 1) */
	axes: readonly number[];
	/** Array of button states */
	buttons: readonly GamepadButton[];
	/** Whether the gamepad is currently connected */
	connected: boolean;
	/** Unique identifier for the gamepad */
	id: string;
	/** Index of the gamepad in the browser's gamepad list */
	index: number;
	/** Mapping type, typically "standard" or "" */
	mapping: string;
	/** Timestamp of the last update */
	timestamp: number;
	/** Deadzone value for joystick movement (0-1) */
	joystickDeadzone?: number;
	/** Add an event listener to this gamepad */
	addEventListener(type: string, listener: (...args: unknown[]) => void): void;
	/** Update the gamepad state from browser data */
	update(gamepad: unknown): void;
	/** Internal reference to previous state for comparison */
	_last?: unknown;
}

export interface GamepadMapping {
	buttonsPath: string;
	buttonImageMapping: string;
}

export interface GamepadEventCallbacks {
	connect: ((gamepad: GamepadState) => void)[];
	disconnect: ((gamepad: GamepadState) => void)[];
}

export interface GamepadHandler {
	gamepads: Record<number, GamepadState>;
	_paused: boolean;
	_callbacks: GamepadEventCallbacks;
	_supported: boolean;
	paused: boolean;
	supported: boolean;
	start(): void;
	stop(): void;
	poll(): void;
	addEventListener(
		type: "connect" | "disconnect",
		listener: (gamepad: GamepadState) => void,
	): void;
	removeEventListener(
		type: "connect" | "disconnect",
		listener: (gamepad: GamepadState) => void,
	): void;
}

export interface StandardMapping {
	Button: {
		BUTTON_BOTTOM: number;
		BUTTON_RIGHT: number;
		BUTTON_LEFT: number;
		BUTTON_TOP: number;
		BUMPER_LEFT: number;
		BUMPER_RIGHT: number;
		TRIGGER_LEFT: number;
		TRIGGER_RIGHT: number;
		BUTTON_CONTROL_LEFT: number;
		BUTTON_CONTROL_RIGHT: number;
		BUTTON_LEFT_STICK: number;
		BUTTON_RIGHT_STICK: number;
		DIRECTION_UP: number;
		DIRECTION_DOWN: number;
		DIRECTION_LEFT: number;
		DIRECTION_RIGHT: number;
	};
	Axis: {
		LEFT_STICK_X: number;
		LEFT_STICK_Y: number;
		RIGHT_STICK_X: number;
		RIGHT_STICK_Y: number;
	};
}

export interface GamepadConnectionEvent {
	gamepad: GamepadState;
	type: "connect" | "disconnect";
	_dispatch(callbacks: ((gamepad: GamepadState) => void)[]): void;
}

export interface GamepadMappings {
	buttonsPath: string;
	buttonImageMapping: string;
}
