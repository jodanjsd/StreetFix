import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  CheckCircle2,
  Clock,
  UserPlus,
  Building2,
  Eye,
  EyeOff,
  MapPin,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import { HOTLINKED_IMAGES, NIGERIAN_CADASTRE } from '../data/mockData';
import { ResidentAccount, ScreenRoute, UserSession } from '../types';
import { SafeImage } from '../components/SafeImage';
import { OtpVerificationCard } from '../components/OtpVerificationCard';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  findResidentAccountByIdentifier,
  generateOtpCode,
  isValidNgPhone,
  normalizeNgPhone,
} from '../utils/authAccounts';

interface AuthHubProps {
  onLogin: (session: UserSession, idToken?: string) => void;
  onNavigate: (route: ScreenRoute) => void;
  redirectTarget?: ScreenRoute;
  isAdminSession?: boolean;
  hasSession?: boolean;
  residentAccounts?: ResidentAccount[];
  onSaveResidentAccount?: (account: ResidentAccount) => void;
  onVerifyResidentAccount?: (accountId: string) => void;
  onNotify?: (msg: string) => void;
}

export const AuthHub: React.FC<AuthHubProps> = ({
  onLogin,
  onNavigate,
  redirectTarget = 'resident',
  isAdminSession = false,
  hasSession = false,
  residentAccounts = [],
  onSaveResidentAccount,
  onVerifyResidentAccount,
  onNotify,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sign In fields (empty by default so unregistered users cannot blindly log in)
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Resident registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stateKey, setStateKey] = useState('akwa_ibom');
  const [lgaKey, setLgaKey] = useState('uyo');
  const [ward, setWard] = useState('Uyo Urban Ward 1');
  const [street, setStreet] = useState('Oron Road');
  const [plotNo, setPlotNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  const [pendingVerification, setPendingVerification] = useState<{
    account: ResidentAccount;
    code: string;
  } | null>(null);

  const selectedState = NIGERIAN_CADASTRE[stateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const availableLgas = Object.entries(selectedState.lgas);
  const selectedLgaObj =
    selectedState.lgas[lgaKey] || Object.values(selectedState.lgas)[0];

  const destinationLabel =
    redirectTarget === 'report'
      ? 'GPS Geotag Studio (Report Issue)'
      : redirectTarget === 'directory'
      ? 'Incident Tracker'
      : 'Resident Dashboard';

  const handleStateChange = (newState: string) => {
    setStateKey(newState);
    const firstLgaKey = Object.keys(NIGERIAN_CADASTRE[newState].lgas)[0];
    setLgaKey(firstLgaKey);
    const lgaObj = NIGERIAN_CADASTRE[newState].lgas[firstLgaKey];
    setWard(lgaObj.wards[0] || '');
    setStreet(lgaObj.streets[0] || '');
  };

  const handleLgaChange = (newLga: string) => {
    setLgaKey(newLga);
    const lgaObj = selectedState.lgas[newLga];
    if (lgaObj) {
      setWard(lgaObj.wards[0] || '');
      setStreet(lgaObj.streets[0] || '');
    }
  };

  const completeLoginToDestination = (account: ResidentAccount, idToken?: string) => {
    onLogin(
      {
        name: account.name,
        role: 'resident',
        jurisdiction: `${account.state} · ${account.lga}`,
        email: account.email,
        phone: account.phone,
        avatarUrl: account.avatarUrl,
      },
      idToken
    );
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data.error || 'Could not complete Google Sign-In.');
        return;
      }
      if (data.resident) {
        onSaveResidentAccount?.({ ...data.resident, password: '' });
        completeLoginToDestination(data.resident, idToken);
      } else {
        onLogin(
          {
            name: result.user.displayName || result.user.email || 'StreetFix Resident',
            role: 'resident',
            jurisdiction: 'Akwa Ibom State · Uyo LGA',
            email: result.user.email || undefined,
            avatarUrl: result.user.photoURL || undefined,
          },
          idToken
        );
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'Google sign-in popup was closed before finishing.'
          : 'Could not complete Google Sign-In. Please try again.';
      setAuthError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!fullName.trim()) {
      setAuthError('Please enter your full legal name.');
      return;
    }
    if (!isValidNgPhone(phone)) {
      setAuthError('Enter a valid Nigerian mobile phone number (WhatsApp & SMS capable).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Choose a password with at least 6 characters.');
      return;
    }

    const normalizedPhone = normalizeNgPhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    const existingVerified = residentAccounts.find(
      (acc) =>
        acc.verified &&
        (acc.email.toLowerCase() === normalizedEmail || acc.phone === normalizedPhone)
    );
    if (existingVerified) {
      setAuthError(
        'An account with this email or phone number already exists. Please switch to Sign In.'
      );
      return;
    }

    const newAccount: ResidentAccount = {
      id: `res-${Date.now()}`,
      name: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      state: selectedState.name,
      lga: selectedLgaObj.name,
      ward,
      street: street.trim() || undefined,
      plotNo: plotNo.trim() || undefined,
      landmark: landmark.trim() || undefined,
      whatsappAlerts,
      verified: false,
      createdAt: new Date().toISOString(),
    };

    onSaveResidentAccount?.(newAccount);
    const code = generateOtpCode();
    setPendingVerification({ account: newAccount, code });
    onNotify?.(`6-digit confirmation code sent via WhatsApp & SMS to ${normalizedPhone}.`);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!signInIdentifier.trim() || !signInPassword) {
      setAuthError('Enter both your registered email/phone and password.');
      return;
    }

    let matched: ResidentAccount | undefined;
    try {
      const res = await fetch('/api/auth/resident-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signInIdentifier.trim(),
          password: signInPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        matched = data.resident;
      } else if (res.status === 401 || res.status === 403 || res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Authentication failed.');
        return;
      }
    } catch {
      // Fallback to local state when server is unreachable
    }

    if (!matched) {
      matched = findResidentAccountByIdentifier(residentAccounts, signInIdentifier);
      if (!matched) {
        setAuthError(
          'No account found for this email or phone number. Create an account first before signing in.'
        );
        return;
      }

      if (matched.password !== signInPassword) {
        setAuthError('Incorrect password. Please check your credentials and try again.');
        return;
      }

      if (matched.status === 'Suspended') {
        setAuthError(
          `Resident account for ${matched.name} is currently suspended by the Office of StreetFix.`
        );
        return;
      }
    }

    if (!matched.verified) {
      const code = generateOtpCode();
      setPendingVerification({ account: matched, code });
      onNotify?.(
        `Account phone confirmation required. Code sent via WhatsApp & SMS to ${matched.phone}.`
      );
      return;
    }

    completeLoginToDestination(matched);
  };

  return (
    <main className="min-h-screen bg-[#F8FAF5] py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN: Civic Telemetry Showcase */}
        <section className="lg:col-span-5 space-y-6 min-w-0">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E06236]">
              <span className="w-2 h-2 rounded-full bg-[#E06236]" />
              <span>Civic Telemetry &amp; Ward Dispatch</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1D1A] tracking-tight leading-tight">
              Fixing Nigeria together, street by street.
            </h1>
            <p className="text-sm text-[#4A5568] leading-relaxed">
              Connect directly with municipal public works crews, monitor repair work orders in your ward, or access authorized telemetry dispatch tools.
            </p>
          </div>

          {/* 2 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#4A5568]">
                <span>FIXED_METRICS</span>
                <CheckCircle2 className="w-4 h-4 text-[#132E20]" />
              </div>
              <div className="text-2xl font-extrabold text-[#1A1D1A] tabular-nums">14,829+</div>
              <p className="text-xs text-[#4A5568]">
                Public infrastructure hazards resolved across 36 states
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#4A5568]">
                <span>DISPATCH_SLA</span>
                <Clock className="w-4 h-4 text-[#E06236]" />
              </div>
              <div className="text-2xl font-extrabold text-[#1A1D1A] tabular-nums">4.2 hrs</div>
              <p className="text-xs text-[#4A5568]">
                Average first-response crew triage &amp; inspection SLA
              </p>
            </div>
          </div>

          {/* Live Municipal Activity Stream */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A1D1A]">
                Live Municipal Activity Stream
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F3F4EF] font-mono text-[10px] font-bold text-[#132E20]">
                OPS-RADAR
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4EF] text-[#132E20] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1A1D1A]">AKSEPB Rapid Clearing Team</span>
                    <span className="text-[#4A5568]">14m ago</span>
                  </div>
                  <p className="text-xs text-[#4A5568]">
                    Drainage desilting &amp; debris clear-out finalized along Abak Road, Uyo.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      RESOLVED
                    </span>
                    <span className="font-mono text-[11px] text-[#4A5568]">#REF-AKS-8941</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-[#F1F5F9]">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4EF] text-[#132E20] flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1A1D1A]">AKRMA Asphalt Paving Unit</span>
                    <span className="text-[#4A5568]">52m ago</span>
                  </div>
                  <p className="text-xs text-[#4A5568]">
                    Pothole cold-mix patching completed along Oron Road &amp; Ibom Plaza junction.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      RESOLVED
                    </span>
                    <span className="font-mono text-[11px] text-[#4A5568]">#REF-UYO-2204</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
            <SafeImage
              src={HOTLINKED_IMAGES.ikoyiAvatar}
              alt="Chief Ekpo Effiong"
              className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0] shrink-0"
            />
            <div className="space-y-2">
              <p className="text-xs italic text-[#1A1D1A]/85 leading-relaxed">
                “We logged a collapsed culvert on our street on Monday morning. By Wednesday noon, the Works crew had poured fresh reinforcement. The live SMS alerts kept our whole community reassured.”
              </p>
              <div className="text-xs">
                <span className="font-bold text-[#1A1D1A]">Chief Ekpo Effiong</span>
                <span className="text-[#4A5568]"> · Ewet Housing Residents Association, Uyo</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Resident Sign In & Sign Up Form Card */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 md:p-8 space-y-6 min-w-0">
          <div className="p-3.5 rounded-xl bg-[#F4FBE4] border border-[#D8FA64] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
            <span className="font-semibold text-[#132E20]">
              Sign up or sign in to submit geo-tagged issue reports and receive SMS/WhatsApp repair updates.
            </span>
            {!isAdminSession && !hasSession && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="font-bold text-[#132E20] hover:underline shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Admin Sign In →
              </button>
            )}
          </div>

          {/* Sign In vs Sign Up Sub-tabs */}
          {!pendingVerification && (
            <div className="flex items-center gap-6 border-b border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError('');
                }}
                className={`pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  authTab === 'signin'
                    ? 'border-[#132E20] text-[#1A1D1A]'
                    : 'border-transparent text-[#4A5568]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
                className={`pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  authTab === 'register'
                    ? 'border-[#132E20] text-[#1A1D1A]'
                    : 'border-transparent text-[#4A5568]'
                }`}
              >
                Create Account / Sign Up
              </button>
            </div>
          )}

          {authError && !pendingVerification && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex flex-wrap items-center justify-between gap-2">
              <span>{authError}</span>
              {authTab === 'signin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setAuthError('');
                  }}
                  className="text-xs font-bold text-[#E06236] hover:underline cursor-pointer"
                >
                  Create Account →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setAuthError('');
                  }}
                  className="text-xs font-bold text-[#132E20] hover:underline cursor-pointer"
                >
                  Sign In →
                </button>
              )}
            </div>
          )}

          {!pendingVerification && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAF5] text-[#1A1D1A] text-xs font-bold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
              </button>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <span className="flex-1 h-px bg-[#E2E8F0]" />
                <span>or use StreetFix email / phone</span>
                <span className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
            </div>
          )}

          {pendingVerification ? (
            <OtpVerificationCard
              phone={pendingVerification.account.phone}
              email={pendingVerification.account.email}
              recipientName={pendingVerification.account.name}
              generatedCode={pendingVerification.code}
              destinationLabel={destinationLabel}
              onVerifySuccess={() => {
                const verifiedAccount: ResidentAccount = {
                  ...pendingVerification.account,
                  verified: true,
                };
                onVerifyResidentAccount?.(verifiedAccount.id);
                setPendingVerification(null);
                onNotify?.(
                  `WhatsApp & SMS code verified! Redirecting to ${destinationLabel}.`
                );
                completeLoginToDestination(verifiedAccount);
              }}
              onResendCode={() => {
                const nextCode = generateOtpCode();
                setPendingVerification((prev) =>
                  prev ? { ...prev, code: nextCode } : null
                );
                onNotify?.(
                  `New confirmation code sent to WhatsApp & SMS (${pendingVerification.account.phone}).`
                );
              }}
              onBack={() => setPendingVerification(null)}
            />
          ) : authTab === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1D1A]">
                      Join Nigeria Civic Watch &amp; Neighborhood Dispatch
                    </h2>
                    <p className="text-xs text-[#4A5568] mt-1">
                      Register with your residential jurisdiction. A 6-digit confirmation code will be sent to your WhatsApp &amp; SMS before entering {destinationLabel}.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Full Legal Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      required
                      placeholder="e.g. Nsikak Udoh"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3.5 py-2.5 text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                        Mobile Phone Number (WhatsApp Enabled)
                      </label>
                      <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] overflow-hidden focus-within:border-[#132E20]">
                        <span className="px-3 py-2.5 bg-[#EDEEE9] text-xs font-mono font-bold text-[#4A5568] border-r border-[#E2E8F0]">
                          +234
                        </span>
                        <input
                          id="auth-phone"
                          type="tel"
                          required
                          placeholder="803 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-transparent px-3 py-2.5 text-sm text-[#1A1D1A] focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-email" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                        Email Address
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        placeholder="resident@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3.5 py-2.5 text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Residential Geographic Jurisdiction */}
                  <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0] space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A1D1A] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E06236]" />
                        Residential Geographic Jurisdiction
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#4A5568]">
                        CADASTRE_SYNC
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <label htmlFor="cad-state" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                          State of Residence (36 States + FCT)
                        </label>
                        <select
                          id="cad-state"
                          value={stateKey}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                        >
                          {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="cad-lga" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                          Local Government Area (LGA)
                        </label>
                        <select
                          id="cad-lga"
                          value={lgaKey}
                          onChange={(e) => handleLgaChange(e.target.value)}
                          className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                        >
                          {availableLgas.map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <label htmlFor="cad-ward" className="text-xs font-semibold text-[#1A1D1A]">
                          LCDA / Ward / Neighborhood CDA
                        </label>
                        <span className="text-[11px] font-semibold text-[#132E20]">
                          Assigned: {selectedLgaObj.dispatch}
                        </span>
                      </div>
                      <select
                        id="cad-ward"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                      >
                        {selectedLgaObj.wards.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <label htmlFor="cad-street" className="text-xs font-semibold text-[#1A1D1A]">
                          Primary Residential Street / Thoroughfare
                        </label>
                        <span className="text-[11px] text-[#4A5568]">
                          {selectedLgaObj.streets.length} streets loaded
                        </span>
                      </div>
                      <input
                        id="cad-street"
                        list="auth-streets-list"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#1A1D1A]"
                      />
                      <datalist id="auth-streets-list">
                        {selectedLgaObj.streets.map((st) => (
                          <option key={st} value={st} />
                        ))}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="cad-plot" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                          House / Plot Number
                        </label>
                        <input
                          id="cad-plot"
                          type="text"
                          value={plotNo}
                          onChange={(e) => setPlotNo(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#1A1D1A]"
                        />
                      </div>
                      <div>
                        <label htmlFor="cad-landmark" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                          Nearest Landmark / Bus Stop
                        </label>
                        <input
                          id="cad-landmark"
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#1A1D1A]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Choose Account Password
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3.5 py-2.5 pr-10 text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#1A1D1A] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => setWhatsappAlerts(e.target.checked)}
                      className="mt-0.5 rounded border-[#CBD5E1] text-[#132E20]"
                    />
                    <span className="text-xs text-[#4A5568]">
                      Send me instant WhatsApp &amp; SMS dispatch advisories and my account confirmation code.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full bg-[#E06236] hover:bg-[#D35400] text-white py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account &amp; Send WhatsApp / SMS Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignInSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1D1A]">Welcome back to StreetFix</h2>
                    <p className="text-xs text-[#4A5568] mt-1">
                      Sign in with your registered email or mobile number to continue to {destinationLabel}.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="signin-email" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Registered Email or Phone (+234)
                    </label>
                    <input
                      id="signin-email"
                      type="text"
                      required
                      placeholder="resident@example.com or 0803 123 4567"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3.5 py-2.5 text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="signin-password" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your account password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3.5 py-2.5 pr-10 text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#1A1D1A] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#132E20] hover:bg-[#183D2A] text-[#D8FA64] py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {redirectTarget === 'report'
                        ? 'Sign In & Continue to Report Issue'
                        : redirectTarget === 'directory'
                        ? 'Sign In & Open Incident Tracker'
                        : 'Sign In to Resident Dashboard'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

          <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5568]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Photo-verified audits
            </span>
            <button
              type="button"
              onClick={() => onNavigate('directory')}
              className="font-semibold text-[#132E20] hover:underline cursor-pointer"
            >
              Public GIS Hub live →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
