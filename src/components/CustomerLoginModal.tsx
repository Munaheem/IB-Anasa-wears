import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Lock, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { CustomerAccount, CustomerCredential } from '../types';
import {
  loadSavedCredentials,
  registerCustomer,
  resetCustomerPassword,
  signInCustomer
} from '../lib/customerAuth';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: CustomerAccount, saveCredentials: boolean) => void;
  onContinueAsGuest: () => void;
  onCredentialsChanged?: (credentials: CustomerCredential[]) => void;
  savedCredentials: CustomerCredential[];
  existingAccount: CustomerAccount | null;
}

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
    />
  </div>
);

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  onCredentialsChanged,
  savedCredentials,
  existingAccount
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'create'>('signin');
  const [view, setView] = useState<'form' | 'forgot'>('form');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredential, setSaveCredential] = useState(true);

  const [createName, setCreateName] = useState('');
  const [createIdentifier, setCreateIdentifier] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');

  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setView('form');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const remembered = savedCredentials[0];
    const prefilled = remembered ? (remembered.email || remembered.phone) : '';
    setIdentifier(prefilled);
    setForgotIdentifier(prefilled);
    setPassword('');
    setAuthTab('signin');
    setView('form');
    setErrorMessage('');
    setSuccessMessage('');

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const syncCredentials = () => onCredentialsChanged?.(loadSavedCredentials());

  const handleSignInSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Enter your phone number or email and your password.');
      return;
    }

    const result = await signInCustomer(identifier, password, existingAccount);
    if (!result.ok || !result.account) {
      setErrorMessage(result.message || 'Sign in failed. Please try again.');
      return;
    }

    if (result.localSideEffects) syncCredentials();
    onLoginSuccess(result.account, result.localSideEffects ? saveCredential : false);
  };

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!createName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!createIdentifier.trim()) {
      setErrorMessage('Enter a phone number or email address for your account.');
      return;
    }
    if (createPassword.length < 8) {
      setErrorMessage('Your password must be at least 8 characters long.');
      return;
    }
    if (createPassword !== createConfirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    const result = await registerCustomer(createName, createIdentifier, createPassword, existingAccount);
    if (!result.ok || !result.account) {
      setErrorMessage(result.message || 'Account could not be created. Please try again.');
      return;
    }

    if (result.localSideEffects) {
      syncCredentials();
      onLoginSuccess(result.account, saveCredential);
    } else {
      onLoginSuccess(result.account, false);
    }
  };

  const handleForgotSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotIdentifier.trim()) {
      setErrorMessage('Enter the phone number or email on your account.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setErrorMessage('Your new password must be at least 8 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    const result = await resetCustomerPassword(forgotIdentifier, forgotNewPassword);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    if (result.credential) syncCredentials();
    setPassword(forgotNewPassword);
    setIdentifier(forgotIdentifier);
    setView('form');
    setAuthTab('signin');
    setSuccessMessage(result.message);
  };

  return (
    <div
      id="customerLoginOverlay"
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="customerLoginModalBox"
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
            Customer Sign In
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Sign in with your phone or email to check out fast, save your details, and earn loyalty points.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            id="customerLoginTab"
            onClick={() => {
              setAuthTab('signin');
              setView('form');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              authTab === 'signin'
                ? 'bg-white text-black border-b-2 border-black font-extrabold'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <KeyRound size={14} />
            <span>Sign In</span>
          </button>

          <button
            id="customerCreateTab"
            onClick={() => {
              setAuthTab('create');
              setView('form');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
              authTab === 'create'
                ? 'bg-white text-black border-b-2 border-black font-extrabold'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <UserPlus size={14} />
            <span>Create Account</span>
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

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {view === 'forgot' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Reset password</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the phone number or email on your account to set a new password.
                </p>
              </div>

              <Input label="Phone Number or Email" value={forgotIdentifier} onChange={setForgotIdentifier} autoComplete="username" />
              <Input label="New Password" type="password" value={forgotNewPassword} onChange={setForgotNewPassword} autoComplete="new-password" />
              <Input label="Confirm New Password" type="password" value={forgotConfirmPassword} onChange={setForgotConfirmPassword} autoComplete="new-password" />

              <button
                type="submit"
                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md"
              >
                UPDATE PASSWORD
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('form');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full text-center text-[10px] text-gray-500 hover:text-black uppercase tracking-wider py-1"
              >
                Back to sign in
              </button>
            </form>
          ) : authTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="customerLoginIdentifierInput"
                    type="text"
                    value={identifier}
                    autoComplete="username"
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 0813 894 7979 or you@email.com"
                    className="w-full px-3 py-2.5 pl-9 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="customerLoginPasswordInput"
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-3 py-2.5 pl-9 text-xs border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveCredential}
                  onChange={(e) => setSaveCredential(e.target.checked)}
                  className="accent-black"
                />
                Save these login credentials for next time
              </label>

              <button
                type="button"
                onClick={() => {
                  setView('forgot');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full text-center text-[10px] text-gray-600 hover:text-black underline underline-offset-2 uppercase tracking-wider"
              >
                Forgot password?
              </button>

              <button
                id="customerLoginSubmitBtn"
                type="submit"
                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Lock size={14} />
                SIGN IN
              </button>

              {savedCredentials.length > 0 && (
                <div className="text-[10px] font-mono text-gray-500 bg-gray-100 p-2.5 border border-gray-200 text-center">
                  Saved account: <span className="font-bold text-black">{savedCredentials[0].email || savedCredentials[0].phone}</span>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Create your account</h3>
                <p className="text-xs text-gray-500 mt-1">
                  One account for faster checkout, saved addresses, and loyalty points.
                </p>
              </div>

              <Input label="Full Name" value={createName} onChange={setCreateName} autoComplete="name" />
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Phone Number or Email
                </label>
                <input
                  id="customerSignupIdentifierInput"
                  type="text"
                  value={createIdentifier}
                  autoComplete="username"
                  onChange={(e) => setCreateIdentifier(e.target.value)}
                  placeholder="e.g. 0813 894 7979 or you@email.com"
                  className="w-full px-3 py-2.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Password" type="password" value={createPassword} onChange={setCreatePassword} autoComplete="new-password" />
                <Input label="Confirm Password" type="password" value={createConfirmPassword} onChange={setCreateConfirmPassword} autoComplete="new-password" />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveCredential}
                  onChange={(e) => setSaveCredential(e.target.checked)}
                  className="accent-black"
                />
                Save these login credentials for next time
              </label>

              <button
                id="customerSignupSubmitBtn"
                type="submit"
                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-xs tracking-[0.2em] uppercase transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <UserPlus size={14} />
                CREATE ACCOUNT
              </button>
            </form>
          )}

          {/* Continue as guest */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              id="continueAsGuestBtn"
              onClick={onContinueAsGuest}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 hover:border-black hover:text-black transition-colors"
            >
              Continue as guest
              <ArrowRight size={13} />
            </button>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              Browse freely without an account. We&apos;ll only ask for your delivery details at checkout.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Payments are secured by Paystack. Connect a backend to manage accounts securely.</span>
          </div>
        </div>
      </div>
    </div>
  );
};