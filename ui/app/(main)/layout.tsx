import { ProtectedRoute } from "@/components/auth/protected-gurd";
import MainSidebar from "@/components/main/main-sidebar";
import React from "react";

export const metadata = {
  title: "Choas",
  description: "Dashboard",
};

const MainLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <MainSidebar />
        {children}
      </div>
    </ProtectedRoute>
  );
};

export default MainLayout;
