import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Trophy, TrendingUp, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import AppLayout from "@/app/templates/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/molecules/card";
import { getUpvoteFeed, listProfiles, type UpvoteItem } from "@/services/backendApi";

interface Appreciation {
  id: string;
  from: string;
  message: string;
  date: string;
}

interface Employee {
  id: string;
  name: string;
  appreciationCount: number;
  appreciations: Appreciation[];
}

const buildInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const buildEmployees = (profiles: Array<{ id: string; display_name: string }>, upvotes: UpvoteItem[]): Employee[] => {
  const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
  const grouped: Record<string, Appreciation[]> = {};

  upvotes.forEach((upvote) => {
    const recipient = profileMap[upvote.upvoted_id];
    const sender = profileMap[upvote.voter_id];
    if (!recipient || !sender) return;

    if (!grouped[upvote.upvoted_id]) {
      grouped[upvote.upvoted_id] = [];
    }

    grouped[upvote.upvoted_id].push({
      id: upvote.id,
      from: sender.display_name || "Unknown",
      message: upvote.message,
      date: format(new Date(upvote.created_at), "yyyy-MM-dd"),
    });
  });

  return profiles
    .map((profile) => {
      const appreciations = grouped[profile.id] || [];
      return {
        id: profile.id,
        name: profile.display_name || "Unknown",
        appreciationCount: appreciations.length,
        appreciations: [...appreciations].sort((a, b) => b.date.localeCompare(a.date)),
      };
    })
    .sort((a, b) => b.appreciationCount - a.appreciationCount);
};

export default function ManagerDashboard() {
  const [showAll, setShowAll] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 24, left: 0, width: 384 });
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["manager-dashboard", "profiles"],
    queryFn: async () => listProfiles(),
  });

  const { data: upvotes = [], isLoading: upvotesLoading } = useQuery({
    queryKey: ["manager-dashboard", "upvotes"],
    queryFn: async () => getUpvoteFeed(),
  });

  const employees = useMemo(() => buildEmployees(profiles, upvotes), [profiles, upvotes]);
  const displayedEmployees = showAll ? employees : employees.slice(0, 5);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || null;
  const isLoading = profilesLoading || upvotesLoading;

  useLayoutEffect(() => {
    if (!selectedEmployeeId) return;

    const updatePosition = () => {
      const container = layoutRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;

      const containerRect = container.getBoundingClientRect();
      const listRect = listRef.current?.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || 384;
      const gap = 32;
      const listRight = listRect?.right ?? containerRect.left;
      const nextLeft = listRight + gap;
      const padding = 16;
      const rawTop = listRect?.top ?? padding;
      const maxTop = Math.max(padding, window.innerHeight - panel.offsetHeight - padding);
      const nextTop = Math.min(Math.max(rawTop, padding), maxTop);
      setPanelPosition({ top: nextTop, left: nextLeft, width: panelWidth });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [selectedEmployeeId]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 px-8 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex gap-8" ref={layoutRef}>
            <div className="flex-1 transition-all" ref={listRef}>
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-semibold text-slate-900 mb-6">Most Appreciated</h1>

                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading appreciations...</p>
                  ) : (
                    <div className="space-y-3">
                      {displayedEmployees.map((employee, index) => (
                        <div
                          key={employee.id}
                          onClick={() => setSelectedEmployeeId(employee.id)}
                          className={`flex items-center gap-4 rounded-lg p-4 transition-all hover:bg-slate-50 cursor-pointer border ${
                            selectedEmployee?.id === employee.id ? "border-blue-400 bg-blue-50" : "border-transparent"
                          }`}
                        >
                          <div className="w-12 flex items-center justify-center">
                            {index < 3 ? (
                              <Trophy
                                className={`h-6 w-6 ${
                                  index === 0
                                    ? "text-yellow-500"
                                    : index === 1
                                      ? "text-slate-400"
                                      : "text-amber-600"
                                }`}
                              />
                            ) : (
                              <span className="text-lg text-slate-500">#{index + 1}</span>
                            )}
                          </div>

                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                              {buildInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900">{employee.name}</h3>
                              {index < 3 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                            </div>
                            <p className="text-sm text-slate-500">
                              {employee.appreciationCount} appreciation{employee.appreciationCount !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <div className="rounded-full bg-blue-100 px-4 py-2 text-blue-700 text-sm font-semibold">
                            {employee.appreciationCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {employees.length > 5 && (
                    <Button
                      variant="ghost"
                      className="mt-6 w-full text-blue-600 hover:bg-blue-50"
                      onClick={() => setShowAll((prev) => !prev)}
                    >
                      {showAll ? "Show Less" : `Show All ${employees.length} Employees`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {selectedEmployee && (
              <div className="w-96 relative">
                <Card
                  className="shadow-lg"
                  ref={panelRef}
                  style={{ position: "fixed", top: panelPosition.top, left: panelPosition.left, width: panelPosition.width }}
                >
                  <CardContent className="p-6 flex flex-col max-h-[calc(100vh-2rem)]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                          {buildInitials(selectedEmployee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-slate-900">{selectedEmployee.name}</h2>
                        <p className="text-sm text-slate-500">
                          {selectedEmployee.appreciationCount} appreciation{selectedEmployee.appreciationCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEmployeeId(null)}
                      className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                      aria-label="Close details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {selectedEmployee.appreciations.length === 0 ? (
                      <p className="text-sm text-slate-500">No appreciations yet.</p>
                    ) : (
                      selectedEmployee.appreciations.map((appreciation) => (
                        <div key={appreciation.id} className="rounded-lg bg-slate-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-700">
                              From <span className="font-medium">{appreciation.from}</span>
                            </span>
                            <span className="text-xs text-slate-500">{appreciation.date}</span>
                          </div>
                          <p className="text-slate-800">{appreciation.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
