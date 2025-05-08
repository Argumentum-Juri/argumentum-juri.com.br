
import { createBrowserRouter, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// LandingPage
import LandingPage from "./pages/LandingPage";

// Pages
import Auth from "./pages/Auth";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";
import Help from "./pages/Help";
import FAQ from "./pages/FAQ";

// Context
import { AuthProvider } from "./contexts/AuthContext";
import { TeamProvider } from "./contexts/TeamContext";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

// Admin
import AdminManagement from "./pages/AdminManagement";
import UsersManagement from "./pages/UsersManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPetitionList from "./pages/AdminPetitionList";
import AdminPetitionDetail from "./pages/AdminPetitionDetail";
import AdminRoute from "./components/AdminRoute";

// User
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

// Define the router with the data router approach
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><ScrollRestoration /><LandingPage /></Layout>,
  },
  {
    path: "/auth",
    element: <Layout><ScrollRestoration /><Auth /></Layout>,
  },
  // Static Pages
  {
    path: "/help",
    element: <Layout><ScrollRestoration /><Help /></Layout>,
  },
  {
    path: "/faq",
    element: <Layout><ScrollRestoration /><FAQ /></Layout>,
  },
  {
    path: "/terms",
    element: <Layout><ScrollRestoration /><Terms /></Layout>,
  },
  {
    path: "/privacy",
    element: <Layout><ScrollRestoration /><Privacy /></Layout>,
  },
  {
    path: "/security",
    element: <Layout><ScrollRestoration /><Security /></Layout>,
  },
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
  // Token Routes
  {
    path: "/tokens/store",
    element: <Layout><ScrollRestoration /><PrivateRoute><TokenStore /></PrivateRoute></Layout>,
  },
  {
    path: "/tokens/success",
    element: <Layout><ScrollRestoration /><PrivateRoute><TokenSuccess /></PrivateRoute></Layout>,
  },
  // Team Route
  {
    path: "/teams",
    element: <Layout><ScrollRestoration /><PrivateRoute><Teams /></PrivateRoute></Layout>,
  },
  // Admin Routes
  {
    path: "/admin/dashboard",
    element: <AdminRoute><ScrollRestoration /><Layout><AdminDashboard /></Layout></AdminRoute>,
  },
  {
    path: "/admin/petitions",
    element: <AdminRoute><ScrollRestoration /><Layout><AdminPetitionList /></Layout></AdminRoute>,
  },
  {
    path: "/admin/petitions/:id",
    element: <AdminRoute><Layout><ScrollRestoration /><AdminPetitionDetail /></Layout></AdminRoute>,
  },
  {
    path: "/admin/admins",
    element: <AdminRoute><Layout><ScrollRestoration /><AdminManagement /></Layout></AdminRoute>,
  },
  {
    path: "/admin/users",
    element: <AdminRoute><Layout><ScrollRestoration /><UsersManagement /></Layout></AdminRoute>,
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
      <TeamProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
