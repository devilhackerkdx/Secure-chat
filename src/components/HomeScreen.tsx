import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MessageSquarePlus, Check, BellOff, Archive, Pin, Trash2, Users } from "lucide-react";
import { sounds } from "./SoundManager";

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
  statusText: string;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
}

interface HomeScreenProps {
  darkMode: boolean;
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  onOpenNewChat: () => void;
}

export default function HomeScreen({
  darkMode,
  contacts,
  onSelectContact,
  onOpenNewChat,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [swipedContactId, setSwipedContactId] = useState<string | null>(null);

  // Filter contacts by query
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactTap = (id: string) => {
    sounds.playPop();
    onSelectContact(id);
  };

  const handleSwipeSimulate = (contactId: string) => {
    sounds.playClick();
    setSwipedContactId(swipedContactId === contactId ? null : contactId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" id="whatsapp-chatsview-root">
      {/* Top Title Section */}
      <div className="px-6 pt-5 pb-3 flex justify-between items-center z-10" id="chatsview-header">
        <h1 className={`text-2xl font-sans tracking-tight font-extrabold ${darkMode ? "text-white" : "text-stone-900"}`}>
          Chats
        </h1>
        <button
          onClick={() => {
            sounds.playChime();
            onOpenNewChat();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/15 text-pink-500 active:scale-90 shadow-md shadow-pink-500/5 transition-all"
          title="New Chat"
          id="btn-new-chat-launcher"
        >
          <MessageSquarePlus size={18} />
        </button>
      </div>

      {/* Floating Search Input Layout */}
      <div className="px-5 pb-3" id="chatsview-search">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
          <input
            type="text"
            placeholder="Search messages or contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-10 pr-4 text-xs rounded-2xl outline-none border transition-all text-stone-800 border-pink-500/10 placeholder-stone-400 bg-white/45 focus:bg-white/75 focus:border-pink-500/20"
          />
        </div>
      </div>

      {/* Scrolling Chat Threads List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-2.5" id="chatsview-list-wrapper">
        <div className="space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400">
              No matching chats found. Tap the "New Chat" icon to connect!
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSwiped = swipedContactId === contact.id;

              return (
                <div
                  key={contact.id}
                  className="relative overflow-hidden rounded-[24px] bg-white/40 border border-white/25 shadow-sm hover:bg-white/55 transition-all flex items-center cursor-pointer"
                  id={`chat-thread-${contact.id}`}
                >
                  {/* Swipe actions background reveal overlay */}
                  <div className="absolute right-0 inset-y-0 flex items-center pr-2 space-x-1 z-0 pointer-events-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        setSwipedContactId(null);
                      }}
                      className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-white transition-all shadow-sm"
                      title="Mute"
                    >
                      <BellOff size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        setSwipedContactId(null);
                      }}
                      className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-550 hover:bg-pink-200 transition-all shadow-sm"
                      title="Archive"
                    >
                      <Archive size={14} />
                    </button>
                  </div>

                  {/* Main Sliding Surface Container */}
                  <div
                    onClick={() => handleContactTap(contact.id)}
                    className="flex-1 flex items-center justify-between p-3.5 relative z-10 bg-white/5 shadow-2x-sm select-none transition-transform duration-300"
                    style={{ transform: isSwiped ? "translateX(-94px)" : "translateX(0px)" }}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                      {/* Avatar with live green indicator dot */}
                      <div className="relative shrink-0">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-white/60"
                        />
                        {contact.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center animate-pulse" />
                        )}
                      </div>

                      {/* Username + snippet preview */}
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className={`font-semibold text-sm truncate ${darkMode ? "text-stone-100" : "text-stone-800"}`}>
                            {contact.name}
                          </h4>
                          <span className="text-[9px] text-stone-400 font-medium shrink-0 ml-2">
                            {contact.lastMessageTime}
                          </span>
                        </div>
                        <p className="text-4xs text-stone-500 truncate mt-0.5 max-w-[210px] font-medium leading-none">
                          {contact.lastMessageText}
                        </p>
                      </div>
                    </div>

                    {/* Unread dot or options trigger */}
                    <div className="flex flex-col items-end space-y-1 ml-3 shrink-0">
                      {contact.unreadCount > 0 ? (
                        <span className="min-w-[18px] h-[18px] px-1 hover:scale-105 active:scale-95 text-[10px] bg-pink-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                          {contact.unreadCount}
                        </span>
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-stone-300.5" />
                      )}

                      {/* Small swipe helper tab bubble trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwipeSimulate(contact.id);
                        }}
                        className="p-1 rounded-full text-stone-300 hover:text-stone-500 active:scale-90"
                        title="Options"
                      >
                        <Pin size={11} className={isSwiped ? "text-pink-500" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
