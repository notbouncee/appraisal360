import AppLayout from "@/components/templates/AppLayout";
import { Card, CardContent } from "@/components/molecules/card";
import { Button } from "@/components/atoms/button";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { Badge } from "@/components/atoms/badge";
import { ThumbsUp, Check, Search } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MAX_VOTES = 5;

const UpvoteColleagues = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: colleagues = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name, team").order("display_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: upvotes = [] } = useQuery({
    queryKey: ["upvotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upvotes")
        .select("id, upvoted_id")
        .eq("voter_id", profile!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const upvotedIds = new Set(upvotes.map((u) => u.upvoted_id));
  const remaining = MAX_VOTES - upvotes.length;
  const filteredColleagues = colleagues
    .filter((c) => c.id !== profile?.id)
    .filter((c) =>
      searchQuery === ""
        ? true
        : c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.team || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const addUpvote = useMutation({
    mutationFn: async (upvotedId: string) => {
      const { error } = await supabase.from("upvotes").insert({ voter_id: profile!.id, upvoted_id: upvotedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upvotes"] });
      toast.success("Upvote recorded!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeUpvote = useMutation({
    mutationFn: async (upvotedId: string) => {
      const { error } = await supabase.from("upvotes").delete().eq("voter_id", profile!.id).eq("upvoted_id", upvotedId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["upvotes"] }),
    onError: (err: any) => toast.error(err.message),
  });

  const handleUpvote = (id: string) => {
    if (upvotedIds.has(id)) {
      removeUpvote.mutate(id);
    } else if (remaining <= 0) {
      toast.error("You've used all your upvotes!");
    } else {
      addUpvote.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Upvote Colleagues</h1>
          <Badge variant="secondary" className="text-sm font-medium">
            {remaining} vote{remaining !== 1 ? "s" : ""} left
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Recognize colleagues who've made an impact. You have {MAX_VOTES} upvotes to distribute.
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search colleagues by name or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filteredColleagues.map((c) => {
            const voted = upvotedIds.has(c.id);
            return (
              <Card key={c.id} className={voted ? "ring-2 ring-primary/30 bg-accent/30" : ""}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                      {c.display_name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground">{c.team || "No team"}</p>
                  </div>
                  <Button variant={voted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(c.id)} className="shrink-0">
                    {voted ? <Check className="h-4 w-4 mr-1" /> : <ThumbsUp className="h-4 w-4 mr-1" />}
                    {voted ? "Voted" : "Upvote"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default UpvoteColleagues;
