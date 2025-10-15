/** biome-ignore-all lint/suspicious/noExplicitAny: Popup script handles dynamic gamepad events and interactions requiring flexible typing for event handlers and button state tracking. */
import { gamepadMappings } from "../../utils/gamepad-icons.ts";
import { gamepads, StandardMapping } from "../../utils/gamepads.ts";
import * as S from "../../utils/storage-items";

let currentMapping = "Xbox One";
const style = window.getComputedStyle(document.body);
const CONTAINER_SIZE = parseFloat(
	style.getPropertyValue("--joystick-container-size"),
);
const DOT_SIZE = parseFloat(style.getPropertyValue("--joystick-size"));
const DOT_POSITION = (CONTAINER_SIZE - DOT_SIZE) / 2;

let count = 0;
const pressedButtons: Record<number, any> = {};

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

gamepads.addEventListener("connect", (e: any) => {
	console.log("Gamepad connected:");
	console.log(e.gamepad);
	const countElement = document.getElementById("count");
	if (countElement) {
		countElement.textContent = (++count).toString();
	}
	updateCompatibility();
	e.gamepad.addEventListener("buttonpress", (e: any) =>
		showPressedButton(e.index),
	);
	e.gamepad.addEventListener("buttonrelease", (e: any) =>
		removePressedButton(e.index),
	);
	e.gamepad.addEventListener(
		"joystickmove",
		(e: any) => moveJoystick(e.values, true),
		StandardMapping.Axis.JOYSTICK_LEFT,
	);
	e.gamepad.addEventListener(
		"joystickmove",
		(e: any) => moveJoystick(e.values, false),
		StandardMapping.Axis.JOYSTICK_RIGHT,
	);
});

gamepads.addEventListener("disconnect", (e: any) => {
	console.log("Gamepad disconnected:");
	console.log(e.gamepad);
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
gamepads.start();

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
			!Object.values(gamepads.gamepads || {}).some(
				(g: any) => g.gamepad.mapping === "standard",
			)
		) {
			warning.style.display = "block";
		} else {
			warning.style.display = "none";
		}
	}
}
