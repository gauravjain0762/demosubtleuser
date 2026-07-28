"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sk_token");
    if (!token) { setReady(true); return; }
    api.get("/api/auth/me")
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem("sk_token"))
      .finally(() => setReady(true));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("sk_token", token);
    setUser(userData);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("sk_token");
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
