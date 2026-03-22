import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEFAULT_LOCAL_SECRET = "lumino-local-development-auth-secret-32";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = "v1";
const IV_LENGTH = 12;

function getEncryptionSecret(): string {
  return process.env.BETTER_AUTH_SECRET?.trim() || DEFAULT_LOCAL_SECRET;
}

function getEncryptionKey(): Buffer {
  return createHash("sha256").update(getEncryptionSecret()).digest();
}

function encodeBuffer(value: Buffer): string {
  return value.toString("base64url");
}

function decodeBuffer(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encryptedValue = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    encodeBuffer(iv),
    encodeBuffer(authTag),
    encodeBuffer(encryptedValue),
  ].join(".");
}

export function decryptSecret(value: string): string {
  const [version, encodedIv, encodedAuthTag, encodedPayload] = value.split(".");

  if (
    version !== ENCRYPTION_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedPayload
  ) {
    return value;
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    decodeBuffer(encodedIv),
  );

  decipher.setAuthTag(decodeBuffer(encodedAuthTag));

  return Buffer.concat([
    decipher.update(decodeBuffer(encodedPayload)),
    decipher.final(),
  ]).toString("utf8");
}
