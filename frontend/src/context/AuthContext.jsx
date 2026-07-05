import { createContext, useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Function to fetch user profile
  const fetchUserProfile = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      if (err.response?.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem("token");
        setUser(null);
        setUserDetails(null);
        window.location.href = "/login"; // Redirect to login page
      }
    }
  };

  // Check for token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Parse the token to get user data

      try {
        const userData = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: userData.id, role: userData.role });
        // Fetch user details
        fetchUserProfile(token).finally(() => setLoading(false));
      } catch (err) {
        console.error("Invalid token:", err);
        localStorage.removeItem("token");
        setUser(null);
        setUserDetails(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
    fetchUserProfile(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUserDetails(null);
  };

  return (
    <AuthContext.Provider value={{ user, userDetails, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
