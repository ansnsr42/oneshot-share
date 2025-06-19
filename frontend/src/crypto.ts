export async function encrypt(
  file: File
): Promise<{ cipher: ArrayBuffer; keyB64: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = await file.arrayBuffer();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);

  const exported = await crypto.subtle.exportKey('raw', key);
  const keyBlob = new Uint8Array([...iv, ...new Uint8Array(exported)]);
  return { cipher, keyB64: btoa(String.fromCharCode(...keyBlob)) };
}

export async function decrypt(
  cipher: ArrayBuffer,
  keyB64: string
): Promise<ArrayBuffer> {
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const iv = keyBytes.slice(0, 12);
  const rawKey = keyBytes.slice(12);
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
}

