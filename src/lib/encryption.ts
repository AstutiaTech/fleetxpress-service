// Here create a cryptography module that uses AES-256-GCM for encryption and decryption.
// The module should export two functions: encrypt and decrypt.
// The encrypt function should take a string and return an object containing the encrypted data, IV,
// and authentication tag.
// The decrypt function should take the encrypted object and return the original string.

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
if (!key) {
  throw new Error('NEXT_PUBLIC_ENCRYPTION_KEY environment variable is required');
}
const KEY = Buffer.from(key, 'hex');

export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(plain, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decrypt({ data, iv, tag }: { data: string; iv: string; tag: string }) {
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
