import ".wxt/wxt.d.ts";
import type { ActionHandler } from "./src/types/components";

// WXT unlisted script ?script import
declare module "*?script" {
	const script: string;
	export default script;
}

// Netflix API type declarations
declare global {
	interface NetflixVideoPlayer {
		getCurrentTime(): number;
		getDuration(): number;
		seek(timeMs: number): void;
		play(): void;
		pause(): void;
		setVolume(level: number): void;
		getVolume(): number;
		setMuted(muted: boolean): void;
		isMuted(): boolean;
		isPaused(): boolean;
		isEnded(): boolean;
		exitFullscreen?(): void;
		enterFullscreen?(): void;
	}

	interface NetflixVideoPlayerAPI {
		getAllPlayerSessionIds(): string[];
		getVideoPlayerBySessionId(
			sessionId: string,
		): NetflixVideoPlayer | undefined;
		getCurrentTimeBySessionId(sessionId: string): () => number;
		getDurationBySessionId(sessionId: string): () => number;
		isVideoPausedForSessionId(sessionId: string): () => boolean;
		isVideoPlayingForSessionId(sessionId: string): () => boolean;
		isVideoEndedBySessionId(sessionId: string): () => boolean;
		isVideoPlayerMutedBySessionId(sessionId: string): () => boolean;
		getTimecodeSkipCredits(): () => { start: number; end: number } | undefined;
	}

	interface NetflixAppContext {
		appContext: {
			state: {
				playerApp: {
					getAPI(): {
						videoPlayer: NetflixVideoPlayerAPI;
						playerApp?: Record<string, unknown>;
						postPlay?: Record<string, unknown>;
						live?: Record<string, unknown>;
						ads?: Record<string, unknown>;
						accessibility?: Record<string, unknown>;
						getTimecodeSkipCredits?: () => () => unknown;
						getTimecodeRecap?: () => () => unknown;
						getTimecodeStart?: () => () => unknown;
						getTimecodeEnding?: () => () => unknown;
						getTimecodePrefetch?: () => () => unknown;
					};
				};
			};
		};
	}
}

// Netflix Debug Tools interface
interface NetflixDebugTools {
	// Player Control Functions
	getPlayer: () => unknown;
	togglePlayPause: () => unknown;
	toggleMute: () => unknown;
	seekForward: (seconds?: number) => unknown;
	seekBackward: (seconds?: number) => unknown;
	volumeUp: (delta?: number) => unknown;
	volumeDown: (delta?: number) => unknown;
	getPlaybackStatus: () => unknown;

	// Debug Functions
	getFullAPI: () => unknown;
	getAllSessions: () => unknown;
	getSessionInfo: () => unknown;
	getTimecodes: () => unknown;
	testVideoPlayerMethods: () => unknown;
	exportAll: () => unknown;
	exploreAPI: () => {
		topLevelKeys: string[];
		videoPlayer: { keys: string[]; methods: string[] };
		playerApp: { keys: string[]; methods: string[] };
		postPlay: { keys: string[]; methods: string[] };
		live: { keys: string[]; methods: string[] };
		ads: { keys: string[]; methods: string[] };
		accessibility: { keys: string[]; methods: string[] };
	} | null;
	getSessionInfo: () => {
		sessionId?: string;
		allSessionIds?: string[];
		currentTime?: number;
		duration?: number;
		isPaused?: boolean;
		isEnded?: boolean;
		isMuted?: boolean;
		volume?: number;
	} | null;
	getTimecodes: () => {
		skipCredits?: unknown;
		recap?: unknown;
		start?: unknown;
		ending?: unknown;
		prefetch?: unknown;
	} | null;
	testVideoPlayerMethods: () => Record<string, unknown> | null;
	exportAll: () => {
		structure?: ReturnType<NetflixDebugTools["exploreAPI"]>;
		sessionInfo?: ReturnType<NetflixDebugTools["getSessionInfo"]>;
		timecodes?: ReturnType<NetflixDebugTools["getTimecodes"]>;
		videoPlayerMethods?: ReturnType<
			NetflixDebugTools["testVideoPlayerMethods"]
		>;
	};
}

// Global type declarations
declare global {
	interface Window {
		actionHandler: ActionHandler;
		isKeyboardActive?: () => boolean;
		netflix?: NetflixAppContext;
		netflixDebug: NetflixDebugTools;
	}
}
