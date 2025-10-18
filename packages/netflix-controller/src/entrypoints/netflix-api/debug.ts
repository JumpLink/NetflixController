/**
 * Netflix API Debug Functions
 * Provides utilities for exploring and debugging the Netflix internal API
 */

import { getPlayer } from "./player-controls";

export function getFullAPI(): unknown {
	return window.netflix?.appContext?.state?.playerApp?.getAPI();
}

export function exploreAPI(): {
	topLevelKeys: string[];
	videoPlayer: { keys: string[]; methods: string[] };
	playerApp: { keys: string[]; methods: string[] };
	postPlay: { keys: string[]; methods: string[] };
	live: { keys: string[]; methods: string[] };
	ads: { keys: string[]; methods: string[] };
	accessibility: { keys: string[]; methods: string[] };
} | null {
	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
	if (!api) {
		console.warn("Netflix API not available");
		return null;
	}

	const result = {
		topLevelKeys: Object.keys(api),
		videoPlayer: { keys: [] as string[], methods: [] as string[] },
		playerApp: { keys: [] as string[], methods: [] as string[] },
		postPlay: { keys: [] as string[], methods: [] as string[] },
		live: { keys: [] as string[], methods: [] as string[] },
		ads: { keys: [] as string[], methods: [] as string[] },
		accessibility: { keys: [] as string[], methods: [] as string[] },
	};

	if (api.videoPlayer) {
		const vp = api.videoPlayer as unknown as Record<string, unknown>;
		result.videoPlayer = {
			keys: Object.keys(vp),
			methods: Object.keys(vp).filter(
				(key: string) => typeof vp[key] === "function",
			),
		};
	}

	if (api.playerApp) {
		const playerApp = api.playerApp as Record<string, unknown>;
		result.playerApp = {
			keys: Object.keys(playerApp),
			methods: Object.keys(playerApp).filter(
				(key: string) => typeof playerApp[key] === "function",
			),
		};
	}

	if (api.postPlay) {
		const postPlay = api.postPlay as Record<string, unknown>;
		result.postPlay = {
			keys: Object.keys(postPlay),
			methods: Object.keys(postPlay).filter(
				(key: string) => typeof postPlay[key] === "function",
			),
		};
	}

	if (api.live) {
		const live = api.live as Record<string, unknown>;
		result.live = {
			keys: Object.keys(live),
			methods: Object.keys(live).filter(
				(key: string) => typeof live[key] === "function",
			),
		};
	}

	if (api.ads) {
		const ads = api.ads as Record<string, unknown>;
		result.ads = {
			keys: Object.keys(ads),
			methods: Object.keys(ads).filter(
				(key: string) => typeof ads[key] === "function",
			),
		};
	}

	if (api.accessibility) {
		const accessibility = api.accessibility as Record<string, unknown>;
		result.accessibility = {
			keys: Object.keys(accessibility),
			methods: Object.keys(accessibility).filter(
				(key: string) => typeof accessibility[key] === "function",
			),
		};
	}

	console.log("Netflix API Structure:", result);
	return result;
}

export function getAllSessions(): Array<{
	sessionId: string;
	type: string;
	currentTime?: number;
	duration?: number;
	isPaused?: boolean;
	isEnded?: boolean;
	isMuted?: boolean;
	volume?: number;
}> | null {
	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
	const videoPlayer = api?.videoPlayer;
	const sessionIds = videoPlayer?.getAllPlayerSessionIds();

	if (!sessionIds || sessionIds.length === 0) {
		console.warn("No player sessions found");
		return null;
	}

	const sessions = sessionIds.map((sessionId) => {
		const player = videoPlayer?.getVideoPlayerBySessionId(sessionId);
		return {
			sessionId,
			type: sessionId.startsWith("watch-")
				? "watch"
				: sessionId.startsWith("motion-")
					? "motion"
					: "unknown",
			currentTime: player?.getCurrentTime(),
			duration: player?.getDuration(),
			isPaused: player?.isPaused(),
			isEnded: player?.isEnded(),
			isMuted: player?.isMuted(),
			volume: player?.getVolume(),
		};
	});

	console.log("All Player Sessions:", sessions);
	return sessions;
}

export function getSessionInfo(): {
	sessionId?: string;
	allSessionIds?: string[];
	currentTime?: number;
	duration?: number;
	isPaused?: boolean;
	isEnded?: boolean;
	isMuted?: boolean;
	volume?: number;
} | null {
	const player = getPlayer();
	if (!player) return null;

	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
	const videoPlayer = api?.videoPlayer;
	const sessionIds = videoPlayer?.getAllPlayerSessionIds();
	const sessionId =
		sessionIds?.find((id) => id.startsWith("watch-")) || sessionIds?.[0];

	return {
		sessionId,
		allSessionIds: sessionIds,
		currentTime: player?.getCurrentTime(),
		duration: player?.getDuration(),
		isPaused: player?.isPaused(),
		isEnded: player?.isEnded(),
		isMuted: player?.isMuted(),
		volume: player?.getVolume(),
	};
}

export function getTimecodes(): {
	skipCredits?: unknown;
	recap?: unknown;
	start?: unknown;
	ending?: unknown;
	prefetch?: unknown;
} | null {
	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();

	try {
		const skipCredits = api?.getTimecodeSkipCredits?.();
		const recap = api?.getTimecodeRecap?.();
		const start = api?.getTimecodeStart?.();
		const ending = api?.getTimecodeEnding?.();
		const prefetch = api?.getTimecodePrefetch?.();

		return {
			skipCredits: skipCredits ? skipCredits() : undefined,
			recap: recap ? recap() : undefined,
			start: start ? start() : undefined,
			ending: ending ? ending() : undefined,
			prefetch: prefetch ? prefetch() : undefined,
		};
	} catch (error) {
		console.warn("Error getting timecodes:", error);
		return null;
	}
}

export function testVideoPlayerMethods(): Record<string, unknown> | null {
	const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
	const videoPlayer = api?.videoPlayer;
	const sessionIds = videoPlayer?.getAllPlayerSessionIds();
	const sessionId =
		sessionIds?.find((id) => id.startsWith("watch-")) || sessionIds?.[0];

	if (!sessionId) {
		console.warn("No active session");
		return null;
	}

	const results: Record<string, unknown> = {};
	const methodsToTest = [
		"getCurrentTimeBySessionId",
		"getDurationBySessionId",
		"isVideoPausedForSessionId",
		"isVideoPlayingForSessionId",
		"isVideoEndedBySessionId",
		"isVideoPlayerMutedBySessionId",
		"getVideoMetadata",
		"getActiveVideoMetadata",
	];

	for (const method of methodsToTest) {
		try {
			const fn = videoPlayer?.[method as keyof typeof videoPlayer];
			if (typeof fn === "function") {
				const result = fn(sessionId);
				results[method] = typeof result === "function" ? result() : result;
			}
		} catch (error) {
			results[method] = { error: String(error) };
		}
	}

	console.log("VideoPlayer Methods Test Results:", results);
	return results;
}

export function exportAll(): {
	structure?: ReturnType<typeof exploreAPI>;
	sessionInfo?: ReturnType<typeof getSessionInfo>;
	timecodes?: ReturnType<typeof getTimecodes>;
	videoPlayerMethods?: ReturnType<typeof testVideoPlayerMethods>;
} {
	const data = {
		structure: exploreAPI(),
		sessionInfo: getSessionInfo(),
		timecodes: getTimecodes(),
		videoPlayerMethods: testVideoPlayerMethods(),
	};

	console.log("=== NETFLIX API EXPORT ===");
	console.log(JSON.stringify(data, null, 2));
	console.log("=== END EXPORT ===");

	return data;
}
