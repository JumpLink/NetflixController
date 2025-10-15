// Gamepad related types

export interface GamepadButton {
	pressed: boolean;
	touched?: boolean;
	value: number;
}

export interface GamepadState {
	axes: readonly number[];
	buttons: readonly GamepadButton[];
	connected: boolean;
	id: string;
	index: number;
	mapping: string;
	timestamp: number;
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
