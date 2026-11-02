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
import Tilt3D from '../components/ui/Tilt3D';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');

  // 3-Step Password Recovery Modal State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const otpInputRefs = useRef([]);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let interval = null;
    if (isRecoveryOpen && recoveryStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((p) => (p > 0 ? p - 1 : 0)), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecoveryOpen, recoveryStep, timerSeconds]);

  useEffect(() => {
    let timer = null;
    if (isRecoveryOpen && recoveryStep === 2) {
      timer = setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
    return () => { if (timer) clearTimeout(timer); };
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
      setErrorMessage(error.response?.data?.message || error.message || 'Unable to log in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCloseRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError('');
    setIsSendingOtp(false);
  };

  const handleRequestOtp = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
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
      setMaskedEmail(res.data?.maskedEmail || res.data?.data?.maskedEmail || cleanIdentifier);
      setRecoveryStep(2);
      setTimerSeconds(600);
    } catch (err) {
      setRecoveryError(err.response?.data?.message || err.message || 'Could not send OTP. Please verify your details and try again.');
    } finally {
      setIsSendingOtp(false);
      setRecoveryLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setRecoveryError('');
    if (cleanVal && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpInputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteText) return;
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteText.length; i++) newDigits[i] = pasteText[i];
    setOtpDigits(newDigits);
    const nextEmpty = pasteText.length < 6 ? pasteText.length : 5;
    otpInputRefs.current[nextEmpty]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    const code = otpDigits.join('');
    if (code.length < 6) {
      setRecoveryError('Please enter all 6 OTP digits sent to your email.');
      return;
    }
    setRecoveryLoading(true);
    try {
      const res = await verifyOtp(recoveryIdentifier.trim(), code);
      setResetToken(res.data?.resetToken || res.data?.data?.resetToken || '');
      setRecoveryStep(3);
    } catch (err) {
      setRecoveryError(err.response?.data?.message || err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendingOtp) return;
    setResendingOtp(true);
    setRecoveryError('');
    try {
      const res = await forgotPassword(recoveryIdentifier.trim());
      setMaskedEmail(res.data?.maskedEmail || res.data?.data?.maskedEmail || recoveryIdentifier.trim());
      setTimerSeconds(600);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setRecoveryError(err.response?.data?.message || err.message || 'Could not resend OTP. Please wait and try again.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match. Please check and try again.');
      return;
    }
    setRecoveryLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setLoginSuccessMessage('Password reset successful! Please sign in with your new password.');
      handleCloseRecovery();
    } catch (err) {
      setRecoveryError(err.response?.data?.message || err.message || 'Password reset failed. The link may have expired.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const formatTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      <Tilt3D max={4} perspective={1000} className="w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-white/70 shadow-2xl shadow-slate-900/10 space-y-6 relative z-10 overflow-hidden">
          {/* Emerald bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-b-3xl" />

          {/* Back button */}
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
              <span>Back</span>
            </button>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25"
              style={{ transform: 'translateZ(16px)' }}>
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-500">Sign in to your Uni-store account</p>
          </div>

          {loginSuccessMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginSuccessMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                College Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@rjit.ac.in"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" tabIndex="-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button" onClick={handleOpenRecovery}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>) : (<><LogIn className="w-4 h-4" />Sign In</>)}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100/80">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </Tilt3D>

      {/* 3-Step Password Recovery Modal */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseRecovery}>
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-white/70 shadow-2xl shadow-slate-900/20 space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-3xl" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {recoveryStep === 1 ? 'Recover Access' : recoveryStep === 2 ? 'Enter OTP Code' : 'Set New Password'}
                </h3>
              </div>
              <button type="button" onClick={handleCloseRecovery} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Step progress */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= recoveryStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              ))}
            </div>

            {recoveryError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* Step 1 */}
            {recoveryStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-500">Enter your registered RJIT email address. We'll send a 6-digit OTP to verify your identity.</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email / Mobile *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="text" value={recoveryIdentifier} onChange={(e) => { setRecoveryIdentifier(e.target.value); setRecoveryError(''); }}
                      placeholder="your@rjit.ac.in" required autoFocus
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleCloseRecovery} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSendingOtp}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer">
                    {isSendingOtp ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</>) : (<><ArrowRight className="w-3.5 h-3.5" />Send OTP</>)}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2 */}
            {recoveryStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-500">
                  OTP sent to <span className="font-bold text-emerald-700">{maskedEmail}</span>. Enter the 6-digit code below. Expires in <span className={`font-bold ${timerSeconds < 60 ? 'text-rose-600' : 'text-slate-700'}`}>{formatTimer(timerSeconds)}</span>.
                </p>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input key={i} ref={(el) => (otpInputRefs.current[i] = el)} type="text" inputMode="numeric"
                      value={digit} maxLength={1}
                      onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 text-center text-lg font-bold border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all" />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleCloseRecovery} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={recoveryLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
                    {recoveryLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Verifying...</>) : (<><ShieldCheck className="w-3.5 h-3.5" />Verify OTP</>)}
                  </button>
                </div>
                <div className="text-center">
                  <button type="button" onClick={handleResendOtp} disabled={resendingOtp || timerSeconds > 540}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold disabled:opacity-40 flex items-center gap-1 mx-auto cursor-pointer">
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                    {resendingOtp ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {recoveryStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-500">Create a strong new password for your RJIT campus account.</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Password (min. 6 characters) *</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type={showNewPassword ? 'text' : 'password'} name="uni-store_new_password" id="uni-store_new_password"
                      autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={6} autoFocus
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" tabIndex="-1">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type={showConfirmPassword ? 'text' : 'password'} name="uni-store_confirm_password" id="uni-store_confirm_password"
                      autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" tabIndex="-1">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleCloseRecovery} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={recoveryLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
                    {recoveryLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving Password...</>) : (<><CheckCircle2 className="w-3.5 h-3.5" />Reset Password</>)}
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

