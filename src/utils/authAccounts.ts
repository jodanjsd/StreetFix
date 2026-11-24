import { ResidentAccount } from '../types';

export function normalizeNgPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+234')) {
    const rest = cleaned.slice(4).replace(/^0+/, '');
    return `+234${rest}`;
  }
  if (cleaned.startsWith('234')) {
    const rest = cleaned.slice(3).replace(/^0+/, '');
    return `+234${rest}`;
  }
  if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+234${cleaned}`;
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function findResidentAccountByIdentifier(
  accounts: ResidentAccount[],
  identifier: string
): ResidentAccount | undefined {
  const trimmed = identifier.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  const normalizedPhone = normalizeNgPhone(trimmed);

  return accounts.find((acc) => {
    if (acc.email.toLowerCase() === lower) return true;
    if (normalizedPhone && acc.phone === normalizedPhone) return true;
    return false;
  });
}

export function isValidNgPhone(raw: string): boolean {
  const normalized = normalizeNgPhone(raw);
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 11 && digits.length <= 15;
}
