import AppLayout from "@/components/templates/AppLayout";
import { Card, CardContent } from "@/components/molecules/card";
import { Badge } from "@/components/atoms/badge";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReviewCycles } from "@/hooks/useReviewCycle";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/molecules/dialog";
import AppreciationForm from "@/components/organisms/AppreciationForm";

type ActiveTab = "appreciations" | "feedback";

const Dashboard = () => {
  const { profile } = useAuth();
  const { currentCycle, currentStatus } = useReviewCycles();
  const [page, setPage] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const pageSize = 5;
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("appreciations");

  // ── Appreciations ──────────────────────────────────────────────
  const { data: upvotesResult = { data: [], count: 0 } } = useQuery({
    queryKey: ["upvotes", "received", page],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      if (!profile) return { data: [], count: 0 };
      const { data, count, error } = await supabase
        .from("upvotes")
        .select("*", { count: "exact" })
        .eq("upvoted_id", profile!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count: count ?? 0 };
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

  const receivedUpvotes = upvotesResult.data;
  const totalCount = upvotesResult.count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const voterIds = [...new Set(receivedUpvotes.map((u) => u.voter_id))];
  const upvotedIds = [...new Set(receivedUpvotes.map((u) => u.upvoted_id))];
  const allIds = [...new Set([...voterIds, ...upvotedIds])];

  const { data: upvoteProfiles = [] } = useQuery({
    queryKey: ["profiles", allIds.sort().join(",")],
    queryFn: async () => {
      if (allIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, team")
        .in("id", allIds);
      if (error) throw error;
      return data;
    },
    enabled: allIds.length > 0,
  });

  const profileMap = Object.fromEntries(upvoteProfiles.map((p) => [p.id, p]));

  // ── Feedback ───────────────────────────────────────────────────
  const { data: feedbackCount = 0 } = useQuery({
    queryKey: ["feedback-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", profile!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile,
  });

  const { data: feedbackResult = { data: [], count: 0 } } = useQuery({
    queryKey: ["feedback", "received", feedbackPage],
    queryFn: async () => {
      const from = feedbackPage * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from("feedback")
        .select("id, situation, behaviour, impact, optional, created_at, author_id, is_anonymous", { count: "exact" })
        .eq("recipient_id", profile!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
    enabled: !!profile && activeTab === "feedback",
  });

  const receivedFeedback = feedbackResult.data;
  const feedbackTotalPages = Math.ceil(feedbackResult.count / pageSize);

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

  // ── Helpers ────────────────────────────────────────────────────
  const getInitials = (name?: string) =>
    name?.split(" ").map((n: string) => n[0]).join("") || "?";

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setPage(0);
    setFeedbackPage(0);
  };

  return (
    <AppLayout>
      <div className="w-full">
        {/* Header */}
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
                  ● Current Phase:{" "}
                  {currentStatus === "active"
                    ? "Feedback Collection"
                    : currentStatus === "upcoming"
                    ? "Upcoming"
                    : "Completed"}
                </p>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  {currentCycle.title} {currentCycle.year}
                </h2>
                <p className="text-sm opacity-80">{currentCycle.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards — act as tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card
            onClick={() => handleTabChange("appreciations")}
            className={`cursor-pointer transition-all duration-200 ${
              activeTab === "appreciations"
                ? "ring-2 ring-primary bg-accent/50 shadow-md"
                : "hover:bg-accent/50 hover:shadow-md"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Appreciation</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {upvoteCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">from colleagues</span>
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => handleTabChange("feedback")}
            className={`cursor-pointer transition-all duration-200 ${
              activeTab === "feedback"
                ? "ring-2 ring-primary bg-accent/50 shadow-md"
                : "hover:bg-accent/50 hover:shadow-md"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Feedback Received</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {feedbackCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">responses</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Appreciations Tab ── */}
        {activeTab === "appreciations" && (
          <>
            <div className="w-full max-w-3xl flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-foreground">Appreciations Received</h2>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Heart className="h-3.5 w-3.5" />
                    Give Appreciation
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Give your Appreciation</DialogTitle>
                  </DialogHeader>
                  <AppreciationForm onSuccess={() => setOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            {receivedUpvotes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No appreciations yet. Check back later!
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="w-full max-w-3xl space-y-4">
                  {receivedUpvotes.map((item) => {
                    const voter = profileMap[item.voter_id];
                    const upvoted = profileMap[item.upvoted_id];
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-6 mb-4">
                            {/* Voter */}
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                                  {getInitials(voter?.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {voter?.display_name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                  {voter?.team ? ` • ${voter.team}` : ""}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                              appreciated
                            </p>

                            {/* Upvoted */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">
                                  {upvoted?.display_name || "Unknown"}
                                </p>
                                {upvoted?.team && (
                                  <p className="text-xs text-muted-foreground">{upvoted.team}</p>
                                )}
                              </div>
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                                  {getInitials(upvoted?.display_name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>

                          {item.message && (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                              {item.message}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center mt-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      disabled={page === 0}
                      className="text-sm text-muted-foreground disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <p className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </p>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="text-sm text-muted-foreground disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Feedback Tab ── */}
        {activeTab === "feedback" && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">Feedback Received</h2>
            {receivedFeedback.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No feedback received yet. Check back later!
                </CardContent>
              </Card>
            ) : (
              <>
              <div className="space-y-4 max-w-3xl">
                {receivedFeedback.map((item) => {
                  const author = item.is_anonymous ? null : authorMap[item.author_id];
                  const initials = item.is_anonymous
                    ? "A"
                    : getInitials(author?.display_name);
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
                            ...(item.optional
                              ? [{ label: "Additional Comments", value: item.optional }]
                              : []),
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                {label}
                              </p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Feedback Pagination */}
              <div className="flex justify-end items-center gap-4 mt-6">
                <button
                  onClick={() => setFeedbackPage((p) => Math.max(p - 1, 0))}
                  disabled={feedbackPage === 0}
                  className="text-sm text-muted-foreground disabled:opacity-50"
                >
                  Previous
                </button>
                <p className="text-sm text-muted-foreground">
                  Page {feedbackPage + 1} of {feedbackTotalPages}
                </p>
                <button
                  onClick={() => setFeedbackPage((p) => p + 1)}
                  disabled={feedbackPage >= feedbackTotalPages - 1}
                  className="text-sm text-muted-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;