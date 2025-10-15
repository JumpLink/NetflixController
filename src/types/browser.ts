// Browser extension specific types

export interface BrowserTab {
	id?: number;
	url?: string;
	active: boolean;
	status?: string;
}

export interface TabChangeInfo {
	status?: string;
}

export interface RuntimeInstalledDetails {
	reason: "install" | "update" | "chrome_update" | "shared_module_update";
	previousVersion?: string;
	id?: string;
}

export interface InjectionTarget {
	tabId: number;
}

export interface ExecuteScriptOptions {
	target: InjectionTarget;
	files: string[];
}

export interface BrowserRuntime {
	onInstalled: {
		addListener(callback: (details: RuntimeInstalledDetails) => void): void;
	};
	onStartup: {
		addListener(callback: () => void): void;
	};
	onMessage: {
		addListener(
			callback: (
				message: unknown,
				sender: unknown,
				sendResponse: unknown,
			) => void,
		): void;
	};
	getManifest(): unknown;
	sendMessage(message: unknown): Promise<unknown>;
}

export interface BrowserTabs {
	onUpdated: {
		addListener(
			callback: (
				tabId: number,
				changeInfo: TabChangeInfo,
				tab: BrowserTab,
			) => void,
		): void;
	};
	sendMessage(tabId: number, message: unknown): Promise<unknown>;
}

export interface BrowserAction {
	onClicked: {
		addListener(callback: (tab: BrowserTab) => void): void;
	};
}

export interface BrowserScripting {
	executeScript(options: ExecuteScriptOptions): Promise<unknown>;
}

export interface BrowserAPI {
	runtime: BrowserRuntime;
	tabs: BrowserTabs;
	action: BrowserAction;
	scripting: BrowserScripting;
}
