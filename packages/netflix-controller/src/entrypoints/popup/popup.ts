import gameControl from "@ribajs/gamecontroller.js";
import type { GamepadState } from "../../types/gamepad";
import { getControllerMapping } from "../../utils/controller-detection";
import { gamepadMappings } from "../../utils/gamepad-icons.ts";
import * as S from "../../utils/storage-items";

let currentMapping = "Xbox One";
const style = window.getComputedStyle(document.body);
const CONTAINER_SIZE = parseFloat(
	style.getPropertyValue("--joystick-container-size"),
);
const DOT_SIZE = parseFloat(style.getPropertyValue("--joystick-size"));
const DOT_POSITION = (CONTAINER_SIZE - DOT_SIZE) / 2;

let count = 0;
const pressedButtons: Record<number, HTMLImageElement> = {};

// disable gamepad input on page while popup is open
browser.tabs.query({ currentWindow: true, active: true }, (tabs) => {
	const tabId = tabs[0]?.id;
	if (tabId !== undefined) {
		browser.tabs.sendMessage(tabId, { message: "disableGamepadInput" });
		window.addEventListener("blur", () => {
			browser.tabs.sendMessage(tabId, { message: "enableGamepadInput" });
		});
	}
});

// Initialize mapping and wire listener
S.buttonImageMapping
	.get()
	.then((v) => {
		currentMapping = v ?? "Xbox One";
		const mappingElement = document.getElementById(
			"gamepad-mapping",
		) as HTMLSelectElement;
		if (mappingElement) {
			mappingElement.value = currentMapping;
		}
	})
	.catch((err) => console.error("Failed to read buttonImageMapping", err));

S.buttonImageMapping.onChanged((v) => {
	currentMapping = v;
	const mappingElement = document.getElementById(
		"gamepad-mapping",
	) as HTMLSelectElement;
	if (mappingElement) {
		mappingElement.value = currentMapping;
	}
});

// Track joystick values globally for beforeCycle reset
const leftJoystickValues = [0, 0];
const rightJoystickValues = [0, 0];

gameControl.on("connect", (gamepad: GamepadState) => {
	console.log("Gamepad connected:");
	console.log(gamepad);
	const countElement = document.getElementById("count");
	if (countElement) {
		countElement.textContent = (++count).toString();
	}
	updateCompatibility();

	// Auto-detect controller type
	const detectedMapping = getControllerMapping(
		gamepad.controllerId,
		currentMapping,
	);
	if (detectedMapping !== currentMapping) {
		console.log(
			`Auto-detected controller as ${detectedMapping} (${gamepad.controllerId})`,
		);
		currentMapping = detectedMapping;
		const mappingElement = document.getElementById(
			"gamepad-mapping",
		) as HTMLSelectElement;
		if (mappingElement) {
			mappingElement.value = currentMapping;
		}
	}

	// Add button event listeners for all buttons
	for (let i = 0; i <= 16; i++) {
		const buttonIndex = i;
		gamepad.before(`button${buttonIndex}`, () =>
			showPressedButton(buttonIndex),
		);
		gamepad.after(`button${buttonIndex}`, () =>
			removePressedButton(buttonIndex),
		);
	}

	// Add joystick event listeners - track the axis values for visualization
	// Left joystick - track horizontal (axis 0)
	gamepad.on("left0", () => {
		leftJoystickValues[0] = -1;
		moveJoystick(leftJoystickValues, true);
	});
	gamepad.on("right0", () => {
		leftJoystickValues[0] = 1;
		moveJoystick(leftJoystickValues, true);
	});
	// Left joystick - track vertical (axis 1)
	gamepad.on("up0", () => {
		leftJoystickValues[1] = -1;
		moveJoystick(leftJoystickValues, true);
	});
	gamepad.on("down0", () => {
		leftJoystickValues[1] = 1;
		moveJoystick(leftJoystickValues, true);
	});

	// Right joystick - track horizontal (axis 2)
	gamepad.on("left1", () => {
		rightJoystickValues[0] = -1;
		moveJoystick(rightJoystickValues, false);
	});
	gamepad.on("right1", () => {
		rightJoystickValues[0] = 1;
		moveJoystick(rightJoystickValues, false);
	});
	// Right joystick - track vertical (axis 3)
	gamepad.on("up1", () => {
		rightJoystickValues[1] = -1;
		moveJoystick(rightJoystickValues, false);
	});
	gamepad.on("down1", () => {
		rightJoystickValues[1] = 1;
		moveJoystick(rightJoystickValues, false);
	});
});

gameControl.on("disconnect", (index: number) => {
	console.log("Gamepad disconnected:");
	console.log(index);
	const countElement = document.getElementById("count");
	if (countElement) {
		countElement.textContent = (--count).toString();
	}
	updateCompatibility();
});

const mappingDropdown = document.getElementById(
	"gamepad-mapping",
) as HTMLSelectElement;
if (mappingDropdown) {
	mappingDropdown.addEventListener("change", () => {
		S.buttonImageMapping.set(mappingDropdown.value);
	});
}

const optionsElement = document.getElementById("options");
if (optionsElement) {
	optionsElement.addEventListener("click", () => {
		browser.runtime.openOptionsPage();
	});
}

moveJoystick([0, 0], true);
moveJoystick([0, 0], false);
gamepadMappings.buttonsPath = "/assets/buttons";

// Use beforeCycle to reset joystick visualization each frame (like in example-3)
gameControl.on("beforeCycle", () => {
	// Reset joystick values if no direction is pressed
	// This creates smooth visualization without needing many .after() handlers
	leftJoystickValues[0] = 0;
	leftJoystickValues[1] = 0;
	rightJoystickValues[0] = 0;
	rightJoystickValues[1] = 0;
	moveJoystick(leftJoystickValues, true);
	moveJoystick(rightJoystickValues, false);
});

function showPressedButton(index: number) {
	if (!pressedButtons[index]) {
		const button = gamepadMappings.getButton(currentMapping, index);
		if (button) {
			const img = document.createElement("img");
			img.classList.add("gamepad-button");
			img.src = button.buttonImageSrc;
			img.alt = button.buttonName;
			const pressedButtonsElement = document.getElementById("pressed-buttons");
			if (pressedButtonsElement) {
				pressedButtonsElement.append(img);
			}
			pressedButtons[index] = img;
		}
	}
}

function removePressedButton(index: number) {
	const img = pressedButtons[index];
	if (img) {
		img.parentNode?.removeChild(img);
		delete pressedButtons[index];
	}
}

function moveJoystick(values: number[], isLeft: boolean) {
	const id = isLeft ? "left" : "right";
	const joystick = document.getElementById(`${id}-joystick`) as HTMLElement;
	if (joystick) {
		const x = DOT_POSITION + (CONTAINER_SIZE / 2) * values[0];
		const y = DOT_POSITION + (CONTAINER_SIZE / 2) * values[1];
		joystick.style.top = `${y}px`;
		joystick.style.left = `${x}px`;
	}
}

function updateCompatibility() {
	const warning = document.getElementById("no-standard-gamepad") as HTMLElement;
	if (warning) {
		if (
			!Object.values(gameControl.gamepads || {}).some(
				(g: GamepadState) => g.mapping === "standard",
			)
		) {
			warning.style.display = "block";
		} else {
			warning.style.display = "none";
		}
	}
}
