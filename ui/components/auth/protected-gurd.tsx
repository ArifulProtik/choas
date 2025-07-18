"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth-store";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
