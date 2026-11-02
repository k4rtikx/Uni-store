import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  Mail,
  Lock,
  GraduationCap,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import useAuth from '../context/useAuth';
import { forgotPassword, verifyOtp, resetPassword } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');

  // 3-Step Password Recovery Modal State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP, 3 = Set New Password
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  // Refs for 6-digit OTP input boxes
  const otpInputRefs = useRef([]);

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 10-minute countdown timer for OTP verification step
  useEffect(() => {
    let interval = null;
    if (isRecoveryOpen && recoveryStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecoveryOpen, recoveryStep, timerSeconds]);

  // Focus first OTP input when transitioning to Step 2
  useEffect(() => {
    let timer = null;
    if (isRecoveryOpen && recoveryStep === 2) {
      timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRecoveryOpen, recoveryStep]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
    if (loginSuccessMessage) setLoginSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await loginUser(formData.email.trim(), formData.password);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Unable to log in. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const handleOpenRecovery = () => {
    setRecoveryIdentifier(formData.email || '');
    setMaskedEmail('');
    setOtpDigits(['', '', '', '', '', '']);
    setTimerSeconds(600);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setRecoveryStep(1);
    setRecoveryError('');
    setIsSendingOtp(false);
    setIsRecoveryOpen(true);
  };

  // Close Forgot Password Modal
  const handleCloseRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError('');
    setIsSendingOtp(false);
  };

  // STEP 1: Request 6-Digit Email OTP
  const handleRequestOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSendingOtp) return;
    setRecoveryError('');

    const cleanIdentifier = recoveryIdentifier.trim();
    if (!cleanIdentifier) {
      setRecoveryError('Please enter your registered RJIT college email or 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setRecoveryLoading(true);

    try {
      const res = await forgotPassword(cleanIdentifier);

      if (res.data?.success) {
        setMaskedEmail(res.data.maskedEmail || 'your registered campus email');
        setOtpDigits(['', '', '', '', '', '']);
        setTimerSeconds(600);
        setRecoveryStep(2);
      } else {
        setRecoveryError(res.data?.message || 'Unable to send recovery OTP. Please try again.');
      }
    } catch (err) {
      setRecoveryError(
        err.response?.data?.message ||
          'No student account found with this email or registered phone number.'
      );
    } finally {
      setIsSendingOtp(false);
      setRecoveryLoading(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);
    if (recoveryError) setRecoveryError('');

    // Auto-advance to next box if digit entered
    if (cleanChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle OTP paste (e.g. user copies 6-digit code)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      updated[i] = pasteData[i];
    }
    setOtpDigits(updated);
    if (recoveryError) setRecoveryError('');

    // Focus either the next empty box or the last box
    const nextEmptyIndex = updated.findIndex((d) => !d);
    if (nextEmptyIndex !== -1) {
      otpInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendingOtp) return;
    setResendingOtp(true);
    setRecoveryError('');

    try {
      const res = await forgotPassword(recoveryIdentifier.trim());

      if (res.data?.success) {
        setTimerSeconds(600);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        setRecoveryError(res.data?.message || 'Could not resend OTP.');
      }
    } catch (err) {
      setRecoveryError(err.response?.data?.message || 'Could not resend OTP. Please try again.');
    } finally {
      setResendingOtp(false);
    }
  };

  // STEP 2: Verify 6-Digit OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setRecoveryError('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setRecoveryError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setRecoveryLoading(true);

    try {
      const res = await verifyOtp(recoveryIdentifier.trim(), fullOtp);

      if (res.data?.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        // Explicitly clear password inputs on transition to prevent browser autofill injection
        setNewPassword('');
        setConfirmPassword('');
        setRecoveryStep(3);
      } else {
        setRecoveryError(res.data?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setRecoveryError(
        err.response?.data?.message ||
          'Invalid OTP. Please check the code sent to your campus email and try again.'
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // STEP 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryError('');

    if (newPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setRecoveryLoading(true);

    try {
      const res = await resetPassword(resetToken, newPassword);

      if (res.data?.success) {
        setIsRecoveryOpen(false);
        // Pre-fill email in login form if identifier was an email
        if (recoveryIdentifier.includes('@')) {
          setFormData({
            email: recoveryIdentifier.trim().toLowerCase(),
            password: '',
          });
        }
        setLoginSuccessMessage('Password updated successfully! Please sign in with your new password.');
        setErrorMessage('');
      } else {
        setRecoveryError(res.data?.message || 'Failed to update password.');
      }
    } catch (err) {
      setRecoveryError(
        err.response?.data?.message ||
          'Invalid or expired recovery session. Please request a new verification code.'
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Format timer seconds into MM:SS
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Subtle ambient glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-2xl shadow-slate-900/5 space-y-6 relative z-10">
        {/* Sleek Top-Left Back Navigation Button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
            <span>Back</span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold uppercase tracking-wider">
            Student Portal
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-500">
            Sign in with your verified college email to trade on campus
          </p>
        </div>

        {/* Success toast from password recovery */}
        {loginSuccessMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{loginSuccessMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              College Email (@rjit.ac.in)
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="0902cs241008@rjit.ac.in"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={handleOpenRecovery}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
          New student on campus?{' '}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>

      {/* Production-Grade Strictly Gated 3-Step Email OTP Recovery Modal */}
      {isRecoveryOpen && (
        <div
          onClick={handleCloseRecovery}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 relative text-left"
          >
            {/* Modal Close Button */}
            <button
              onClick={handleCloseRecovery}
              type="button"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step Progress Indicators */}
            <div className="flex items-center gap-2 pt-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  recoveryStep >= 1 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  recoveryStep >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  recoveryStep >= 3 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'
                }`}
              />
            </div>

            {/* Modal Header & Back Navigation */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (recoveryStep > 1) {
                    setRecoveryStep((prev) => prev - 1);
                    setRecoveryError('');
                  } else {
                    handleCloseRecovery();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group mb-2.5"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>{recoveryStep > 1 ? 'Back to previous step' : 'Back to Login'}</span>
              </button>

              {recoveryStep === 1 && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Step 1 of 3: Account Lookup
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Reset Your Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Enter your registered RJIT college email or 10-digit mobile number. We will send a secure 6-digit OTP to your campus inbox.
                  </p>
                </>
              )}

              {recoveryStep === 2 && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Step 2 of 3: Email OTP
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Enter 6-Digit Code
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    We sent a verification code to <span className="font-semibold text-slate-800 font-mono">{maskedEmail}</span>.
                  </p>
                </>
              )}

              {recoveryStep === 3 && (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold tracking-wider mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Step 3 of 3: Secure Password
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Set New Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Choose a strong, secure password (minimum 6 characters) for your campus account.
                  </p>
                </>
              )}
            </div>

            {/* Error Banner */}
            {recoveryError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* STEP 1: Request 6-Digit OTP */}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered @rjit.ac.in Email or 10-Digit Phone *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={(e) => setRecoveryIdentifier(e.target.value)}
                      placeholder="e.g. 0902cs241008@rjit.ac.in or 9876543210"
                      required
                      autoFocus
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter either your campus student email or registered WhatsApp phone number.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseRecovery}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleRequestOtp}
                    disabled={isSendingOtp}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP... ⏳</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify 6-Digit Email OTP */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      6-Digit OTP Code
                    </label>
                    <span
                      className={`text-xs font-mono font-bold ${
                        timerSeconds < 60 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      ⏱️ {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  {/* 6 Individual Digit Input Boxes */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-full h-12 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white shadow-sm transition-all"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Resend OTP button */}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
                    >
                      Change Identifier
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp || timerSeconds > 540}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 font-bold hover:underline cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendingOtp ? 'animate-spin' : ''}`} />
                      <span>{resendingOtp ? 'Sending...' : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading || otpDigits.some((d) => !d)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <span>Verify OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Set New Password (Unlocked ONLY after Step 2 succeeds) */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4" autoComplete="off">
                {/* Hidden dummy inputs to defeat Edge/Chrome aggressive credential autofill */}
                <input
                  type="text"
                  name="fakeusernameremembered"
                  className="hidden"
                  tabIndex="-1"
                  autoComplete="off"
                />
                <input
                  type="password"
                  name="fakepasswordremembered"
                  className="hidden"
                  tabIndex="-1"
                  autoComplete="off"
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password (min. 6 characters) *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="reusecampus_new_password"
                      id="reusecampus_new_password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoFocus
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex="-1"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="reusecampus_confirm_password"
                      id="reusecampus_confirm_password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex="-1"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseRecovery}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
