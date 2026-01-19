import { Switch, Route, Redirect, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import React, { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Email from "@/pages/Email";
import Chat from "@/pages/Chat";
import WhatsApp from "@/pages/WhatsApp";
import Telegram from "@/pages/Telegram";
import Communications from "@/pages/Communications";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Archivio from "@/pages/Archivio";
import Login from "@/pages/Login";
import ToDoList from "@/pages/ToDoList";
import PulseKeep from "@/pages/PulseKeep";
import Whiteboard from "@/pages/Whiteboard";
import Meeting from "@/pages/Meeting";
import Analytics from "@/pages/Analytics";
import Manual from "@/pages/Manual";
import Setup from "@/pages/Setup";
import ControlPanel from "@/pages/ControlPanel";
import SharedFile from "@/pages/SharedFile";
import SharedProject from "@/pages/SharedProject";
import InternalProjectView from "@/pages/InternalProjectView";
import ShareView from "@/pages/ShareView";
import CustomerPortal from "@/pages/CustomerPortal";
import StaffPortal from "@/pages/StaffPortal";
import PortaleTimbratura from "@/pages/PortaleTimbratura";
import Monitor from "@/pages/Monitor";
import CourierPage from "@/pages/CourierPage";
import PublicMappaClienti from "@/pages/PublicMappaClienti";
import SocialMarketing from "@/pages/SocialMarketing";
import HRManager from "@/pages/HRManager";
import Cedolini from "@/pages/Cedolini";
import Macchinari from "@/pages/Macchinari";
import FinanzaPersonale from "@/pages/FinanzaPersonale";
import CompanySearch from "@/pages/CompanySearch";
import MobileTasks from "@/pages/MobileTasks";
const Library = lazy(() => import("@/pages/Library"));

// Caricamento pigro (Lazy Loading) per le pagine più pesanti (>100KB)
const Documents = lazy(() => import("@/pages/Documents"));
const Finanza = lazy(() => import("@/pages/Finanza"));
const Anagrafica = lazy(() => import("@/pages/Anagrafica"));
const Produzione = lazy(() => import("@/pages/Produzione"));
const CRM = lazy(() => import("@/pages/CRM"));
const ProjectsAndTasks = lazy(() => import("@/pages/ProjectsAndTasks"));
const OfficePulse = lazy(() => import("@/pages/OfficePulse"));
const OfficeEditor = lazy(() => import("@/pages/OfficeEditor"));

const LoadingFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground animate-pulse">Caricamento modulo...</p>
    </div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/company-search" component={CompanySearch} />
      <Route path="/email" component={Email} />
      <Route path="/chat" component={Chat} />
      <Route path="/whatsapp" component={WhatsApp} />
      <Route path="/telegram" component={Telegram} />
      <Route path="/communications" component={Communications} />
      <Route path="/mobile/tasks" component={MobileTasks} />
      <Route path="/projects">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <ProjectsAndTasks />
          </ErrorBoundary>
        </Suspense>
      </Route>
      <Route path="/documents">
        <Suspense fallback={<LoadingFallback />}>
          <Documents />
        </Suspense>
      </Route>
      <Route path="/archivio" component={Archivio} />
      <Route path="/anagrafica">
        <Suspense fallback={<LoadingFallback />}>
          <Anagrafica />
        </Suspense>
      </Route>
      <Route path="/finanza">
        <Suspense fallback={<LoadingFallback />}>
          <Finanza />
        </Suspense>
      </Route>
      <Route path="/produzione">
        <Suspense fallback={<LoadingFallback />}>
          <Produzione />
        </Suspense>
      </Route>
      <Route path="/macchinari" component={Macchinari} />
      <Route path="/finanza-personale" component={FinanzaPersonale} />
      <Route path="/crm">
        <Suspense fallback={<LoadingFallback />}>
          <CRM />
        </Suspense>
      </Route>
      <Route path="/social-marketing" component={SocialMarketing} />
      <Route path="/hr-manager" component={HRManager} />
      <Route path="/cedolini" component={Cedolini} />
      <Route path="/todolist" component={ToDoList} />
      <Route path="/library">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <Library />
          </ErrorBoundary>
        </Suspense>
      </Route>
      <Route path="/keep" component={PulseKeep} />
      <Route path="/office-pulse">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <OfficePulse />
          </ErrorBoundary>
        </Suspense>
      </Route>
      <Route path="/office-editor/:id">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <OfficeEditor />
          </ErrorBoundary>
        </Suspense>
      </Route>
      <Route path="/whiteboard" component={Whiteboard} />
      <Route path="/meeting" component={Meeting} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/manual" component={Manual} />
      <Route path="/control-panel" component={ControlPanel} />
      <Route path="/users">{() => <Redirect to="/control-panel" />}</Route>
      <Route path="/permissions">{() => <Redirect to="/control-panel" />}</Route>
      <Route path="/database">{() => <Redirect to="/control-panel" />}</Route>
      <Route path="/share/:token" component={ShareView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  // Check setup status
  const { data: setupStatus, isLoading: isSetupLoading } = useQuery({
    queryKey: ["setup-status"],
    queryFn: async () => {
      const res = await fetch("/api/setup/status");
      return res.json();
    },
  });

  if (isLoading || isSetupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Router />;
}

function PublicRoutes() {
  const [isShared] = useRoute("/shared/:token");

  if (isShared) {
    return <SharedFile />;
  }

  return null;
}

function PublicShareRouter() {
  // Check monitor route first - must bypass auth
  if (typeof window !== "undefined" && window.location.pathname === "/monitor") {
    return <Monitor />;
  }

  // Check public map route - must bypass auth
  if (typeof window !== "undefined" && window.location.pathname === "/tv/mappa-clienti") {
    return <PublicMappaClienti />;
  }

  // Staff portal route - must bypass auth
  if (typeof window !== "undefined" && window.location.pathname === "/staff-portal") {
    return <StaffPortal />;
  }

  // Portale Timbratura - must bypass auth
  if (typeof window !== "undefined" && window.location.pathname === "/portale-timbratura") {
    return <PortaleTimbratura />;
  }

  // Redirect for old route
  if (typeof window !== "undefined" && window.location.pathname === "/portale-collaboratori") {
    return <StaffPortal />;
  }

  const [isSharedFile] = useRoute("/shared/:token");
  const [isSharedProject] = useRoute("/shared/project/:token");
  const [isInternalProject] = useRoute("/internal/project/:id");
  const [isShareView] = useRoute("/share/:token");
  const [isCustomerPortal] = useRoute("/portal/:token");
  const [isCourierPage] = useRoute("/corriere/:token");

  if (isSharedProject) return <SharedProject />;
  if (isInternalProject) return <InternalProjectView />;
  if (isSharedFile) return <SharedFile />;
  if (isShareView) return <ShareView />;
  if (isCustomerPortal) return <CustomerPortal />;
  if (isCourierPage) return <CourierPage />;

  return <AuthenticatedApp />;
}

import { OfflineNotificationBanner } from "@/components/OfflineIndicator";
import { offlineManager } from "@/lib/offline-manager";

function App() {
  // Richiedi permessi notifiche all'avvio
  React.useEffect(() => {
    offlineManager.requestNotificationPermission();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <ConfirmProvider>
              <OfflineNotificationBanner />
              <Toaster />
              <PublicShareRouter />
            </ConfirmProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
