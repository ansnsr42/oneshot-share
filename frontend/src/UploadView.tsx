import { useState } from 'react';
import { encrypt } from './crypto';

const API = import.meta.env.VITE_API ?? 'https://files.example.com';

export default function UploadView() {
  const [link, setLink] = useState<string>();

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const { cipher, keyB64 } = await encrypt(file);
    const resp = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: cipher
    });

    const { link: dl } = await resp.json();
    setLink(`${dl}#k=${keyB64}`);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Zero-Knowledge Share</h1>
      <input type="file" onChange={handleSelect} />
      {link && (
        <p className="mt-4 break-all">
          Share Link:&nbsp;<a href={link}>{link}</a>
        </p>
      )}
    </div>
  );
}

