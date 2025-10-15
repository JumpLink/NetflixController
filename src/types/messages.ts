// Browser extension message types

export interface LocationChangedMessage {
	message: "locationChanged";
	path: string;
}

export interface DisableGamepadInputMessage {
	message: "disableGamepadInput";
}

export interface EnableGamepadInputMessage {
	message: "enableGamepadInput";
}

export type ContentScriptMessage =
	| LocationChangedMessage
	| DisableGamepadInputMessage
	| EnableGamepadInputMessage;

export interface RuntimeMessage {
	[key: string]: unknown;
}
