/** biome-ignore-all lint/suspicious/noExplicitAny: Message interfaces use dynamic properties for flexible extension messaging requiring any types for runtime message structures. */

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
	[key: string]: any;
}
