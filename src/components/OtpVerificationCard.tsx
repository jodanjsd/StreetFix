import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface OtpVerificationCardProps {
  phone: string;
  email: string;
  recipientName: string;
  generatedCode: string;
  destinationLabel: string;
  onVerifySuccess: () => void;
  onResendCode: () => void;
  onBack: () => void;
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  phone,
  email,
  recipientName,
  generatedCode,
  destinationLabel,
  onVerifySuccess,
  onResendCode,
  onBack,
}) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [deliveryTime, setDeliveryTime] = useState(() =>
    new Date().toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = enteredCode.replace(/\D/g, '').trim();
    if (cleaned.length !== 6) {
      setError('Enter the full 6-digit confirmation code sent to your WhatsApp and SMS.');
      return;
    }
    if (cleaned !== generatedCode) {
      setError('Confirmation code does not match. Check the WhatsApp or SMS message below.');
      return;
    }
    setError('');
    onVerifySuccess();
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    onResendCode();
    setEnteredCode('');
    setError('');
    setCooldown(30);
    setDeliveryTime(
      new Date().toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0B231A] text-[#D8FA64] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#E06236]">
              2-Step Phone Confirmation
            </p>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1A1D1A]">
              Verify WhatsApp &amp; SMS Code
            </h3>
            <p className="text-xs text-[#4A5568] mt-0.5">
              A 6-digit confirmation code has been dispatched to{' '}
              <span className="font-mono font-bold text-[#1A1D1A]">{phone}</span> before opening{' '}
              {destinationLabel}.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Delivery Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
          <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-emerald-950">WhatsApp Dispatch</div>
            <div className="text-[11px] text-emerald-800 truncate">
              Delivered to {phone} · {deliveryTime} WAT
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#F4FBE4] border border-[#D8FA64] flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-[#132E20] shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-[#132E20]">SMS Gateway (STREETFIX)</div>
            <div className="text-[11px] text-[#4A5568] truncate">
              Delivered to {phone} · {deliveryTime} WAT
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulated WhatsApp & SMS Message Preview */}
      <div className="p-3.5 rounded-xl bg-[#0B231A] text-white border border-white/10 space-y-2">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-[#D8FA64] inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            WhatsApp &amp; SMS Message Sent ({phone})
          </span>
          <button
            type="button"
            onClick={() => {
              setEnteredCode(generatedCode);
              setError('');
            }}
            className="px-2 py-0.5 rounded bg-[#183D2A] hover:bg-[#D8FA64] hover:text-[#0B231A] text-[#D8FA64] font-semibold transition-colors cursor-pointer shrink-0"
          >
            Auto-fill code
          </button>
        </div>
        <p className="text-xs text-[#E2E8F0] leading-relaxed">
          Hello <span className="font-semibold text-white">{recipientName}</span>, your StreetFix NG account verification code for <span className="font-mono text-[#A3B899]">{email}</span> is{' '}
          <span className="inline-block px-2 py-0.5 rounded bg-[#132E20] border border-[#D8FA64]/50 font-mono font-extrabold text-sm text-[#D8FA64] tracking-widest tabular-nums">
            {generatedCode}
          </span>
          . Enter this code to continue to {destinationLabel}.
        </p>
      </div>

      {/* Code Entry Form */}
      <form onSubmit={handleVerifySubmit} className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor={`otp-input-${phone}`}
            className="block text-xs font-semibold text-[#1A1D1A] mb-1.5"
          >
            Enter 6-digit Confirmation Code *
          </label>
          <input
            id={`otp-input-${phone}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={enteredCode}
            onChange={(e) => {
              setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (error) setError('');
            }}
            placeholder="000000"
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAF5] px-4 py-3 text-center font-mono text-xl font-extrabold tracking-[0.4em] text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none tabular-nums"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#E06236] hover:bg-[#D35400] text-white py-3 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Verify Code &amp; Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-semibold text-[#4A5568] hover:text-[#1A1D1A] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Edit details</span>
        </button>

        <button
          type="button"
          disabled={cooldown > 0}
          onClick={handleResend}
          className={`inline-flex items-center gap-1.5 font-semibold ${
            cooldown > 0
              ? 'text-[#727973] cursor-not-allowed'
              : 'text-[#132E20] hover:text-[#E06236] cursor-pointer'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {cooldown > 0
              ? `Resend WhatsApp & SMS in ${cooldown}s`
              : 'Resend code to WhatsApp & SMS'}
          </span>
        </button>
      </div>
    </div>
  );
};
