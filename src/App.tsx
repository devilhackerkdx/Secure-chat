import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, RefreshCw, Layers, PhoneCall, LogOut, Check, Heart, Lock, ShieldCheck } from "lucide-react";
import { sounds } from "./components/SoundManager";

// Firebase Imports
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { signInAnonymously, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";

// Types matching components
import HomeScreen, { Contact } from "./components/HomeScreen";
import ChatWindow, { Message } from "./components/ChatWindow";
import StatusSection, { UserStatus, StatusStory } from "./components/StatusSection";
import CallsSection, { CallLog } from "./components/CallsSection";
import SettingsSection from "./components/SettingsSection";
import LoginScreen from "./components/LoginScreen";

// --- Seed Default Data outside component ---
const defaultMessages: Record<string, Message[]> = {
  sophie: [
    { id: "s1", sender: "contact", text: "Hey! How is SecureChat looking today?", timestamp: "15:45" },
    { id: "s2", sender: "user", text: "Stunning! Fully redesigned with glassmorphism and soft light pink shades.", timestamp: "15:48" },
    { id: "s3", sender: "contact", text: "Did you check out the new transparent widgets?", timestamp: "15:52" },
  ],
  marcus: [
    { id: "m1", sender: "contact", text: "Are our keys rolling on each session block?", timestamp: "13:10" },
    { id: "m2", sender: "user", text: "Yes, standard ephemeral rollouts are synchronized.", timestamp: "13:15" },
    { id: "m3", sender: "contact", text: "Let me know when the end-to-end audit completes.", timestamp: "13:21" },
  ],
  jean: [
    { id: "j1", sender: "contact", text: "Our glass styling renders so cleanly on iPhone.", timestamp: "11:10" },
    { id: "j2", sender: "user", text: "Definitely. iOS 26 blur looks top-tier.", timestamp: "11:12" },
    { id: "j3", sender: "contact", text: "That light pink glass vibe is incredible!", timestamp: "11:15" },
  ],
};

const defaultStatuses: UserStatus[] = [
  {
    contactId: "sophie",
    name: "Sophie Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    hasUnviewed: true,
    stories: [
      { id: "st-s1", mediaType: "text", content: "Chasing sunsets on the West Coast! 🌅", bgColor: "bg-gradient-to-tr from-rose-400 to-amber-300", timestamp: "2 hours ago" },
      { id: "st-s2", mediaType: "image", content: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&fit=crop", timestamp: "1 hour ago" },
    ],
  },
  {
    contactId: "marcus",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    hasUnviewed: true,
    stories: [
      { id: "st-m1", mediaType: "text", content: "Clean compilers make clean minds. 💻", bgColor: "bg-gradient-to-tr from-fuchsia-500 to-pink-500", timestamp: "4 hours ago" },
    ],
  },
];

const defaultCallLogs: CallLog[] = [
  {
    id: "cl-1",
    contactId: "sophie",
    name: "Sophie Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    type: "video",
    direction: "incoming",
    timestamp: "Today, 14:15",
  },
  {
    id: "cl-2",
    contactId: "marcus",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    type: "voice",
    direction: "outgoing",
    timestamp: "Yesterday, 18:22",
  },
];

export default function App() {
  // --- UI Frame Control ---
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "calls" | "settings">("chats");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("+1 555-0199");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("1234");
  const [pinError, setPinError] = useState<boolean>(false);

  // --- Simulated Platform Engine ---
  const [activePlatform, setActivePlatform] = useState<"ios" | "android">("ios");
  const [lastNotification, setLastNotification] = useState<{ sender: string; text: string } | null>(null);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([
    "Flutter main() compiled successfully.",
    "Dual Platform responsive layout activated.",
    "SecureChat standard double-ratchet initialized.",
  ]);

  const handleTriggerSimulatedNotification = () => {
    sounds.playChime();
    const notificationOptions = [
      { sender: "Sophie Chen", text: "Are we synchronized on other devices?" },
      { sender: "Marcus Vance", text: "End-to-end signal audit matches 100% block rating." },
      { sender: "Jean Laurent", text: "This pink translucent glass looks pristine on Android too!" },
    ];
    const picked = notificationOptions[Math.floor(Math.random() * notificationOptions.length)];
    setLastNotification(picked);
    
    // Add to simulation log
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSimulatedLog((prev) => [
      `[${time}] Mock Notification: from ${picked.sender}`,
      ...prev.slice(0, 5)
    ]);

    // Automatically dismiss after 4 seconds
    setTimeout(() => {
      setLastNotification(null);
    }, 4500);
  };

  const handleTriggerSimulatedIncomingCall = () => {
    sounds.playClick();
    sounds.startRingtone();
    const randomContacts = ["sophie", "marcus", "jean"];
    const contactId = randomContacts[Math.floor(Math.random() * randomContacts.length)];
    
    setActiveCall({
      contactId,
      type: "voice",
      direction: "incoming",
      isConnected: false,
    });

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSimulatedLog((prev) => [
      `[${time}] Simulated call incoming from ${contactId}`,
      ...prev.slice(0, 5)
    ]);
  };

  // --- Visual Customizations ---
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeWallpaper, setActiveWallpaper] = useState<string>("sakura");
  const [glassOpacity, setGlassOpacity] = useState<number>(0.35);
  const [blurAmount, setBlurAmount] = useState<number>(24);
  const [activeTheme, setActiveTheme] = useState<string>("pink");
  const [activeFont, setActiveFont] = useState<string>("Inter");
  const [chatWallpaper, setChatWallpaper] = useState<string>("classic-doodle");
  const [appIcon, setAppIcon] = useState<string>("Icon Classic Pink");

  // Configured Pastel iOS 26 palettes
  const themeAccents: Record<string, { hex: string; hoverHex: string; lightHex: string; lightHoverHex: string; textLight: string; shadow: string }> = {
    pink: {
      hex: "#ffb6c1",
      hoverHex: "#f094a4",
      lightHex: "rgba(255, 182, 193, 0.18)",
      lightHoverHex: "rgba(255, 182, 193, 0.32)",
      textLight: "#ffd1d7",
      shadow: "rgba(255, 182, 193, 0.25)",
    },
    emerald: {
      hex: "#10b981",
      hoverHex: "#059669",
      lightHex: "rgba(16, 185, 129, 0.15)",
      lightHoverHex: "rgba(16, 185, 129, 0.28)",
      textLight: "#a7f3d0",
      shadow: "rgba(16, 185, 129, 0.25)",
    },
    sky: {
      hex: "#0ea5e9",
      hoverHex: "#0284c7",
      lightHex: "rgba(14, 165, 233, 0.15)",
      lightHoverHex: "rgba(14, 165, 233, 0.28)",
      textLight: "#bae6fd",
      shadow: "rgba(14, 165, 233, 0.25)",
    },
    violet: {
      hex: "#8b5cf6",
      hoverHex: "#7c3aed",
      lightHex: "rgba(139, 92, 246, 0.15)",
      lightHoverHex: "rgba(139, 92, 246, 0.28)",
      textLight: "#ddd6fe",
      shadow: "rgba(139, 92, 246, 0.25)",
    },
    amber: {
      hex: "#eab308",
      hoverHex: "#ca8a04",
      lightHex: "rgba(234, 179, 8, 0.15)",
      lightHoverHex: "rgba(234, 179, 8, 0.28)",
      textLight: "#fef3c7",
      shadow: "rgba(234, 179, 8, 0.25)",
    },
    monochrome: {
      hex: "#4b5563",
      hoverHex: "#374151",
      lightHex: "rgba(75, 85, 99, 0.15)",
      lightHoverHex: "rgba(75, 85, 99, 0.28)",
      textLight: "#e5e7eb",
      shadow: "rgba(75, 85, 99, 0.25)",
    },
  };

  const fontStyles: Record<string, string> = {
    "Inter": "'Inter', sans-serif",
    "Space Grotesk": "'Space Grotesk', sans-serif",
    "Playfair Display": "'Playfair Display', serif",
    "JetBrains Mono": "'JetBrains Mono', monospace",
    "Outfit": "'Outfit', sans-serif",
  };

  const currentAccent = themeAccents[activeTheme] || themeAccents.pink;

  // --- User Profile System ---
  const [userProfile, setUserProfile] = useState({
    name: "Aria Sterling",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    bio: "Securing conversations elegantly • iOS 26",
    isOnline: true,
  });

  // --- Database States ---
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "sophie",
      name: "Sophie Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      status: "online",
      statusText: "online",
      unreadCount: 1,
      lastMessageText: "Did you check out the new transparent widgets?",
      lastMessageTime: "15:52",
    },
    {
      id: "marcus",
      name: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      status: "offline",
      statusText: "last seen today at 13:40",
      unreadCount: 0,
      lastMessageText: "Let me know when the end-to-end audit completes.",
      lastMessageTime: "13:21",
    },
    {
      id: "jean",
      name: "Jean Laurent",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      status: "online",
      statusText: "online",
      unreadCount: 0,
      lastMessageText: "That light pink glass vibe is incredible!",
      lastMessageTime: "11:15",
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    sophie: [],
    marcus: [],
    jean: [],
  });

  // --- Status Updates DB ---
  const [statuses, setStatuses] = useState<UserStatus[]>(defaultStatuses);

  // --- Call History DB ---
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  // --- FaceTime State System ---
  const [activeCall, setActiveCall] = useState<{
    contactId: string;
    type: "voice" | "video";
    direction: "incoming" | "outgoing";
    isConnected: boolean;
  } | null>(null);

  // --- Firebase Session & Firestore Live synchronization ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            const profileData = userSnapshot.data();
            setUserPhoneNumber(profileData.phoneNumber || "");
            setUserProfile({
              name: profileData.name || "Aria Sterling",
              avatar: profileData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
              bio: profileData.bio || "Secure verified companion",
              isOnline: profileData.isOnline !== undefined ? profileData.isOnline : true,
            });
            if (profileData.darkMode !== undefined) setDarkMode(profileData.darkMode);
            if (profileData.activeWallpaper !== undefined) setActiveWallpaper(profileData.activeWallpaper);
            if (profileData.glassOpacity !== undefined) setGlassOpacity(profileData.glassOpacity);
            if (profileData.blurAmount !== undefined) setBlurAmount(profileData.blurAmount);
            if (profileData.activeTheme !== undefined) setActiveTheme(profileData.activeTheme);
            if (profileData.activeFont !== undefined) setActiveFont(profileData.activeFont);
            if (profileData.chatWallpaper !== undefined) setChatWallpaper(profileData.chatWallpaper);
            if (profileData.appIcon !== undefined) setAppIcon(profileData.appIcon);
            setIsLoggedIn(true);
            setSimulatedLog((prev) => ["Cloud Synchronized: User Profile sync session verified.", ...prev]);
          } else {
            // New user login (such as with Google Sign-In)
            const defaultProfile = {
              name: firebaseUser.displayName || "Aria Sterling",
              avatar: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
              bio: firebaseUser.email ? `Secure Verified • ${firebaseUser.email}` : "Secure verified companion",
              isOnline: true,
              darkMode,
              activeWallpaper,
              glassOpacity,
              blurAmount,
              activeTheme,
              activeFont,
              chatWallpaper,
              appIcon,
              phoneNumber: firebaseUser.phoneNumber || "",
              serverTimestamp: new Date().toISOString()
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile({
              name: defaultProfile.name,
              avatar: defaultProfile.avatar,
              bio: defaultProfile.bio,
              isOnline: defaultProfile.isOnline,
            });
            setIsLoggedIn(true);
            setSimulatedLog((prev) => ["Cloud Synchronized: Initialized new user profile via SSO.", ...prev]);
          }
        } catch (err) {
          console.warn("Could not automatically recover the user profile from Firestore:", err);
        }
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for dynamically imported Contacts from Google Workspace
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q = query(
      collection(db, "users", uid, "contacts"),
      orderBy("serverTimestamp", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const gContacts: Contact[] = [];
      snapshot.forEach((docSnap) => {
        gContacts.push(docSnap.data() as Contact);
      });

      // Merge defaults with custom/imported contacts
      setContacts((prev) => {
        const defaults = prev.filter(c => !c.id.startsWith("gcontact-"));
        const combined = [...defaults, ...gContacts];
        const unique = combined.reduce((acc: Contact[], current) => {
          if (!acc.some(item => item.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);
        return unique;
      });
    }, (err) => {
      console.error("Error loading imported contacts:", err);
    });

    return () => unsub();
  }, [isLoggedIn]);

  // Listen for Messages
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const unsubscribes: (() => void)[] = [];

    const contactIds = contacts.map(c => c.id);
    contactIds.forEach((contactId) => {
      const q = query(
        collection(db, "users", uid, "chats", contactId, "messages"),
        orderBy("serverTimestamp", "asc")
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        const chatMsgs: Message[] = [];
        snapshot.forEach((docSnap) => {
          chatMsgs.push(docSnap.data() as Message);
        });
        
        if (chatMsgs.length > 0) {
          setMessages((prev) => ({
            ...prev,
            [contactId]: chatMsgs,
          }));
          
          const lastMsg = chatMsgs[chatMsgs.length - 1];
          if (lastMsg) {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === contactId
                  ? {
                      ...c,
                      lastMessageText: lastMsg.text,
                      lastMessageTime: lastMsg.timestamp,
                    }
                  : c
              )
            );
          }
        } else {
          // Initialize default messages
          const defaults = defaultMessages[contactId] || [];
          defaults.forEach(async (msg, index) => {
            try {
              const msgRef = doc(db, "users", uid, "chats", contactId, "messages", `init-${index}`);
              await setDoc(msgRef, {
                ...msg,
                serverTimestamp: new Date(Date.now() - (4 - index) * 60000).toISOString()
              });
            } catch (e) {
              console.error("Failed to seed initial chat messages:", e);
            }
          });
        }
      }, (err) => {
        console.error(`Error loading messages for ${contactId}:`, err);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isLoggedIn, contacts.length]);

  // Listen for Status stories
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q = query(
      collection(db, "users", uid, "statuses"),
      orderBy("serverTimestamp", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const myStories: StatusStory[] = [];
      snapshot.forEach((docSnap) => {
        myStories.push(docSnap.data() as StatusStory);
      });

      if (myStories.length > 0) {
        setStatuses((prev) => {
          const nonMe = prev.filter((s) => s.contactId !== "me");
          const meStatus: UserStatus = {
            contactId: "me",
            name: "My Status",
            avatar: userProfile.avatar,
            hasUnviewed: false,
            stories: myStories,
          };
          return [meStatus, ...nonMe];
        });
      }
    }, (err) => {
      console.error("Error loading statuses:", err);
    });

    return () => unsub();
  }, [isLoggedIn, userProfile.avatar]);

  // Listen for Call logs
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const q = query(
      collection(db, "users", uid, "callLogs"),
      orderBy("serverTimestamp", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const logs: CallLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as CallLog);
      });

      if (logs.length > 0) {
        setCallLogs(logs);
      } else {
        defaultCallLogs.forEach(async (log, i) => {
          try {
            const logRef = doc(db, "users", uid, "callLogs", `init-log-${i}`);
            await setDoc(logRef, {
              ...log,
              serverTimestamp: new Date(Date.now() - (i + 1) * 3600000).toISOString()
            });
          } catch (e) {
            console.error("Error seeding initial call log:", e);
          }
        });
      }
    }, (err) => {
      console.error("Error loading call logs:", err);
    });

    return () => unsub();
  }, [isLoggedIn]);

  // Seed local states (messages, call logs) if this is a secure offline/fallback local session
  useEffect(() => {
    if (isLoggedIn && !auth.currentUser) {
      setMessages(defaultMessages);
      setCallLogs(defaultCallLogs);
    }
  }, [isLoggedIn]);

  // Standard Phone/OTP Verification triggers Firebase Auth under-the-hood
  const handleLoginSuccess = async (phone: string) => {
    try {
      let uid = "";
      let authenticated = false;
      
      try {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
        authenticated = true;
      } catch (authError: any) {
        console.warn("[Auth Engine]: Sign in anonymously not enabled or restricted. Falling back to secure local-only emulator session.", authError);
      }

      if (authenticated && uid) {
        const userDocRef = doc(db, "users", uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const profileData = userSnapshot.data();
          setUserProfile({
            name: profileData.name || "Aria Sterling",
            avatar: profileData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
            bio: profileData.bio || `Secure Phone Verified • ${phone}`,
            isOnline: profileData.isOnline !== undefined ? profileData.isOnline : true,
          });
          if (profileData.darkMode !== undefined) setDarkMode(profileData.darkMode);
          if (profileData.activeWallpaper !== undefined) setActiveWallpaper(profileData.activeWallpaper);
          if (profileData.glassOpacity !== undefined) setGlassOpacity(profileData.glassOpacity);
          if (profileData.blurAmount !== undefined) setBlurAmount(profileData.blurAmount);
          if (profileData.activeTheme !== undefined) setActiveTheme(profileData.activeTheme);
          if (profileData.activeFont !== undefined) setActiveFont(profileData.activeFont);
          if (profileData.chatWallpaper !== undefined) setChatWallpaper(profileData.chatWallpaper);
          if (profileData.appIcon !== undefined) setAppIcon(profileData.appIcon);
        } else {
          const defaultProfile = {
            name: "Aria Sterling",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
            bio: `Secure Phone Verified • ${phone}`,
            isOnline: true,
            darkMode,
            activeWallpaper,
            glassOpacity,
            blurAmount,
            activeTheme,
            activeFont,
            chatWallpaper,
            appIcon,
            phoneNumber: phone,
            serverTimestamp: new Date().toISOString()
          };
          await setDoc(userDocRef, defaultProfile);
          setUserProfile({
            name: defaultProfile.name,
            avatar: defaultProfile.avatar,
            bio: defaultProfile.bio,
            isOnline: defaultProfile.isOnline,
          });
        }
      } else {
        // Safe, stable simulated offline local user profile
        setUserProfile({
          name: "Aria Sterling",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
          bio: `Secure Phone Verified • ${phone}`,
          isOnline: true,
        });
      }

      setUserPhoneNumber(phone);
      setIsLoggedIn(true);
      setSimulatedLog((prev) => [`[Auth Engine]: Phone login success for ${phone} (${authenticated ? "Cloud Synchronized" : "Local Verified"})`, ...prev]);
    } catch (err) {
      // If we got here, a real firestore write or essential setup failed
      handleFirestoreError(err, OperationType.WRITE, `users`);
    }
  };


  // --- Automation chatbot states ---
  const [botTypingId, setBotTypingId] = useState<string | null>(null);

  // Clear unread counts upon opening chat
  useEffect(() => {
    if (selectedContactId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === selectedContactId ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [selectedContactId]);

  // Handle incoming bot automatic messaging responses
  const triggerAutomatedReply = (contactId: string, userMessageText: string) => {
    const uid = auth.currentUser?.uid;
    
    // Show typing dots delay
    setBotTypingId(contactId);
    
    // Status text to show online indicator sequence
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, status: "online", statusText: "typing..." } : c))
    );

    // Fetch response from server /api/chat Gemini Node, or beautiful realistic mock fallback
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessageText,
        history: (messages[contactId] || []).map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Wait at least 1.5 seconds for premium realism and fluid human-like tempo
        setTimeout(async () => {
          const receivedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const textReply = data.text || "Perfectly delivered inside our secure channel! 💬";
          const msgId = `msg-bot-${Date.now()}`;

          const newMsg: Message = {
            id: msgId,
            sender: "contact",
            text: textReply,
            timestamp: receivedTime,
          };

          if (uid) {
            try {
              const msgRef = doc(db, "users", uid, "chats", contactId, "messages", msgId);
              await setDoc(msgRef, {
                ...newMsg,
                serverTimestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error("Firestore bot write error:", err);
            }
          } else {
            setMessages((prev) => ({
              ...prev,
              [contactId]: [...(prev[contactId] || []), newMsg],
            }));
          }

          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId
                ? {
                    ...c,
                    statusText: "online",
                    lastMessageText: textReply.length > 36 ? textReply.slice(0, 36) + "..." : textReply,
                    lastMessageTime: receivedTime,
                  }
                : c
            )
          );

          sounds.playChime();
          setBotTypingId(null);
        }, 1500);
      })
      .catch((err) => {
        console.warn("AI routing fallback to local simulator:", err);
        // Fallback witticism replies
        setTimeout(async () => {
          const replies = [
            "🌸 I completely agree! Let me review this with our glass widget engineers.",
            "🔒 Standard double ratchets and end-to-end encryptions are fully locked in place.",
            "✨ Stunning! The glowing neon pink accent colors really match your vibe.",
            "💬 Would you like me to dial a FaceTime voice call or secure audio sync?",
          ];
          const chosen = replies[Math.floor(Math.random() * replies.length)];
          const receivedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const msgId = `msg-bot-${Date.now()}`;

          const newMsg: Message = {
            id: msgId,
            sender: "contact",
            text: chosen,
            timestamp: receivedTime,
          };

          if (uid) {
            try {
              const msgRef = doc(db, "users", uid, "chats", contactId, "messages", msgId);
              await setDoc(msgRef, {
                ...newMsg,
                serverTimestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error("Firestore bot write error:", err);
            }
          } else {
            setMessages((prev) => ({
              ...prev,
              [contactId]: [...(prev[contactId] || []), newMsg],
            }));
          }

          setContacts((prev) =>
            prev.map((c) =>
              c.id === contactId
                ? {
                    ...c,
                    statusText: "online",
                    lastMessageText: chosen,
                    lastMessageTime: receivedTime,
                  }
                : c
            )
          );

          sounds.playChime();
          setBotTypingId(null);
        }, 1500);
      });
  };

  // --- Handlers from App children ---
  const handleImportContact = async (gContact: any) => {
    const contactId = `gcontact-${Date.now()}`;
    
    const newContact: Contact = {
      id: contactId,
      name: gContact.name,
      avatar: gContact.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      status: "online",
      statusText: "online",
      unreadCount: 0,
      lastMessageText: gContact.email ? `Email: ${gContact.email}` : "Imported Contact",
      lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        await setDoc(doc(db, "users", uid, "contacts", contactId), {
          ...newContact,
          serverTimestamp: new Date().toISOString()
        });
        sounds.playChime();
        setSimulatedLog((prev) => [`[Workspace]: Imported Google Contact "${gContact.name}" successfully!`, ...prev]);
      } catch (err) {
        console.error("Firestore import contact error:", err);
      }
    } else {
      setContacts((prev) => [...prev, newContact]);
      sounds.playChime();
      setSimulatedLog((prev) => [`[Workspace]: Imported Google Contact "${gContact.name}" successfully to local list!`, ...prev]);
    }
  };

  const handleSendMessage = async (
    text: string,
    replyToText?: string | null,
    attachmentType?: "photo" | "doc" | "location" | "gdrive",
    gdriveMetaData?: { name: string; url: string; size?: string; mimeType: string }
  ) => {
    if (!selectedContactId) return;

    sounds.playMessageSent();
    const sendTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msgId = `msg-user-${Date.now()}`;
    
    // Create new message object
    const newMsg: Message = {
      id: msgId,
      sender: "user",
      text,
      timestamp: sendTime,
      replyTo: replyToText || undefined,
      attachmentType: attachmentType || undefined,
      gdriveFileName: gdriveMetaData?.name,
      gdriveFileUrl: gdriveMetaData?.url,
      gdriveFileSize: gdriveMetaData?.size,
      gdriveMimeType: gdriveMetaData?.mimeType,
    };

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const msgRef = doc(db, "users", uid, "chats", selectedContactId, "messages", msgId);
        await setDoc(msgRef, {
          ...newMsg,
          serverTimestamp: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/chats/${selectedContactId}/messages/${msgId}`);
      }
    } else {
      setMessages((prev) => ({
        ...prev,
        [selectedContactId]: [...(prev[selectedContactId] || []), newMsg],
      }));

      // Update contacts list item meta description
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContactId
            ? {
                ...c,
                lastMessageText: text,
                lastMessageTime: sendTime,
              }
            : c
        )
      );
    }

    // Auto chatbot answer loop
    triggerAutomatedReply(selectedContactId, text);
  };

  // Add personal status
  const handleAddStatus = async (newStory: Omit<StatusStory, "id" | "timestamp">) => {
    const timeStr = "Just now";
    const storyId = `my-st-${Date.now()}`;
    
    const storyItem: StatusStory = {
      ...newStory,
      id: storyId,
      timestamp: timeStr,
    };

    sounds.playChime();

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        const storyRef = doc(db, "users", uid, "statuses", storyId);
        await setDoc(storyRef, {
          ...storyItem,
          serverTimestamp: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/statuses/${storyId}`);
      }
    } else {
      setStatuses((prev) => {
        const nonMe = prev.filter((s) => s.contactId !== "me");
        const currentMe = prev.find((s) => s.contactId === "me");
        const existingStories = currentMe?.stories || [];
        const meStatus: UserStatus = {
          contactId: "me",
          name: "My Status",
          avatar: userProfile.avatar,
          hasUnviewed: false,
          stories: [...existingStories, storyItem],
        };
        return [meStatus, ...nonMe];
      });
    }
  };

  const handleInitiateCall = (contactId: string, type: "voice" | "video") => {
    sounds.playClick();
    sounds.startRingtone();
    setActiveCall({
      contactId,
      type,
      direction: "outgoing",
      isConnected: false,
    });

    // Simulate connection pick up after 3 seconds
    setTimeout(() => {
      sounds.stopRingtone();
      sounds.playChime();
      setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));

      // Append call log
      const pickContact = contacts.find((c) => c.id === contactId);
      const logId = `cl-log-${Date.now()}`;
      const newLog: CallLog = {
        id: logId,
        contactId,
        name: pickContact ? pickContact.name : "Secure Contact",
        avatar: pickContact ? pickContact.avatar : userProfile.avatar,
        type,
        direction: "outgoing",
        timestamp: "Just now",
      };
      
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        setDoc(doc(db, "users", uid, "callLogs", logId), {
          ...newLog,
          serverTimestamp: new Date().toISOString()
        }).catch(err => console.error("Error saving call log:", err));
      }
    }, 2800);
  };

  const handleEndCall = () => {
    sounds.stopRingtone();
    sounds.playClick();
    setActiveCall(null);
  };

  const handlePINSubmit = () => {
    if (pinInput === "1234") {
      sounds.playChime();
      setIsLocked(false);
      setPinInput("");
      setPinError(false);
    } else {
      sounds.playClick();
      setPinError(true);
      setPinInput("");
    }
  };

  // Wallpaper backgrounds selection map
  const bgClasses: Record<string, string> = {
    sakura: "from-[#ffe4e9] via-[#ffffff] to-[#ffdae3]",
    sunset: "from-[#ffd8be] via-[#fff4ec] to-[#ffafb0]",
    midnight: "from-[#0d0711] via-[#1a0f25] to-[#04010a]",
    quartz: "from-[#e2e8f0] via-[#ffffff] to-[#ffdae3]",
  };

  const wallpaperClass = bgClasses[activeWallpaper] || bgClasses.sakura;

  return (
    <div 
      className={`relative min-h-screen flex flex-col lg:flex-row items-center justify-center p-3 md:p-8 lg:space-x-8 gap-6 transition-all bg-gradient-to-tr ${wallpaperClass}`}
      id="securechat-global-root"
    >
      {/* Decorative ambient blurred layout bubbles strictly behind glass interface */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-96 rounded-full bg-rose-300/15 blur-3xl pointer-events-none" />

      {/* --- Dynamic Desktop/Web Environment Simulator Control Dashboard --- */}
      <div 
        className="w-full max-w-sm lg:h-[880px] bg-white/40 border border-white/20 rounded-[32px] p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md" 
        id="emulator-control-panel animate-fade-in"
      >
        <div className="space-y-5">
          <div className="flex items-center space-x-2 text-pink-600">
            <Layers size={18} className="animate-pulse" />
            <span className="text-3xs uppercase font-mono tracking-widest font-extrabold text-pink-500">Dual-Platform Core</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-stone-800 tracking-tight leading-none mb-1 text-left">
              SecureChat Emulator
            </h1>
            <p className="text-3xs text-stone-500 font-medium text-left">
              Simulate and test native application runtimes across iOS and Android ecosystems seamlessly.
            </p>
          </div>

          {/* Active Platform Selector Toggle */}
          <div className="p-4 rounded-2xl bg-white/55 border border-pink-500/5 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider block text-left">CHOOSE DEVICE SKIN</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  setActivePlatform("ios");
                  setSimulatedLog(prev => ["[Native Runtime]: Target: Apple iOS 26 frame activated.", ...prev]);
                }}
                className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  activePlatform === "ios"
                    ? "bg-stone-900 border-stone-800 text-white shadow-md shadow-stone-900/15 scale-[1.02]"
                    : "bg-white/40 border-stone-200/50 text-stone-600 hover:bg-white"
                }`}
              >
                <span className="text-pink-500 text-xs mb-1">🍎</span>
                <span>Apple iOS</span>
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  setActivePlatform("android");
                  setSimulatedLog(prev => ["[Native Runtime]: Target: Google Android 16 frame activated.", ...prev]);
                }}
                className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  activePlatform === "android"
                    ? "bg-stone-900 border-stone-800 text-white shadow-md shadow-stone-900/15 scale-[1.02]"
                    : "bg-white/40 border-stone-200/50 text-stone-600 hover:bg-white"
                }`}
              >
                <span className="text-emerald-500 text-xs mb-1">🤖</span>
                <span>Andriod OS</span>
              </button>
            </div>
          </div>

          {/* Interactive Trigger Events Sandbox */}
          <div className="p-4 rounded-2xl bg-white/55 border border-pink-500/5 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider block text-left">SIMULATE MOBILE HANDLERS</span>
            <div className="space-y-2">
              <button
                onClick={handleTriggerSimulatedNotification}
                className="w-full py-2.5 px-3.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/15 active:scale-[0.99] transition-all text-pink-600 font-bold text-[11px] text-left flex items-center justify-between"
              >
                <span className="flex items-center space-x-1.5">
                  <span>🔔</span>
                  <span>Inject Push Notification</span>
                </span>
                <span className="text-[8px] font-mono bg-pink-500/10 text-pink-600 px-1.5 py-0.5 rounded font-extrabold uppercase">FIRE</span>
              </button>
              <button
                onClick={handleTriggerSimulatedIncomingCall}
                className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.99] transition-all text-emerald-600 font-bold text-[11px] text-left flex items-center justify-between"
              >
                <span className="flex items-center space-x-1.5">
                  <span>📞</span>
                  <span>Simulate FaceTime Call</span>
                </span>
                <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-extrabold uppercase">DIAL</span>
              </button>
            </div>
          </div>

          {/* Real-time Crypto and Platform Engine Log */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider block text-left">ENGINE SYNC TERMINAL</span>
            <div className="bg-stone-900/90 text-[10px] font-mono p-3.5 rounded-2xl h-36 overflow-y-auto text-left space-y-1.5 border border-stone-800 text-stone-300 shadow-inner">
              <div className="text-stone-500 text-[9px] mb-1">Target Engine: {activePlatform === "ios" ? "Flutter iOS Core" : "Flutter Android JVM"}</div>
              {simulatedLog.map((log, i) => (
                <div key={i} className="leading-tight">
                  <span className="text-pink-400 mr-1.5">➜</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security indicator */}
        <div className="mt-4 pt-3 border-t border-stone-200/50 flex justify-between items-center text-stone-400 text-3xs font-mono">
          <span className="uppercase font-bold tracking-wider text-pink-500">Cross-Platform Sync</span>
          <span>100% Secure</span>
        </div>
      </div>

      {/* Dynamic styling override block mapping UI customization preferences */}
      <style>{`
        :root {
          --color-accent: ${currentAccent.hex};
          --color-accent-hover: ${currentAccent.hoverHex};
          --color-accent-light: ${currentAccent.lightHex};
          --color-accent-light-hover: ${currentAccent.lightHoverHex};
          --color-accent-text-light: ${currentAccent.textLight};
          --color-accent-shadow: ${currentAccent.shadow};
        }
      `}</style>

      {/* Main realistic phone dimensions viewport container framing the entire structure */}
      <div 
        className={`w-full max-w-md h-[95vh] md:h-[880px] flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 ${
          activePlatform === "ios" 
            ? "rounded-[44px] border-[6px] border-stone-900/95" 
            : "rounded-[32px] border-[5px] border-stone-850/95"
        } ${
          darkMode 
            ? "bg-stone-950/75 border-stone-800/80" 
            : "bg-white/45 border-stone-200/40"
        }`}
        style={{ 
          backdropFilter: `blur(${blurAmount}px)`, 
          WebkitBackdropFilter: `blur(${blurAmount}px)`,
          fontFamily: fontStyles[activeFont] || "'Inter', sans-serif"
        }}
        id="device-viewport-frame"
      >
        {/* Dynamic Notch / Hardware slots at the top */}
        {activePlatform === "ios" ? (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-28 bg-black rounded-full z-30 flex items-center justify-between px-3.5 select-none" id="hardware-island">
            <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        ) : (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 h-3.5 w-3.5 bg-black rounded-full z-30" id="hardware-punchhole" />
        )}

        {/* Dynamic Mobile Status Bar (iOS / Android Adaptive) */}
        {activePlatform === "ios" ? (
          <div className="h-6 px-6 pt-1.5 flex justify-between items-center text-stone-600 dark:text-stone-400 font-sans text-xs font-semibold select-none z-10" id="ios-device-header">
            <span className="text-[10px] font-bold">9:41</span>
            <div className="flex items-center space-x-1.5">
              {/* Cellular Signal Icons */}
              <div className="flex items-end space-x-0.5 h-2">
                <div className="w-0.5 h-1 bg-current rounded-full" />
                <div className="w-0.5 h-1.5 bg-current rounded-full" />
                <div className="w-0.5 h-2 bg-current rounded-full" />
                <div className="w-0.5 h-2.5 bg-current rounded-full" />
              </div>
              <span className="text-[9px] font-mono font-bold">5G</span>
              {/* Battery */}
              <div className="w-5 h-2.5 rounded-sm border border-stone-600/60 dark:border-stone-400/60 p-0.5 flex items-center">
                <div className="h-full w-full bg-emerald-500 rounded-2xs" />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-6 px-6 pt-1.5 flex justify-between items-center text-stone-600 dark:text-stone-400 font-sans text-xs font-semibold select-none z-10" id="android-device-header">
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-bold">10:42 AM</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px]">📶 WiFi</span>
              <span className="text-[9px] font-bold">98%</span>
              <div className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
            </div>
          </div>
        )}

        {/* In-App Sliding Simulated Push Notification Banner */}
        <AnimatePresence>
          {lastNotification && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 12, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              onClick={() => {
                sounds.playPop();
                setLastNotification(null);
                const contactId = lastNotification.sender.toLowerCase().includes("sophie")
                  ? "sophie"
                  : lastNotification.sender.toLowerCase().includes("marcus")
                  ? "marcus"
                  : "jean";
                setSelectedContactId(contactId);
              }}
              className="absolute left-4 right-4 top-13 z-40 p-3 bg-stone-950/95 text-white rounded-[20px] flex items-center space-x-3 shadow-xl border border-white/10 cursor-pointer backdrop-blur-md"
              id="mock-notification-banner animate-slide-down"
            >
              <div className="w-8 h-8 rounded-full accent-bg-light accent-text flex items-center justify-center shrink-0 font-bold border accent-border-light">
                💬
              </div>
              <div className="text-left flex-1 min-w-0">
                <h5 className="text-[10px] font-bold flex items-center justify-between accent-text leading-tight">
                  <span>{lastNotification.sender}</span>
                  <span className="text-[8px] text-stone-400 font-mono">JUST NOW</span>
                </h5>
                <p className="text-4xs text-stone-200 truncate font-semibold leading-none mt-1">
                  {lastNotification.text}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- MAIN ROUTER CHANGER WINDOW --- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-8" id="scene-body-container">
          <AnimatePresence mode="wait">
            {!isLoggedIn ? (
              /* High fidelity Phone Login Screen */
              <motion.div
                key="login-screen-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 z-50 bg-transparent flex flex-col justify-between overflow-hidden"
              >
                <LoginScreen
                  darkMode={darkMode}
                  currentAccent={currentAccent}
                  onLoginSuccess={handleLoginSuccess}
                />
              </motion.div>
            ) : isLocked ? (
              /* High fidelity secure Passcode lock screen overlay */
              <motion.div
                key="locked-pin-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#fbf3f5]/95 backdrop-blur-2xl flex flex-col justify-between p-8 text-stone-800 text-center"
              >
                <div className="pt-16 flex flex-col items-center">
                  <div className="p-4 rounded-full accent-bg-light accent-text mb-4 animate-bounce">
                    <Lock size={28} />
                  </div>
                  <h2 className="text-lg font-bold font-sans tracking-tight">Console Locked</h2>
                  <p className="text-[11px] text-stone-400 mt-1">Enter your SecureChat PIN authorization</p>
                </div>

                {/* Dial pad keys */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex justify-center space-x-2.5 mb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full border accent-border-light transition-all ${
                          pinInput.length > i ? "accent-bg scale-110" : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>

                  {pinError && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-shake">
                      INCORRECT PIN - RETRY
                    </span>
                  )}

                  <div className="grid grid-cols-3 gap-4 max-w-[210px]">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          sounds.playPop();
                          if (key === "C") {
                            setPinInput("");
                            setPinError(false);
                          } else if (key === "OK") {
                            handlePINSubmit();
                          } else {
                            if (pinInput.length < 4) {
                              setPinInput((prev) => prev + key);
                            }
                          }
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm bg-white/60 hover:bg-white border select-none transition-transform active:scale-90 ${
                          key === "OK" ? "text-emerald-600 font-extrabold text-[11px]" : "text-stone-700"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pb-8 text-[10px] font-mono text-stone-400">
                  <span>Default developer PIN: </span>
                  <span className="font-bold accent-text">1234</span>
                </div>
              </motion.div>
            ) : selectedContactId ? (
              /* Slid-in Dedicated active conversation window */
              <motion.div
                key="chat-window-view"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                className="absolute inset-0 z-20 bg-transparent flex flex-col overflow-hidden"
              >
                {(() => {
                  const targetContact = contacts.find((c) => c.id === selectedContactId);
                  if (!targetContact) return null;

                  return (
                    <ChatWindow
                      darkMode={darkMode}
                      selectedContact={targetContact}
                      messages={messages[selectedContactId] || []}
                      isTyping={botTypingId === selectedContactId}
                      onBack={() => {
                        sounds.playClick();
                        setSelectedContactId(null);
                      }}
                      onSendMessage={handleSendMessage}
                      onInitiateCall={(type) => handleInitiateCall(selectedContactId, type)}
                      chatWallpaper={chatWallpaper}
                    />
                  );
                })()}
              </motion.div>
            ) : (
              /* Bottom Tabs Panels layout switcher */
              <motion.div
                key="tabs-container-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {activeTab === "chats" && (
                  <HomeScreen
                    darkMode={darkMode}
                    contacts={contacts}
                    onSelectContact={(id) => {
                      setSelectedContactId(id);
                    }}
                    onOpenNewChat={() => {
                      sounds.playChime();
                      setSelectedContactId(contacts[0]?.id || null);
                    }}
                  />
                )}

                {activeTab === "status" && (
                  <StatusSection
                    darkMode={darkMode}
                    userProfile={userProfile}
                    statuses={statuses}
                    onAddStatus={handleAddStatus}
                  />
                )}

                {activeTab === "calls" && (
                  <CallsSection
                    darkMode={darkMode}
                    contacts={contacts}
                    callLogs={callLogs}
                    activeCall={activeCall}
                    onInitiateCall={handleInitiateCall}
                    onEndCall={handleEndCall}
                    onAcceptIncomingCall={() => {
                      sounds.stopRingtone();
                      sounds.playChime();
                      setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
                    }}
                  />
                )}

                {activeTab === "settings" && (
                  <SettingsSection
                    darkMode={darkMode}
                    userProfile={userProfile}
                    onImportContact={handleImportContact}
                    onUpdateProfile={async (name, avatar, bio, isOnline) => {
                      setUserProfile({ name, avatar, bio, isOnline });
                      if (auth.currentUser) {
                        try {
                          await updateDoc(doc(db, "users", auth.currentUser.uid), {
                            name, avatar, bio, isOnline
                          });
                        } catch (err) {
                          console.error("Firestore write profile error:", err);
                        }
                      }
                    }}
                    onLogout={async () => {
                      sounds.playClick();
                      await signOut(auth);
                      setIsLoggedIn(false);
                      setIsLocked(false);
                    }}
                    themePref={{
                      isDark: darkMode,
                      activeWallpaper,
                      glassOpacity,
                      blurAmount,
                      activeTheme,
                      activeFont,
                      chatWallpaper,
                      appIcon,
                    }}
                    onUpdateTheme={async (updates) => {
                      if (updates.isDark !== undefined) setDarkMode(updates.isDark);
                      if (updates.activeWallpaper !== undefined) setActiveWallpaper(updates.activeWallpaper);
                      if (updates.glassOpacity !== undefined) setGlassOpacity(updates.glassOpacity);
                      if (updates.blurAmount !== undefined) setBlurAmount(updates.blurAmount);
                      if (updates.activeTheme !== undefined) setActiveTheme(updates.activeTheme);
                      if (updates.activeFont !== undefined) setActiveFont(updates.activeFont);
                      if (updates.chatWallpaper !== undefined) setChatWallpaper(updates.chatWallpaper);
                      if (updates.appIcon !== undefined) setAppIcon(updates.appIcon);

                      if (auth.currentUser) {
                        try {
                          await updateDoc(doc(db, "users", auth.currentUser.uid), {
                            darkMode: updates.isDark !== undefined ? updates.isDark : darkMode,
                            activeWallpaper: updates.activeWallpaper !== undefined ? updates.activeWallpaper : activeWallpaper,
                            glassOpacity: updates.glassOpacity !== undefined ? updates.glassOpacity : glassOpacity,
                            blurAmount: updates.blurAmount !== undefined ? updates.blurAmount : blurAmount,
                            activeTheme: updates.activeTheme !== undefined ? updates.activeTheme : activeTheme,
                            activeFont: updates.activeFont !== undefined ? updates.activeFont : activeFont,
                            chatWallpaper: updates.chatWallpaper !== undefined ? updates.chatWallpaper : chatWallpaper,
                            appIcon: updates.appIcon !== undefined ? updates.appIcon : appIcon,
                          });
                        } catch (err) {
                          console.error("Firestore write theme error:", err);
                        }
                      }
                    }}
                  />
                )}

                {/* Persistent Tab bar switcher at the bottom styled like native iOS WhatsApp */}
                <div 
                   className="absolute bottom-0 inset-x-0 h-18 bg-white/45 border-t accent-border-light flex justify-around items-center px-4.5 pb-2.5 z-10" id="whatsapp-persistent-tabbar"
                >
                  {[
                    { id: "chats", label: "Chats", count: contacts.reduce((acc, current) => acc + current.unreadCount, 0) },
                    { id: "status", label: "Updates", count: statuses.filter((s) => s.hasUnviewed).length },
                    { id: "calls", label: "Calls", count: 0 },
                    { id: "settings", label: "Settings", count: 0 },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          sounds.playPop();
                          setActiveTab(tab.id as any);
                        }}
                        className={`flex flex-col items-center space-y-1 relative group w-16 active:scale-95 transition-transform ${
                          isActive ? "accent-text scale-102" : "text-stone-400"
                        }`}
                      >
                        {/* Dynamic unread notifications badge counts */}
                        {tab.count > 0 && (
                          <span className="absolute top-0 right-3.5 min-w-[15px] h-[15px] px-1 accent-bg text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white">
                            {tab.count}
                          </span>
                        )}

                        <span className={`text-[10px] uppercase font-mono tracking-widest font-extrabold ${isActive ? "accent-text" : "text-stone-500/35 group-hover:text-stone-600"}`}>
                          {tab.label}
                        </span>
                        
                        <div 
                          className={`h-0.5 w-4.5 rounded-full transition-all duration-300 ${
                            isActive ? "accent-bg scale-x-100" : "bg-transparent scale-x-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Unified System Softkeys & Home Indicator Bottom Rows --- */}
        {activePlatform === "ios" ? (
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-25 pointer-events-none" id="ios-homeindicator">
            <div className="w-32 h-1 bg-stone-400/40 rounded-full" />
          </div>
        ) : (
          <div className="absolute bottom-0 inset-x-0 h-8 bg-black/5 hover:bg-black/10 flex justify-center items-center space-x-14 z-25 text-stone-500/80 font-mono select-none border-t border-black/5" id="android-softkeys">
            <button 
              onClick={() => {
                sounds.playPop();
                if (selectedContactId) {
                  setSelectedContactId(null);
                  setSimulatedLog(prev => ["[Android System]: Traversed back to threads list.", ...prev]);
                } else if (activeTab !== "chats") {
                  setActiveTab("chats");
                  setSimulatedLog(prev => ["[Android System]: Navigated back to Chats tab.", ...prev]);
                }
              }} 
              className="hover:text-pink-500 active:scale-90 text-[12px] px-3.5 py-1" 
              title="Back"
            >
              ◀
            </button>
            <button 
              onClick={() => {
                sounds.playPop();
                setSelectedContactId(null);
                setActiveTab("chats");
                setSimulatedLog(prev => ["[Android System]: Returned to main home view.", ...prev]);
              }} 
              className="hover:text-pink-500 active:scale-95 text-[13px] px-3.5" 
              title="Home"
            >
              ●
            </button>
            <button 
              onClick={() => {
                sounds.playPop();
                setIsLocked(true);
                setSimulatedLog(prev => ["[Android System]: System locked with Secure Passcode PIN.", ...prev]);
              }} 
              className="hover:text-pink-500 active:scale-90 text-[11px] px-3.5 py-1" 
              title="Multitask / Secure Lock"
            >
              ■
            </button>
          </div>
        )}
      </div>

      {/* --- Full Call FaceTime Overlay portal directly wired outside tabs to display on top of everything --- */}
      {activeCall && (
        <CallsSection
          darkMode={darkMode}
          contacts={contacts}
          callLogs={callLogs}
          activeCall={activeCall}
          onInitiateCall={handleInitiateCall}
          onEndCall={handleEndCall}
          onAcceptIncomingCall={() => {
            sounds.stopRingtone();
            sounds.playChime();
            setActiveCall((prev) => (prev ? { ...prev, isConnected: true } : null));
          }}
        />
      )}
    </div>
  );
}
