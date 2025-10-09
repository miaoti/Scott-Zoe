import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PhotoGallery from './components/PhotoGallery';
import PhotoDetail from './components/PhotoDetail';
import Memories from './components/Memories';
import Settings from './components/Settings';
import Categories from './components/Categories';
import CategoryPhotos from './components/CategoryPhotos';
import AllPhotos from './components/AllPhotos';
import RecycleBin from './components/RecycleBin';
import Header from './components/Header';
import Scott from './components/Scott';
import Zoe from './components/Zoe';
import SurpriseBoxManager from './components/SurpriseBoxManager';
import TurnBasedNotePad from './components/TurnBasedNotePad';
import NotificationManager from './components/NotificationManager';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';


function AppContent() {
  const { isAuthenticated, loading } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/scott" element={<Scott />} />
        <Route path="/zoe" element={<Zoe />} />
        
        {/* Private Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/" element={isAuthenticated ? (
          <div className="min-h-screen">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Dashboard />
            </main>
          </div>
        ) : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Dashboard />
          </main>

        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/gallery" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <PhotoGallery />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/photos" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <AllPhotos />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/category/:id" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <CategoryPhotos />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/photo/:id" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <PhotoDetail />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/memories" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Memories />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/categories" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Categories />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/recycle-bin" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <RecycleBin />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/settings" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Settings />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="/surprise-boxes" element={isAuthenticated ? (
        <div className="min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <SurpriseBoxManager />
          </main>
        </div>
      ) : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    {/* Only show TurnBasedNotePad on authenticated pages */}
    {/* TEMPORARILY DISABLED - Will be re-enabled later */}
    {/* {isAuthenticated && <TurnBasedNotePad />} */}
  </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DndProvider backend={HTML5Backend}>
          <Router>
            <AppContent />
            <NotificationManager />
          </Router>
        </DndProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;