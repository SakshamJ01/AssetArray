import CryptoJS from "crypto-js";

/**
 * Core-integrity PIN crypto (3.3.x).
 * Replaces SHA256(pin) / AES(passphrase=pin) with PBKDF2 + random salt/IV.
 * Backward compatible: can still decrypt legacy AES(pin) payloads.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_SIZE_WORDS = 256 / 32;

export type PinKdfParams = {
  saltHex: string;
  iterations: number;
};

export function newPinSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
}

export function derivePinKey(pin: string, saltHex: string, iterations = PBKDF2_ITERATIONS): string {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  return CryptoJS.PBKDF2(pin, salt, { keySize: KEY_SIZE_WORDS, iterations }).toString(CryptoJS.enc.Hex);
}

export function buildOwnerId(pin: string, saltHex?: string): string {
  // Owner ID is a non-secret identifier. When a salt is available it is bound
  // into the hash; legacy callers without salt keep the old derivation.
  const material = saltHex ? `${saltHex}:${pin}` : pin;
  return CryptoJS.SHA256(material).toString().slice(0, 24);
}

type VersionedEnvelope = {
  v: 1;
  salt: string;
  iv: string;
  ct: string;
  iter: number;
};

export function encryptPayload(payload: unknown, pin: string, saltHex?: string): string {
  const salt = saltHex || newPinSalt();
  const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
  });
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, { iv });
  const envelope: VersionedEnvelope = {
    v: 1,
    salt,
    iv: iv.toString(CryptoJS.enc.Hex),
    ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iter: PBKDF2_ITERATIONS,
  };
  return `AA1.${Buffer.from(JSON.stringify(envelope)).toString("base64")}`;
}

export function decryptPayload<T>(ciphertext: string, pin: string): T {
  if (ciphertext.startsWith("AA1.")) {
    const envelope = JSON.parse(
      Buffer.from(ciphertext.slice(4), "base64").toString("utf8")
    ) as VersionedEnvelope;
    if (!envelope || envelope.v !== 1 || !envelope.salt || !envelope.iv || !envelope.ct) {
      throw new Error("Unable to decrypt backup. Check your PIN and cloud data.");
    }
    const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(envelope.salt), {
      keySize: KEY_SIZE_WORDS,
      iterations: envelope.iter || PBKDF2_ITERATIONS,
    });
    const bytes = CryptoJS.AES.decrypt(
      envelope.ct,
      key,
      { iv: CryptoJS.enc.Hex.parse(envelope.iv) } as never
    );
    const raw = bytes.toString(CryptoJS.enc.Utf8);
    if (!raw) throw new Error("Unable to decrypt backup. Check your PIN and cloud data.");
    return JSON.parse(raw) as T;
  }
  // Legacy fallback: raw AES passphrase payloads created before 3.3.x hardening.
  const bytes = CryptoJS.AES.decrypt(ciphertext, pin);
  const raw = bytes.toString(CryptoJS.enc.Utf8);
  if (!raw) throw new Error("Unable to decrypt backup. Check your PIN and cloud data.");
  return JSON.parse(raw) as T;
}

/**
 * Brute-force guard: attempt tracking with progressive delay + temporary lockout.
 * Stored in-memory per session; callers persist lockout metadata if needed.
 */
const attemptMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

export function pinAttemptKey(scope = "pin"): string {
  return scope;
}

export function isPinLocked(scope = "pin", now = Date.now()): boolean {
  const s = attemptMap.get(scope);
  return Boolean(s && s.lockedUntil > now);
}

export function recordPinFailure(scope = "pin", now = Date.now()): { count: number; lockedUntil: number } {
  const cur = attemptMap.get(scope) || { count: 0, lockedUntil: 0 };
  const count = cur.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCK_MS * Math.pow(2, count - MAX_ATTEMPTS) : cur.lockedUntil;
  attemptMap.set(scope, { count, lockedUntil });
  return { count, lockedUntil };
}

export function clearPinFailures(scope = "pin"): void {
  attemptMap.delete(scope);
}

export function pinLockDelayMs(scope = "pin"): number {
  const s = attemptMap.get(scope);
  if (!s) return 0;
  if (s.lockedUntil > Date.now()) return s.lockedUntil - Date.now();
  // progressive delay: 500ms * failures, capped at 5s
  return Math.min(500 * s.count, 5000);
}
