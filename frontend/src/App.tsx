import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import IncidentInvestigation from "./pages/IncidentInvestigation";
import AgentsPage from "./pages/Agents";
import ResponseCenter from "./pages/ResponseCenter";
import Memory from "./pages/Memory";
import NotFound from "./pages/NotFound";
import { useStore } from "@/store/useStore";

const queryClient = new QueryClient();

function BackendBridge() {
  const { fetchFromBackend, initWebSocket } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch existing data once on mount
    fetchFromBackend();

    // Open WebSocket for live pipeline results
    wsRef.current = initWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackendBridge />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents/:id" element={<IncidentInvestigation />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/response" element={<ResponseCenter />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
