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
    const { link } = await res.json();
    setLink(link);                 // z. B.  /d/abc123
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl mb-4">One-Shot File Share</h1>

      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button
        disabled={!file}
        onClick={doUpload}
        className="ml-2 px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
      >
        Upload
      </button>

      {link && (
        <p className="mt-6 break-all">
          Link&nbsp;:&nbsp;<a href={link}>{window.location.origin + link}</a>
        </p>
      )}
    </div>
  );
}

