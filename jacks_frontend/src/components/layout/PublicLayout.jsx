import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AnimatedBackground from '../ui/AnimatedBackground';
import LocalBusinessSchema from '../seo/LocalBusinessSchema';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-pub-light relative">
      <LocalBusinessSchema />
      <AnimatedBackground />
      <Navbar />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
