import AppLayout from "@/app/templates/AppLayout";
import { Card, CardContent } from "@/components/molecules/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { getUpvoteCount, getUpvotesReceived, listProfiles } from "@/services/backendApi";
import { useAuth } from "@/hooks/useAuth";
import { useReviewCycles } from "@/hooks/useReviewCycle";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ViewUpvotes = () => {
  const { profile } = useAuth();
  const { currentCycle, currentStatus, currentProgress, currentDaysLeft, isLoading: cycleLoading } = useReviewCycles();

  const { data: receivedUpvotes = [] } = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: async () => (await getUpvotesReceived(profile!.id, 0, 100)).data,
    enabled: !!profile,
  });

  const { data: upvoteCount = 0 } = useQuery({
    queryKey: ["upvote-count"],
    queryFn: async () => getUpvoteCount(profile!.id),
    enabled: !!profile,
  });

  // Fetch voter profiles for feedback
  const voterIds = [...new Set(receivedUpvotes.map((f) => f.voter_id))];
  const { data: voters = [] } = useQuery({
    queryKey: ["voters", voterIds],
    queryFn: async () => {
      if (voterIds.length === 0) return [];
      return listProfiles(voterIds);
    },
    enabled: voterIds.length > 0,
  });

  const voterMap = Object.fromEntries(voters.map((a) => [a.id, a]));
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
                <span className="text-sm text-muted-foreground font-medium">Appreciations Received</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {receivedUpvotes.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">responses</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Appreciation Messages */}
        <h2 className="text-lg font-bold text-foreground mb-4">Appreciation Messages</h2>
        {receivedUpvotes.length === 0 ? (
          <Card className="max-w-5xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              No feedback received yet. Check back later!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-5xl">
            {receivedUpvotes.map((item) => {
              const voter = voterMap[item.voter_id];
              const initials = voter?.display_name?.split(" ").map((n: string) => n[0]).join("") || "?";
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
                          { voter?.display_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          {voter?.team ? ` • ${voter.team}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Message section */}
                    <div className="space-y-4">
                      {item.message}
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

export default ViewUpvotes;