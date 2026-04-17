import { ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/organisms/sidebar";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

const AppLayout = ({ children, noPadding = false }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen h-full flex w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="md:hidden flex items-center p-4 border-b border-border">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </div>
          <div className={noPadding ? "" : "p-6 lg:p-8"}>{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
