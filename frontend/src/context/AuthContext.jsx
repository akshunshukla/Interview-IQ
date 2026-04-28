import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on page load via cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.data.user);
      } catch (error) {
        // Cookie invalid or expired — user not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { user } = response.data.data;
    setUser(user);
    return user;
  };

  const register = async ({ name, email, password, role, orgName }) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
      ...(role === "RECRUITER" && { orgName }),
    });
    const { user } = response.data.data;
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore errors on logout
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
