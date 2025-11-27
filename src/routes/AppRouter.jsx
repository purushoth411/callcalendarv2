import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layouts/Layout";
import ScrollToTop from "../components/ScrollToTop";
import { useAuth } from "../utils/idb";
import { useEffect } from "react";
import Dashboard from "../pages/dashboard/Dashboard";
import Login from "../pages/Login";
import Users from "../pages/manageuser/Users";
import Teams from "../pages/Teams";
import Bookings from "../pages/managebooking/Bookings";
import ScheduleCall from "../pages/managebooking/ScheduleCall";
import BookingDetail from "../pages/managebooking/bookingdetail/BookingDetail";
import CallRequestsFromRc from "../pages/additional/CallRequestsFromRc";
import ExternalCalls from "../pages/additional/ExternalCalls";
import EditBooking from "../pages/managebooking/EditBooking";
import DomainPref from "../pages/DomainPref";
import Summary from "../pages/summary/Summary";
import ViewAllTable from "../pages/summary/ViewAllTable";
import Plans from "../pages/Plans";
import Approveaddcallrequests from "../pages/Approveaddcallrequests";
import Completedcallratings from "../pages/Completedcallratings";
import Followers from "../pages/Followers";
import OTPVerificationPage from "../pages/OTPVerificationPage";
import ClientBookingDetails from "../pages/ClientBookingDetails";
import ResetPassword from "../pages/ResetPassword";
import SlotListView from "../pages/managebooking/SlotListView";
import ScheduleCallNew from "../pages/managebooking/ScheduleCallNew";




export default function AppRouter() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Restaurant Routes (NO layout) */}
        <Route path="/login" element={<Login/>} />
       <Route path="/otp/:bookingId/:verifyOtpUrl" element={<OTPVerificationPage />} />
       <Route path="/otp/:bookingId" element={<OTPVerificationPage />} />
       <Route path="/booking_details/:bookingId" element={<ClientBookingDetails />} />
       <Route path="/reset_password" element={<ResetPassword />} />
        <Route element={<PrivateRoute />}>
       
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:dashboard_status" element={<Bookings />} />
            <Route path="/schedulecall/:bookingId" element={<ScheduleCall />} />
            <Route path="/schedulecallnew/:bookingId" element={<ScheduleCallNew />} />
            <Route path="/admin/booking_detail/:bookingId" element={<BookingDetail />} />
            <Route path="/admin/booking_detail/:bookingId/convert" element={<BookingDetail />} />
            <Route path="/call_request_from_rc" element={<CallRequestsFromRc />} />
            <Route path="/external_calls" element={<ExternalCalls />} />
            <Route path="/admin/add_call_request/:bookingid/enq" element={<Bookings />} />
            <Route path="/admin/edit_booking/:bookingId" element={<EditBooking />} />
            <Route path="/domain_pref" element={<DomainPref />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/summary/viewall" element={<ViewAllTable />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/approveaddcallrequests" element={<Approveaddcallrequests />} />
            <Route path="/completedcallratings" element={<Completedcallratings />} />
            <Route path="/followers" element={<Followers />} />

            <Route path="/slots" element={<SlotListView />} />
           

            
          </Route>

          <Route path="*" element={<Login />} />
        
        </Route>
        
      </Routes>
    </Router>
  );
}
