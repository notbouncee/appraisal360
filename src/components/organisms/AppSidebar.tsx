import { LayoutDashboard, MessageSquarePlus, LogOut, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/molecules/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/organisms/sidebar";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Give Feedback", url: "/give-feedback", icon: MessageSquarePlus },
  { title: "xAIP Appreciations", url: "/team-appreciation", icon: Trophy },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Sidebar className="border-r border-border">
      <div className="p-5 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate("/team-appreciation")} className="flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 rounded-lg gradient-banner flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-foreground">Appraisal360</span>
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{profile?.display_name || "User"}</p>
            <p className="text-xs text-muted-foreground">{profile?.team || "No team set"}</p>
          </div>
        </div>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
