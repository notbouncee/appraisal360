import { Toaster } from "@/components/molecules/toaster";
import { Toaster as Sonner } from "@/components/atoms/sonner";
import { TooltipProvider } from "@/components/molecules/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/templates/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import GiveFeedback from "./pages/GiveFeedback";
import ViewFeedback from "./pages/ViewFeedback";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ViewUpvotes from "./pages/ViewUpvotes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/give-feedback" element={<ProtectedRoute><GiveFeedback /></ProtectedRoute>} />
            <Route path="/view-feedback" element={<ProtectedRoute><ViewFeedback /></ProtectedRoute>} />
            <Route path="/view-upvotes" element={<ProtectedRoute><ViewUpvotes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
