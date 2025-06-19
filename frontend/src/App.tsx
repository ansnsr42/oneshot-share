import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadView from './UploadView';
import DownloadView from './DownloadView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadView />} />
        <Route path="/d/:id" element={<DownloadView />} />
      </Routes>
    </BrowserRouter>
  );
}

