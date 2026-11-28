import { Navigate, Route, Routes, useParams } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import CustomerLayout from "../layouts/CustomerLayout";
import StaffLayout from "../layouts/StaffLayout";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerInfoPage from "../pages/customer/CustomerInfoPage";
import CustomerServices from "../pages/customer/Services";
import HomePage from "../pages/home/HomePage";
import PublicHomeLayout from "../layouts/PublicHomeLayout";
import AdminHomeSettings from "../pages/admin/AdminHomeSettings";
import AdminHomeSettingsHub from "../pages/admin/AdminHomeSettingsHub";
import AdminBannerSettings from "../pages/admin/AdminBannerSettings";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminReviewDetail from "../pages/admin/AdminReviewDetail";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminCoupons from "../pages/admin/AdminCoupons";
import AdminCouponCreate from "../pages/admin/AdminCouponCreate";
import AdminCouponDetail from "../pages/admin/AdminCouponDetail";
import CustomerMyCoupons from "../pages/customer/CustomerMyCoupons";
import AdminInbox from "../pages/inbox/AdminInbox";
import StaffInbox from "../pages/inbox/StaffInbox";
import CustomerInbox from "../pages/inbox/CustomerInbox";
import InboxDetailRoute from "../pages/inbox/InboxDetailRoute";
import ServiceDetail from "../pages/customer/ServiceDetail";
import BookingWizard from "../pages/customer/BookingWizard";
import MyBookings from "../pages/customer/MyBookings";
import BookingDetail from "../pages/customer/BookingDetail";
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffProfile from "../pages/staff/StaffProfile";
import StaffBookings from "../pages/staff/StaffBookings";
import StaffReviews from "../pages/staff/StaffReviews";
import StaffBookingDetail from "../pages/staff/StaffBookingDetail";
import StaffTreatments from "../pages/staff/StaffTreatments";
import CustomerTreatments from "../pages/customer/CustomerTreatments";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminServices from "../pages/admin/Services";
import ServiceForm from "../pages/admin/ServiceForm";
import Categories from "../pages/admin/Categories";
import StaffList from "../pages/admin/StaffList";
import CustomerList from "../pages/admin/CustomerList";
import CustomerDetail from "../pages/admin/CustomerDetail";
import StaffDetail from "../pages/admin/StaffDetail";
import StaffForm from "../pages/admin/StaffForm";
import StaffServiceAssignment from "../pages/admin/StaffServiceAssignment";
import StaffSchedulePage from "../pages/admin/StaffSchedulePage";
import ScheduleList from "../pages/admin/ScheduleList";
import AccountList from "../pages/admin/AccountList";
import AccountForm from "../pages/admin/AccountForm";
import AdminTreatments from "../pages/admin/AdminTreatments";
import AdminBookingList from "../pages/admin/AdminBookingList";
import AdminBookingDetail from "../pages/admin/AdminBookingDetail";
import Profile from "../pages/profile/Profile";
import Unauthorized from "../pages/Unauthorized";
import MySchedule from "../pages/staff/MySchedule";
import { getDashboardPath, useAuth } from "../contexts/AuthContext";

function LegacyStaffScheduleRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/schedules/${id || ""}`} replace />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicHomeLayout />}>
        <Route path="/home" element={<HomePage variant="public" />} />
        <Route path="/policy" element={<CustomerInfoPage />} />
        <Route path="/terms" element={<CustomerInfoPage />} />
        <Route path="/careers" element={<CustomerInfoPage />} />
      </Route>

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute roles={["CUSTOMER"]}>
              <CustomerLayout />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="services" element={<CustomerServices />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="bookings/new" element={<BookingWizard />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="coupons" element={<CustomerMyCoupons />} />
        <Route path="inbox" element={<CustomerInbox />} />
        <Route path="inbox/:id" element={<InboxDetailRoute />} />
        <Route path="treatments" element={<CustomerTreatments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="policy" element={<CustomerInfoPage />} />
        <Route path="terms" element={<CustomerInfoPage />} />
        <Route path="careers" element={<CustomerInfoPage />} />
      </Route>

      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute roles={["STAFF"]}>
              <StaffLayout />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="bookings" element={<StaffBookings />} />
        <Route path="bookings/:id" element={<StaffBookingDetail />} />
        <Route path="treatments" element={<StaffTreatments />} />
        <Route path="reviews" element={<StaffReviews />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="inbox" element={<StaffInbox />} />
        <Route path="inbox/:id" element={<InboxDetailRoute />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </RoleProtectedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="staff/new" element={<StaffForm />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="staff/:id/edit" element={<StaffForm />} />
        <Route path="staff/:id/services" element={<StaffServiceAssignment />} />
        <Route path="staff/:id/schedule" element={<LegacyStaffScheduleRedirect />} />
        <Route path="schedules" element={<ScheduleList />} />
        <Route path="schedules/:staffId" element={<StaffSchedulePage />} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="accounts/:id/edit" element={<AccountForm />} />
        <Route path="bookings" element={<AdminBookingList />} />
        <Route path="bookings/:id" element={<AdminBookingDetail />} />
        <Route path="treatments" element={<AdminTreatments />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reviews/:id" element={<AdminReviewDetail />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="coupons/new" element={<AdminCouponCreate />} />
        <Route path="coupons/:id" element={<AdminCouponDetail />} />
        <Route path="inbox" element={<AdminInbox />} />
        <Route path="inbox/:id" element={<InboxDetailRoute />} />
        <Route path="settings" element={<AdminHomeSettingsHub />} />
        <Route path="settings/content" element={<AdminHomeSettings />} />
        <Route path="settings/banner" element={<AdminBannerSettings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
