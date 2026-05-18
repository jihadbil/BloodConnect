import { useState, useEffect, useCallback } from "react";
import { UserDto } from "@workspace/api-client-react";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("blood_bank_token"));
  const [user, setUserState] = useState<UserDto | null>(() => {
    const saved = localStorage.getItem("blood_bank_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTokenState(localStorage.getItem("blood_bank_token"));
      const savedUser = localStorage.getItem("blood_bank_user");
      try {
        setUserState(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUserState(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((newToken: string, newUser: UserDto) => {
    localStorage.setItem("blood_bank_token", newToken);
    localStorage.setItem("blood_bank_user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("blood_bank_token");
    localStorage.removeItem("blood_bank_user");
    setTokenState(null);
    setUserState(null);
  }, []);

  return {
    isAuthenticated: !!token && !!user,
    user,
    userRole: user?.roles?.[0] || null,
    donorId: user?.donorID || null,
    login,
    logout,
  };
}
