/**
 * Automatically detects the controller type based on the gamepad ID string
 * @param gamepadId - The gamepad.id string from the Gamepad API
 * @returns The detected controller mapping name, or null to use user preference
 */
export function detectControllerType(gamepadId: string): string | null {
	if (!gamepadId) return null;

	const id = gamepadId.toLowerCase();

	// PlayStation Controllers
	if (
		id.includes("playstation") ||
		id.includes("ps5") ||
		id.includes("dualsense")
	) {
		return "PS4"; // Use PS4 mapping for PS5 (same layout)
	}
	if (id.includes("ps4") || id.includes("dualshock 4")) {
		return "PS4";
	}
	if (id.includes("ps3") || id.includes("sixaxis")) {
		return "PS3";
	}

	// Xbox Controllers
	if (
		id.includes("xbox") &&
		(id.includes("one") || id.includes("series") || id.includes("wireless"))
	) {
		return "Xbox One"; // Series X/S use same layout as Xbox One
	}
	if (id.includes("xbox") && id.includes("360")) {
		return "Xbox 360";
	}
	if (id.includes("xinput") || id.includes("xbox")) {
		// Generic Xbox-like controller
		return "Xbox One";
	}

	// Nintendo Switch
	if (
		id.includes("switch") ||
		id.includes("joy-con") ||
		id.includes("pro controller")
	) {
		return "Switch";
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
