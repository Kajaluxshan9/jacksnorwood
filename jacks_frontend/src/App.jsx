import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Layout
import PublicLayout from './components/layout/PublicLayout';
import ScrollToTop from './components/ui/ScrollToTop';

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const MenuPage = lazy(() => import('./pages/public/MenuPage'));
const PromotionsPage = lazy(() => import('./pages/public/PromotionsPage'));
const EventsPage = lazy(() => import('./pages/public/EventsPage'));
const ReservationPage = lazy(() => import('./pages/public/ReservationPage'));
const GalleryPage = lazy(() => import('./pages/public/GalleryPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));

// Admin
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminHeroImages = lazy(() => import('./pages/admin/AdminHeroImages'));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-pub-light flex items-center justify-center">
      <div className="text-pub-gold text-xl font-display">Loading...</div>
    </div>
  );
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;
  return children;
};

const RouteFallback = () => (
  <div className="min-h-screen bg-pub-light flex items-center justify-center">
    <div className="text-pub-gold text-xl font-display">Loading...</div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#3d2b1f', color: '#f5e6c8', border: '1px solid #c8922a' },
          }}
        />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="reservation" element={<ReservationPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="promotions" element={<AdminPromotions />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="reservations" element={<AdminReservations />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="hero" element={<AdminHeroImages />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
