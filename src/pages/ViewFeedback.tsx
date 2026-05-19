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
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ViewFeedback = () => {
  const { profile } = useAuth();
  const { currentCycle, currentStatus, currentProgress, currentDaysLeft, isLoading: cycleLoading } = useReviewCycles();

  const { data: receivedFeedback = [] } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, situation,behaviour, impact, optional, created_at, author_id, is_anonymous")
        .eq("recipient_id", profile!.id)
        .order("created_at", { ascending: false });

      if (!error) return data;

      throw error;
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
  const navigate = useNavigate();
  return (
  <div className="w-full min-h-screen bg-background">
    <div className="w-full px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="ml-20">
        {/* Banner */}
        {currentCycle && (
          <Card className="gradient-banner border-0 mb-6 overflow-hidden max-w-5xl">
            <CardContent className="p-6">
              <div className="text-primary-foreground">
                <h2 className="text-xl md:text-2xl font-bold mb-1">{currentCycle.title} {currentCycle.year}</h2>
                <p className="text-sm opacity-75">{currentCycle.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stat Card */}
        <div className="mb-8 max-w-5xl flex justify-end">
          <Card className="w-96">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Feedback Received</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {receivedFeedback.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">responses</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <h2 className="text-lg font-bold text-foreground mb-4">Detailed Feedback</h2>
        {receivedFeedback.length === 0 ? (
          <Card className="max-w-5xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              No feedback received yet. Check back later!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-5xl">
            {receivedFeedback.map((item) => {
              const author = item.is_anonymous ? null : authorMap[item.author_id];
              const initials = item.is_anonymous
                ? "A"
                : author?.display_name?.split(" ").map((n: string) => n[0]).join("") || "?";
              return (
                <Card key={item.id}>
                  <CardContent className="p-5">
                    {/* Author Header */}
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.is_anonymous ? "Anonymous" : author?.display_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          {!item.is_anonymous && author?.team ? ` • ${author.team}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* SBI Sections */}
                    <div className="space-y-4">
                      {[
                        { label: "Situation", value: item.situation },
                        { label: "Behaviour", value: item.behaviour },
                        { label: "Impact", value: item.impact },
                        ...(item.optional ? [{ label: "Additional Comments", value: item.optional }] : []),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {label}
                          </p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default ViewFeedback;