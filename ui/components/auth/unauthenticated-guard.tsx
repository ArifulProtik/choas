"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth-store";
import { useEffect } from "react";

export function UnauthenticatedGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
