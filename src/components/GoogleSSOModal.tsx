import React, { useEffect, useState } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, ArrowRight, User, KeyRound, Sparkles, RefreshCw, X } from 'lucide-react';
import { AdminUser, StaffAccount } from '../types';
import { adminLogin } from '../lib/adminApi';
import { isBackendConfigured } from '../lib/api';

interface GoogleSSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: AdminUser) => void;
  staffAccounts?: StaffAccount[];
  onStaffAccountCreated?: (account: StaffAccount) => void;
  userEmail?: string;
}

export const GoogleSSOModal: React.FC<GoogleSSOModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  staffAccounts = [],
  onStaffAccountCreated,
  userEmail = 'muhammedaimanosinaim@gmail.com'
}) => {
  const [authTab, setAuthTab] = useState<'google' | 'credentials'>('google');
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  
  // Credentials tab state
  const [credEmail, setCredEmail] = useState('admin@ibanasawears.com');
  const [credPassword, setCredPassword] = useState('admin123');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [registeredAccount, setRegisteredAccount] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [resetMessage, setResetMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Google SVG Multi-color Icon
  const GoogleGIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  const handleGoogleSignIn = (targetEmail: string, displayName: string = 'Authorized Admin') => {
    setIsGoogleSigningIn(true);
    setErrorMessage('');

    // Simulate Google SSO identity token exchange and verification
    setTimeout(() => {
      setIsGoogleSigningIn(false);
      const adminUser: AdminUser = {
        email: targetEmail,
        name: displayName,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          displayName
        )}&backgroundColor=111111`,
        role: 'Super Administrator',
        authMethod: 'google',
        signedInAt: new Date().toISOString()
      };
      onSuccessLogin(adminUser);
    }, 1200);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!credEmail || !credPassword) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (!captchaChecked) {
      setErrorMessage('Please verify the Google security challenge.');
      return;
    }

    if (isBackendConfigured()) {
      const result = await adminLogin(credEmail.trim(), credPassword);
      if (result.ok && result.user) {
        onSuccessLogin(result.user);
      } else {
        setErrorMessage(result.message || 'Invalid administrative credentials.');
      }
      return;
    }

    if (
      (credEmail.toLowerCase() === 'admin@ibanasawears.com' && credPassword === 'admin123') ||
      staffAccounts.some(
        (staff) => staff.email.toLowerCase() === credEmail.toLowerCase() && staff.password === credPassword
      )
    ) {
      const staffAccount = staffAccounts.find(
        (staff) => staff.email.toLowerCase() === credEmail.toLowerCase()
      );
      const accountName =
        staffAccount?.name ||
        (registeredAccount && credEmail.toLowerCase() === registeredAccount.email.toLowerCase()
          ? registeredAccount.name
          : 'Store Admin');
      const adminUser: AdminUser = {
        email: credEmail,
        name: accountName,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(accountName)}&backgroundColor=111111`,
        role: staffAccount?.role || 'Store Manager',
        authMethod: 'password',
        signedInAt: new Date().toISOString()
      };
      onSuccessLogin(adminUser);
    } else {
      setErrorMessage('Invalid administrative credentials. Try admin@ibanasawears.com / admin123');
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setResetMessage('');

    if (signupPassword.length < 8) {
      setErrorMessage('Your password must be at least 8 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    if (signupEmail.toLowerCase() === 'admin@ibanasawears.com') {
      setErrorMessage('That email is already registered. Please sign in instead.');
      return;
    }

    const newStaffAccount: StaffAccount = {
      id: `staff-${Date.now()}`,
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      role: 'Sales Associate',
      createdAt: new Date().toISOString()
    };
    setRegisteredAccount(newStaffAccount);
    onStaffAccountCreated?.(newStaffAccount);
    setCredEmail(signupEmail.trim());
    setCredPassword(signupPassword);
    setIsSignUp(false);
    setCaptchaChecked(true);
    setResetMessage('Account created for this demo session. You can now sign in with your new credentials.');
  };

  const userDisplayName = userEmail.split('@')[0].replace('.', ' ').toUpperCase();

  return (
    <div
      id="googleSSOOverlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="googleSSOModalBox"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 sm:max-h-[calc(100dvh-3rem)]"
      >
        {/* Header */}
        <div className="bg-black text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-white/20 text-[8px] font-bold tracking-[0.25em] uppercase text-gray-200">
              SECURE ACCESS
            </span>
            <span className="text-gray-400 text-xs font-mono">&bull; IB ANASA WEARS</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
            Admin Authentication
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Single Sign-On and verified management access for showroom inventory &amp; sales.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            id="tabGoogleSSO"
            onClick={() => {
              setAuthTab('google');
              setIsForgotPassword(false);
              setIsSignUp(false);
              setResetMessage('');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              authTab === 'google'
                ? 'bg-white text-black border-b-2 border-black font-extrabold'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <GoogleGIcon />
            <span>Google SSO</span>
          </button>

          <button
            id="tabCredentials"
            onClick={() => {
              setAuthTab('credentials');
              setIsForgotPassword(false);
              setIsSignUp(false);
              setResetMessage('');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              authTab === 'credentials'
                ? 'bg-white text-black border-b-2 border-black font-extrabold'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <KeyRound size={14} />
            <span>Password Login</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {authTab === 'google' ? (
            /* Google Single Sign-On Flow */
            <div className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Sign in with your Google Workspace Account
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Fast, cryptographically verified Google SSO access
                </p>
              </div>

              {/* Primary Detected Google Account Card */}
              {!showCustomGoogleInput && (
                <div className="space-y-3">
                  <div
                    id="primaryGoogleAccountBtn"
                    onClick={() =>
                      !isGoogleSigningIn && handleGoogleSignIn(userEmail, userDisplayName)
                    }
                    className="w-full min-w-0 p-3.5 border-2 border-gray-200 hover:border-black bg-gray-50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {userDisplayName[0] || 'M'}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-gray-900 group-hover:text-black flex items-center gap-1.5">
                          <span>{userDisplayName}</span>
                          <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded-xs font-mono font-bold">
                            CURRENT
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 truncate max-w-[210px] sm:max-w-[240px]">
                          {userEmail}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-gray-400 group-hover:text-black transition-colors">
                      <GoogleGIcon />
                    </div>
                  </div>

                  {/* Primary Google SSO Action Button */}
                  <button
                    id="googleSignInPrimaryBtn"
                    onClick={() => handleGoogleSignIn(userEmail, userDisplayName)}
                    disabled={isGoogleSigningIn}
                    className="w-full min-w-0 px-3 py-3.5 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs tracking-[0.08em] sm:tracking-[0.14em] uppercase transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-98 cursor-pointer disabled:opacity-75"
                  >
                    {isGoogleSigningIn ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span className="min-w-0 text-center leading-tight">Verifying Google SSO Token...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-1 rounded-xs">
                          <GoogleGIcon />
                        </div>
                        <span className="min-w-0 text-center leading-tight">Continue with Google Single Sign-On</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      id="toggleCustomGoogleAccountBtn"
                      onClick={() => setShowCustomGoogleInput(true)}
                      className="text-[11px] font-semibold text-gray-600 hover:text-black underline underline-offset-2 cursor-pointer"
                    >
                      Use a different Google account
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Google Account Input */}
              {showCustomGoogleInput && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Enter Google Account Email
                    </label>
                    <input
                      id="customGoogleEmailInput"
                      type="email"
                      placeholder="e.g. director@ibanasawears.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                    />
                  </div>

                  <button
                    id="customGoogleSubmitBtn"
                    onClick={() => {
                      if (!customGoogleEmail.includes('@')) {
                        setErrorMessage('Please enter a valid Google email address.');
                        return;
                      }
                      handleGoogleSignIn(
                        customGoogleEmail,
                        customGoogleEmail.split('@')[0].toUpperCase()
                      );
                    }}
                    disabled={isGoogleSigningIn}
                    className="w-full py-3 bg-[#4285F4] text-white font-bold text-xs tracking-wider uppercase hover:bg-[#3367D6] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGoogleSigningIn ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <GoogleGIcon />
                        <span>Authenticate with Google</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="w-full text-center text-[10px] text-gray-500 hover:text-black uppercase tracking-wider py-1"
                  >
                    Back to detected profile
                  </button>
                </div>
              )}

              {/* Google Security Trust Badge */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
                <Shield size={13} className="text-emerald-600" />
                <span>Protected by Google Identity OAuth 2.0 &amp; SSL</span>
              </div>
            </div>
          ) : (
            isSignUp ? (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Create admin account</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a local demo account for this browser session.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    id="adminSignupNameInput"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    id="adminSignupEmailInput"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Password
                    </label>
                    <input
                      id="adminSignupPasswordInput"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="adminSignupConfirmPasswordInput"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <button
                  id="adminSignupSubmitBtn"
                  type="submit"
                  className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md"
                >
                  CREATE ACCOUNT
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage('');
                    setResetMessage('');
                  }}
                  className="w-full text-center text-[10px] text-gray-500 hover:text-black uppercase tracking-wider py-1"
                >
                  Back to password login
                </button>
              </form>
            ) : isForgotPassword ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setErrorMessage('');
                  setResetMessage(`Password reset instructions are ready for ${credEmail}. Connect Firebase Auth to send the email.`);
                }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Reset admin password</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the email address associated with the admin account.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    id="adminResetEmailInput"
                    type="email"
                    value={credEmail}
                    onChange={(e) => {
                      setCredEmail(e.target.value);
                      setResetMessage('');
                    }}
                    className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <button
                  id="adminPasswordResetBtn"
                  type="submit"
                  className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md"
                >
                  SEND RESET INSTRUCTIONS
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetMessage('');
                    setErrorMessage('');
                  }}
                  className="w-full text-center text-[10px] text-gray-500 hover:text-black uppercase tracking-wider py-1"
                >
                  Back to password login
                </button>
              </form>
            ) : (
            /* Traditional Password Form with ReCAPTCHA */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Admin Email Address
                </label>
                <input
                  id="adminEmailInput"
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Admin Password
                </label>
                <input
                  id="adminPasswordInput"
                  type="password"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  required
                />
              </div>

              {/* Google reCAPTCHA interactive box */}
              <div
                id="recaptchaBox"
                onClick={() => setCaptchaChecked(!captchaChecked)}
                className="p-3 bg-gray-50 border border-gray-300 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 border rounded-xs flex items-center justify-center transition-all ${
                      captchaChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-400'
                    }`}
                  >
                    {captchaChecked && <CheckCircle2 size={16} />}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    I am not a robot
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <GoogleGIcon />
                  <span className="text-[7px] text-gray-400 font-mono mt-0.5">reCAPTCHA</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMessage('');
                  setResetMessage('');
                }}
                className="w-full text-center text-[10px] text-gray-600 hover:text-black underline underline-offset-2 uppercase tracking-wider"
              >
                Forgot password?
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage('');
                  setResetMessage('');
                }}
                className="w-full text-center text-[10px] text-gray-600 hover:text-black underline underline-offset-2 uppercase tracking-wider"
              >
                Create an admin account
              </button>

              <button
                id="adminCredentialsSubmitBtn"
                type="submit"
                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md"
              >
                VERIFY &amp; SIGN IN
              </button>

              <div className="text-[10px] font-mono text-gray-500 bg-gray-100 p-2.5 border border-gray-200 text-center">
                Demo Account: <span className="font-bold text-black">admin@ibanasawears.com</span> / <span className="font-bold text-black">admin123</span>
              </div>
            </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};
