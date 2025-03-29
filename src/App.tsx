
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Dashboard from "@/pages/Dashboard";
import CreateBot from "@/pages/CreateBot";
import EditBot from "@/pages/EditBot";
import Conversations from "@/pages/Conversations";
import ScrapedSite from "@/pages/ScrapedSite";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Team from "@/pages/Team";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Index from "@/pages/Index";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/preview" element={<ScrapedSite />} />
            <Route path="/scraped-site" element={<ScrapedSite />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/create-bot"
              element={
                <ProtectedRoute>
                  <CreateBot />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/edit-bot/:id"
              element={
                <ProtectedRoute>
                  <EditBot />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/conversations/:botId"
              element={
                <ProtectedRoute>
                  <Conversations />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SonnerToaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
