
import { createBrowserRouter, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import { Loader2 } from "lucide-react";

// Importe suas páginas e componentes de rota
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/Auth";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";
import Help from "./pages/Help";
import FAQ from "./pages/FAQ";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import AdminManagement from "./pages/AdminManagement";
import UsersManagement from "./pages/UsersManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPetitionList from "./pages/AdminPetitionList";
import AdminPetitionDetail from "./pages/AdminPetitionDetail";
import Teams from "./pages/Teams";
import Stats from "./pages/Stats";
import TokenStore from "./pages/TokenStore";
import TokenSuccess from "./pages/TokenSuccess";
import Dashboard from "./pages/Dashboard";
import PetitionList from "./pages/PetitionList";
import PetitionForm from "./pages/PetitionForm";
import PetitionDetail from "./pages/PetitionDetail";
import PetitionSettings from "./pages/PetitionSettings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AppContent from "./components/AppContent";

// Definição do router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><ScrollRestoration /><LandingPage /></Layout>,
  },
  {
    path: "/auth",
    element: <Layout><ScrollRestoration /><AuthPage /></Layout>,
  },
  // Static Pages
  { path: "/help", element: <Layout><ScrollRestoration /><Help /></Layout> },
  { path: "/faq", element: <Layout><ScrollRestoration /><FAQ /></Layout> },
  { path: "/terms", element: <Layout><ScrollRestoration /><Terms /></Layout> },
  { path: "/privacy", element: <Layout><ScrollRestoration /><Privacy /></Layout> },
  { path: "/security", element: <Layout><ScrollRestoration /><Security /></Layout> },
  // Authenticated Routes
  {
    path: "/dashboard",
    element: <Layout><ScrollRestoration /><PrivateRoute><Dashboard /></PrivateRoute></Layout>,
  },
  {
    path: "/petitions",
    element: <Layout><ScrollRestoration /><PrivateRoute><PetitionList /></PrivateRoute></Layout>,
  },
  {
    path: "/petitions/new",
    element: <Layout><ScrollRestoration /><PrivateRoute><PetitionForm /></PrivateRoute></Layout>,
  },
  {
    path: "/petitions/:id",
    element: <Layout><ScrollRestoration /><PrivateRoute><PetitionDetail /></PrivateRoute></Layout>,
  },
  {
    path: "/petition-settings",
    element: <Layout><ScrollRestoration /><PrivateRoute><PetitionSettings /></PrivateRoute></Layout>,
  },
  {
    path: "/profile",
    element: <Layout><ScrollRestoration /><PrivateRoute><Profile /></PrivateRoute></Layout>,
  },
  {
    path: "/tokens/store",
    element: <Layout><ScrollRestoration /><PrivateRoute><TokenStore /></PrivateRoute></Layout>,
  },
  {
    path: "/tokens/success",
    element: <Layout><ScrollRestoration /><PrivateRoute><TokenSuccess /></PrivateRoute></Layout>,
  },
  {
    path: "/teams",
    element: <Layout><ScrollRestoration /><PrivateRoute><Teams /></PrivateRoute></Layout>,
  },
  // Admin Routes
  {
    path: "/admin/dashboard",
    element: <Layout><ScrollRestoration /><AdminRoute><AdminDashboard /></AdminRoute></Layout>,
  },
  {
    path: "/admin/petitions",
    element: <Layout><ScrollRestoration /><AdminRoute><AdminPetitionList /></AdminRoute></Layout>,
  },
  {
    path: "/admin/petitions/:id",
    element: <Layout><ScrollRestoration /><AdminRoute><AdminPetitionDetail /></AdminRoute></Layout>,
  },
  {
    path: "/admin/admins",
    element: <Layout><ScrollRestoration /><AdminRoute><AdminManagement /></AdminRoute></Layout>,
  },
  {
    path: "/admin/users",
    element: <Layout><ScrollRestoration /><AdminRoute><UsersManagement /></AdminRoute></Layout>,
  },
  // Stats Route
  {
    path: "/stats",
    element: <Layout><ScrollRestoration /><PrivateRoute><Stats /></PrivateRoute></Layout>,
  },
  // 404
  {
    path: "*",
    element: <Layout><ScrollRestoration /><NotFound /></Layout>,
  },
]);

function App() {
  return (
    <AuthProvider>
      <AppContent router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
