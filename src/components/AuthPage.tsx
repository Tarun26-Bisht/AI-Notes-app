import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mic,
  Camera,
  Layers,
  GraduationCap,
  FlaskConical
} from 'lucide-react';
import { User, AuthResponse } from '../types/note';

interface AuthPageProps {
  onAuthSuccess: (authData: AuthResponse) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please recheck.');
        return;
      }
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = mode === 'login' ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      // Success
      onAuthSuccess(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMessage(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed.');
      }
      onAuthSuccess(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to login with demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-blue-50/20 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background ambient decorative shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            SmartNotes AI
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            Your private, multi-modal notes sanctuary powered by Gemini 3.8 Flash
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Your Workspace' : 'Create My Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1-Click Quick Demo Accounts
              </span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Test User Isolation
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Click either persona below to experience how each account sees <strong>only their own private notes</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alex@example.com', 'password123')}
                disabled={isLoading}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    AM
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                      Alex Morgan
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">Lead Researcher</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1">
                  <FlaskConical className="w-3 h-3" />
                  <span>3 Architecture notes</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sarah@example.com', 'password123')}
                disabled={isLoading}
                className="p-3 text-left bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    SC
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 truncate">
                      Sarah Chen
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">CS Student</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-purple-600 font-medium mt-1">
                  <GraduationCap className="w-3 h-3" />
                  <span>2 Study guides</span>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Security Guarantees */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict per-user notes isolation & session encryption</span>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/60 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60">
            <Mic className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-800">Voice Memos</p>
            <p className="text-[10px] text-slate-500">Audio transcription</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60">
            <Camera className="w-4 h-4 text-purple-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-800">Camera OCR</p>
            <p className="text-[10px] text-slate-500">Handwritten notes</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60">
            <FileText className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-800">PDF Synthesis</p>
            <p className="text-[10px] text-slate-500">Study guide quizzes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
