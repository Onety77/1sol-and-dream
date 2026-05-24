import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Dreamboard from './pages/Dreamboard';
import Arena from './pages/Arena';
import HallOfDreams from './pages/HallOfDreams';
import Graveyard from './pages/Graveyard';
import WishingWell from './pages/WishingWell';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

export default function App() {
  const restoreSession = useAuthStore(s => s.restoreSession);
  useEffect(() => { restoreSession(); }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dreamboard" element={<Dreamboard />} />
        <Route path="/arena" element={<Arena />} />
        <Route path="/hall" element={<HallOfDreams />} />
        <Route path="/graveyard" element={<Graveyard />} />
        <Route path="/well" element={<WishingWell />} />
        <Route path="/profile/:wallet" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}
