import AppLayout from "@/components/templates/AppLayout";
import { Card, CardContent } from "@/components/molecules/card";
import { Badge } from "@/components/atoms/badge";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Progress } from "@/components/atoms/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReviewCycles } from "@/hooks/useReviewCycle";
import { formatDistanceToNow, format } from "date-fns";

const Dashboard = () => {
  const { profile } = useAuth();
  const { currentCycle, currentStatus, currentProgress, currentDaysLeft, isLoading: cycleLoading } = useReviewCycles();

  const { data: receivedFeedback = [] } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, content, created_at, author_id")
        .eq("recipient_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const { data: upvoteCount = 0 } = useQuery({
    queryKey: ["upvote-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("upvotes")
        .select("*", { count: "exact", head: true })
        .eq("upvoted_id", profile!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile,
  });

  // Fetch author profiles for feedback
  const authorIds = [...new Set(receivedFeedback.map((f) => f.author_id))];
  const { data: authors = [] } = useQuery({
    queryKey: ["authors", authorIds],
    queryFn: async () => {
      if (authorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, team")
        .in("id", authorIds);
      if (error) throw error;
      return data;
    },
    enabled: authorIds.length > 0,
  });

  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

  return (
    <AppLayout>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
          {currentCycle && currentStatus === "active" && (
            <Badge className="bg-success/15 text-success border-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 inline-block" />
              Active Cycle
            </Badge>
          )}
          {currentCycle && currentStatus === "upcoming" && (
            <Badge className="bg-yellow-500/15 text-yellow-600 border-0 font-medium">
              Upcoming Cycle
            </Badge>
          )}
          {(!currentCycle || currentStatus === "completed") && (
            <Badge className="bg-muted text-muted-foreground border-0 font-medium">
              No Active Cycle
            </Badge>
          )}
        </div>

        {/* Banner */}
        {currentCycle && (
        <Card className="gradient-banner border-0 mb-6 overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-primary-foreground">
              <p className="text-sm opacity-80 mb-1">
                ● Current Phase: {currentStatus === "active" ? "Feedback Collection" : currentStatus === "upcoming" ? "Upcoming" : "Completed"}
              </p>
              <h2 className="text-xl md:text-2xl font-bold mb-2">{currentCycle.title} {currentCycle.year}</h2>
              <p className="text-sm opacity-80">{currentCycle.description}</p>
            </div>
            <div className="bg-card/15 backdrop-blur-sm rounded-xl p-4 min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary-foreground text-sm font-medium">Timeline</span>
                {currentStatus === "active" && (
                  <Badge className="bg-card/20 text-primary-foreground border-0 text-xs">
                    <Clock className="h-3 w-3 mr-1" />{currentDaysLeft} Day{currentDaysLeft !== 1 ? "s" : ""} Left
                  </Badge>
                )}
                {currentStatus === "upcoming" && (
                  <Badge className="bg-card/20 text-primary-foreground border-0 text-xs">
                    Starts Soon
                  </Badge>
                )}
                {currentStatus === "completed" && (
                  <Badge className="bg-card/20 text-primary-foreground border-0 text-xs">
                    Ended
                  </Badge>
                )}
              </div>
              <Progress value={currentProgress} className="h-1.5 bg-card/20 mb-2" />
              <div className="flex justify-between text-xs text-primary-foreground/70">
                <span>{format(new Date(currentCycle.start_date), "MMM d")}</span>
                <span>{format(new Date(currentCycle.end_date), "MMM d")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Appreciation</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{upvoteCount} <span className="text-sm font-normal text-muted-foreground">from colleagues</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Feedback Received</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{receivedFeedback.length} <span className="text-sm font-normal text-muted-foreground">responses</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <h2 className="text-lg font-bold text-foreground mb-4">Detailed Feedback</h2>
        {receivedFeedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No feedback received yet. Check back later!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {receivedFeedback.map((item) => {
              const author = authorMap[item.author_id];
              const initials = author?.display_name?.split(" ").map((n: string) => n[0]).join("") || "?";
              return (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{author?.display_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          {author?.team ? ` • ${author.team}` : ""}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Situation & Impact</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
