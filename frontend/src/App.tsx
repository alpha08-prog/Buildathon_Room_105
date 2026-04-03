import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard            from "./pages/Dashboard";
import IncidentInvestigation from "./pages/IncidentInvestigation";
import AgentsPage           from "./pages/Agents";
import ResponseCenter       from "./pages/ResponseCenter";
import Memory               from "./pages/Memory";
import NotFound             from "./pages/NotFound";
import Squad                from "./pages/Squad";
import Codex                from "./pages/Codex";
import MissionBriefing      from "./pages/MissionBriefing";
import Missions             from "./pages/Missions";

// Global game overlays
import { XpPopupLayer }           from "./components/animations/XpPopup";
import { AchievementUnlockOverlay } from "./components/animations/AchievementUnlock";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* Global gamification overlays — render outside router so they persist across navigation */}
      <XpPopupLayer />
      <AchievementUnlockOverlay />

      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"           element={<Dashboard />} />
          {/* Missions */}
          <Route path="/missions"            element={<Missions />} />
          <Route path="/missions/:id"        element={<MissionBriefing />} />
          {/* Incidents */}
          <Route path="/incidents/:id"       element={<IncidentInvestigation />} />
          {/* Squad & Agents */}
          <Route path="/squad"               element={<Squad />} />
          <Route path="/agents"              element={<AgentsPage />} />
          {/* Response */}
          <Route path="/response"            element={<ResponseCenter />} />
          {/* Codex (replaces Memory) */}
          <Route path="/codex"               element={<Codex />} />
          <Route path="/memory"              element={<Navigate to="/codex" replace />} />
          {/* 404 */}
          <Route path="*"                    element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
