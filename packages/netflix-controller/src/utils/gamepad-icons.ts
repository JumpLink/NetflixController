import { GAMEPAD_BUTTONS } from "@ribajs/gamecontroller.js";

interface GamepadMapping {
	name: string;
	filePrefix: string;
	buttons: Record<number, string>;
}

// PlayStation 3 Mapping
const PS3Mapping: GamepadMapping = {
	name: "PS3",
	filePrefix: "PS3_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "Cross",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "Circle",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "Square",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Triangle",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "L1",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "R1",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "L2",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "R2",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Select",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Start",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// PlayStation 4 Mapping
const PS4Mapping: GamepadMapping = {
	name: "PS4",
	filePrefix: "PS4_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "Cross",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "Circle",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "Square",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Triangle",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "L1",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "R1",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "L2",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "R2",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Share",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Options",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// Xbox 360 Mapping
const Xbox360Mapping: GamepadMapping = {
	name: "Xbox 360",
	filePrefix: "360_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "A",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "B",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "X",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Y",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "LB",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "RB",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "LT",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "RT",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Back",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Start",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// Xbox One Mapping
const XboxOneMapping: GamepadMapping = {
	name: "Xbox One",
	filePrefix: "XboxOne_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "A",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "B",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "X",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Y",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "LB",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "RB",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "LT",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "RT",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Windows",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Menu",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// PlayStation 5 Mapping
const PS5Mapping: GamepadMapping = {
	name: "PS5",
	filePrefix: "PS5_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "Cross",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "Circle",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "Square",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Triangle",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "L1",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "R1",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "L2",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "R2",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Share",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Options",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// Xbox Series X/S Mapping
const XboxSeriesMapping: GamepadMapping = {
	name: "Xbox Series",
	filePrefix: "XboxSeriesX_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "A",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "B",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "X",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Y",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "LB",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "RB",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "LT",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "RT",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "View",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Menu",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// Nintendo Switch Mapping
const SwitchMapping: GamepadMapping = {
	name: "Switch",
	filePrefix: "Switch_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "B", // Bottom button is B on Switch
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "A", // Right button is A on Switch
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "Y", // Left button is Y on Switch
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "X", // Top button is X on Switch
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "L",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "R",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "ZL",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "ZR",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Minus",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Plus",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

// Steam Deck Mapping
const SteamDeckMapping: GamepadMapping = {
	name: "Steam Deck",
	filePrefix: "SteamDeck_",
	buttons: {
		[GAMEPAD_BUTTONS.BUTTON_BOTTOM]: "A",
		[GAMEPAD_BUTTONS.BUTTON_RIGHT]: "B",
		[GAMEPAD_BUTTONS.BUTTON_LEFT]: "X",
		[GAMEPAD_BUTTONS.BUTTON_TOP]: "Y",
		[GAMEPAD_BUTTONS.BUMPER_LEFT]: "L1",
		[GAMEPAD_BUTTONS.BUMPER_RIGHT]: "R1",
		[GAMEPAD_BUTTONS.TRIGGER_LEFT]: "L2",
		[GAMEPAD_BUTTONS.TRIGGER_RIGHT]: "R2",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_LEFT]: "Minus",
		[GAMEPAD_BUTTONS.BUTTON_CONTROL_RIGHT]: "Menu",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_LEFT]: "Left_Stick",
		[GAMEPAD_BUTTONS.BUTTON_JOYSTICK_RIGHT]: "Right_Stick",
		[GAMEPAD_BUTTONS.D_PAD_UP]: "Dpad_Up",
		[GAMEPAD_BUTTONS.D_PAD_BOTTOM]: "Dpad_Down",
		[GAMEPAD_BUTTONS.D_PAD_LEFT]: "Dpad_Left",
		[GAMEPAD_BUTTONS.D_PAD_RIGHT]: "Dpad_Right",
	},
};

const ALL_MAPPINGS = [
	PS3Mapping,
	PS4Mapping,
	PS5Mapping,
	Xbox360Mapping,
	XboxOneMapping,
	XboxSeriesMapping,
	SwitchMapping,
	SteamDeckMapping,
];

interface GamepadButtonInfo {
	mappingName: string;
	buttonName: string;
	buttonImageSrc: string;
}

// avoid naming collision with DOM's GamepadButton
class _GamepadButton implements GamepadButtonInfo {
	mappingName: string;
	buttonName: string;
	buttonImageSrc: string;

	constructor(mappingName: string, buttonName: string, buttonImageSrc: string) {
		this.mappingName = mappingName;
		this.buttonName = buttonName;
		this.buttonImageSrc = buttonImageSrc;
	}
}

class GamepadIconHandler {
	buttonsPath: string = "/buttons";
	mappings: Record<string, GamepadMapping> = {};
	static _instance: GamepadIconHandler | null = null;

	constructor() {
		if (GamepadIconHandler._instance) {
			// Return the existing instance by copying its properties
			Object.assign(this, GamepadIconHandler._instance);
			return;
		}
		for (const mapping of ALL_MAPPINGS) {
			this.mappings[mapping.name] = mapping;
		}
		GamepadIconHandler._instance = this;
	}

	getButton(mappingName: string, index: number): _GamepadButton | null {
		if (
			mappingName in this.mappings &&
			index in this.mappings[mappingName].buttons
		) {
			const buttonName = this.mappings[mappingName].buttons[index];
			const buttonImageFile = `${this.mappings[mappingName].filePrefix + buttonName}.png`;
			const buttonImageSrc = `${this.buttonsPath}/${mappingName}/${buttonImageFile}`;
			return new _GamepadButton(mappingName, buttonName, buttonImageSrc);
		}
		return null;
	}
}

const GamepadIcons = new GamepadIconHandler();

// ESM export
export { GamepadIcons as gamepadMappings };
export default GamepadIcons;
