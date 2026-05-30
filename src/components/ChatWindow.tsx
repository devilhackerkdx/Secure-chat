import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Phone, Video, Send, Mic, Smile, Paperclip, MoreVertical, CheckCheck, Play, Pause, Trash2, Camera, Reply, Image, FileText, MapPin, Check, X
} from "lucide-react";
import { sounds } from "./SoundManager";
import GoogleWorkspaceHub from "./GoogleWorkspaceHub.tsx";

export interface Message {
  id: string;
  sender: "user" | "contact";
  text: string;
  timestamp: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  voiceWaveform?: number[];
  replyTo?: string | null;
  attachmentType?: "photo" | "doc" | "location" | "gdrive";
  gdriveFileName?: string;
  gdriveFileUrl?: string;
  gdriveFileSize?: string;
  gdriveMimeType?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  statusText: string;
}

interface ChatWindowProps {
  darkMode: boolean;
  selectedContact: Contact;
  messages: Message[];
  isTyping: boolean;
  onBack: () => void;
  onSendMessage: (
    text: string, 
    replyToText?: string | null, 
    attachmentType?: "photo" | "doc" | "location" | "gdrive",
    gdriveMetaData?: { name: string; url: string; size?: string; mimeType: string }
  ) => void;
  onInitiateCall: (type: "voice" | "video") => void;
  chatWallpaper?: string;
}

export default function ChatWindow({
  darkMode,
  selectedContact,
  messages,
  isTyping,
  onBack,
  onSendMessage,
  onInitiateCall,
  chatWallpaper = "classic-doodle",
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showGDriveSelector, setShowGDriveSelector] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  // Helper to determine wallpaper styles
  const getWallpaperStyles = () => {
    switch (chatWallpaper) {
      case "sakura-gradient":
        return {
          background: darkMode
            ? "linear-gradient(185deg, #1a0f14 0%, #0c080a 100%)"
            : "linear-gradient(185deg, #fff5f7 0%, #ffd6df 100%)",
        };
      case "dark-grid":
        return {
          backgroundColor: darkMode ? "#0c0812" : "#f1f3f9",
          backgroundImage: darkMode
            ? "linear-gradient(rgba(236,72,153,0.04) 1px, transparent 0px), linear-gradient(90deg, rgba(236,72,153,0.04) 1px, transparent 0px)"
            : "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 0px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 0px)",
          backgroundSize: "20px 20px",
        };
      case "emerald-leaves":
        return {
          background: darkMode
            ? "linear-gradient(135deg, #05140b 0%, #020c06 100%)"
            : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        };
      case "midnight-mist":
        return {
          background: darkMode
            ? "linear-gradient(180deg, #09060c 0%, #020104 100%)"
            : "linear-gradient(180deg, #18141d 0%, #0d0a0f 100%)",
        };
      case "vintage-grid":
        return {
          backgroundColor: darkMode ? "#1c1917" : "#fafaf9",
          backgroundImage: darkMode
            ? "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 0px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 0px)"
            : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 0px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 0px)",
          backgroundSize: "16px 16px",
        };
      case "classic-doodle":
      default:
        return {
          backgroundImage: `radial-gradient(var(--color-accent, #ec4899) 1px, transparent 0px)`,
          backgroundSize: "16px 16px",
        };
    }
  };

  // Voice Note states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [voiceWaveform, setVoiceWaveform] = useState<number[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback simulate states
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const audioPlaybackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const endMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setVoiceWaveform(Array.from({ length: 30 }, () => Math.floor(Math.random() * 24) + 4));
      recordingTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
        setVoiceWaveform((prev) => [...prev.slice(1), Math.floor(Math.random() * 24) + 4]);
      }, 1000);
    } else {
      setRecordDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), replyMessage ? replyMessage.text : null);
    setInputText("");
    setReplyMessage(null);
  };

  const startVoiceRecording = () => {
    sounds.playPop();
    setIsRecording(true);
  };

  const deleteVoiceRecording = () => {
    sounds.playClick();
    setIsRecording(false);
  };

  const submitVoiceRecording = () => {
    sounds.playMessageSent();
    setIsRecording(false);
    // Submit a voice message
    const minutes = Math.floor(recordDuration / 60);
    const secs = recordDuration % 60;
    const durStr = `${minutes}:${secs.toString().padStart(2, "0")}`;
    onSendMessage(`🎤 Voice Note (${durStr})`, null, undefined);
  };

  const triggerAttachment = (type: "photo" | "doc" | "location") => {
    sounds.playMessageSent();
    setShowAttachments(false);
    if (type === "photo") {
      onSendMessage("📷 Image Attachment", null, "photo");
    } else if (type === "doc") {
      onSendMessage("📄 PDF Document", null, "doc");
    } else if (type === "location") {
      onSendMessage("📍 Location pin shared", null, "location");
    }
  };

  // Simulating playback progress of voice message
  const toggleVoicePlayback = (msgId: string) => {
    sounds.playClick();
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
      if (audioPlaybackTimerRef.current) clearInterval(audioPlaybackTimerRef.current);
    } else {
      setPlayingVoiceId(msgId);
      setVoiceProgress(0);
      audioPlaybackTimerRef.current = setInterval(() => {
        setVoiceProgress((prev) => {
          if (prev >= 100) {
            setPlayingVoiceId(null);
            clearInterval(audioPlaybackTimerRef.current!);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    }
  };

  const formatRecDuration = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative" id="chat-window-pane">
      {/* Dynamic blurred header bar */}
      <div className="px-4 py-3.5 flex justify-between items-center bg-white/40 border-b accent-border-light z-10" id="chat-header">
        <div className="flex items-center space-x-2.5">
          {/* Back Trigger */}
          <button
            onClick={() => { sounds.playClick(); onBack(); }}
            className="p-1 rounded-full text-stone-700 hover:bg-stone-500/5 active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Profile Circle Details */}
          <div className="flex items-center space-x-2.5 text-left">
            <img
              src={selectedContact.avatar}
              alt={selectedContact.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-white"
            />
            <div>
              <h3 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-stone-800"}`}>
                {selectedContact.name}
              </h3>
              <p className="text-[10px] text-stone-500 font-medium">
                {isTyping ? "typing..." : selectedContact.statusText}
              </p>
            </div>
          </div>
        </div>

        {/* Audio / Video phone dials */}
        <div className="flex space-x-2">
          <button
            onClick={() => { sounds.playClick(); onInitiateCall("voice"); }}
            className="w-9 h-9 rounded-full flex items-center justify-center accent-bg-light accent-text accent-bg-light-hover active:scale-95"
          >
            <Phone size={14} />
          </button>
          <button
            onClick={() => { sounds.playClick(); onInitiateCall("video"); }}
            className="w-9 h-9 rounded-full flex items-center justify-center accent-bg-light accent-text accent-bg-light-hover active:scale-95"
          >
            <Video size={14} />
          </button>
        </div>
      </div>

      {/* Messages Scrolling Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5" 
        id="messages-wrapper"
        style={getWallpaperStyles()}
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === "user";

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              {/* Optional Sliding Swipe Reply trigger inside item */}
              <div
                className={`p-3.5 rounded-[22px] border shadow-sm relative group text-left ${
                  isUser
                    ? "accent-bg text-white accent-border-thick p-3.5 accent-shadow"
                    : "bg-white/55 backdrop-blur-md text-stone-800 border-white/20"
                }`}
              >
                {/* Swipe Reply indicator overlay on hover */}
                <button
                  onClick={() => { sounds.playPop(); setReplyMessage(msg); }}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/40 backdrop-blur-xl rounded-full text-stone-600 hover:accent-text"
                >
                  <Reply size={12} />
                </button>

                {/* Reply To Preview Bubble Context */}
                {msg.replyTo && (
                  <div className={`p-2 rounded-[14px] text-4xs mb-2 text-left border ${
                    isUser
                      ? "bg-pink-600/35 border-pink-400 text-pink-50"
                      : "bg-pink-50/50 border-pink-500/10 text-stone-600"
                  }`}>
                    <span className="font-bold block text-5xs uppercase tracking-widest opacity-75">Replying to</span>
                    <span className="truncate block font-medium max-w-[150px]">{msg.replyTo}</span>
                  </div>
                )}

                {/* Specialized Attachments custom drawing */}
                {msg.attachmentType === "photo" && (
                  <div className="mb-2 relative overflow-hidden rounded-xl border border-white/20 aspect-video bg-rose-100">
                    <img 
                      src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=420&fit=crop" 
                      alt="Party preset" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {msg.attachmentType === "doc" && (
                  <div className={`flex items-center space-x-2.5 p-2 rounded-xl border mb-2 text-left ${isUser ? "bg-pink-600/25 border-pink-400" : "bg-stone-50 border-stone-200"}`}>
                    <FileText size={18} className="text-pink-500 shrink-0" />
                    <div className="truncate w-36">
                      <h4 className="text-[10px] font-bold truncate">SecureChat_Review.pdf</h4>
                      <p className="text-5xs opacity-60">1.8 MB • PDF Document</p>
                    </div>
                  </div>
                )}

                {msg.attachmentType === "location" && (
                  <div className="flex items-center space-x-2.5 p-2 rounded-xl mb-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-left">
                    <MapPin size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold">Standard Cupertino HQ</h4>
                      <p className="text-3xs opacity-80">Infinite Loop, Cupertino, CA</p>
                    </div>
                  </div>
                )}

                {msg.attachmentType === "gdrive" && (
                  <div className={`flex flex-col p-2.5 rounded-xl border mb-2 text-left ${isUser ? "bg-pink-600/10 border-pink-400" : "bg-white/80 border-stone-200"} max-w-[210px]`}>
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 text-xs">
                        📁
                      </div>
                      <div className="truncate flex-1">
                        <h4 className="text-[10px] font-bold truncate text-emerald-600 dark:text-emerald-400">
                          {msg.gdriveFileName || msg.text}
                        </h4>
                        <p className="text-[8px] text-stone-500 dark:text-stone-400 leading-none mt-0.5 font-mono">
                          {msg.gdriveFileSize ? `${(parseInt(msg.gdriveFileSize)/1024/1024).toFixed(2)} MB` : "Doc"} • Google Drive
                        </p>
                      </div>
                    </div>
                    {msg.gdriveFileUrl && (
                      <a 
                        href={msg.gdriveFileUrl} 
                        target="_blank" 
                        rel="noreferrer noopener"
                        onClick={() => sounds.playChime()}
                        className="mt-2 text-center py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[9px] block transition-colors shadow"
                      >
                        View in Google Drive
                      </a>
                    )}
                  </div>
                )}

                {/* Voice player bubble simulation */}
                {msg.text.includes("Voice Note") ? (
                  <div className="flex items-center space-x-3 w-48 text-left py-1">
                    <button
                      onClick={() => toggleVoicePlayback(msg.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isUser 
                          ? "bg-white text-pink-500" 
                          : "bg-pink-500 text-white"
                      }`}
                    >
                      {playingVoiceId === msg.id ? (
                        <div className="flex space-x-0.5 justify-center">
                          <span className="w-1 h-3 bg-current animate-bounce" />
                          <span className="w-1 h-3.5 bg-current animate-bounce" style={{ animationDelay: "0.15s" }} />
                          <span className="w-1 h-2 bg-current animate-bounce" style={{ animationDelay: "0.3s" }} />
                        </div>
                      ) : (
                        <Play size={14} className="ml-0.5" />
                      )}
                    </button>

                    {/* Animated waveform bars */}
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-stone-300/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${isUser ? "bg-white" : "accent-bg"}`} 
                          style={{ width: playingVoiceId === msg.id ? `${voiceProgress}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[9px] block opacity-75 font-semibold">Voice playback status</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                )}

                {/* Tick & Time marker */}
                <div className={`flex justify-end items-center gap-1 mt-1 text-[9px] opacity-75 ${isUser ? "text-white/70" : "text-stone-400"}`}>
                  <span>{msg.timestamp}</span>
                  {isUser && (
                    <CheckCheck size={11} className={index === messages.length - 1 ? "text-white" : "text-sky-300"} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Live Typing block */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex mr-auto bg-white/40 border border-white/20 px-4 py-2.5 rounded-[20px] items-center space-x-1"
          >
            <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" />
          </motion.div>
        )}

        <div ref={endMessagesRef} />
      </div>

      {/* Reply Draft Bar Indicator */}
      <AnimatePresence>
        {replyMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="px-4 py-2 bg-white/60 border-t accent-border-light flex items-center justify-between text-left z-10"
            id="reply-draft-panel"
          >
            <div className="border-l-2 accent-border pl-3 truncate">
              <span className="text-[10px] font-bold accent-text block uppercase tracking-widest leading-none">Replying to msg</span>
              <p className="text-5xs text-stone-500 truncate mt-1 leading-tight">{replyMessage.text}</p>
            </div>
            <button
              onClick={() => { sounds.playClick(); setReplyMessage(null); }}
              className="w-6 h-6 rounded-full bg-stone-500/10 flex items-center justify-center text-stone-500 hover:bg-stone-500/20 active:scale-90"
            >
              <Check size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Input Drawer Bar */}
      <div className="p-3.5 bg-white/40 border-t accent-border-light z-10" id="chat-input-bar">
        {isRecording ? (
          /* Mic Recording State Panel */
          <div className="flex items-center justify-between px-3 py-1.5 accent-bg-light border accent-border-light rounded-full" id="recording-module">
            <div className="flex items-center space-x-3 accent-text font-mono text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>RECORDING {formatRecDuration(recordDuration)}</span>
            </div>

            {/* Simulated Live wave lines */}
            <div className="flex space-x-0.5 items-end h-6 max-w-[200px] overflow-hidden">
              {voiceWaveform.map((val, idx) => (
                <div 
                  key={idx} 
                  className="accent-bg w-0.5" 
                  style={{ height: `${val}px` }}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={deleteVoiceRecording}
                className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 hover:bg-white/60 active:scale-95 transition-all"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={submitVoiceRecording}
                className="px-5 py-2 rounded-full accent-bg text-white font-bold text-3xs shadow-md accent-shadow"
              >
                Send Audio
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Panel */
          <div className="flex items-center space-x-2">
            {/* Attachment paperclip list */}
            <div className="relative">
              <button
                onClick={() => { sounds.playPop(); setShowAttachments(!showAttachments); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  showAttachments ? "accent-bg text-white" : "text-stone-500 accent-bg-light accent-bg-light-hover"
                }`}
              >
                <Paperclip size={16} />
              </button>

              {/* Attachments drawer portal */}
              <AnimatePresence>
                {showAttachments && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-12 left-0 z-20 w-44 rounded-[24px] bg-white text-stone-800 p-3.5 border shadow-xl flex flex-col space-y-1 text-left"
                    id="attachment-menu"
                  >
                    <button
                      onClick={() => triggerAttachment("photo")}
                      className="flex items-center space-x-3.5 p-2 rounded-xl hover:bg-stone-50 active:scale-99 text-xs"
                    >
                      <Image className="accent-text shrink-0" size={14} />
                      <span className="font-semibold text-stone-700">Photo & Video</span>
                    </button>
                    <button
                      onClick={() => triggerAttachment("doc")}
                      className="flex items-center space-x-3.5 p-2 rounded-xl hover:bg-stone-50 active:scale-99 text-xs"
                    >
                      <FileText className="accent-text shrink-0" size={14} />
                      <span className="font-semibold text-stone-700">Document</span>
                    </button>
                    <button
                      onClick={() => triggerAttachment("location")}
                      className="flex items-center space-x-3.5 p-2 rounded-xl hover:bg-stone-50 active:scale-99 text-xs"
                    >
                      <MapPin className="text-emerald-500 shrink-0" size={14} />
                      <span className="font-semibold text-stone-700">Location Share</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setShowAttachments(false);
                        setShowGDriveSelector(true);
                      }}
                      className="flex items-center space-x-3.5 p-2 rounded-xl hover:bg-emerald-500/5 active:scale-99 text-xs"
                    >
                      <span className="shrink-0 text-emerald-500">📁</span>
                      <span className="font-semibold text-emerald-600">Google Drive</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main TextBox input */}
            <input
              type="text"
              placeholder="Message SecureChat..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              className="flex-1 py-3 px-4.5 text-xs rounded-2xl border outline-none bg-white/45 accent-border-light placeholder-stone-400 text-stone-800 focus:bg-white/75 focus:accent-border"
            />

            {/* Mic / Send triggers */}
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full accent-bg text-white flex items-center justify-center shadow-lg accent-shadow active:scale-95 transition-transform"
              >
                <Send size={15} />
              </button>
            ) : (
              <button
                onClick={startVoiceRecording}
                className="w-10 h-10 rounded-full text-stone-500 accent-bg-light accent-bg-light-hover flex items-center justify-center active:scale-95 transition-transform"
              >
                <Mic size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Google Drive Selection Overlay Modal */}
      <AnimatePresence>
        {showGDriveSelector && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex flex-col justify-end"
            id="gdrive-picker-modal"
          >
            <div className={`w-full h-[85%] rounded-t-[32px] flex flex-col overflow-hidden ${darkMode ? "bg-stone-950 text-white" : "bg-[#fef6f8] text-stone-850"} shadow-2xl`}>
              {/* Modal Top Bar header */}
              <div className="p-4 bg-white/20 border-b border-stone-200/25 dark:border-white/10 flex justify-between items-center shrink-0">
                <button
                  onClick={() => { sounds.playClick(); setShowGDriveSelector(false); }}
                  className="p-1.5 px-3 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-500 active:scale-95 flex items-center space-x-1"
                >
                  <X size={12} />
                  <span>Cancel</span>
                </button>
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-stone-550 dark:text-stone-400">
                  Select Drive Attachment
                </h3>
                <div className="w-12" /> {/* Spacer */}
              </div>

              {/* Dynamic Google Workspace component */}
              <GoogleWorkspaceHub
                darkMode={darkMode}
                isInsideChatSelection={true}
                onSelectDriveFile={(file) => {
                  sounds.playMessageSent();
                  onSendMessage(`📁 File: ${file.name}`, null, "gdrive", {
                    name: file.name,
                    url: file.webViewLink || "",
                    size: file.size,
                    mimeType: file.mimeType,
                  });
                  setShowGDriveSelector(false);
                }}
                onImportContact={() => {}} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
