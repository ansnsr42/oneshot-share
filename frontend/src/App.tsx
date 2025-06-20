import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Upload from './Upload';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}

