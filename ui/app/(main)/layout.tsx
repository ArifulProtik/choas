import { ProtectedRoute } from "@/components/auth/protected-gurd";
import MainSidebar from "@/components/main/main-sidebar";
import { GlobalCallInterface } from "@/components/messaging/call-interface";
import { StoreInitializer } from "@/components/store/store-initializer";
import React from "react";

export const metadata = {
  title: "Choas",
  description: "Dashboard",
};

const MainLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <ProtectedRoute>
      <StoreInitializer />
      <div className="flex h-screen overflow-hidden">
        <MainSidebar />
        {children}
      </div>
      {/* Global call interface for handling calls from anywhere in the app */}
      <GlobalCallInterface />
    </ProtectedRoute>
  );
};

export default MainLayout;
