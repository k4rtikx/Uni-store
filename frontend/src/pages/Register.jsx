import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building, Phone, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import useAuth from '../context/useAuth';
import { COLLEGES, DEFAULT_COLLEGE } from '../constants/campusConstants';
import Tilt3D from '../components/ui/Tilt3D';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: DEFAULT_COLLEGE,
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) { setErrorMessage('Please provide your full name.'); return; }

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@ced.alliance.edu.in')) {
      setErrorMessage('Please use your official CED college email ending with @ced.alliance.edu.in');
      return;
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?[6789]\d{9}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setErrorMessage('Please provide a valid 10-digit Indian mobile number.');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    if (formData.password.length < 6) { setErrorMessage('Password must be at least 6 characters long.'); return; }

    setLoading(true);
    try {
      await registerUser({ ...formData, name: trimmedName, email: trimmedEmail, phone: trimmedPhone });
      navigate('/');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Registration failed. Please use your official CED college email ending with @ced.alliance.edu.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/12 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/12 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

      <Tilt3D max={3} perspective={1000} className="w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-white/70 shadow-2xl shadow-slate-900/10 space-y-5 relative z-10 overflow-hidden">
          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-b-3xl" />

          <div>
            <button type="button" onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer group" aria-label="Go Back">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-600" />
              <span>Back</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/25"
              style={{ transform: 'translateZ(16px)' }}>
              <UserPlus className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Campus Account</h2>
            <p className="text-sm text-slate-500">Join your college community with your verified student email</p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Priya Sharma" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">CED College Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@ced.alliance.edu.in" required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all" />
              </div>
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">College / University Name *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select name="college" value={formData.college} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all cursor-pointer">
                  {COLLEGES.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone / WhatsApp (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password (min. 6 characters) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" tabIndex="-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm transition-all" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer" tabIndex="-1">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 text-sm cursor-pointer disabled:cursor-not-allowed">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Creating Account...</>) : (<><UserPlus className="w-4 h-4" />Register Account</>)}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100/80">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">Sign In here</Link>
          </div>
        </div>
      </Tilt3D>
    </div>
  );
};

export default Register;
