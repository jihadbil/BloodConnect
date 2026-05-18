import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

// Pages - Public
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PublicBloodRequests from "@/pages/public-requests";

// Pages - Donor
import DonorDashboard from "@/pages/donor-dashboard";
import DonorRequests from "@/pages/donor-requests";
import Profile from "@/pages/profile";

// Pages - Staff
import StaffDashboard from "@/pages/staff-dashboard";
import StaffDonors from "@/pages/staff-donors";
import StaffPatients from "@/pages/staff-patients";
import StaffBloodRequests from "@/pages/staff-blood-requests";
import StaffDonations from "@/pages/staff-donations";
import StaffInventory from "@/pages/staff-inventory";

// Pages - Admin
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/">
        <Layout><Home /></Layout>
      </Route>
      <Route path="/blood-requests">
        <Layout><PublicBloodRequests /></Layout>
      </Route>
      <Route path="/login">
        <Layout><Login /></Layout>
      </Route>
      <Route path="/register">
        <Layout><Register /></Layout>
      </Route>

      {/* Donor */}
      <Route path="/donor/dashboard">
        <Layout>
          <ProtectedRoute allowedRoles={["Donor"]}>
            <DonorDashboard />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/donor/requests">
        <Layout>
          <ProtectedRoute allowedRoles={["Donor"]}>
            <DonorRequests />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/profile">
        <Layout>
          <ProtectedRoute allowedRoles={["Donor"]}>
            <Profile />
          </ProtectedRoute>
        </Layout>
      </Route>

      {/* Staff */}
      <Route path="/staff/dashboard">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffDashboard />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/staff/donors">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffDonors />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/staff/patients">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffPatients />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/staff/blood-requests">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffBloodRequests />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/staff/donations">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffDonations />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/staff/inventory">
        <Layout>
          <ProtectedRoute allowedRoles={["Staff", "Admin"]}>
            <StaffInventory />
          </ProtectedRoute>
        </Layout>
      </Route>

      {/* Admin */}
      <Route path="/admin/dashboard">
        <Layout>
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Layout>
      </Route>
      <Route path="/admin/users">
        <Layout>
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        </Layout>
      </Route>

      {/* Fallback */}
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
