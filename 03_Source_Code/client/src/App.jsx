import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AdminLayout from './components/Layout/AdminLayout';

// Public Pages
import Home from './pages/public/Home';
import AboutUs from './pages/public/AboutUs';
import Articles from './pages/public/Articles';
import ArticleDetail from './pages/public/ArticleDetail';
import Document from './pages/public/Document';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminArticles from './pages/admin/AdminArticles';
import AdminDocs from './pages/admin/AdminDocs';
import AdminOps from './pages/admin/AdminOps';
import SecurityDashboard from './pages/admin/SecurityDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes with Header & Footer */}
          <Route path="/" element={<><Header /><Home /><Footer /></>} />
          <Route path="/about-us" element={<><Header /><AboutUs /><Footer /></>} />
          <Route path="/articles" element={<><Header /><Articles /><Footer /></>} />
          <Route path="/articles/:id" element={<><Header /><ArticleDetail /><Footer /></>} />
          <Route path="/document" element={<><Header /><Document /><Footer /></>} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="documentation" element={<AdminDocs />} />
            <Route path="operations" element={<AdminOps />} />
            <Route path="security" element={<SecurityDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
