interface GamepadMapping {
	name: string;
	filePrefix: string;
	buttons: string[];
}

// untested
const PS3Mapping = {
	name: "PS3",
	filePrefix: "PS3_",
	buttons: [
		"Cross",
		"Circle",
		"Square",
		"Triangle",
		"L1",
		"R1",
		"L2",
		"R2",
		"Select",
		"Start",
		"Left_Stick",
		"Right_Stick",
		"Dpad_Up",
		"Dpad_Down",
		"Dpad_Left",
		"Dpad_Right",
	],
};

// untested
const PS4Mapping = {
	name: "PS4",
	filePrefix: "PS4_",
	buttons: [
		"Cross",
		"Circle",
		"Square",
		"Triangle",
		"L1",
		"R1",
		"L2",
		"R2",
		"Share",
		"Options",
		"Left_Stick",
		"Right_Stick",
		"Dpad_Up",
		"Dpad_Down",
		"Dpad_Left",
		"Dpad_Right",
	],
};

// untested
const Xbox360Mapping = {
	name: "Xbox 360",
	filePrefix: "360_",
	buttons: [
		"A",
		"B",
		"X",
		"Y",
		"LB",
		"RB",
		"LT",
		"RT",
		"Back",
		"Start",
		"Left_Stick",
		"Right_Stick",
		"Dpad_Up",
		"Dpad_Down",
		"Dpad_Left",
		"Dpad_Right",
	],
};

const XboxOneMapping = {
	name: "Xbox One",
	filePrefix: "XboxOne_",
	buttons: [
		"A",
		"B",
		"X",
		"Y",
		"LB",
		"RB",
		"LT",
		"RT",
		"Windows",
		"Menu",
		"Left_Stick",
		"Right_Stick",
		"Dpad_Up",
		"Dpad_Down",
		"Dpad_Left",
		"Dpad_Right",
	],
};

const SwitchMapping = {
	name: "Switch",
	filePrefix: "Switch_",
	buttons: [
		"B",
		"A",
		"Y",
		"X",
		"L",
		"R",
		"ZL",
		"ZR",
		"Minus",
		"Plus",
		"Left_Stick",
		"Right_Stick",
		"Dpad_Up",
		"Dpad_Down",
		"Dpad_Left",
		"Dpad_Right",
	],
};

const ALL_MAPPINGS = [
	PS3Mapping,
	PS4Mapping,
	Xbox360Mapping,
	XboxOneMapping,
	SwitchMapping,
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
