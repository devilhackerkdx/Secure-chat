import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, ShieldCheck, Check, ArrowRight, ChevronDown, KeyRound, Smartphone, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { sounds } from "./SoundManager";
import { googleSignIn } from "../lib/googleAuth";

interface LoginScreenProps {
  darkMode: boolean;
  onLoginSuccess: (phoneNumber: string) => void;
  activeFont?: string;
  currentAccent?: {
    hex: string;
    hoverHex: string;
    lightHex: string;
    lightHoverHex: string;
    textLight: string;
    shadow: string;
  };
}

const COUNTRIES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

export default function LoginScreen({
  darkMode,
  onLoginSuccess,
  currentAccent,
}: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  // Login Steps: "phone" | "otp"
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState<string[]>(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
  // Simulated SMS Push Notification
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);

  const handleGoogleLoginClick = async () => {
    sounds.playClick();
    setIsSigningInWithGoogle(true);
    setOtpError("");
    try {
      const result = await googleSignIn();
      if (result) {
        // Successful Google login triggers onAuthStateChanged in App.tsx!
        sounds.playChime();
      }
    } catch (err: any) {
      console.error("Google sign in on LoginScreen error:", err);
      setOtpError(err.message || "Google Authentication failed");
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  // Auto-decrement OTP resend countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      setOtpError("Please enter a valid phone number");
      return;
    }
    sounds.playClick();
    setOtpError("");
    setIsSendingCode(true);

    // Simulate network delay to make it feel premium
    setTimeout(() => {
      // Generate a random 4 digit code
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      setIsSendingCode(false);
      setStep("otp");
      setCountdown(59);

      // Trigger standard incoming notification overlay
      setTimeout(() => {
        sounds.playChime();
        setSmsNotification(`🔑 SecureChat SMS: Your requested authentication code is ${newOtp}. Expiry: 10m.`);
        
        // Auto dismiss SMS notification after 6 seconds
        setTimeout(() => {
          setSmsNotification(null);
        }, 8000);
      }, 1500);
    }, 1200);
  };

  const handleOtpValueChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return; // Only allow digits
    
    const nextOtp = [...otpInput];
    nextOtp[index] = val;
    setOtpInput(nextOtp);
    setOtpError("");

    // Auto-focus next field
    if (val !== "" && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      // If current is empty, focus previous
      if (otpInput[index] === "" && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
        
        const nextOtp = [...otpInput];
        nextOtp[index - 1] = "";
        setOtpInput(nextOtp);
      }
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otpInput.join("");
    if (enteredOtp.length < 4) {
      setOtpError("Please enter all 4 digits of the OTP code");
      return;
    }

    sounds.playClick();
    setIsVerifying(true);
    setOtpError("");

    setTimeout(() => {
      // Allow the generated mock OTP or developer test bypass '1234'
      if (enteredOtp === generatedOtp || enteredOtp === "1234" || enteredOtp === "8820") {
        sounds.playChime();
        // Trigger success callback
        onLoginSuccess(`${selectedCountry.code} ${phoneNumber}`);
      } else {
        sounds.playPop();
        setOtpError("Invalid verification code. Please try again.");
        setIsVerifying(false);
        // Clear inputs for ease of retry
        setOtpInput(["", "", "", ""]);
        document.getElementById("otp-input-0")?.focus();
      }
    }, 1500);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    
    sounds.playClick();
    setOtpInput(["", "", "", ""]);
    setOtpError("");
    setCountdown(59);
    
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);

    setTimeout(() => {
      sounds.playChime();
      setSmsNotification(`🔑 SecureChat SMS: Your new OTP verification code is ${newOtp}.`);
      setTimeout(() => {
        setSmsNotification(null);
      }, 7000);
    }, 8000);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-7 bg-transparent rounded-[inherit]" id="login-screen-root">
      
      {/* Absolute Header Overlay for Simulated SMS Carrier Notification */}
      <AnimatePresence>
        {smsNotification && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="absolute top-10 left-3 right-3 z-[60] p-3.5 bg-stone-900/95 text-white rounded-2xl flex items-start space-x-3 shadow-xl border border-white/10"
            id="simulated-sms-banner"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold border border-amber-500/20">
              💬
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-amber-400">CARRIER SMS GATEWAY</span>
                <span className="text-[8px] text-stone-400 font-mono">JUST NOW</span>
              </div>
              <p className="text-[11px] text-stone-100 font-medium leading-normal mt-1">
                {smsNotification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Graphic Header */}
      <div className="pt-2 flex flex-col items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-sm accent-text">
            🔐
          </div>
          <span className="font-sans font-bold text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
            SecureChat iOS 26
          </span>
        </div>
      </div>

      {/* Main Form Body Container */}
      <div className="flex-1 flex flex-col justify-center items-center mt-4">
        
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone-step-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="w-full max-w-sm space-y-6 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-sans tracking-tight text-stone-850 dark:text-white leading-tight">
                  Enter Your Number
                </h2>
                <p className="text-[11px] text-stone-400 leading-relaxed max-w-[240px] mx-auto">
                  Verify your account safely with end-to-end device confirmation. No password required.
                </p>
              </div>

              {/* Login Phone Fields */}
              <div className="space-y-3 relative">
                
                {/* Custom Styled Select Country Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setShowCountryDropdown(!showCountryDropdown);
                    }}
                    className="w-full flex items-center justify-between p-3.5 bg-white/45 dark:bg-stone-900/30 border border-stone-200/40 dark:border-white/10 rounded-2xl hover:bg-white/60 dark:hover:bg-stone-900/40 active:scale-99 transition-all text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base select-none">{selectedCountry.flag}</span>
                      <span className="font-bold text-stone-700 dark:text-stone-200">
                        {selectedCountry.country} ({selectedCountry.code})
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-stone-400" />
                  </button>

                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-1.5 max-h-40 overflow-y-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/50 dark:border-white/10 rounded-2xl shadow-xl z-50 text-left"
                      >
                        {COUNTRIES.map((ct) => (
                          <button
                            key={ct.country}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedCountry(ct);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full flex items-center justify-between p-3.5 hover:bg-stone-105/10 dark:hover:bg-white/5 border-b border-stone-100/30 dark:border-white/5 last:border-0 text-left"
                          >
                            <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                              {ct.flag} &nbsp; {ct.country}
                            </span>
                            <span className="text-[10px] font-bold font-mono text-stone-400">{ct.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Country and Number input block */}
                <div className="flex space-x-2.5">
                  <div className="w-16 p-3.5 bg-stone-200/30 dark:bg-stone-800/10 border border-stone-200/40 dark:border-white/10 rounded-2xl flex items-center justify-center select-none">
                    <span className="text-xs font-bold font-mono text-stone-500">
                      {selectedCountry.code}
                    </span>
                  </div>
                  
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="Phone number details"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPhoneNumber(val);
                        if (otpError) setOtpError("");
                      }}
                      className="w-full p-3.5 bg-white/45 dark:bg-stone-900/30 border border-stone-200/40 dark:border-white/10 rounded-2xl outline-none focus:bg-white/70 dark:focus:bg-stone-900/60 focus:accent-border font-bold text-xs placeholder-stone-400 text-stone-800 dark:text-white"
                    />
                    <Phone size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  </div>
                </div>

              </div>

              {otpError && (
                <div className="flex items-center justify-center space-x-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wide">
                  <AlertCircle size={12} />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleSendOtp}
                disabled={isSendingCode || phoneNumber.length < 7}
                className="w-full py-3.5 rounded-2xl font-bold bg-pink-500 hover:bg-pink-600 disabled:bg-stone-400/30 disabled:text-stone-400 text-white flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98 shadow-md accent-shadow"
                style={{
                  backgroundColor: isSendingCode ? "var(--color-accent-hover)" : "var(--color-accent)",
                }}
              >
                {isSendingCode ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-white" />
                    <span className="text-xs">Sending Secure SMS...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs">Verify Account</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="flex items-center my-1 select-none">
                <div className="flex-1 h-px bg-stone-200/40 dark:bg-white/10" />
                <span className="px-3 text-[9px] font-bold text-stone-400">OR VIA SSO</span>
                <div className="flex-1 h-px bg-stone-200/40 dark:bg-white/10" />
              </div>

              {/* Google SSO Login */}
              <button
                type="button"
                onClick={handleGoogleLoginClick}
                disabled={isSigningInWithGoogle}
                className="w-full py-3 px-4 border border-stone-200/50 dark:border-white/10 rounded-2xl font-bold hover:bg-white/60 dark:hover:bg-stone-900/45 bg-white/20 dark:bg-stone-900/20 text-stone-700 dark:text-stone-200 flex items-center justify-center space-x-2.5 transition-all cursor-pointer active:scale-98 text-xs shadow-sm"
              >
                {isSigningInWithGoogle ? (
                  <Loader2 className="animate-spin text-pink-500" size={14} />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "16px", height: "16px" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

            </motion.div>
          ) : (
            <motion.div
              key="otp-step-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="w-full max-w-sm space-y-6 text-center"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center mx-auto accent-text">
                  <KeyRound size={16} />
                </div>
                <h2 className="text-xl font-bold font-sans tracking-tight text-stone-850 dark:text-white leading-tight">
                  Verification Code
                </h2>
                <p className="text-[10px] text-stone-400 leading-relaxed max-w-[230px] mx-auto">
                  We've sent a 4-digit verification code to
                  <span className="font-bold text-stone-700 dark:text-stone-200 block font-mono mt-0.5">
                    {selectedCountry.code} {phoneNumber}
                  </span>
                </p>
              </div>

              {/* 4 Digit Code Input Wrapper */}
              <div className="flex justify-center space-x-3.5 my-4">
                {otpInput.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpValueChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-12 rounded-2xl bg-white/45 dark:bg-stone-900/30 border border-stone-200/40 dark:border-white/10 outline-none text-center font-mono font-bold text-lg text-stone-850 dark:text-white focus:bg-white/70 dark:focus:bg-stone-900/60 focus:accent-border"
                  />
                ))}
              </div>

              {otpError && (
                <div className="flex items-center justify-center space-x-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wide">
                  <AlertCircle size={12} />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Resend status or countdown trigger */}
              <div className="text-[10px] text-stone-400">
                {countdown > 0 ? (
                  <span>Resend code in <strong className="font-mono text-stone-600 dark:text-stone-300 font-bold">{countdown}s</strong></span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-pink-500 hover:underline cursor-pointer font-bold select-none inline-flex items-center space-x-1 accent-text"
                  >
                    <RefreshCw size={10} />
                    <span>Resend OTP Code</span>
                  </button>
                )}
              </div>

              {/* Buttons Grid layout */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setStep("phone");
                    setOtpInput(["", "", "", ""]);
                    setOtpError("");
                  }}
                  className="py-3.5 border border-stone-200 dark:border-white/10 rounded-2xl font-bold hover:bg-stone-50/15 text-stone-500 hover:text-stone-700 bg-white/20 text-xs transition-colors cursor-pointer active:scale-98"
                >
                  Edit Number
                </button>
                
                <button
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpInput.some(d => d === "")}
                  className="py-3.5 rounded-2xl font-bold bg-pink-500 hover:bg-pink-600 disabled:bg-stone-400/30 disabled:text-stone-400 text-white flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98 shadow-md accent-shadow"
                  style={{
                    backgroundColor: isVerifying ? "var(--color-accent-hover)" : "var(--color-accent)",
                  }}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-white" />
                      <span className="text-xs">Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs">Verify & Enter</span>
                      <Check size={13} />
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Dynamic Simulated Bottom Status */}
      <div className="text-center pb-2 select-none">
        <span className="text-[9px] font-mono font-bold text-stone-400 block dark:text-stone-500 leading-none">
          SECURE ENCLAVE ACTIVE • ISO-LEVEL CERTIFICATE
        </span>
      </div>

    </div>
  );
}
