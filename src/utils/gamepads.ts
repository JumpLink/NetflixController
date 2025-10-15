/**
 * Source: https://github.com/FThompson/ChromeLiveStorage
 *
 * MIT License
 *
 * Copyright (c) 2019 Finn Thompson
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

/** biome-ignore-all lint/suspicious/noExplicitAny lint/complexity/noBannedTypes lint/correctness/noConstructorReturn: Gamepad utilities work with dynamic browser Gamepad API objects requiring any types for event handling and device properties. Function types are used for flexible event listener callbacks. Singleton pattern requires returning existing instance from constructor. */

interface GamepadButton {
	pressed: boolean;
	touched?: boolean;
	value: number;
}

interface GamepadState {
	axes: readonly number[];
	buttons: readonly GamepadButton[];
	connected: boolean;
	id: string;
	index: number;
	mapping: string;
	timestamp: number;
	joystickDeadzone?: number;
	addEventListener(type: string, listener: Function): void;
	update(gamepad: any): void;
	_last?: any;
}

const Gamepads = (() => {
	class GamepadHandler {
		gamepads: Record<number, GamepadState> = {};
		_paused: boolean = false;
		_callbacks: Record<string, Function[]> = {
			connect: [],
			disconnect: [],
		};
		_supported: boolean = navigator.getGamepads !== undefined;
		static _instance: GamepadHandler | null = null;

		constructor() {
			if (GamepadHandler._instance) {
				return GamepadHandler._instance;
			}
			GamepadHandler._instance = this;
		}

		get paused(): boolean {
			return this._paused;
		}

		get supported(): boolean {
			return this._supported;
		}

		start(): void {
			this._paused = false;
			this._run();
		}

		stop(): void {
			this._paused = true;
		}

		poll(): void {
			// must call getGamepads() to force each gamepad object to update for some browsers (Chrome)
			const gamepads = navigator.getGamepads
				? [...navigator.getGamepads()]
				: [];
			const connectedIndices = [];
			for (const index in gamepads) {
				const gamepad = gamepads[index];
				if (index && gamepad !== null) {
					if (gamepad.index !== undefined) {
						if (gamepad.index in this.gamepads) {
							this.gamepads[gamepad.index].update(gamepad);
						} else {
							this.gamepads[gamepad.index] = new Gamepad(gamepad);
							const event = new GamepadConnectionEvent(
								this.gamepads[gamepad.index],
								"connect",
							);
							event._dispatch(this._callbacks.connect);
						}
					}
					connectedIndices.push(index);
				}
			}
			// check if any tracked gamepads are now absent/disconnected from the browser's gamepads
			for (const index in this.gamepads) {
				if (!connectedIndices.includes(index)) {
					this.gamepads[index]._last.connected = false;
					const event = new GamepadConnectionEvent(
						this.gamepads[index],
						"disconnect",
					);
					event._dispatch(this._callbacks.disconnect);
					delete this.gamepads[index];
				}
			}
		}

		// connect: callback(gamepad)
		// disconnect: callback(gamepad)
		addEventListener(type: string, listener: Function): void {
			if (!this._callbacks[type]) {
				this._callbacks[type] = [];
			}
			this._callbacks[type].push(listener);
		}

		removeEventListener(type: string, listener: Function): void {
			if (this._callbacks[type]) {
				this._callbacks[type] = this._callbacks[type].filter(
					(callback) => callback !== listener,
				);
			}
		}

		_run() {
			if (this._supported && !this._paused) {
				this.poll();
				requestAnimationFrame(() => this._run());
			}
		}
	}

	class Gamepad implements GamepadState {
		gamepad: any;
		_callbacks: Record<string, Map<any, any>>;
		_deadzones: Record<number, number>;
		_last: any;
		_deadzone: number;

		axes!: readonly number[];
		buttons!: readonly GamepadButton[];
		connected!: boolean;
		id!: string;
		index!: number;
		mapping!: string;
		timestamp!: number;

		constructor(gamepad: any) {
			this.gamepad = gamepad;
			this._callbacks = {
				// map required for array keys on joystickmove, used for convenience elsewhere
				buttonpress: new Map(),
				buttonrelease: new Map(),
				buttonvaluechange: new Map(),
				axischange: new Map(),
				joystickmove: new Map(),
			};
			this._deadzones = {};
			this._deadzone = 0.1;
			this._setLastValues();
		}

		_setLastValues(): void {
			this._last = {
				connected: this.gamepad.connected,
				axes: this.gamepad.axes.slice(),
				buttons: Object.keys(this.gamepad.buttons).map((i: string) => ({
					pressed: this.gamepad.buttons[i].pressed,
					value: this.gamepad.buttons[i].value,
				})),
			};
		}

		get joystickDeadzone(): number {
			return this._deadzone || 0.1;
		}

		set joystickDeadzone(deadzone: number) {
			this._checkDeadzone(deadzone);
			this._deadzone = deadzone;
		}

		getAxisDeadzone(index: number): number | undefined {
			return this._deadzones[index];
		}

		setAxisDeadzone(index: number, deadzone: number): void {
			this._checkDeadzone(deadzone);
			this._deadzones[index] = deadzone;
		}

		getButton(index: number): any {
			return this.gamepad.buttons[index];
		}

		getAxis(index: number): number {
			return this.gamepad.axes[index];
		}

		isConnected() {
			// uses _last so the value can be set from gamepads 'disconnect' event
			// necessary for browsers that do not automatically update gamepad values
			// return this._last.connected
			return this.gamepad.connected && this._last.connected;
		}

		getMapping() {
			return this.gamepad.mapping;
		}

		_checkDeadzone(deadzone: number): void {
			if (deadzone >= 1.0 || deadzone < 0) {
				throw new Error("deadzone must be in range [0, 1)");
			}
		}

		update(gamepad: any): void {
			const updatesReferences = gamepad.timestamp === this.gamepad.timestamp;
			let oldGamepad: any, newGamepad: any;
			if (!updatesReferences) {
				// chrome gamepad instances are snapshots
				oldGamepad = this.gamepad;
				newGamepad = gamepad;
				this.gamepad = gamepad;
			} else {
				// firefox gamepad instances are live objects
				oldGamepad = this._last;
				newGamepad = this.gamepad;
			}
			if (newGamepad.connected && oldGamepad.connected) {
				this._compareButtons(newGamepad.buttons, oldGamepad.buttons);
				this._compareAxes(newGamepad.axes, oldGamepad.axes);
				this._compareJoysticks(newGamepad.axes, oldGamepad.axes);
			}
			this._setLastValues();
		}

		_compareJoysticks(newAxes: number[], oldAxes: number[]): void {
			this._callbacks.joystickmove.forEach((callbacks, indices) => {
				const newHorizontal = this._applyJoystickDeadzone(newAxes[indices[0]]);
				const newVertical = this._applyJoystickDeadzone(newAxes[indices[1]]);
				const oldHorizontal = this._applyJoystickDeadzone(oldAxes[indices[0]]);
				const oldVertical = this._applyJoystickDeadzone(oldAxes[indices[1]]);
				if (newHorizontal !== oldHorizontal || newVertical !== oldVertical) {
					const event = new GamepadJoystickEvent(
						this,
						"joystickmove",
						indices[0],
						indices[1],
						newHorizontal,
						newVertical,
					);
					event._dispatch(callbacks);
				}
			});
		}

		_applyJoystickDeadzone(value: number): number {
			return this._applyDeadzone(value, this.joystickDeadzone);
		}

		_applyAxisDeadzone(value: number, index: number): number {
			return index in this._deadzones
				? this._applyDeadzone(value, this._deadzones[index])
				: value;
		}

		_applyDeadzone(value: number, deadzone: number): number {
			return Math.abs(value) > deadzone
				? value - Math.sign(value) * deadzone
				: 0;
		}

		_compareAxes(newAxes: number[], oldAxes: number[]): void {
			const callbackMap = this._callbacks.axischange;
			for (let i = 0; i < newAxes.length; i++) {
				const newValue = this._applyAxisDeadzone(newAxes[i], i);
				const oldValue = this._applyAxisDeadzone(oldAxes[i], i);
				if (newValue !== oldValue) {
					const event = new GamepadValueEvent(
						this,
						"axischange",
						i,
						newAxes[i],
					);
					this._dispatchEvent(event, callbackMap, i);
				}
			}
		}

		_compareButtons(newValues: any[], oldValues: any[]): void {
			this._checkButtons(
				"buttonpress",
				newValues,
				oldValues,
				(nv: any, ov: any) => nv.pressed && !ov.pressed,
			);
			this._checkButtons(
				"buttonrelease",
				newValues,
				oldValues,
				(nv: any, ov: any) => !nv.pressed && ov.pressed,
			);
			this._checkButtons(
				"buttonvaluechange",
				newValues,
				oldValues,
				(nv: any, ov: any) => nv.value !== ov.value,
			);
		}

		_checkButtons(
			eventType: string,
			newValues: any[],
			oldValues: any[],
			predicate: (nv: any, ov: any) => boolean,
		): void {
			const callbackMap = this._callbacks[eventType];
			for (let i = 0; i < newValues.length; i++) {
				if (predicate(newValues[i], oldValues[i])) {
					const event = new GamepadValueEvent(
						this,
						eventType,
						i,
						newValues[i].value,
					);
					this._dispatchEvent(event, callbackMap, i);
				}
			}
		}

		_dispatchEvent(event: any, callbackMap: any, index: any): void {
			if (callbackMap.has(index)) {
				// specific listeners
				event._dispatch(callbackMap.get(index));
			}
			if (callbackMap.has(-1)) {
				// non-specific listeners
				event._dispatch(callbackMap.get(-1));
			}
		}

		// event types: buttonpress, buttonrelease, buttonvaluechange, axischange, joystickmove
		// specify index to track only a specific button
		// joystickmove event requires a two-length array for index
		addEventListener(
			type: string,
			listener: Function,
			index: number | number[] = -1,
		): void {
			this._checkJoystickEvent(type, index);
			if (!this._callbacks[type].has(index)) {
				this._callbacks[type].set(index, []);
			}
			this._callbacks[type].get(index).push(listener);
		}

		removeEventListener(
			type: string,
			listener: Function,
			index: number | number[] = -1,
		): void {
			this._checkJoystickEvent(type, index);
			const filtered = this._callbacks[type]
				.get(index)
				.filter((callback: Function) => callback !== listener);
			this._callbacks[type].set(index, filtered);
		}

		_checkJoystickEvent(type: string, index: number | number[]): void {
			if (type === "joystickmove" && !Array.isArray(index)) {
				throw new Error("joystickmove events require a two-length index array");
			}
		}

		addJoystickEventListener(
			type: string,
			listener: Function,
			horizontalIndex: number,
			verticalIndex: number,
		): void {
			this.addEventListener(type, listener, [horizontalIndex, verticalIndex]);
		}

		removeJoystickEventListener(
			type: string,
			listener: Function,
			horizontalIndex: number,
			verticalIndex: number,
		): void {
			this.removeEventListener(type, listener, [
				horizontalIndex,
				verticalIndex,
			]);
		}
	}

	// avoid naming collision with DOM GamepadEvent
	class _GamepadEvent {
		gamepad: any;
		type: string;
		_consumed: boolean;

		constructor(gamepad: any, type: string) {
			this.gamepad = gamepad;
			this.type = type.toLowerCase();
			this._consumed = false;
		}

		consume(): void {
			this._consumed = true;
		}

		isConsumed(): boolean {
			return this._consumed;
		}

		_dispatch(listeners: Function[]): void {
			for (let i = 0; i < listeners.length && !this.isConsumed(); i++) {
				listeners[i](this);
			}
		}
	}

	class GamepadConnectionEvent extends _GamepadEvent {}

	class GamepadValueEvent extends _GamepadEvent {
		index: number;
		value: number;

		constructor(gamepad: any, type: string, index: number, value: number) {
			super(gamepad, type);
			this.index = index;
			this.value = value;
		}
	}

	class GamepadJoystickEvent extends _GamepadEvent {
		indices: number[];
		values: number[];
		horizontalIndex: number;
		verticalIndex: number;
		horizontalValue: number;
		verticalValue: number;

		constructor(
			gamepad: any,
			type: string,
			hIndex: number,
			vIndex: number,
			hValue: number,
			vValue: number,
		) {
			super(gamepad, type);
			this.indices = [hIndex, vIndex];
			this.values = [hValue, vValue];
			this.horizontalIndex = hIndex;
			this.verticalIndex = vIndex;
			this.horizontalValue = hValue;
			this.verticalValue = vValue;
		}
	}

	return new GamepadHandler();
})();

// TODO: additional mappings with button names and images in gamepad-mappings.js
const StandardMapping = {
	Button: {
		BUTTON_BOTTOM: 0,
		BUTTON_RIGHT: 1,
		BUTTON_LEFT: 2,
		BUTTON_TOP: 3,
		BUMPER_LEFT: 4,
		BUMPER_RIGHT: 5,
		TRIGGER_LEFT: 6,
		TRIGGER_RIGHT: 7,
		BUTTON_CONTROL_LEFT: 8,
		BUTTON_CONTROL_RIGHT: 9,
		BUTTON_JOYSTICK_LEFT: 10,
		BUTTON_JOYSTICK_RIGHT: 11,
		D_PAD_UP: 12,
		D_PAD_BOTTOM: 13,
		D_PAD_LEFT: 14,
		D_PAD_RIGHT: 15,
		BUTTON_CONTROL_MIDDLE: 16,
	},

	// negative left and up, positive right and down
	Axis: {
		JOYSTICK_LEFT_HORIZONTAL: 0,
		JOYSTICK_LEFT_VERTICAL: 1,
		JOYSTICK_RIGHT_HORIZONTAL: 2,
		JOYSTICK_RIGHT_VERTICAL: 3,
		JOYSTICK_LEFT: [0, 1],
		JOYSTICK_RIGHT: [2, 3],
	},
};

// ESM exports
export { Gamepads as gamepads };
export { StandardMapping };
export default Gamepads;
