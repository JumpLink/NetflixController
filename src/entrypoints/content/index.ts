import LiveStorage from '../../utils/live-storage.ts';
import { gamepads, StandardMapping } from '../../utils/gamepads.ts';
import { gamepadMappings } from '../../utils/gamepad-icons.ts';
import type { LiveStorageInstance } from '../../types/storage';
import type { ContentScriptMessage } from '../../types/messages';

// Import CSS - WXT will automatically add this to the manifest
import '../../../public/assets/styles/content.css';

// UI components
import { ActionHandler } from './ui/actions.js';
import { ConnectionHintBar } from './ui/connection-hint.js';
import { CompatibilityWarningBar } from './ui/compatibility-warning.js';
import { ErrorBar } from './ui/error-bar.js';
import { VirtualKeyboard } from './ui/virtual-keyboard.js';
import { Navigatable } from './components/navigatable.js';

// Page handlers
import { ChooseProfile } from './pages/choose-profile.js';
import { FeaturedBrowse } from './pages/featured-browse.js';
import { FeaturelessBrowse } from './pages/featureless-browse.js';
import { LatestBrowse } from './pages/latest-browse.js';
import { TitleBrowse } from './pages/title-browse.js';
import { SearchBrowse } from './pages/search.js';
import { WatchVideo } from './pages/watch.js';

// Components
import { DIRECTION } from './components/direction.js';

export default defineContentScript({
  matches: ['*://*.netflix.com/*'],
  main() {

const storage: LiveStorageInstance = LiveStorage;
const ERROR_ALERT_DURATION = 10000;
const NETFLIX_RED = 'rgba(229, 9, 20)';

function getTransparentNetflixRed(opacity: number): string {
    return NETFLIX_RED.replace(')', ', ' + opacity + ')');
}

gamepadMappings.buttonsPath = 'assets/buttons';

let currentPath: string | null = null;
let numGamepads = 0;
let hasConnectedGamepad = false;
let keyboard: any = null;
let handlerHistory: any[] = [];
let currentHandler: any = null;
let actionHandler: any = new ActionHandler(storage);
let connectionHintBar: any = new ConnectionHintBar();
let compatibilityWarning: any = new CompatibilityWarningBar();
let errorBar: any = new ErrorBar();
const pageHandlers: any[] = [
    ChooseProfile,
    FeaturedBrowse,
    FeaturelessBrowse,
    LatestBrowse,
    TitleBrowse,
    SearchBrowse,
    WatchVideo
];

const searchAction: any = {
    label: 'Search',
    index: StandardMapping.Button.BUTTON_TOP,
    onPress: openSearch
};

const backAction: any = {
    label: 'Back',
    index: StandardMapping.Button.BUTTON_RIGHT,
    onPress: goBack
};

storage.addListener('showActionHints', showActionHints);
storage.addListener('buttonImageMapping', () => actionHandler.updateHints());
storage.addListener('showConnectionHint', showConnectionHint);
storage.addListener('showCompatibilityWarning', updateCompatibility);
storage.load().then(() => {
    // Initialize UI elements after storage is loaded
    showConnectionHint();
    showActionHints();
    updateCompatibility();
});

browser.runtime.onMessage.addListener((request: ContentScriptMessage, _sender: any, _sendMessage: any) => {
    if (request.message === 'locationChanged') {
        if (hasConnectedGamepad) {
            // load plugin core only if user is using gamepad in this session
            runHandler(request.path);
        }
    } else if (request.message === 'disableGamepadInput') {
        gamepads.stop();
    } else if (request.message === 'enableGamepadInput') {
        gamepads.start();
    }
});

async function runHandler(path: string, forceLoad: boolean = false) {
    if (forceLoad || path !== currentPath) {
        unload();
        refreshPageIfBad();
        let found = false;
        for (let i = 0; !found && i < pageHandlers.length; i++) {
            if (pageHandlers[i].validatePath(path)) {
                log(`Loading ${pageHandlers[i].name} module for ${path}`);
                await loadPage(pageHandlers[i]);
                found = true;
            }
        }
        if (!found) {
            warn(`No module found for ${path}`);
        }
        currentPath = path;
    }
}

async function loadPage(handlerClass: any) {
    currentHandler = new handlerClass();
    if (currentHandler.hasPath()) {
        addHistory();
    }
    setPageActions();
    try {
        await currentHandler.load();
    } catch (error) {
        showError(error as any);
    }
}

function unload() {
    if (currentHandler) {
        currentHandler.unload();
        currentHandler = null;
    }
}

// pages containing ?so=su seem to often not load; remove it and refresh
function refreshPageIfBad() {
    if (window.location.href.includes('so=su')) {
        window.location.assign(window.location.href.replace('so=su', ''));
    }
}

function setPageActions() {
    if (!keyboard) {
        if (currentHandler.hasSearchBar()) {
            actionHandler.addAction(searchAction);
        } else {
            actionHandler.removeAction(searchAction);
        }
        if (handlerHistory.length >= 2) {
            actionHandler.addAction(backAction);
        } else {
            actionHandler.removeAction(backAction);
        }
        (actionHandler as any).onDirection = currentHandler.onDirectionAction.bind(currentHandler);
    }
}

function showActionHints() {
    if (numGamepads > 0 && (storage.sync.showActionHints ?? true)) {
        actionHandler.showHints();
    } else {
        actionHandler.hideHints();
    }
}

function showConnectionHint() {
    if (numGamepads === 0 && (storage.local.showConnectionHint ?? true)) {
        connectionHintBar.add();
    } else {
        connectionHintBar.remove();
    }
}

function updateCompatibility() {
    if ((storage.local.showCompatibilityWarning ?? true) && numGamepads > 0 &&
            !isStandardGamepadConnected()) {
        compatibilityWarning.add();
    } else {
        compatibilityWarning.remove();
    }
}

function showError(error: Error, timeout: number = -1) {
    console.error(error);
    errorBar.setError(error.message, timeout);
    errorBar.add();
}

function showTempError(error: Error) {
    showError(error, ERROR_ALERT_DURATION);
}

function log(message: string) {
    console.log(`NETFLIX-CONTROLLER: ${message}`);
}

function warn(message: string) {
    console.warn(`NETFLIX-CONTROLLER: ${message}`);
}

function isStandardGamepadConnected() {
    return Object.values(gamepads.gamepads || {}).some((g: any) => g.gamepad.mapping === 'standard');
}

log('Listening for gamepad connections.');
gamepads.addEventListener('connect', (e: any) => {
    if (!hasConnectedGamepad) {
        // first connection, run current page handler manually
        observeProfilePopup();
        runHandler(window.location.pathname);
        hasConnectedGamepad = true;
    }
    connectionHintBar.remove();
    numGamepads++;
    showActionHints();
    updateCompatibility();
    log(`Gamepad connected: ${e.gamepad.gamepad.id}`);
    e.gamepad.addEventListener('buttonpress', (e: any) => {
        try {
            (actionHandler as any).onButtonPress(e.index);
        } catch (error) {
            showTempError(error as any);
        }
    })
    e.gamepad.addEventListener('buttonrelease', (e: any) => {
        try {
            (actionHandler as any).onButtonRelease(e.index);
        } catch (error) {
            showTempError(error as any);
        }
    })
    e.gamepad.addEventListener('joystickmove', (e: any) => {
        try {
            checkJoystickDirection(e.gamepad, e.horizontalIndex, e.horizontalValue, DIRECTION.RIGHT, DIRECTION.LEFT);
            checkJoystickDirection(e.gamepad, e.verticalIndex, e.verticalValue, DIRECTION.DOWN, DIRECTION.UP);
        } catch (error) {
            showTempError(error as any);
        }
    }, StandardMapping.Axis.JOYSTICK_LEFT);
})
gamepads.addEventListener('disconnect', (e: any) => {
    numGamepads--;
    if (numGamepads === 0) {
        actionHandler.hideHints();
    }
    showConnectionHint();
    updateCompatibility();
    log(`Gamepad disconnected: ${e.gamepad.gamepad.id}`);
})
gamepads.start();

// TODO: rethink this messy code; integrate rate limited polling into gamepads.js?
let timeouts: Record<number, any> = {};
let directions: Record<number, any> = {};

function checkJoystickDirection(gamepad: any, axis: number, value: number, pos: any, neg: any) {
    if (Math.abs(value) >= 1 - gamepad.joystickDeadzone) {
        let direction = value > 0 ? pos : neg;
        if (!(axis in directions) || directions[axis] !== direction) {
            directions[axis] = direction;
            rateLimitJoystickDirection(axis, 500);
        }
    } else {
        directions[axis] = -1;
        if (axis in timeouts) {
            clearTimeout(timeouts[axis]);
            delete timeouts[axis];
        }
    }
}

function rateLimitJoystickDirection(axis: number, rateMillis: number) {
    if (directions[axis] !== -1) {
        actionHandler.onDirection(directions[axis]);
        timeouts[axis] = setTimeout(() => rateLimitJoystickDirection(axis, rateMillis), rateMillis);
    }
}

function openSearch() {
    let searchButton = document.querySelector('.searchTab') as HTMLElement;
    if (searchButton) {
        searchButton.click();
    }
    let searchInput = document.querySelector('.searchInput > input[type=text]') as HTMLInputElement;
    if (!searchInput) return;
    let searchParent = searchInput.parentElement?.parentElement;
    if (!searchParent) return;
    let startingLocation = window.location.href;
    let handlerState = currentHandler?.exit();
    (Navigatable as any).scrollIntoView(searchInput);

    keyboard = VirtualKeyboard.create(searchInput, searchParent, () => {
        if (keyboard) {
            (actionHandler as any).removeAll(keyboard.getActions());
        }
        if (window.location.href === startingLocation && currentHandler) {
            currentHandler.enter(handlerState);
        }
        keyboard = null;
        setPageActions();
    });

    let searchContainer = document.querySelector('.secondary-navigation') as HTMLElement;
    if (!searchContainer) return;
    let closeObserver = new MutationObserver((mutations: MutationRecord[]) => {
        for (let mutation of mutations) {
            if (!(mutation.target as Element).classList.contains('search-focused')) {
                // search bar is no longer focused
                if (keyboard) {
                    keyboard.close();
                }
                closeObserver.disconnect();
            }
        }
    });
    closeObserver.observe(searchContainer, { attributes: true, attributeFilter: [ 'class' ] });

    actionHandler.removeAction(searchAction);
    (actionHandler as any).addAll(keyboard.getActions());
    (actionHandler as any).onDirection = keyboard.onDirectionAction.bind(keyboard);
}

function goBack() {
    if (handlerHistory.length > 0) {
        unload();
        handlerHistory.pop();
        window.history.back();
    }
}

// track history to ensure we don't go back to a non-Netflix page
function addHistory() {
    let location = new URL(window.location.href);
    if (handlerHistory.length > 0) {
        let last = handlerHistory[handlerHistory.length - 1];
        if (last !== location.pathname) {
            handlerHistory.push(location.pathname);
        }
    } else {
        handlerHistory.push(location.pathname);
    }
}

function observeProfilePopup() {
    let root = document.getElementById('appMountPoint');
    if (!root) return;
    let observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node as Element).classList.contains('profiles-gate-container')) {
                    unload();
                    loadPage(ChooseProfile);
                }
            }
        }
    });
    observer.observe(root, { subtree: true, childList: true });
}

// Make functions globally available for other modules
// TODO: Cleaner exportable solution?
(window as any).runHandler = runHandler;
(window as any).currentHandler = currentHandler;
(window as any).actionHandler = actionHandler;
(window as any).getTransparentNetflixRed = getTransparentNetflixRed;
(window as any).isKeyboardActive = () => keyboard !== null;
  }
});