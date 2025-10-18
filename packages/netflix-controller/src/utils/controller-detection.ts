/**
 * Automatically detects the controller type based on the gamepad ID string
 * @param gamepadId - The gamepad.id string from the Gamepad API
 * @returns The detected controller mapping name, or null to use user preference
 */
export function detectControllerType(gamepadId: string): string | null {
	if (!gamepadId) return null;

	const id = gamepadId.toLowerCase();

	// PlayStation Controllers (check newest first)
	if (
		id.includes("054c-0ce6") || // PS5 USB Vendor/Product ID
		id.includes("dualsense") ||
		id.includes("ps5")
	) {
		return "PS5";
	}
	if (
		id.includes("054c-09cc") || // PS4 USB Vendor/Product ID
		id.includes("ps4") ||
		id.includes("dualshock 4") ||
		id.includes("playstation 4")
	) {
		return "PS4";
	}
	if (id.includes("ps3") || id.includes("sixaxis")) {
		return "PS3";
	}

	// Xbox Controllers (check newest first)
	if (
		id.includes("045e-0b13") || // Xbox Series X USB ID
		id.includes("045e-0b12") || // Xbox Series S USB ID
		id.includes("xbox series") ||
		(id.includes("xbox") && id.includes("series"))
	) {
		return "Xbox Series";
	}
	if (
		id.includes("xbox") &&
		(id.includes("one") || id.includes("wireless controller"))
	) {
		return "Xbox One";
	}
	if (id.includes("xbox") && id.includes("360")) {
		return "Xbox 360";
	}
	if (id.includes("xinput") || id.includes("xbox")) {
		// Generic Xbox-like controller - use Series as default (most modern)
		return "Xbox Series";
	}

	// Nintendo Switch
	if (
		id.includes("057e-2009") || // Switch Pro Controller USB ID
		id.includes("switch") ||
		id.includes("joy-con") ||
		id.includes("pro controller")
	) {
		return "Switch";
	}

	// Steam Deck
	if (
		id.includes("28de-1205") || // Steam Deck Controller USB ID
		id.includes("valve") ||
		id.includes("neptune")
	) {
		return "Steam Deck";
	}

	// Steam Controller (older controller with trackpads)
	if (
		id.includes("28de-1142") || // Steam Controller USB ID
		id.includes("steam controller")
	) {
		return "Steam";
	}

	// Google Stadia
	if (
		id.includes("18d1-9400") || // Stadia Controller USB ID
		id.includes("stadia") ||
		id.includes("google controller")
	) {
		return "Google Stadia";
	}

	// Amazon Luna
	if (
		id.includes("1949-0419") || // Luna Controller USB ID
		id.includes("luna") ||
		id.includes("amazon controller")
	) {
		return "Amazon Luna";
	}

	// Ouya
	if (
		id.includes("2836-0001") || // Ouya Controller USB ID
		id.includes("ouya")
	) {
		return "Ouya";
	}

	// Nintendo Wii Controllers
	if (
		id.includes("057e-0306") || // Wii Remote
		id.includes("wiimote") ||
		id.includes("wii remote")
	) {
		return "Wii";
	}

	// Nintendo Wii U Controllers
	if (
		id.includes("057e-0330") || // Wii U Pro Controller
		id.includes("wii u")
	) {
		return "WiiU";
	}

	// Generic/Unknown - use user preference
	return null;
}

/**
 * Gets the appropriate controller mapping, preferring auto-detection over user preference
 * @param gamepadId - The gamepad.id string
 * @param userPreference - The user's manual selection from settings
 * @returns The controller mapping name to use
 */
export function getControllerMapping(
	gamepadId: string,
	userPreference: string,
): string {
	const detected = detectControllerType(gamepadId);
	// Use detected type if available, otherwise fall back to user preference
	return detected || userPreference || "Xbox One";
}
