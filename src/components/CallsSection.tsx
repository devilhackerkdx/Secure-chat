import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Video, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, X, Mic, MicOff, Volume2, VolumeX, ShieldAlert, VideoOff } from "lucide-react";
import { sounds } from "./SoundManager";

export interface CallLog {
  id: string;
  contactId: string;
  name: string;
  avatar: string;
  type: "voice" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
}

interface CallsSectionProps {
  darkMode: boolean;
  contacts: { id: string; name: string; avatar: string }[];
  callLogs: CallLog[];
  activeCall: {
    contactId: string;
    type: "voice" | "video";
    direction: "incoming" | "outgoing";
    isConnected: boolean;
  } | null;
  onInitiateCall: (contactId: string, type: "voice" | "video") => void;
  onEndCall: () => void;
  onAcceptIncomingCall: () => void;
}

export default function CallsSection({
  darkMode,
  contacts,
  callLogs,
  activeCall,
  onInitiateCall,
  onEndCall,
  onAcceptIncomingCall,
}: CallsSectionProps) {
  const [deviceStream, setDeviceStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callTimer, setCallTimer] = useState(0);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Handle local user camera preview for video calling
  useEffect(() => {
    if (activeCall && activeCall.type === "video" && isVideoOn) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 480, height: 640 }, audio: false })
        .then((stream) => {
          setDeviceStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera media access blocked or not available:", err);
        });
    } else {
      if (deviceStream) {
        deviceStream.getTracks().forEach((track) => track.stop());
        setDeviceStream(null);
      }
    }

    return () => {
      if (deviceStream) {
        deviceStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCall, isVideoOn]);

  // Hook up video ref when stream triggers
  useEffect(() => {
    if (localVideoRef.current && deviceStream) {
      localVideoRef.current.srcObject = deviceStream;
    }
  }, [deviceStream]);

  // Handle call seconds duration timer
  useEffect(() => {
    if (activeCall && activeCall.isConnected) {
      callIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    }
    return () => {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [activeCall]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeContact = activeCall ? contacts.find((c) => c.id === activeCall.contactId) : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" id="calls-section-root">
      {/* Upper header */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-center z-10" id="calls-header">
        <h1 className={`text-2xl font-sans tracking-tight font-extrabold ${darkMode ? "text-white" : "text-stone-900"}`}>
          Calls
        </h1>
      </div>

      {/* Scroller page */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-5" id="calls-scroller">
        <div className="text-left" id="logs-box">
          <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest pl-1">
            Recent activity
          </span>

          <div className="mt-3 space-y-3">
            {callLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No recent calls. Start a call from any chat screen.
              </div>
            ) : (
              callLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 rounded-[24px] bg-white/40 border border-white/25 shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    {/* Circle Photo */}
                    <img
                      src={log.avatar}
                      alt={log.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-white"
                    />

                    <div className="text-left">
                      <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-stone-800"}`}>
                        {log.name}
                      </h4>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {log.direction === "incoming" && (
                          <PhoneIncoming size={10} className="text-emerald-500" />
                        )}
                        {log.direction === "outgoing" && (
                          <PhoneOutgoing size={10} className="text-pink-500" />
                        )}
                        {log.direction === "missed" && (
                          <PhoneMissed size={10} className="text-rose-500" />
                        )}
                        <span className="text-[9px] text-stone-500 font-medium">
                          {log.timestamp} • {log.type === "voice" ? "Voice" : "Video"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Redial triggers */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onInitiateCall(log.contactId, "voice");
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 transition-all text-pink-500"
                    >
                      <Phone size={14} />
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onInitiateCall(log.contactId, "video");
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 transition-all text-pink-500"
                    >
                      <Video size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Full-Screen Glassmorphic FaceTime calling simulation overlay --- */}
      <AnimatePresence>
        {activeCall && activeContact && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed inset-0 z-50 bg-stone-950 text-white flex flex-col justify-between p-6 overflow-hidden"
            id="facetime-calling-overlay"
          >
            {/* Visual background blurred gradients */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-pink-500/15 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-950 no-repeat to-transparent pointer-events-none" />

            {/* If video call is active and camera granted, show stream full bleed */}
            {activeCall.type === "video" && isVideoOn && deviceStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            )}

            {/* Encryption label */}
            <div className="z-10 flex justify-center mt-6" id="call-encryption-status">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  End-to-End Encrypted
                </span>
              </div>
            </div>

            {/* Profile Avatar center view */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 pt-16">
              <motion.div 
                className="relative mb-6"
                animate={{ scale: activeCall.isConnected ? 1 : [0.95, 1.05, 0.95] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {/* Glowing fluid rings around avatar */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 blur-xl opacity-40 scale-125" />
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 rounded-full border-4 border-white/20 object-cover relative z-10"
                />
              </motion.div>

              <h2 className="text-xl font-bold font-sans tracking-tight">{activeContact.name}</h2>
              <p className="text-[11px] text-white/60 font-mono tracking-widest uppercase mt-2">
                {activeCall.isConnected ? `CONNECTED • ${formatDuration(callTimer)}` : "DIALING SECURE TUNNEL..."}
              </p>
            </div>

            {/* Controls segment bar */}
            <div className="z-10 mb-10 flex flex-col items-center space-y-6" id="call-controls-panel">
              {/* Call Accept Bar for incoming */}
              {activeCall.direction === "incoming" && !activeCall.isConnected && (
                <div className="flex justify-center space-x-10 w-full mb-4">
                  <button
                    onClick={() => {
                      sounds.playChime();
                      onAcceptIncomingCall();
                    }}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Phone className="stroke-[2.5]" size={24} />
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onEndCall();
                    }}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <X className="stroke-[2.5]" size={24} />
                  </button>
                </div>
              )}

              {/* Connected Controls */}
              {(activeCall.direction === "outgoing" || activeCall.isConnected) && (
                <div className="flex justify-center space-x-6">
                  {/* Mic Mute */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsMicOn(!isMicOn);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${
                      isMicOn
                        ? "bg-white/10 text-white border-white/10 hover:bg-white/20"
                        : "bg-red-550 border-red-500 text-white border"
                    }`}
                  >
                    {isMicOn ? <Mic size={18} /> : <MicOff size={18} className="text-rose-500" />}
                  </button>

                  {/* Volume Speaker */}
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsSpeakerOn(!isSpeakerOn);
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${
                      isSpeakerOn
                        ? "bg-white/10 text-white border-white/10 hover:bg-white/20"
                        : "bg-pink-500/20 text-pink-400 border-pink-500/30"
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>

                  {/* Video camera hide/display */}
                  {activeCall.type === "video" && (
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setIsVideoOn(!isVideoOn);
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${
                        isVideoOn
                          ? "bg-white/10 text-white border-white/10 hover:bg-white/20"
                          : "bg-red-550 border-red-500 text-white border"
                      }`}
                    >
                      {isVideoOn ? <Video size={18} /> : <VideoOff size={18} className="text-rose-400" />}
                    </button>
                  )}

                  {/* End Button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onEndCall();
                    }}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white border border-rose-500/20"
                  >
                    <X size={18} className="stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
