/**
 * Netflix Player Control Functions
 * Provides clean, reusable methods for controlling Netflix video playback
 */

// Helper function to get the active Netflix video player
export function getPlayer(): NetflixVideoPlayer | null {
	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
	const videoPlayer = api?.videoPlayer;
	const sessionIds = videoPlayer?.getAllPlayerSessionIds();

	// Prefer "watch-" sessions over motion billboards
	const sessionId =
		sessionIds?.find((id) => id.startsWith("watch-")) || sessionIds?.[0];

	if (!sessionId) {
		console.warn("[NETFLIX-API] No active session found");
		return null;
	}

	const player = videoPlayer?.getVideoPlayerBySessionId(sessionId);
	if (!player) {
		console.warn(
			"[NETFLIX-API] Could not get player instance for session:",
			sessionId,
		);
		return null;
	}

	return player;
}

// ===== PLAYER CONTROL FUNCTIONS =====

export function togglePlayPause(): {
	success: boolean;
	error?: string;
	action?: string;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		if (player.isPaused()) {
			player.play();
			return { action: "play", success: true };
		} else {
			player.pause();
			return { action: "pause", success: true };
		}
	} catch (error) {
		console.error("[NETFLIX-API] Error in togglePlayPause:", error);
		return { success: false, error: String(error) };
	}
}

export function toggleMute(): {
	success: boolean;
	error?: string;
	action?: string;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const wasMuted = player.isMuted();
		player.setMuted(!wasMuted);
		return { action: wasMuted ? "unmute" : "mute", success: true };
	} catch (error) {
		console.error("[NETFLIX-API] Error in toggleMute:", error);
		return { success: false, error: String(error) };
	}
}

export function seekForward(seconds: number = 10): {
	success: boolean;
	error?: string;
	action?: string;
	newTime?: number;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const currentTime = player.getCurrentTime();
		const duration = player.getDuration();
		const newTime = Math.min(currentTime + seconds * 1000, duration);
		player.seek(newTime);
		return { action: "seek", newTime, success: true };
	} catch (error) {
		console.error("[NETFLIX-API] Error in seekForward:", error);
		return { success: false, error: String(error) };
	}
}

export function seekBackward(seconds: number = 10): {
	success: boolean;
	error?: string;
	action?: string;
	newTime?: number;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const currentTime = player.getCurrentTime();
		const newTime = Math.max(currentTime - seconds * 1000, 0);
		player.seek(newTime);
		return { action: "seek", newTime, success: true };
	} catch (error) {
		console.error("[NETFLIX-API] Error in seekBackward:", error);
		return { success: false, error: String(error) };
	}
}

export function volumeUp(delta: number = 0.1): {
	success: boolean;
	error?: string;
	action?: string;
	newVolume?: number;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const currentVolume = player.getVolume();
		const newVolume = Math.min(currentVolume + delta, 1.0);
		player.setVolume(newVolume);
		return { action: "volume", newVolume, success: true };
	} catch (error) {
		console.error("[NETFLIX-API] Error in volumeUp:", error);
		return { success: false, error: String(error) };
	}
}

export function volumeDown(delta: number = 0.1): {
	success: boolean;
	error?: string;
	action?: string;
	newVolume?: number;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const currentVolume = player.getVolume();
		const newVolume = Math.max(currentVolume - delta, 0.0);
		player.setVolume(newVolume);
		return { action: "volume", newVolume, success: true };
	} catch (error) {
		console.error("[NETFLIX-API] Error in volumeDown:", error);
		return { success: false, error: String(error) };
	}
}

// ===== STATUS CHECK FUNCTIONS =====

export function getPlaybackStatus(): {
	success: boolean;
	isPaused?: boolean;
	isPlaying?: boolean;
	error?: string;
} {
	const player = getPlayer();
	if (!player) return { success: false, error: "No player available" };

	try {
		const isPaused = player.isPaused();
		const isPlaying = !isPaused;
		return { success: true, isPaused, isPlaying };
	} catch (error) {
		console.error("[NETFLIX-API] Error getting playback status:", error);
		return { success: false, error: String(error) };
	}
}
