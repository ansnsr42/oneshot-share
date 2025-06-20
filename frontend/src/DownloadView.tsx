import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { decrypt } from './crypto';

export default function DownloadView() {
  const { id } = useParams();
  const [status, setStatus] = useState('Starting…');

  useEffect(() => {
    async function run() {
      try {
        // 1) Schlüssel aus Fragment holen
        const keyMatch = window.location.hash.match(/k=(.+)$/);
        if (!keyMatch) throw new Error('No key fragment found in URL');

        setStatus('Fetching ciphertext …');

        // 2) Ciphertext laden (geht über Vite-Proxy an :8080)
        const res = await fetch(`/d/${id}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const cipher = await res.arrayBuffer();

        setStatus('Decrypting …');

        // 3) Entschlüsseln
        const plain = await decrypt(cipher, keyMatch[1]);

        setStatus('Saving file …');

        // 4) Download
        const blob = new Blob([plain]);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'download';   // Optional: Fragment „&n=name“ parsen
        a.click();
        URL.revokeObjectURL(url);

        setStatus('✅ File downloaded & decrypted');
      } catch (e: any) {
        console.error(e);          // ⇦ volle Fehlermeldung
        setStatus(`❌ ${e.message ?? e}`);
      }
    }
    run();
  }, [id]);

  return <div className="p-8">{status}</div>;
}

