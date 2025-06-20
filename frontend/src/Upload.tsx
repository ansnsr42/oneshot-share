import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<string>();

  async function doUpload() {
    if (!file) return;
    const res = await fetch(`/upload?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: await file.arrayBuffer()
    });
    const { link: rel } = await res.json();     // z. B. "/d/abc123"
    setLink(rel);
  }

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>One-Shot File Share</h1>

      <input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      <button
        disabled={!file}
        onClick={doUpload}
        style={{
          marginLeft: 12,
          padding: '4px 12px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 4,
          opacity: file ? 1 : 0.4
        }}
      >
        Upload
      </button>

      {link && (
        <p style={{ marginTop: 24, wordBreak: 'break-all' }}>
          Link:&nbsp;
          <a href={link}>{window.location.origin + link}</a>
        </p>
      )}
    </div>
  );
}

