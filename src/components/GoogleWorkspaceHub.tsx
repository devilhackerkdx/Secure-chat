import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, HardDrive, Search, LogOut, ExternalLink, FileText, Loader2, Plus, ArrowLeft, RefreshCw, AlertCircle, RefreshCcw
} from "lucide-react";
import { 
  googleSignIn, 
  getAccessToken, 
  clearAccessToken, 
  fetchGoogleDriveFiles, 
  fetchGoogleContacts, 
  GoogleDriveFile, 
  GoogleContact 
} from "../lib/googleAuth.ts";
import { sounds } from "./SoundManager";

interface GoogleWorkspaceHubProps {
  darkMode: boolean;
  onImportContact: (contact: GoogleContact) => void;
  onSelectDriveFile?: (file: GoogleDriveFile) => void;
  isInsideChatSelection?: boolean;
}

export default function GoogleWorkspaceHub({
  darkMode,
  onImportContact,
  onSelectDriveFile,
  isInsideChatSelection = false,
}: GoogleWorkspaceHubProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [activeTab, setActiveTab] = useState<"drive" | "contacts">("drive");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Data lists
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const handleGoogleLogin = async () => {
    sounds.playClick();
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        sounds.playChime();
        // Load default tab
        if (activeTab === "drive") {
          loadDriveFiles();
        } else {
          loadContacts();
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Sign-in failed. Please verify configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sounds.playClick();
    clearAccessToken();
    setToken(null);
    setDriveFiles([]);
    setContacts([]);
  };

  const loadDriveFiles = async (queryStr = "") => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const files = await fetchGoogleDriveFiles(queryStr);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load Google Drive files.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const gContacts = await fetchGoogleContacts();
      setContacts(gContacts);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load Google Contacts.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync tab loading
  useEffect(() => {
    if (token) {
      if (activeTab === "drive") {
        loadDriveFiles(searchQuery);
      } else {
        loadContacts();
      }
    }
  }, [token, activeTab]);

  // Search handle
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token && activeTab === "drive") {
      loadDriveFiles(searchQuery);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" id="google-hub-root">
      
      {!token ? (
        /* Sign-in Promotion view */
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6" id="google-promo-frame">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-md">
            <HardDrive size={32} className="stroke-[1.5]" />
          </div>
          
          <div className="space-y-2 text-center max-w-xs">
            <h3 className={`text-base font-bold font-sans tracking-tight ${darkMode ? "text-white" : "text-stone-800"}`}>
              Connect Google Workspace
            </h3>
            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
              Access your Google Drive files and view your Contacts directly within SecureChat to share documents and import people instantly.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="gsi-material-button font-sans font-bold text-xs select-none shadow-sm cursor-pointer hover:shadow hover:bg-stone-50 active:scale-[0.98] transition-all bg-white border border-stone-200 text-stone-700 px-5 py-3 rounded-2xl flex items-center space-x-3"
            id="gsi-login-button"
            style={{ minHeight: "44px" }}
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-pink-500" size={18} />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "18px", height: "18px" }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span className="text-3xs tracking-wide uppercase">Sign in with Google</span>
          </button>

          {errorMsg && (
            <div className="flex items-center space-x-2 text-rose-500 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
              <AlertCircle size={12} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        /* Workspace Active view */
        <div className="flex-1 flex flex-col h-full overflow-hidden text-left" id="google-hub-panel">
          
          {/* Header section with logout and refresh status */}
          <div className="p-4 bg-white/30 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[10px] font-mono font-bold uppercase ${darkMode ? "text-stone-300" : "text-stone-650"}`}>
                WORKSPACE DIRECT LINK
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="py-1.5 px-3.5 rounded-full hover:bg-rose-500/10 text-rose-500 text-[10px] font-bold flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <LogOut size={12} />
              <span>DISCONNECT</span>
            </button>
          </div>

          {/* Tab Selector Buttons */}
          <div className="p-3 grid grid-cols-2 gap-2 text-xs font-bold border-b border-white/15 bg-white/20 shrink-0">
            <button
              onClick={() => { sounds.playPop(); setActiveTab("drive"); setSearchQuery(""); }}
              className={`py-2 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeTab === "drive" 
                  ? "bg-stone-900 text-white shadow" 
                  : "bg-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              <HardDrive size={13} />
              <span>Google Drive</span>
            </button>
            <button
              onClick={() => { sounds.playPop(); setActiveTab("contacts"); setSearchQuery(""); }}
              className={`py-2 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                activeTab === "contacts" 
                  ? "bg-stone-900 text-white shadow" 
                  : "bg-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              <Users size={13} />
              <span>Google Contacts</span>
            </button>
          </div>

          {/* Search bar layout */}
          <form onSubmit={handleSearchSubmit} className="p-3 border-b border-white/10 shrink-0 flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={13} />
              <input
                type="text"
                placeholder={activeTab === "drive" ? "Search active folder files..." : "Filter your contacts..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === "contacts") {
                    // local filter done in real time
                  }
                }}
                className="w-full py-2.5 pl-10 pr-4 text-[11px] rounded-xl outline-none border transition-all text-stone-800 border-white/20 bg-white/45 placeholder-stone-400"
              />
            </div>
            {activeTab === "drive" && (
              <button
                type="submit"
                disabled={isLoading}
                className="px-3.5 bg-stone-900 text-white rounded-xl text-3xs font-bold font-mono tracking-wider active:scale-95 duration-100"
              >
                FIND
              </button>
            )}
          </form>

          {/* Interactive display list container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" id="google-hub-scroller">
            {isLoading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="animate-spin text-pink-500 mx-auto" size={24} />
                <span className="text-4xs font-mono font-bold text-stone-400 uppercase tracking-widest block">FETCHING INSTANT DIRECTORIES...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 text-center space-y-2">
                <AlertCircle size={20} className="mx-auto text-orange-500" />
                <p className="text-[10px] font-bold">{errorMsg}</p>
                <button
                  onClick={() => activeTab === "drive" ? loadDriveFiles(searchQuery) : loadContacts()}
                  className="px-4 py-1.5 bg-orange-600 text-white rounded-full text-4xs font-bold uppercase inline-flex items-center space-x-1"
                >
                  <RefreshCcw size={10} />
                  <span>Retry Fetch</span>
                </button>
              </div>
            ) : activeTab === "drive" ? (
              /* Google Drive list mapping */
              <div className="space-y-2">
                {driveFiles.length === 0 ? (
                  <div className="py-12 text-center text-4xs font-mono text-stone-400 uppercase tracking-wider">
                    Empty folder or no search results.
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl bg-white/45 border border-white/20 hover:bg-white/65 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                        {file.thumbnailLink ? (
                          <img 
                            src={file.thumbnailLink} 
                            alt={file.name} 
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 text-xs">
                            📄
                          </div>
                        )}
                        <div className="truncate text-left flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold text-stone-800 dark:text-stone-100 truncate leading-tight">
                            {file.name}
                          </h4>
                          <p className="text-[9px] text-stone-500 mt-0.5 truncate uppercase font-mono">
                            {file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : "Document"} • {file.mimeType.split(".").pop()?.split("/").pop()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {onSelectDriveFile && (
                          <button
                            onClick={() => { sounds.playChime(); onSelectDriveFile(file); }}
                            className="p-1 px-3 text-[9px] font-mono font-bold bg-pink-500 text-white rounded-lg active:scale-95 shadow shadow-pink-500/10 uppercase"
                            title="Insert into chat"
                          >
                            SELECT
                          </button>
                        )}
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="p-2 rounded-full hover:bg-stone-200/50 text-stone-500 hover:text-stone-700"
                          title="Open on Web"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Google Contacts list mapping */
              <div className="space-y-2">
                {filteredContacts.length === 0 ? (
                  <div className="py-12 text-center text-4xs font-mono text-stone-400 uppercase tracking-wider">
                    No contacts found in contacts database.
                  </div>
                ) : (
                  filteredContacts.map((contact, index) => (
                    <div
                      key={contact.resourceName || index}
                      className="p-3 rounded-2xl bg-white/45 border border-white/20 hover:bg-white/65 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {contact.photoUrl ? (
                          <img 
                            src={contact.photoUrl} 
                            alt={contact.name} 
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-white shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 font-bold flex items-center justify-center shrink-0 text-sm border border-white">
                            {contact.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate text-left flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold text-stone-800 dark:text-stone-100 truncate leading-tight">
                            {contact.name}
                          </h4>
                          {contact.email && (
                            <p className="text-[9px] text-stone-400 truncate mt-0.5">{contact.email}</p>
                          )}
                          {contact.phone && (
                            <p className="text-4xs text-stone-500 truncate mt-0.5 font-mono">{contact.phone}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => { sounds.playChime(); onImportContact(contact); }}
                        className="py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[9px] font-bold tracking-wider active:scale-95 inline-flex items-center space-x-1 shadow uppercase"
                      >
                        <Plus size={10} />
                        <span>IMPORT</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-stone-50/10 text-center font-mono text-4xs text-stone-400 border-t border-white/5 uppercase select-none">
            Google API authentication secure token isolated.
          </div>
        </div>
      )}
    </div>
  );
}
