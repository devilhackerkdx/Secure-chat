export interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: string;
  voiceUrl?: string;
  voiceDuration?: string;
  isVoice?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away" | "typing";
  statusText: string;
  unreadCount: number;
  initials: string;
  messages: Message[];
  isAi?: boolean;
}

export type WallpaperPreset = "sakura_aurora" | "cyber_rose" | "milky_quartz" | "pink_abyss" | "minimal_glass";

export type ScreenId = "home" | "chat" | "call" | "video_call";

export interface ControlSettings {
  darkMode: boolean;
  blurLevel: number; // 0 to 100
  glassIntensity: number; // 0 to 100
  hapticFeedback: boolean;
  audioEffects: boolean;
  activeWallpaper: WallpaperPreset;
  bubbleStyle: "frosted_pink" | "neon_glow" | "crystal_white";
}
