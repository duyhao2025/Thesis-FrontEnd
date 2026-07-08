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

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

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
          if (parsed.user) {
            setUser(parsed.user);
          } else {
            const payload = decodeJwtPayload(storedToken);
            const userId = (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] as string)
              || (payload["sub"] as string)
              || parsed.id
              || "";
            setUser({
              ...parsed,
              id: userId,
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
    const payload = decodeJwtPayload(accessToken);
    const userId = (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] as string)
      || (payload["sub"] as string)
      || "";

    const userData = {
      id: userId,
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
