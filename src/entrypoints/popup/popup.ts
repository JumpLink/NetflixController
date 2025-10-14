import LiveStorage from '../../utils/live-storage.js';
import { gamepads, StandardMapping } from '../../utils/gamepads.js';
import { gamepadMappings } from '../../utils/gamepad-icons.js';
import type { LiveStorageInstance } from '../../types/storage';

const storage: LiveStorageInstance = LiveStorage;
let style = window.getComputedStyle(document.body);
const CONTAINER_SIZE = parseFloat(style.getPropertyValue('--joystick-container-size'));
const DOT_SIZE = parseFloat(style.getPropertyValue('--joystick-size'));
const DOT_POSITION = (CONTAINER_SIZE - DOT_SIZE) / 2;

let count = 0;
let pressedButtons: Record<number, any> = {};

// disable gamepad input on page while popup is open
browser.tabs.query({ currentWindow: true, active: true }, tabs => {
    let tabId = tabs[0]?.id;
    if (tabId !== undefined) {
        browser.tabs.sendMessage(tabId, { message: 'disableGamepadInput' })
        window.addEventListener('blur', () => {
            browser.tabs.sendMessage(tabId, { message: 'enableGamepadInput' });
        });
    }
});

storage.addListener('buttonImageMapping', () => {
    // TODO link mapping to controller id maybe?
    const mappingElement = document.getElementById('gamepad-mapping') as HTMLSelectElement;
    if (mappingElement) {
        mappingElement.value = storage.sync.buttonImageMapping;
    }
});
storage.load();

gamepads.addEventListener('connect', (e: any) => {
    console.log('Gamepad connected:');
    console.log(e.gamepad);
    const countElement = document.getElementById('count');
    if (countElement) {
        countElement.textContent = (++count).toString();
    }
    updateCompatibility();
    e.gamepad.addEventListener('buttonpress', (e: any) => showPressedButton(e.index));
    e.gamepad.addEventListener('buttonrelease', (e: any) => removePressedButton(e.index));
    e.gamepad.addEventListener('joystickmove', (e: any) => moveJoystick(e.values, true),
            StandardMapping.Axis.JOYSTICK_LEFT);
    e.gamepad.addEventListener('joystickmove', (e: any) => moveJoystick(e.values, false),
            StandardMapping.Axis.JOYSTICK_RIGHT);
});

gamepads.addEventListener('disconnect', (e: any) => {
    console.log('Gamepad disconnected:');
    console.log(e.gamepad);
    const countElement = document.getElementById('count');
    if (countElement) {
        countElement.textContent = (--count).toString();
    }
    updateCompatibility();
});

let mappingDropdown = document.getElementById('gamepad-mapping') as HTMLSelectElement;
if (mappingDropdown) {
    mappingDropdown.addEventListener('change', () => {
        storage.sync.buttonImageMapping = mappingDropdown.value;
    });
}

const optionsElement = document.getElementById('options');
if (optionsElement) {
    optionsElement.addEventListener('click', () => {
        browser.runtime.openOptionsPage();
    });
}

moveJoystick([0, 0], true);
moveJoystick([0, 0], false);
gamepadMappings.buttonsPath = '/assets/buttons';
gamepads.start();

function showPressedButton(index: number) {
    if (!pressedButtons[index]) {
        let button = gamepadMappings.getButton(storage.sync.buttonImageMapping, index);
        if (button) {
            let img = document.createElement('img');
            img.classList.add('gamepad-button');
            img.src = button.buttonImageSrc;
            img.alt = button.buttonName;
            const pressedButtonsElement = document.getElementById('pressed-buttons');
            if (pressedButtonsElement) {
                pressedButtonsElement.append(img);
            }
            pressedButtons[index] = img;
        }
    }
}

function removePressedButton(index: number) {
    let img = pressedButtons[index];
    if (img) {
        img.parentNode?.removeChild(img);
        delete pressedButtons[index];
    }
}

function moveJoystick(values: number[], isLeft: boolean) {
    let id = (isLeft ? 'left' : 'right');
    let joystick = document.getElementById(id + '-joystick') as HTMLElement;
    if (joystick) {
        let x = DOT_POSITION + CONTAINER_SIZE / 2 * values[0];
        let y = DOT_POSITION + CONTAINER_SIZE / 2 * values[1];
        joystick.style.top = y + 'px';
        joystick.style.left = x + 'px';
    }
}

function updateCompatibility() {
    let warning = document.getElementById('no-standard-gamepad') as HTMLElement;
    if (warning) {
        if (!Object.values(gamepads.gamepads || {}).some((g: any) => g.gamepad.mapping === 'standard')) {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }
}