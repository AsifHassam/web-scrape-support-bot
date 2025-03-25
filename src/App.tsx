
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ScrapedSite from "./pages/ScrapedSite";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CreateBot from "./pages/CreateBot";
import EditBot from "./pages/EditBot";
import ProtectedRoute from "./components/ProtectedRoute";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";

// Create a client instance outside of the component
const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/scraped-site" element={<ScrapedSite />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Protected routes (require authentication) */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/create-bot" element={
                <ProtectedRoute>
                  <CreateBot />
                </ProtectedRoute>
              } />
              <Route path="/edit-bot/:id" element={
                <ProtectedRoute>
                  <EditBot />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
