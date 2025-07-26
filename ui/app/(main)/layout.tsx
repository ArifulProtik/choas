import { ProtectedRoute } from "@/components/auth/protected-gurd";
import MainSidebar from "@/components/main/main-sidebar";
import TitileBar from "@/components/main/titile-bar";
import { GlobalCallInterface } from "@/components/messaging/call-interface";
import { StoreInitializer } from "@/components/store/store-initializer";
import { GlobalToastManager } from "@/components/notifications/global-toast-manager";
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <TitileBar />
          <div className="flex flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
      <GlobalCallInterface />
      <GlobalToastManager />
    </ProtectedRoute>
  );
};

export default MainLayout;
