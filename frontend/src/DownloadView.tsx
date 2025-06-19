import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { decrypt } from './crypto';

const API = import.meta.env.VITE_API ?? 'https://files.example.com';

export default function DownloadView() {
  const { id } = useParams();
  const [status, setStatus] = useState('Downloading…');

  useEffect(() => {
    async function go() {
      const keyMatch = window.location.hash.match(/k=(.+)$/);
      if (!keyMatch) return setStatus('Key missing in URL!');
      try {
        const res = await fetch(`${API}/d/${id}`);
        if (!res.ok) return setStatus(`Server returned ${res.status}`);
        const cipher = await res.arrayBuffer();
        const plain = await decrypt(cipher, keyMatch[1]);
        const blob = new Blob([plain]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'download'; // optional: use Content-Disposition later
        a.click();
        URL.revokeObjectURL(url);
        setStatus('File downloaded.');
      } catch (e) {
        setStatus(String(e));
      }
    }
    go();
  }, [id]);

  return <div className="p-8">{status}</div>;
}

