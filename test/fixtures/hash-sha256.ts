export async function hashSHA256(input: string | ArrayBufferView): Promise<string> {
  const data = normalizeToUint8Array(input);
  const subtle = await getSubtleCrypto();

  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeToUint8Array(input: string | ArrayBufferView): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  throw new TypeError('Input must be a string or a typed array');
}

async function getSubtleCrypto(): Promise<SubtleCrypto> {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  const nodeCrypto = await import('node:crypto');
  return nodeCrypto.webcrypto.subtle as SubtleCrypto;
}
