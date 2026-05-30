import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Shield, MessageSquare, Bell, HardDrive, Smartphone, Eye, LogOut, ChevronRight, HelpCircle, Key, RefreshCw, Trash2, Camera, Instagram, ArrowLeft
} from "lucide-react";
import { sounds } from "./SoundManager";
import GoogleWorkspaceHub from "./GoogleWorkspaceHub.tsx";

interface SettingsSectionProps {
  darkMode: boolean;
  userProfile: { name: string; avatar: string; bio: string; isOnline: boolean };
  onUpdateProfile: (name: string, avatar: string, bio: string, isOnline: boolean) => void;
  onLogout: () => void;
  onImportContact: (contact: any) => void;
  // Wallpapers and styling controls
  themePref: {
    isDark: boolean;
    activeWallpaper: string;
    glassOpacity: number;
    blurAmount: number;
    activeTheme: string;
    activeFont: string;
    chatWallpaper: string;
    appIcon: string;
  };
  onUpdateTheme: (updates: Partial<{ 
    isDark: boolean; 
    activeWallpaper: string; 
    glassOpacity: number; 
    blurAmount: number;
    activeTheme: string;
    activeFont: string;
    chatWallpaper: string;
    appIcon: string;
  }>) => void;
}

export default function SettingsSection({
  darkMode,
  userProfile,
  onUpdateProfile,
  onLogout,
  onImportContact,
  themePref,
  onUpdateTheme,
}: SettingsSectionProps) {
  const [activeSubView, setActiveSubView] = useState<"profile" | "chats" | "devices" | "privacy" | "storage" | "google" | null>(null);

  // Profile temporary inputs
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempBio, setTempBio] = useState(userProfile.bio);
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);
  const [tempIsOnline, setTempIsOnline] = useState(userProfile.isOnline);

  // Storage simulator
  const [cacheSize, setCacheSize] = useState(14.8);
  const [isCleaning, setIsCleaning] = useState(false);

  // Preset avatars for profile change
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
  ];

  const handleSaveProfile = () => {
    sounds.playChime();
    onUpdateProfile(tempName, tempAvatar, tempBio, tempIsOnline);
    setActiveSubView(null);
  };

  const handleCleanCache = () => {
    sounds.playClick();
    setIsCleaning(true);
    setTimeout(() => {
      setIsCleaning(false);
      setCacheSize(0.0);
      sounds.playChime();
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" id="settings-section-root">
      {/* Top Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-center z-10" id="settings-header">
        <h1 className={`text-2xl font-sans tracking-tight font-extrabold ${darkMode ? "text-white" : "text-stone-900"}`}>
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-4" id="settings-scroller">
        
        {/* User Card */}
        <div 
          onClick={() => {
            sounds.playPop();
            setTempName(userProfile.name);
            setTempBio(userProfile.bio);
            setTempAvatar(userProfile.avatar);
            setTempIsOnline(userProfile.isOnline);
            setActiveSubView("profile");
          }}
          className="flex items-center space-x-4 p-4 rounded-[28px] bg-white/40 hover:bg-white/50 active:scale-99 transition-all cursor-pointer border border-white/20 shadow-sm"
          id="user-profile-shortcut"
        >
          <div className="relative">
            <img 
              src={userProfile.avatar} 
              alt={userProfile.name} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-white"
            />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
              userProfile.isOnline ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
            }`} />
          </div>
          <div className="text-left flex-1">
            <h2 className={`font-semibold text-base ${darkMode ? "text-white" : "text-stone-800"}`}>
              {userProfile.name}
            </h2>
            <p className="text-3xs text-stone-500 truncate mt-0.5">{userProfile.bio}</p>
          </div>
          <ChevronRight size={18} className="text-stone-400" />
        </div>

        {/* Settings Links */}
        <div className="rounded-[28px] bg-white/25 border border-white/10 overflow-hidden divide-y divide-white/10" id="settings-rows">
          
          {/* Chats, Wallpapers edit */}
          <div 
            onClick={() => { sounds.playPop(); setActiveSubView("chats"); }}
            className="flex items-center justify-between p-4 hover:bg-white/30 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Chats & Display</h4>
                <p className="text-4xs text-stone-500">Wallpapers, light pink theme, opacity</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          {/* Privacy Toggle */}
          <div 
            onClick={() => { sounds.playPop(); setActiveSubView("privacy"); }}
            className="flex items-center justify-between p-4 hover:bg-white/30 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Shield size={16} />
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Privacy</h4>
                <p className="text-4xs text-stone-500">Read receipts, online visbility</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          {/* Linked devices */}
          <div 
            onClick={() => { sounds.playPop(); setActiveSubView("devices"); }}
            className="flex items-center justify-between p-4 hover:bg-white/30 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Smartphone size={16} />
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Linked Devices</h4>
                <p className="text-4xs text-stone-500">Active secure browser sessions</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          {/* Storage Cleanup */}
          <div 
            onClick={() => { sounds.playPop(); setActiveSubView("storage"); }}
            className="flex items-center justify-between p-4 hover:bg-white/30 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <HardDrive size={16} />
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Storage & Data</h4>
                <p className="text-4xs text-stone-500">Purge cache: {cacheSize.toFixed(1)} MB occupied</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </div>

          {/* Google Workspace Integration */}
          <div 
            onClick={() => { sounds.playPop(); setActiveSubView("google"); }}
            className="flex items-center justify-between p-4 hover:bg-white/30 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "16px", height: "16px" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Google Workspace</h4>
                <p className="text-4xs text-stone-500">Google Drive & Google Contacts integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Cloud Synchronized</span>
              <ChevronRight size={16} className="text-stone-400" />
            </div>
          </div>

          {/* Instagram Support */}
          <a 
            href="https://www.instagram.com/kdramaeditstudio?igsh=dGtxN3p4eGN6NHg2"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.playChime()}
            className="flex items-center justify-between p-4 hover:bg-pink-500/5 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/10 shrink-0">
                <Instagram size={16} />
              </div>
              <div>
                <h4 className={`text-xs font-semibold ${darkMode ? "text-white" : "text-stone-800"}`}>Instagram Studio</h4>
                <p className="text-4xs text-stone-500">Contact @kdramaeditstudio on Instagram for custom support</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[8px] font-mono font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Support</span>
              <ChevronRight size={16} className="text-stone-400" />
            </div>
          </a>

          {/* Logout Lock */}
          <div 
            onClick={() => {
              sounds.playClick();
              onLogout();
            }}
            className="flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 cursor-pointer active:scale-99 transition-all text-left"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <LogOut size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-red-500">Logout & Lock</h4>
                <p className="text-4xs text-red-400">Lock console with security PIN passcode</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-red-300" />
          </div>
        </div>

        {/* Dummy Support Link */}
        <div className="p-4 rounded-[28px] bg-white/20 border border-white/5 flex items-center justify-between text-xs font-mono text-stone-500 pr-5">
          <div className="flex items-center space-x-2">
            <HelpCircle size={14} className="text-pink-400" />
            <span className="text-3xs uppercase font-bold tracking-wider">SecureChat build 26.90.x1</span>
          </div>
          <span className="text-4xs">Stable v1.0.4</span>
        </div>
      </div>

      {/* --- SUBVIEW OVERLAYS --- */}
      <AnimatePresence>
        {activeSubView === "profile" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between overflow-y-auto ${
              darkMode ? "bg-stone-900 text-white" : "bg-[#fef6f8] text-stone-800"
            }`}
          >
            {/* Top Back Row */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                className="px-4 py-2 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500 active:scale-95"
              >
                Back
              </button>
              <h3 className="font-bold text-sm tracking-tight font-sans">Edit Profile Info</h3>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 text-xs font-bold rounded-full bg-pink-500 text-white hover:scale-105 active:scale-95 shadow-md shadow-pink-500/10"
              >
                Save
              </button>
            </div>

            {/* Profile Fields Box */}
            <div className="flex-1 space-y-6 flex flex-col items-center">
              {/* Avatar picture custom preset selectors */}
              <div className="relative group">
                <img 
                  src={tempAvatar} 
                  alt="Temp Preview" 
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/20 shadow-lg"
                />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={18} />
                </div>
              </div>

              {/* Presets Row */}
              <div className="flex space-x-2.5">
                {avatarPresets.map((avUrl, i) => (
                  <button
                    key={i}
                    onClick={() => { sounds.playPop(); setTempAvatar(avUrl); }}
                    className={`p-0.5 rounded-full border transition-all ${
                      tempAvatar === avUrl ? "border-pink-500 scale-110" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={avUrl} className="w-10 h-10 rounded-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Name entry field */}
              <div className="w-full text-left space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white/40 border border-white/20 focus:outline-none focus:ring-1 focus:ring-pink-500/40 text-xs font-medium"
                />
              </div>

              {/* Bio entry field */}
              <div className="w-full text-left space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Bio Status</label>
                <input
                  type="text"
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white/40 border border-white/20 focus:outline-none focus:ring-1 focus:ring-pink-500/40 text-xs font-medium"
                />
              </div>

              {/* Online visibility toggle widget */}
              <div className="w-full p-4 rounded-[24px] bg-white/40 border border-white/10 flex justify-between items-center">
                <div className="text-left">
                  <h4 className="text-xs font-bold">Online Status Visibility</h4>
                  <p className="text-3xs text-stone-400 mt-1">Displays green dot indicator in contacts</p>
                </div>
                <button
                  type="button"
                  onClick={() => { sounds.playPop(); setTempIsOnline(!tempIsOnline); }}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${
                    tempIsOnline ? "bg-emerald-500" : "bg-stone-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                    tempIsOnline ? "translate-x-5" : ""
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Chats and display options */}
        {activeSubView === "chats" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between overflow-y-auto ${
              darkMode ? "bg-stone-900 text-white" : "bg-[#fef6f8] text-stone-800"
            }`}
          >
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                  className="px-4 py-2 text-xs font-bold rounded-full accent-bg-light accent-text active:scale-95"
                >
                  Back
                </button>
                <h3 className="font-bold text-sm tracking-tight font-sans">Chats & Customization</h3>
                <div className="w-10 h-1" />
              </div>

              {/* Dark mode toggle */}
              <div className="p-4 rounded-[24px] bg-white/40 border border-white/10 flex justify-between items-center text-left">
                <div>
                  <h4 className="text-xs font-bold">Aesthetic Dark Mode</h4>
                  <p className="text-3xs text-stone-400 mt-1">Frosted obsidian glass style</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onUpdateTheme({ isDark: !themePref.isDark });
                  }}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ${
                    themePref.isDark ? "accent-bg" : "bg-stone-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                    themePref.isDark ? "translate-x-5" : ""
                  }`} />
                </button>
              </div>

              {/* Glass opacity slider details */}
              <div className="p-4 rounded-[24px] bg-white/40 border border-white/10 space-y-3.5 text-left">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold">Glass Frost Opacity</h4>
                  <span className="text-[10px] font-mono accent-text font-bold">{Math.round(themePref.glassOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={themePref.glassOpacity}
                  onChange={(e) => onUpdateTheme({ glassOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-accent-color h-1.5 rounded-full"
                />
              </div>

              {/* Dynamic Theme selection */}
              <div className="text-left space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Dynamic App Theme</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { id: "pink", name: "Blossom Rose", color: "bg-[#ec4899]" },
                    { id: "emerald", name: "Emerald Mint", color: "bg-[#10b981]" },
                    { id: "sky", name: "Ocean Wave", color: "bg-[#0ea5e9]" },
                    { id: "violet", name: "Cyber Amethyst", color: "bg-[#8b5cf6]" },
                    { id: "amber", name: "Solar Amber", color: "bg-[#eab308]" },
                    { id: "monochrome", name: "Slate Charcoal", color: "bg-[#4b5563]" },
                  ].map((themeItem) => (
                    <button
                      key={themeItem.id}
                      onClick={() => {
                        sounds.playPop();
                        onUpdateTheme({ activeTheme: themeItem.id });
                      }}
                      className={`p-2 rounded-2xl border flex flex-col items-center space-y-2 transition-all cursor-pointer ${
                        themePref.activeTheme === themeItem.id ? "accent-border ring-1 ring-offset-1 ring-pink-300 scale-102" : "border-white/20"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full shadow-inner ${themeItem.color}`} />
                      <span className="text-[9px] font-semibold text-center leading-none truncate w-full">{themeItem.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Font selection */}
              <div className="text-left space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Interface Typography Font</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: "Inter", name: "Inter (Default)", preview: "font-sans" },
                    { id: "Space Grotesk", name: "Space Grotesk", preview: "font-mono" },
                    { id: "Playfair Display", name: "Playfair Display", preview: "italic" },
                    { id: "JetBrains Mono", name: "JetBrains Mono", preview: "font-mono" },
                    { id: "Outfit", name: "Outfit (Modern)", preview: "font-sans" },
                  ].map((fontItem) => (
                    <button
                      key={fontItem.id}
                      onClick={() => {
                        sounds.playPop();
                        onUpdateTheme({ activeFont: fontItem.id });
                      }}
                      className={`p-2 rounded-2xl border text-left transition-all flex flex-col space-y-1 ${
                        themePref.activeFont === fontItem.id ? "accent-border bg-white/20 scale-101" : "border-white/15"
                      }`}
                    >
                      <span className="text-[9px] text-stone-400 font-mono">Aa</span>
                      <span className="text-[10px] font-bold truncate">{fontItem.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Wallpapers selection */}
              <div className="text-left space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Conversation Wallpaper</label>
                <div className="grid grid-cols-2 gap-2.5 mt-1">
                  {[
                    { id: "classic-doodle", name: "Classic Dot Grid" },
                    { id: "sakura-gradient", name: "Sakura Gradient" },
                    { id: "dark-grid", name: "Blueprint Grid" },
                    { id: "emerald-leaves", name: "Emerald Leaves" },
                    { id: "midnight-mist", name: "Midnight Mist" },
                    { id: "vintage-grid", name: "Vintage Notebook" },
                  ].map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        sounds.playPop();
                        onUpdateTheme({ chatWallpaper: wp.id });
                      }}
                      className={`p-2 rounded-2xl border truncate text-center text-[10px] font-semibold transition-all ${
                        themePref.chatWallpaper === wp.id ? "accent-border bg-white/30 scale-101" : "border-white/10"
                      }`}
                    >
                      {wp.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client App Icons selection */}
              <div className="text-left space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Simulated Phone Launch Icon</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[
                    { id: "Icon Classic Pink", name: "Classic Pink", icon: "🌸" },
                    { id: "Icon Emerald Mint", name: "Mint Green", icon: "🍀" },
                    { id: "Icon Cyber Amethyst", name: "Amethyst", icon: "🔮" },
                    { id: "Icon Midnight Black", name: "Midnight", icon: "🌚" },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      onClick={() => {
                        sounds.playPop();
                        onUpdateTheme({ appIcon: ic.id });
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center space-y-1.5 transition-all text-center ${
                        themePref.appIcon === ic.id ? "accent-border bg-white/30 ring-1 ring-offset-1 ring-pink-300 scale-102" : "border-white/10"
                      }`}
                    >
                      <span className="text-xl" role="img">{ic.icon}</span>
                      <span className="text-[8px] font-bold truncate leading-none w-full">{ic.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpapers presets list */}
              <div className="text-left space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Premium Device Wallpapers</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { id: "sakura", name: "Sakura Frost", preview: "bg-gradient-to-tr from-[#ffe4e9] via-[#ffffff] to-[#ffdae3]" },
                    { id: "sunset", name: "Velvet Sunset", preview: "bg-gradient-to-tr from-[#ffd8be] via-[#fff4ec] to-[#ffafb0]" },
                    { id: "midnight", name: "Obsidian Violet", preview: "bg-gradient-to-tr from-[#0d0711] via-[#1a0f25] to-[#04010a]" },
                    { id: "quartz", name: "Quartz Crystal", preview: "bg-gradient-to-tr from-[#e2e8f0] via-[#ffffff] to-[#ffdae3]" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        sounds.playPop();
                        onUpdateTheme({ activeWallpaper: preset.id });
                      }}
                      className={`p-1.5 rounded-[22px] border transition-all ${
                        themePref.activeWallpaper === preset.id ? "accent-border scale-102" : "border-white/20"
                      }`}
                    >
                      <div className={`h-20 rounded-[18px] mb-1.5 ${preset.preview}`} />
                      <span className="text-[10px] font-semibold pl-1">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Linked browsers devices */}
        {activeSubView === "devices" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between overflow-y-auto ${
              darkMode ? "bg-stone-900 text-white" : "bg-[#fef6f8] text-stone-800"
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500 active:scale-95"
                >
                  Back
                </button>
                <h3 className="font-bold text-sm tracking-tight font-sans">Linked Devices</h3>
                <div className="w-10 h-1" />
              </div>

              <div className="p-4 rounded-[24px] bg-white/40 border border-white/10 text-center space-y-4">
                <Smartphone className="mx-auto text-pink-500 stroke-[1.5]" size={36} />
                <div>
                  <h4 className="text-xs font-bold">Use SecureChat on Other Devices</h4>
                  <p className="text-[10px] text-stone-500 mt-2">All sessions are fully bridged and end-to-end synchronized.</p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider">Device logs</span>
                <div className="mt-3 p-4 rounded-[24px] bg-white/45 border border-white/10 flex justify-between items-center">
                  <div>
                    <h5 className="text-[11px] font-semibold">Chrome on macOS Sequoia</h5>
                    <p className="text-4xs text-stone-500 mt-0.5">Last active: today at 15:52 • Palo Alto, US</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-500">Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Storage management details */}
        {activeSubView === "storage" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between overflow-y-auto ${
              darkMode ? "bg-stone-900 text-white" : "bg-[#fef6f8] text-stone-800"
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500 active:scale-95"
                >
                  Back
                </button>
                <h3 className="font-bold text-sm tracking-tight font-sans">Storage Cleanup</h3>
                <div className="w-10 h-1" />
              </div>

              {/* Cache stat indicators */}
              <div className="p-4 rounded-[24px] bg-white/40 border border-white/10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h4 className="text-xs font-bold">Offline Local Sandbox</h4>
                    <p className="text-3xs text-stone-500 mt-1">Aggregated chat caching logs</p>
                  </div>
                  <span className="text-xl font-bold text-pink-500 font-mono">{cacheSize.toFixed(1)} MB</span>
                </div>

                <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: cacheSize > 0 ? "40%" : "0%" }} />
                </div>
                <p className="text-4xs text-stone-400">Vite dynamic assets pre-loader cache status</p>
              </div>

              {/* Cleaner triggering button */}
              <button
                type="button"
                onClick={handleCleanCache}
                disabled={cacheSize === 0 || isCleaning}
                className={`w-full py-4 rounded-[22px] font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                  cacheSize > 0 
                    ? "bg-pink-500 text-white hover:scale-101 active:scale-99"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>PURGING CACHED CHANNELS...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{cacheSize > 0 ? "PURGE ALL CACHE SPACE" : "CACHE FULLY CLEANED"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Privacy options details */}
        {activeSubView === "privacy" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between overflow-y-auto ${
              darkMode ? "bg-stone-900 text-white" : "bg-[#fef6f8] text-stone-800"
            }`}
          >
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                  className="px-4 py-2 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500 active:scale-95"
                >
                  Back
                </button>
                <h3 className="font-bold text-sm tracking-tight font-sans">Privacy Guard</h3>
                <div className="w-10 h-1" />
              </div>

              <div className="p-4 rounded-[24px] bg-white/40 border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold">Read Receipts</h4>
                    <p className="text-3xs text-stone-400 mt-1">If turned off, ticks won't turn blue</p>
                  </div>
                  <button
                    type="button"
                    className="w-11 h-6 rounded-full p-1 bg-emerald-500 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
                  </button>
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold">Last Seen status</h4>
                    <p className="text-3xs text-stone-400 mt-1">Broadcast last active timestamp</p>
                  </div>
                  <button
                    type="button"
                    className="w-11 h-6 rounded-full p-1 bg-emerald-500 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubView === "google" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`fixed inset-0 z-50 p-0 flex flex-col ${
              darkMode ? "bg-stone-950 text-white" : "bg-[#fef6f8] text-stone-850"
            }`}
          >
            {/* Header Top strip */}
            <div className="p-4 bg-white/20 border-b border-stone-200/25 dark:border-white/10 flex justify-between items-center shrink-0">
              <button
                onClick={() => { sounds.playClick(); setActiveSubView(null); }}
                className="px-4 py-2 text-xs font-bold rounded-full bg-pink-500/10 text-pink-500 active:scale-95 inline-flex items-center space-x-1.5"
              >
                <ArrowLeft size={12} />
                <span>Back</span>
              </button>
              <h3 className="font-bold text-sm tracking-tight font-sans">Google Workspace</h3>
              <div className="w-16" /> {/* Spacer */}
            </div>

            {/* Render component */}
            <GoogleWorkspaceHub 
              darkMode={darkMode} 
              onImportContact={(contact) => {
                onImportContact(contact);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
