import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Plus, X, Heart, Smile } from "lucide-react";
import { sounds } from "./SoundManager";

export interface StatusStory {
  id: string;
  mediaType: "text" | "image";
  content: string; // text message or image URL
  bgColor?: string; // for text stories
  timestamp: string;
}

export interface UserStatus {
  contactId: string;
  name: string;
  avatar: string;
  stories: StatusStory[];
  hasUnviewed: boolean;
}

interface StatusSectionProps {
  darkMode: boolean;
  userProfile: { name: string; avatar: string; bio: string };
  statuses: UserStatus[];
  onAddStatus: (story: Omit<StatusStory, "id" | "timestamp">) => void;
}

export default function StatusSection({
  darkMode,
  userProfile,
  statuses,
  onAddStatus,
}: StatusSectionProps) {
  const [activeViewer, setActiveViewer] = useState<{
    statusIndex: number;
    storyIndex: number;
  } | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textBg, setTextBg] = useState("bg-gradient-to-tr from-pink-400 to-rose-300");

  const bgOptions = [
    "bg-gradient-to-tr from-pink-400 to-rose-300",
    "bg-gradient-to-tr from-purple-400 via-pink-400 to-rose-400",
    "bg-gradient-to-tr from-rose-400 to-amber-300",
    "bg-gradient-to-tr from-fuchsia-500 to-pink-500",
    "bg-gradient-to-tr from-blue-400 to-pink-400",
  ];

  // Story playback timer
  useEffect(() => {
    if (!activeViewer) return;

    const currentStatus = statuses[activeViewer.statusIndex];
    if (!currentStatus) {
      setActiveViewer(null);
      return;
    }

    const timer = setTimeout(() => {
      handleNextStory();
    }, 4000); // 4s per story

    return () => clearTimeout(timer);
  }, [activeViewer]);

  const handleNextStory = () => {
    if (!activeViewer) return;
    const currentStatus = statuses[activeViewer.statusIndex];
    if (activeViewer.storyIndex < currentStatus.stories.length - 1) {
      // Go to next story of same user
      setActiveViewer({
        ...activeViewer,
        storyIndex: activeViewer.storyIndex + 1,
      });
    } else if (activeViewer.statusIndex < statuses.length - 1) {
      // Go to next contact's story
      setActiveViewer({
        statusIndex: activeViewer.statusIndex + 1,
        storyIndex: 0,
      });
    } else {
      // All done
      setActiveViewer(null);
    }
  };

  const handlePrevStory = () => {
    if (!activeViewer) return;
    if (activeViewer.storyIndex > 0) {
      // Go to previous story
      setActiveViewer({
        ...activeViewer,
        storyIndex: activeViewer.storyIndex - 1,
      });
    } else if (activeViewer.statusIndex > 0) {
      // Go to previous user's last story
      const prevIndex = activeViewer.statusIndex - 1;
      setActiveViewer({
        statusIndex: prevIndex,
        storyIndex: statuses[prevIndex].stories.length - 1,
      });
    } else {
      // At very beginning
      setActiveViewer(null);
    }
  };

  const submitTextStatus = () => {
    if (!textInput.trim()) return;
    onAddStatus({
      mediaType: "text",
      content: textInput,
      bgColor: textBg,
    });
    setTextInput("");
    setIsAddingText(false);
    sounds.playMessageSent();
  };

  const handleStatusCircleClick = (index: number) => {
    sounds.playPop();
    // Start viewing this user's story starting from index 0
    setActiveViewer({
      statusIndex: index,
      storyIndex: 0,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" id="status-section-root">
      {/* Top Header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-center z-10" id="status-header">
        <h1 className={`text-2xl font-sans tracking-tight font-extrabold ${darkMode ? "text-white" : "text-stone-900"}`}>
          Status
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              sounds.playClick();
              setIsAddingText(true);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 transition-all text-pink-500"
            title="Create Text Status"
            id="write-status-btn"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-6" id="status-scroller">
        {/* Personal Status Row Row */}
        <div className="flex items-center justify-between p-3.5 rounded-[24px] bg-white/40 border border-white/25 shadow-sm" id="my-status-card">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt="My Profile"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-white"
              />
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAddingText(true);
                }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-500 hover:bg-pink-600 border border-white rounded-full flex items-center justify-center text-white scale-100 transition-transform active:scale-90"
              >
                <Plus size={11} className="stroke-[3]" />
              </button>
            </div>
            <div className="text-left">
              <h3 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-stone-800"}`}>My Status</h3>
              <p className="text-3xs text-stone-500 mt-0.5">Tap to write a status update</p>
            </div>
          </div>
        </div>

        {/* Recent updates header */}
        <div className="text-left" id="recent-updates-box">
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest pl-1">
            Recent updates
          </span>

          <div className="mt-3 space-y-3">
            {statuses.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No active status contacts. Add status text above!
              </div>
            ) : (
              statuses.map((item, index) => (
                <div
                  key={item.contactId}
                  onClick={() => handleStatusCircleClick(index)}
                  className="flex items-center space-x-4 p-3.5 rounded-[24px] bg-white/30 hover:bg-white/50 active:scale-99 transition-all cursor-pointer border border-pink-500/5 group"
                >
                  {/* Status Circle Frame with gradient border indicator */}
                  <div className="relative">
                    <div
                      className={`absolute -inset-1 rounded-full p-[2.5px] transition-all duration-300 ${
                        item.hasUnviewed
                          ? "bg-gradient-to-tr from-pink-500 to-rose-400 shadow-md shadow-pink-500/10 animate-pulse"
                          : "border border-stone-300/40"
                      }`}
                    >
                      <div className="w-full h-full rounded-full bg-white/10" />
                    </div>
                    <img
                      src={item.avatar}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 rounded-full object-cover relative z-10 border border-white"
                    />
                  </div>

                  <div className="text-left flex-1">
                    <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-stone-800"}`}>
                      {item.name}
                    </h4>
                    <p className="text-3xs text-stone-500 mt-0.5">
                      {item.stories[item.stories.length - 1].timestamp}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Full-Screen Immersive Story Viewer --- */}
      <AnimatePresence>
        {activeViewer && (() => {
          const activeStatus = statuses[activeViewer.statusIndex];
          if (!activeStatus) return null;
          const story = activeStatus.stories[activeViewer.storyIndex];

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden"
              id="fullscreen-story-viewer"
            >
              {/* Tap zones for going backwards and forwards */}
              <div 
                className="absolute inset-[10%_0] flex" 
                id="story-touch-zones"
              >
                <div className="w-1/2 h-full z-10" onClick={handlePrevStory} />
                <div className="w-1/2 h-full z-10" onClick={handleNextStory} />
              </div>

              {/* Progress Counters Indicator */}
              <div className="px-4 pt-6 pb-2 z-20 flex space-x-1.5" id="story-progress-indicator">
                {activeStatus.stories.map((st, sId) => {
                  let progressPercent = "w-0";
                  if (sId < activeViewer.storyIndex) {
                    progressPercent = "w-full";
                  } else if (sId === activeViewer.storyIndex) {
                    progressPercent = "w-full transition-all duration-[4000ms] ease-linear scale-x-100 origin-left";
                  }

                  return (
                    <div
                      key={st.id}
                      className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                    >
                      <div className={`h-full bg-pink-400 ${progressPercent}`} style={{ transformOrigin: "left" }} />
                    </div>
                  );
                })}
              </div>

              {/* User Profile Bar */}
              <div className="px-4 py-2 z-20 flex justify-between items-center" id="story-host-row">
                <div className="flex items-center space-x-3.5 text-left">
                  <img
                    src={activeStatus.avatar}
                    alt={activeStatus.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
                  />
                  <div>
                    <h3 className="font-semibold text-sm text-white">{activeStatus.name}</h3>
                    <p className="text-[10px] text-white/60">{story.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveViewer(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Central Main Screen Media Content */}
              <div className="flex-1 flex items-center justify-center p-6 relative z-10" id="story-body">
                {story.mediaType === "text" ? (
                  <div
                    className={`w-full max-w-sm aspect-square rounded-[36px] p-8 flex items-center justify-center text-center shadow-xl ${
                      story.bgColor || "bg-gradient-to-tr from-pink-500 to-rose-400"
                    }`}
                  >
                    <p className="text-xl font-bold text-white tracking-wide">{story.content}</p>
                  </div>
                ) : (
                  <img
                    src={story.content}
                    alt="Story media"
                    referrerPolicy="no-referrer"
                    className="max-h-[70vh] rounded-[24px] shadow-2xl object-contain border border-white/10"
                  />
                )}
              </div>

              {/* Optional Response Swipe panel */}
              <div className="p-6 pb-8 text-center text-xs font-medium text-white/50 z-20 flex flex-col items-center gap-1.5" id="story-footer">
                <div className="flex space-x-4 mb-2">
                  <button className="p-2.5 rounded-full bg-white/10 text-white hover:scale-105 active:scale-95 transition-all">
                    <Heart size={16} className="text-pink-400 fill-pink-400" />
                  </button>
                  <button className="p-2.5 rounded-full bg-white/10 text-white hover:scale-105 active:scale-95 transition-all">
                    <Smile size={16} className="text-amber-400" />
                  </button>
                </div>
                <span className="font-mono text-3xs uppercase tracking-widest text-white/40">Swipe up to reply</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* --- Status Text Creation Drawer / Overlay --- */}
      <AnimatePresence>
        {isAddingText && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className={`fixed inset-0 z-50 p-6 flex flex-col justify-between transition-all ${textBg}`}
            id="text-status-creator-panel"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center" id="creator-header">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAddingText(false);
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-2">
                {/* Palette picker */}
                {bgOptions.map((bg, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      sounds.playPop();
                      setTextBg(bg);
                    }}
                    className={`w-6 h-6 rounded-full border border-white/40 transition-transform ${bg} ${
                      textBg === bg ? "scale-125 border-white ring-2 ring-white/20" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Middle Entry Body text area */}
            <div className="flex-1 flex items-center justify-center text-center">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value.slice(0, 150))}
                placeholder="Type a status update..."
                className="w-full max-w-sm bg-transparent border-none text-white text-2xl font-bold text-center placeholder-white/50 focus:outline-none resize-none px-4"
                rows={4}
                autoFocus
              />
            </div>

            {/* Footer triggers */}
            <div className="flex justify-between items-center pb-6" id="creator-footer">
              <span className="text-3xs font-mono text-white/55 uppercase tracking-wider">
                {150 - textInput.length} characters left
              </span>

              <button
                onClick={submitTextStatus}
                disabled={!textInput.trim()}
                className={`px-6 py-3 rounded-full font-bold text-xs shadow-lg transition-all ${
                  textInput.trim()
                    ? "bg-white text-pink-600 hover:scale-105 active:scale-95"
                    : "bg-white/40 text-white/60 cursor-not-allowed"
                }`}
              >
                Post Status
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
