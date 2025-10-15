import ".wxt/wxt.d.ts";
import type { ActionHandler } from "./src/types/components";

// Global type declarations
declare global {
	interface Window {
		actionHandler: ActionHandler;
		isKeyboardActive?: () => boolean;
	}
}
