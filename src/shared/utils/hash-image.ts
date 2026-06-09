import { createHash } from 'crypto';
// Gera hash SHA256 de um buffer
export function generateImageHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
// Gera hash de string base64
export function generateImageHashFromBase64(base64: string): string {
  const clean = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
  const buffer = Buffer.from(clean, 'base64');
  return generateImageHash(buffer);
}