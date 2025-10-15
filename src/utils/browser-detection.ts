/**
 * Browser detection utilities
 *
 * Provides methods to detect the current browser type based on user agent strings.
 * This is useful for handling browser-specific differences in APIs and behavior.
 */
export const BrowserDetection = {
	/**
	 * Detects if the current browser is Firefox
	 *
	 * @returns True if the browser is Firefox
	 */
	isFirefox(): boolean {
		return navigator.userAgent.toLowerCase().includes("firefox");
	},

	/**
	 * Detects if the current browser is Chrome
	 *
	 * @returns True if the browser is Chrome
	 */
	isChrome(): boolean {
		return navigator.userAgent.toLowerCase().includes("chrome");
	},

	/**
	 * Detects if the current browser is Safari
	 *
	 * @returns True if the browser is Safari (excluding Chrome-based browsers)
	 */
	isSafari(): boolean {
		return (
			navigator.userAgent.toLowerCase().includes("safari") &&
			!navigator.userAgent.toLowerCase().includes("chrome")
		);
	},

	/**
	 * Detects if the current browser is Edge
	 *
	 * @returns True if the browser is Microsoft Edge
	 */
	isEdge(): boolean {
		return navigator.userAgent.toLowerCase().includes("edg");
	},

	/**
	 * Detects if the current browser is Opera
	 *
	 * @returns True if the browser is Opera
	 */
	isOpera(): boolean {
		return (
			navigator.userAgent.toLowerCase().includes("opr") ||
			navigator.userAgent.toLowerCase().includes("opera")
		);
	},

	/**
	 * Gets the browser name as a string
	 *
	 * @returns The detected browser name or "Unknown"
	 */
	getBrowserName(): string {
		if (this.isFirefox()) return "Firefox";
		if (this.isChrome()) return "Chrome";
		if (this.isSafari()) return "Safari";
		if (this.isEdge()) return "Edge";
		if (this.isOpera()) return "Opera";
		return "Unknown";
	},

	/**
	 * Gets the browser version from user agent
	 *
	 * @returns The browser version or null if not found
	 */
	getBrowserVersion(): string | null {
		const userAgent = navigator.userAgent.toLowerCase();

		if (this.isFirefox()) {
			const match = userAgent.match(/firefox\/(\d+\.\d+)/);
			return match ? match[1] : null;
		}

		if (this.isChrome()) {
			const match = userAgent.match(/chrome\/(\d+\.\d+)/);
			return match ? match[1] : null;
		}

		if (this.isSafari()) {
			const match = userAgent.match(/version\/(\d+\.\d+)/);
			return match ? match[1] : null;
		}

		if (this.isEdge()) {
			const match = userAgent.match(/edg\/(\d+\.\d+)/);
			return match ? match[1] : null;
		}

		return null;
	},

	/**
	 * Checks if the browser supports a specific feature
	 *
	 * @param feature - The feature to check for
	 * @returns True if the feature is supported
	 */
	supportsFeature(feature: string): boolean {
		switch (feature) {
			case "gamepad":
				return "getGamepads" in navigator;
			case "vibration":
				return "vibrate" in navigator;
			case "fullscreen":
				return "requestFullscreen" in document.documentElement;
			case "webgl":
				return !!document.createElement("canvas").getContext("webgl");
			default:
				return false;
		}
	},
} as const;
