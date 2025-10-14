import { StandardMapping } from '../../../utils/gamepads@1.2.2.js';
import { gamepadMappings } from '../../../utils/gamepad-icons@1.2.2.js';
import { DIRECTION } from '../components/direction.js';
import { BottomBar } from './bottom-bar.js';

const DIRECTION_MAP = {
    [StandardMapping.Button.D_PAD_UP]: DIRECTION.UP,
    [StandardMapping.Button.D_PAD_BOTTOM]: DIRECTION.DOWN,
    [StandardMapping.Button.D_PAD_LEFT]: DIRECTION.LEFT,
    [StandardMapping.Button.D_PAD_RIGHT]: DIRECTION.RIGHT
};

/**
 * Action { label, index, onPress, onRelease, hideHint }
 */

export class ActionHandler {
    constructor(storage) {
        this.storage = storage;
        this.hintsBar = new ActionHintsBar(storage);
        this.actions = {};
        this.onDirection = null;
        this.onInput = null;
    }

    addAction(action) {
        this.actions[action.index] = action;
        this.updateHints();
    }

    removeAction(action) {
        delete this.actions[action.index];
        this.updateHints();
    }

    addAll(actions) {
        for (let action of actions) {
            this.actions[action.index] = action;
        }
        this.updateHints();
    }

    removeAll(actions) {
        for (let action of actions) {
            delete this.actions[action.index];
        }
        this.updateHints();
    }

    updateHints() {
        if (this.hintsBar) {
            this.hintsBar.update(this.actions);
        }
    }

    showHints() {
        this.hintsBar.add();
        this.updateHints();
    }

    hideHints() {
        this.hintsBar.remove();
    }

    onButtonPress(index) {
        if (this.onInput) {
            this.onInput(); // non-specific activity callback
        }
        if (index in DIRECTION_MAP && this.onDirection) {
            this.onDirection(DIRECTION_MAP[index]);
        }
        if (index in this.actions && this.actions[index].onPress) {
            this.actions[index].onPress();
        }
    }

    onButtonRelease(index) {
        if (index in this.actions && this.actions[index].onRelease) {
            this.actions[index].onRelease();
        }
    }
}

export class ActionHintsBar extends BottomBar {
    constructor(storage) {
        super();
        this.storage = storage;
    }

    createBar() {
        let hintsBar = document.createElement('div');
        hintsBar.id = 'gamepad-interface-hints-bar';
        hintsBar.classList.add('gamepad-interface-bar');
        return hintsBar;
    }

    createHint(action) {
        let buttonMapping = this.storage.sync.buttonImageMapping || 'Xbox One';
        let button = gamepadMappings.getButton(buttonMapping, action.index);
        if (button) {
            let imageSrc = chrome.runtime.getURL(button.buttonImageSrc);
            return (
                `<div class='gamepad-interface-hint'>
                    <img src='${imageSrc}' alt='${button.buttonName}'>
                    ${action.label}
                </div>`   
            );
        }
        return null;
    }

    update(actions) {
        if (this.element) {
            this.element.innerHTML = '';
            for (let action of Object.values(actions)) {
                if (action.hideHint !== false) {
                    let hint = this.createHint(action);
                    if (hint) {
                        this.element.insertAdjacentHTML('beforeend', hint);
                    }
                }
            }
        }
    }

    getPriority() {
        return 5;
    }
}
