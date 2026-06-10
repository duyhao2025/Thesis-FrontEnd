"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User, LoginRequest, LoginResponse, UserRole } from "@/types/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsed = JSON.parse(storedUser);
          // Support both old nested format { user: {...} } and new flat format
          if (parsed.user) {
            // Old format
            setUser(parsed.user);
          } else {
            // Normalize FullName (PascalCase from BE) to fullName (camelCase in interface)
            setUser({
              ...parsed,
              fullName: parsed.fullName ?? parsed.FullName ?? parsed.name ?? "",
            } as User);
          }
        } catch {
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    const { accessToken, refreshToken, requirePasswordChange, role, email, fullName } = response.data;

    const userData = {
      id: "",
      email,
      fullName: fullName ?? "",
      role: role as User["role"],
      requirePasswordChange,
      createdAt: ""
    };

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
