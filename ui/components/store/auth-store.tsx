import { User } from "@/lib/schemas/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  removeAuth: () => void;
  setHydrated: (bool: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isHydrated: false,
      setHydrated: (bool: boolean) => set({ isHydrated: bool }),
      setAuth: (user: User, token: string) =>
        set({ isAuthenticated: true, user, token, isHydrated: true }),
      removeAuth: () =>
        set({ isAuthenticated: false, user: null, token: null }),
    }),
    {
      name: "auth-store",
      onRehydrateStorage: (state) => {
        return () => state.setHydrated(true);
      },
    },
  ),
);
