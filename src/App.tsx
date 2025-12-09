import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Diary from './pages/Diary';
import Rewards from './pages/Rewards';
import Gifts from './pages/Gifts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Diary />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="gifts" element={<Gifts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
