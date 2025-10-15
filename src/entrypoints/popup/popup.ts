import type { GamepadState } from "../../types/gamepad";
import { GamepadEventManager } from "../../utils/gamepad-events.ts";
import { gamepadMappings } from "../../utils/gamepad-icons.ts";
import { Gamepads } from "../../utils/gamepads.ts";
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

Gamepads.addEventListener("connect", (e: unknown) => {
	const event = e as { gamepad: GamepadState };
	console.log("Gamepad connected:");
	console.log(event.gamepad);
	const countElement = document.getElementById("count");
	if (countElement) {
		countElement.textContent = (++count).toString();
	}
	updateCompatibility();

	// Add button event listeners
	GamepadEventManager.addButtonListeners(
		event.gamepad,
		(index: number) => showPressedButton(index),
		(index: number) => removePressedButton(index),
	);

	// Add joystick event listeners
	GamepadEventManager.addJoystickListener(event.gamepad, {
		callback: (e) => moveJoystick(e.values, true),
		isLeftJoystick: true,
	});

	GamepadEventManager.addJoystickListener(event.gamepad, {
		callback: (e) => moveJoystick(e.values, false),
		isLeftJoystick: false,
	});
});

Gamepads.addEventListener("disconnect", (e: unknown) => {
	const event = e as { gamepad: GamepadState };
	console.log("Gamepad disconnected:");
	console.log(event.gamepad);
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
Gamepads.start();

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
			!Object.values(Gamepads.gamepads || {}).some(
				(g: GamepadState) => g.mapping === "standard",
			)
		) {
			warning.style.display = "block";
		} else {
			warning.style.display = "none";
		}
	}
}
