/**
 * Source: https://github.com/FThompson/Gamepads.js
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

/**
 * HTML5 Gamepad API Enhancements
 *
 * A JavaScript module for tracking Gamepads and events pertaining to their usage.
 * This library provides event handling for gamepad interactions that works consistently
 * across multiple browsers, addressing limitations in the built-in Gamepad API.
 *
 * @see {@link https://github.com/FThompson/Gamepads.js} Original source repository
 * @license MIT
 * @author Finn Thompson
 */

// Native browser gamepad interfaces
interface NativeGamepad {
	connected: boolean;
	axes: readonly number[];
	buttons: readonly GamepadButton[];
	id: string;
	index: number;
	mapping: string;
	timestamp: number;
}

interface GamepadButtonState {
	pressed: boolean;
	value: number;
}

interface GamepadLastState {
	connected: boolean;
	axes: number[];
	buttons: GamepadButtonState[];
}

import type { GamepadButton, GamepadState } from "../types/gamepad.js";

export const Gamepads = (() => {
	/**
	 * Main gamepad handler singleton that manages all connected gamepads
	 * and provides event polling functionality.
	 *
	 * This class implements the singleton pattern to ensure only one
	 * gamepad handler exists per application.
	 */
	class GamepadHandler {
		/** Map of all connected gamepad objects indexed by their browser index */
		gamepads: Record<number, GamepadState> = {};
		/** Internal flag indicating if polling is paused */
		_paused: boolean = false;
		/** Event callback storage for connect/disconnect events */
		_callbacks: Record<string, ((event: unknown) => void)[]> = {
			connect: [],
			disconnect: [],
		};
		/** Whether the browser supports the Gamepad API */
		_supported: boolean = navigator.getGamepads !== undefined;
		/** Singleton instance reference */
		static _instance: GamepadHandler | null = null;

		/**
		 * Creates a new GamepadHandler instance or returns the existing singleton
		 * @returns The GamepadHandler instance
		 */
		constructor() {
			if (GamepadHandler._instance) {
				// Return the existing instance by copying its properties
				Object.assign(this, GamepadHandler._instance);
				return;
			}
			GamepadHandler._instance = this;
		}

		/**
		 * Gets whether polling is currently paused
		 * @returns True if polling is paused, false otherwise
		 */
		get paused(): boolean {
			return this._paused;
		}

		/**
		 * Gets whether the current browser supports the Gamepad API
		 * @returns True if gamepads are supported, false otherwise
		 */
		get supported(): boolean {
			return this._supported;
		}

		/**
		 * Starts polling and updating available gamepads at the screen frame rate
		 *
		 * This method begins the automatic polling loop that detects gamepad
		 * connections, disconnections, and input changes.
		 */
		start(): void {
			this._paused = false;
			this._run();
		}

		/**
		 * Pauses polling and updating of gamepads
		 *
		 * Can be resumed by calling start() again.
		 */
		stop(): void {
			this._paused = true;
		}

		/**
		 * Manually polls and updates all available gamepads
		 *
		 * This method can be called manually if you need the module to update
		 * gamepads at a different rate than the screen frame rate.
		 * Must call getGamepads() to force each gamepad object to update for some browsers (Chrome).
		 */
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
					(this.gamepads[index]._last as GamepadLastState).connected = false;
					const event = new GamepadConnectionEvent(
						this.gamepads[index],
						"disconnect",
					);
					event._dispatch(this._callbacks.disconnect);
					delete this.gamepads[index];
				}
			}
		}

		/**
		 * Adds an event listener to the page's gamepad handler
		 *
		 * Event listeners are called in order of most recently added.
		 *
		 * @param type - Event type: 'connect' or 'disconnect'
		 * @param listener - Callback function to execute when the event occurs
		 *
		 * @example
		 * ```javascript
		 * Gamepads.addEventListener('connect', (event) => {
		 *   console.log('Gamepad connected:', event.gamepad);
		 * });
		 * ```
		 */
		addEventListener(type: string, listener: (event: unknown) => void): void {
			if (!this._callbacks[type]) {
				this._callbacks[type] = [];
			}
			this._callbacks[type].push(listener);
		}

		/**
		 * Removes an event listener from the page's gamepad handler
		 *
		 * @param type - Event type: 'connect' or 'disconnect'
		 * @param listener - The callback function to remove
		 */
		removeEventListener(
			type: string,
			listener: (event: unknown) => void,
		): void {
			if (this._callbacks[type]) {
				this._callbacks[type] = this._callbacks[type].filter(
					(callback) => callback !== listener,
				);
			}
		}

		/**
		 * Internal method that runs the polling loop
		 *
		 * Uses requestAnimationFrame to maintain smooth polling at screen refresh rate
		 * @private
		 */
		_run() {
			if (this._supported && !this._paused) {
				this.poll();
				requestAnimationFrame(() => this._run());
			}
		}
	}

	/**
	 * Represents an individual gamepad with event handling capabilities
	 *
	 * This class wraps the browser's native Gamepad object and provides
	 * enhanced event handling for button presses, releases, axis changes,
	 * and joystick movements.
	 */
	class Gamepad implements GamepadState {
		/** Reference to the native browser gamepad object */
		gamepad: NativeGamepad;
		/** Internal storage for event callbacks organized by type and index */
		_callbacks: Record<
			string,
			Map<number | number[], ((event: unknown) => void)[]>
		>;
		/** Per-axis deadzone values */
		_deadzones: Record<number, number>;
		/** Previous state for change detection */
		_last!: GamepadLastState;
		/** Default joystick deadzone value */
		_deadzone: number;

		/** Array of axis values (-1 to 1) */
		axes!: readonly number[];
		/** Array of button states */
		buttons!: readonly GamepadButton[];
		/** Whether the gamepad is currently connected */
		connected!: boolean;
		/** Unique identifier for the gamepad */
		id!: string;
		/** Index of the gamepad in the browser's gamepad list */
		index!: number;
		/** Mapping type, typically "standard" or "" */
		mapping!: string;
		/** Timestamp of the last update */
		timestamp!: number;

		/**
		 * Creates a new Gamepad instance
		 *
		 * @param gamepad - The native browser gamepad object
		 */
		constructor(gamepad: NativeGamepad) {
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

			// Initialize properties from the native gamepad
			this.axes = gamepad.axes;
			this.buttons = gamepad.buttons;
			this.connected = gamepad.connected;
			this.id = gamepad.id;
			this.index = gamepad.index;
			this.mapping = gamepad.mapping;
			this.timestamp = gamepad.timestamp;
		}

		/**
		 * Sets up the initial state values for change detection
		 * @private
		 */
		_setLastValues(): void {
			this._last = {
				connected: this.gamepad.connected,
				axes: this.gamepad.axes.slice(),
				buttons: Object.keys(this.gamepad.buttons).map((i: string) => ({
					pressed: this.gamepad.buttons[parseInt(i, 10)].pressed,
					value: this.gamepad.buttons[parseInt(i, 10)].value,
				})),
			};
		}

		/**
		 * Gets the current joystick deadzone value
		 * @returns The deadzone value (0-1), defaults to 0.1
		 */
		get joystickDeadzone(): number {
			return this._deadzone || 0.1;
		}

		/**
		 * Sets the joystick deadzone value
		 *
		 * The deadzone is subtracted from the absolute minimum and maximum
		 * joystick axis values to smooth out values in the deadzone.
		 *
		 * @param deadzone - Deadzone value in range [0, 1)
		 * @throws Error if deadzone is not in valid range
		 */
		set joystickDeadzone(deadzone: number) {
			this._checkDeadzone(deadzone);
			this._deadzone = deadzone;
		}

		/**
		 * Gets the deadzone value for a specific axis
		 *
		 * @param index - The axis index
		 * @returns The deadzone value for the axis, or undefined if not set
		 */
		getAxisDeadzone(index: number): number | undefined {
			return this._deadzones[index];
		}

		/**
		 * Sets a deadzone value for a specific axis
		 *
		 * @param index - The axis index
		 * @param deadzone - Deadzone value in range [0, 1)
		 * @throws Error if deadzone is not in valid range
		 */
		setAxisDeadzone(index: number, deadzone: number): void {
			this._checkDeadzone(deadzone);
			this._deadzones[index] = deadzone;
		}

		/**
		 * Gets the button at the specified index
		 *
		 * @param index - The button index
		 * @returns The button object with pressed and value properties
		 */
		getButton(index: number): GamepadButton {
			return this.gamepad.buttons[index];
		}

		/**
		 * Gets the floating point value of the axis at the specified index
		 *
		 * @param index - The axis index
		 * @returns The axis value (-1 to 1)
		 */
		getAxis(index: number): number {
			return this.gamepad.axes[index];
		}

		/**
		 * Checks if this gamepad is currently connected
		 *
		 * Uses both the native gamepad connection state and internal tracking
		 * to ensure accurate connection status across different browsers.
		 *
		 * @returns True if the gamepad is connected, false otherwise
		 */
		isConnected() {
			// uses _last so the value can be set from gamepads 'disconnect' event
			// necessary for browsers that do not automatically update gamepad values
			// return this._last.connected
			return this.gamepad.connected && this._last.connected;
		}

		/**
		 * Gets this gamepad's mapping type
		 *
		 * @returns The mapping type, typically "standard" or ""
		 */
		getMapping() {
			return this.gamepad.mapping;
		}

		/**
		 * Validates that a deadzone value is in the correct range
		 *
		 * @param deadzone - The deadzone value to validate
		 * @throws Error if deadzone is not in range [0, 1)
		 * @private
		 */
		_checkDeadzone(deadzone: number): void {
			if (deadzone >= 1.0 || deadzone < 0) {
				throw new Error("deadzone must be in range [0, 1)");
			}
		}

		/**
		 * Updates this gamepad's values and fires events if necessary
		 *
		 * This method handles the differences between Chrome (snapshot-based)
		 * and Firefox (live object) gamepad implementations.
		 *
		 * @param gamepad - The updated gamepad object from the browser
		 */
		update(gamepad: NativeGamepad): void {
			const updatesReferences = gamepad.timestamp === this.gamepad.timestamp;
			let oldGamepad: NativeGamepad | GamepadLastState,
				newGamepad: NativeGamepad;
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
				this._compareButtons([...newGamepad.buttons], [...oldGamepad.buttons]);
				this._compareAxes([...newGamepad.axes], [...oldGamepad.axes]);
				this._compareJoysticks([...newGamepad.axes], [...oldGamepad.axes]);
			}
			this._setLastValues();

			// Update properties from the native gamepad
			this.axes = gamepad.axes;
			this.buttons = gamepad.buttons;
			this.connected = gamepad.connected;
			this.id = gamepad.id;
			this.index = gamepad.index;
			this.mapping = gamepad.mapping;
			this.timestamp = gamepad.timestamp;
		}

		/**
		 * Compares joystick movements and fires joystickmove events
		 *
		 * @param newAxes - Current axis values
		 * @param oldAxes - Previous axis values
		 * @private
		 */
		_compareJoysticks(newAxes: number[], oldAxes: number[]): void {
			this._callbacks.joystickmove.forEach((callbacks, indices) => {
				if (Array.isArray(indices)) {
					const newHorizontal = this._applyJoystickDeadzone(
						newAxes[indices[0]],
					);
					const newVertical = this._applyJoystickDeadzone(newAxes[indices[1]]);
					const oldHorizontal = this._applyJoystickDeadzone(
						oldAxes[indices[0]],
					);
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
				}
			});
		}

		/**
		 * Applies joystick deadzone to a value
		 *
		 * @param value - The axis value to process
		 * @returns The processed value with deadzone applied
		 * @private
		 */
		_applyJoystickDeadzone(value: number): number {
			return this._applyDeadzone(value, this.joystickDeadzone);
		}

		/**
		 * Applies axis-specific deadzone to a value
		 *
		 * @param value - The axis value to process
		 * @param index - The axis index
		 * @returns The processed value with deadzone applied
		 * @private
		 */
		_applyAxisDeadzone(value: number, index: number): number {
			return index in this._deadzones
				? this._applyDeadzone(value, this._deadzones[index])
				: value;
		}

		/**
		 * Applies deadzone calculation to a value
		 *
		 * @param value - The input value
		 * @param deadzone - The deadzone threshold
		 * @returns The value with deadzone subtracted if above threshold, 0 otherwise
		 * @private
		 */
		_applyDeadzone(value: number, deadzone: number): number {
			return Math.abs(value) > deadzone
				? value - Math.sign(value) * deadzone
				: 0;
		}

		/**
		 * Compares axis values and fires axischange events
		 *
		 * @param newAxes - Current axis values
		 * @param oldAxes - Previous axis values
		 * @private
		 */
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

		/**
		 * Compares button values and fires button events
		 *
		 * @param newValues - Current button values
		 * @param oldValues - Previous button values
		 * @private
		 */
		_compareButtons(
			newValues: GamepadButton[],
			oldValues: GamepadButton[],
		): void {
			this._checkButtons(
				"buttonpress",
				newValues,
				oldValues,
				(nv: GamepadButton, ov: GamepadButton) => nv.pressed && !ov.pressed,
			);
			this._checkButtons(
				"buttonrelease",
				newValues,
				oldValues,
				(nv: GamepadButton, ov: GamepadButton) => !nv.pressed && ov.pressed,
			);
			this._checkButtons(
				"buttonvaluechange",
				newValues,
				oldValues,
				(nv: GamepadButton, ov: GamepadButton) => nv.value !== ov.value,
			);
		}

		/**
		 * Checks for button state changes and fires appropriate events
		 *
		 * @param eventType - The type of event to check for
		 * @param newValues - Current button values
		 * @param oldValues - Previous button values
		 * @param predicate - Function to determine if an event should fire
		 * @private
		 */
		_checkButtons(
			eventType: string,
			newValues: GamepadButton[],
			oldValues: GamepadButton[],
			predicate: (nv: GamepadButton, ov: GamepadButton) => boolean,
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

		/**
		 * Dispatches an event to the appropriate listeners
		 *
		 * @param event - The event to dispatch
		 * @param callbackMap - Map of callbacks organized by index
		 * @param index - The button/axis index
		 * @private
		 */
		_dispatchEvent(
			event: unknown,
			callbackMap: Map<number | number[], ((event: unknown) => void)[]>,
			index: number | number[],
		): void {
			if (callbackMap.has(index)) {
				// specific listeners
				const listeners = callbackMap.get(index);
				if (listeners) {
					(
						event as {
							_dispatch: (listeners: ((event: unknown) => void)[]) => void;
						}
					)._dispatch(listeners);
				}
			}
			if (callbackMap.has(-1)) {
				// non-specific listeners
				const listeners = callbackMap.get(-1);
				if (listeners) {
					(
						event as {
							_dispatch: (listeners: ((event: unknown) => void)[]) => void;
						}
					)._dispatch(listeners);
				}
			}
		}

		/**
		 * Adds an event listener to this gamepad
		 *
		 * Event types: buttonpress, buttonrelease, buttonvaluechange, axischange, joystickmove
		 * If index is supplied, the listener will apply only to events for the button/axis at that index;
		 * otherwise (default value -1) the listener will apply to all buttons or axes.
		 * For joystickmove events, a two-item array must be passed to index to handle two-axis joysticks.
		 *
		 * Indexed event listeners are called before unindexed event listeners.
		 * After that, event listeners are called in order of most recently added.
		 *
		 * @param type - Event type: 'buttonpress', 'buttonrelease', 'buttonvaluechange', 'axischange', or 'joystickmove'
		 * @param listener - Callback function to execute when the event occurs
		 * @param index - Button/axis index or array of indices for joystick events (default: -1 for all)
		 *
		 * @example
		 * ```javascript
		 * // Listen to all button presses
		 * gamepad.addEventListener('buttonpress', (event) => {
		 *   console.log('Button pressed:', event.index);
		 * });
		 *
		 * // Listen to specific button (A button on standard mapping)
		 * gamepad.addEventListener('buttonpress', (event) => {
		 *   console.log('A button pressed');
		 * }, StandardMapping.Button.BUTTON_BOTTOM);
		 *
		 * // Listen to left joystick movement
		 * gamepad.addEventListener('joystickmove', (event) => {
		 *   console.log('Left stick:', event.horizontalValue, event.verticalValue);
		 * }, StandardMapping.Axis.JOYSTICK_LEFT);
		 * ```
		 */
		addEventListener(
			type: string,
			listener: (event: unknown) => void,
			index: number | number[] = -1,
		): void {
			this._checkJoystickEvent(type, index);
			if (!this._callbacks[type].has(index)) {
				this._callbacks[type].set(index, []);
			}
			const listeners = this._callbacks[type].get(index);
			if (listeners) {
				listeners.push(listener);
			}
		}

		/**
		 * Removes an event listener from this gamepad
		 *
		 * @param type - Event type: 'buttonpress', 'buttonrelease', 'buttonvaluechange', 'axischange', or 'joystickmove'
		 * @param listener - The callback function to remove
		 * @param index - Button/axis index or array of indices for joystick events (default: -1 for all)
		 */
		removeEventListener(
			type: string,
			listener: (event: unknown) => void,
			index: number | number[] = -1,
		): void {
			this._checkJoystickEvent(type, index);
			const listeners = this._callbacks[type].get(index);
			if (listeners) {
				const filtered = listeners.filter(
					(callback: (event: unknown) => void) => callback !== listener,
				);
				this._callbacks[type].set(index, filtered);
			}
		}

		/**
		 * Validates joystick event parameters
		 *
		 * @param type - The event type
		 * @param index - The index parameter
		 * @throws Error if joystickmove event doesn't have array index
		 * @private
		 */
		_checkJoystickEvent(type: string, index: number | number[]): void {
			if (type === "joystickmove" && !Array.isArray(index)) {
				throw new Error("joystickmove events require a two-length index array");
			}
		}

		/**
		 * Convenience method for adding joystick event listeners
		 *
		 * @param type - Event type (typically 'joystickmove')
		 * @param listener - Callback function to execute when the event occurs
		 * @param horizontalIndex - Index of the horizontal axis
		 * @param verticalIndex - Index of the vertical axis
		 *
		 * @example
		 * ```javascript
		 * gamepad.addJoystickEventListener('joystickmove', (event) => {
		 *   console.log('Joystick moved:', event.horizontalValue, event.verticalValue);
		 * }, 0, 1); // Left joystick
		 * ```
		 */
		addJoystickEventListener(
			type: string,
			listener: (event: unknown) => void,
			horizontalIndex: number,
			verticalIndex: number,
		): void {
			this.addEventListener(type, listener, [horizontalIndex, verticalIndex]);
		}

		/**
		 * Convenience method for removing joystick event listeners
		 *
		 * @param type - Event type (typically 'joystickmove')
		 * @param listener - The callback function to remove
		 * @param horizontalIndex - Index of the horizontal axis
		 * @param verticalIndex - Index of the vertical axis
		 */
		removeJoystickEventListener(
			type: string,
			listener: (event: unknown) => void,
			horizontalIndex: number,
			verticalIndex: number,
		): void {
			this.removeEventListener(type, listener, [
				horizontalIndex,
				verticalIndex,
			]);
		}
	}

	/**
	 * Base class for all gamepad events
	 *
	 * Underscore in name used to avoid collision with DOM's built-in GamepadEvent.
	 * Provides common functionality for event consumption and dispatching.
	 */
	class _GamepadEvent {
		/** The gamepad for which the event occurred */
		gamepad: GamepadState;
		/** The event type */
		type: string;
		/** Internal flag indicating if the event has been consumed */
		_consumed: boolean;

		/**
		 * Creates a new gamepad event
		 *
		 * @param gamepad - The gamepad instance
		 * @param type - The event type
		 */
		constructor(gamepad: GamepadState, type: string) {
			this.gamepad = gamepad;
			this.type = type.toLowerCase();
			this._consumed = false;
		}

		/**
		 * Consumes the event to prevent additional listeners from being called
		 */
		consume(): void {
			this._consumed = true;
		}

		/**
		 * Checks if the event has been consumed
		 *
		 * @returns True if the event has been consumed, false otherwise
		 */
		isConsumed(): boolean {
			return this._consumed;
		}

		/**
		 * Dispatches the event to a list of listeners
		 *
		 * @param listeners - Array of listener functions
		 * @private
		 */
		_dispatch(listeners: ((event: unknown) => void)[]): void {
			for (let i = 0; i < listeners.length && !this.isConsumed(); i++) {
				listeners[i](this);
			}
		}
	}

	/**
	 * Event fired when a gamepad is connected or disconnected
	 */
	class GamepadConnectionEvent extends _GamepadEvent {}

	/**
	 * Event fired when a gamepad button or axis value changes
	 */
	class GamepadValueEvent extends _GamepadEvent {
		/** The index of the button or axis that changed */
		index: number;
		/** The new value of the button or axis */
		value: number;

		/**
		 * Creates a new gamepad value event
		 *
		 * @param gamepad - The gamepad instance
		 * @param type - The event type
		 * @param index - The button or axis index
		 * @param value - The new value
		 */
		constructor(
			gamepad: GamepadState,
			type: string,
			index: number,
			value: number,
		) {
			super(gamepad, type);
			this.index = index;
			this.value = value;
		}
	}

	/**
	 * Event fired when a gamepad joystick moves
	 */
	class GamepadJoystickEvent extends _GamepadEvent {
		/** Array containing both axis indices [horizontal, vertical] */
		indices: number[];
		/** Array containing both axis values [horizontal, vertical] */
		values: number[];
		/** Index of the horizontal axis */
		horizontalIndex: number;
		/** Index of the vertical axis */
		verticalIndex: number;
		/** Value of the horizontal axis (-1 to 1) */
		horizontalValue: number;
		/** Value of the vertical axis (-1 to 1) */
		verticalValue: number;

		/**
		 * Creates a new gamepad joystick event
		 *
		 * @param gamepad - The gamepad instance
		 * @param type - The event type
		 * @param hIndex - Index of the horizontal axis
		 * @param vIndex - Index of the vertical axis
		 * @param hValue - Value of the horizontal axis
		 * @param vValue - Value of the vertical axis
		 */
		constructor(
			gamepad: GamepadState,
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

/**
 * Standard gamepad mapping indices for buttons and axes
 *
 * This object contains the button and axis index values for the standard gamepad mapping
 * as defined by the W3C Gamepad specification. Use these constants to identify specific
 * buttons and axes in your event handlers.
 *
 * @see {@link https://www.w3.org/TR/gamepad/} W3C Gamepad Specification
 *
 * @example
 * ```javascript
 * // Listen to A button press (bottom face button)
 * gamepad.addEventListener('buttonpress', (event) => {
 *   console.log('A button pressed');
 * }, StandardMapping.Button.BUTTON_BOTTOM);
 *
 * // Listen to left joystick movement
 * gamepad.addEventListener('joystickmove', (event) => {
 *   console.log('Left stick moved');
 * }, StandardMapping.Axis.JOYSTICK_LEFT);
 * ```
 */
export const StandardMapping = {
	/**
	 * Button indices for the standard gamepad mapping
	 *
	 * These correspond to the physical buttons on a standard gamepad:
	 * - Face buttons (A, B, X, Y)
	 * - Shoulder buttons (bumpers and triggers)
	 * - Control buttons (start, select, etc.)
	 * - D-pad directions
	 * - Joystick click buttons
	 */
	Button: {
		/** A button (bottom face button) - typically the primary action button */
		BUTTON_BOTTOM: 0,
		/** B button (right face button) - typically the secondary action button */
		BUTTON_RIGHT: 1,
		/** X button (left face button) - typically the tertiary action button */
		BUTTON_LEFT: 2,
		/** Y button (top face button) - typically the quaternary action button */
		BUTTON_TOP: 3,
		/** Left bumper button */
		BUMPER_LEFT: 4,
		/** Right bumper button */
		BUMPER_RIGHT: 5,
		/** Left trigger button */
		TRIGGER_LEFT: 6,
		/** Right trigger button */
		TRIGGER_RIGHT: 7,
		/** Left control button (select/back) */
		BUTTON_CONTROL_LEFT: 8,
		/** Right control button (start/menu) */
		BUTTON_CONTROL_RIGHT: 9,
		/** Left joystick click button */
		BUTTON_JOYSTICK_LEFT: 10,
		/** Right joystick click button */
		BUTTON_JOYSTICK_RIGHT: 11,
		/** D-pad up */
		D_PAD_UP: 12,
		/** D-pad down */
		D_PAD_BOTTOM: 13,
		/** D-pad left */
		D_PAD_LEFT: 14,
		/** D-pad right */
		D_PAD_RIGHT: 15,
		/** Middle control button (home/guide) */
		BUTTON_CONTROL_MIDDLE: 16,
	},

	/**
	 * Axis indices for the standard gamepad mapping
	 *
	 * Axis values range from -1 to 1:
	 * - Negative values: left/up
	 * - Positive values: right/down
	 * - 0: center/neutral position
	 */
	Axis: {
		/** Left joystick horizontal axis */
		JOYSTICK_LEFT_HORIZONTAL: 0,
		/** Left joystick vertical axis */
		JOYSTICK_LEFT_VERTICAL: 1,
		/** Right joystick horizontal axis */
		JOYSTICK_RIGHT_HORIZONTAL: 2,
		/** Right joystick vertical axis */
		JOYSTICK_RIGHT_VERTICAL: 3,
		/** Left joystick as array [horizontal, vertical] - convenient for joystick events */
		JOYSTICK_LEFT: [0, 1],
		/** Right joystick as array [horizontal, vertical] - convenient for joystick events */
		JOYSTICK_RIGHT: [2, 3],
	},
};
