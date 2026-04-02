import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelection from './pages/RoleSelection';
import AdminSignup from './pages/AdminSignup';
import GymSignup from './pages/GymSignup';
import TrainerSignup from './pages/TrainerSignup';
import MemberSignup from './pages/MemberSignup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import GymList from './pages/GymList';
import GymProfile from './pages/GymProfile';
import GymDashboard from './pages/GymDashboard';
import MacroCalculator from './pages/MacroCalculator';
import ProgressTracker from './pages/ProgressTracker';
import Chat from './pages/Chat';
import Announcements from './pages/Announcements';
import WorkoutPlans from './pages/WorkoutPlans';
import ClientRoster from './pages/ClientRoster';
import MemberDashboard from './pages/MemberDashboard';
import RequestPlan from './pages/RequestPlan';
import MyWorkouts from './pages/MyWorkouts';
import TodayWorkout from './pages/TodayWorkout';
import ManageSchedule from './pages/ManageSchedule';
import ViewBookings from './pages/ViewBookings';
import BookSession from './pages/BookSession';
import UpdateGym from './pages/UpdateGym';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import MembershipManagement from './pages/MembershipManagement';
import MembershipUpdate from './pages/MembershipUpdate';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageViewTracker from './components/PageViewTracker';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <PageViewTracker />
                    <Navbar />
                    <div className="pt-20">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/signup" element={<RoleSelection />} />
                            <Route path="/signup/admin" element={<AdminSignup />} />
                            <Route path="/signup/gym" element={<GymSignup />} />
                            <Route path="/signup/trainer" element={<TrainerSignup />} />
                            <Route path="/signup/member" element={<MemberSignup />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/gyms" element={<GymList />} />
                            <Route path="/gym/:id" element={<GymProfile />} />
                            <Route path="/gym-dashboard" element={
                                <ProtectedRoute>
                                    <GymDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/macro-calculator" element={
                                <ProtectedRoute>
                                    <MacroCalculator />
                                </ProtectedRoute>
                            } />
                            <Route path="/progress-tracker" element={
                                <ProtectedRoute>
                                    <ProgressTracker />
                                </ProtectedRoute>
                            } />
                            <Route path="/chat" element={
                                <ProtectedRoute>
                                    <Chat />
                                </ProtectedRoute>
                            } />
                            <Route path="/announcements" element={
                                <ProtectedRoute>
                                    <Announcements />
                                </ProtectedRoute>
                            } />
                            <Route path="/workout-plans" element={
                                <ProtectedRoute>
                                    <WorkoutPlans />
                                </ProtectedRoute>
                            } />
                            <Route path="/client-roster" element={
                                <ProtectedRoute>
                                    <ClientRoster />
                                </ProtectedRoute>
                            } />
                            <Route path="/member-dashboard" element={
                                <ProtectedRoute>
                                    <MemberDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/request-plan" element={
                                <ProtectedRoute>
                                    <RequestPlan />
                                </ProtectedRoute>
                            } />
                            <Route path="/my-workouts" element={
                                <ProtectedRoute>
                                    <MyWorkouts />
                                </ProtectedRoute>
                            } />
                            <Route path="/today" element={
                                <ProtectedRoute>
                                    <TodayWorkout />
                                </ProtectedRoute>
                            } />
                            <Route path="/manage-schedule" element={
                                <ProtectedRoute>
                                    <ManageSchedule />
                                </ProtectedRoute>
                            } />
                            <Route path="/view-bookings" element={
                                <ProtectedRoute>
                                    <ViewBookings />
                                </ProtectedRoute>
                            } />
                            <Route path="/book-session" element={
                                <ProtectedRoute>
                                    <BookSession />
                                </ProtectedRoute>
                            } />
                            <Route path="/update-gym" element={
                                <ProtectedRoute>
                                    <UpdateGym />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin-dashboard" element={
                                <ProtectedRoute>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/membership-management" element={
                                <ProtectedRoute>
                                    <MembershipManagement />
                                </ProtectedRoute>
                            } />
                            <Route path="/membership-update" element={
                                <ProtectedRoute>
                                    <MembershipUpdate />
                                </ProtectedRoute>
                            } />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </div>
                    {/* Toast Container */}
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                    />
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;