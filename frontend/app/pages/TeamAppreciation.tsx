import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AppLayout from "@/app/templates/AppLayout";
import { AppreciationCard, Appreciation, TeamMember, Reaction } from "@/components/organisms/team-appreciation/AppreciationCard";
import { NewAppreciationDialog } from "@/components/organisms/team-appreciation/NewAppreciationDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createUpvote, deleteReaction, getUpvoteFeed, listProfiles, listReactions, upsertReaction } from "@/services/backendApi";
import { useAuth } from "@/hooks/useAuth";

const memberPalette = ["#7C3AED", "#2563EB", "#DC2626", "#059669", "#D97706", "#DB2777", "#0EA5E9", "#F59E0B"];

const buildInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const colorForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % memberPalette.length;
  }
  return memberPalette[Math.abs(hash) % memberPalette.length];
};

const toTeamMember = (id: string, displayName: string): TeamMember => ({
  id,
  name: displayName,
  initials: buildInitials(displayName),
  color: colorForId(id),
});

export default function TeamAppreciation() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: teamProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["team-appreciation", "profiles"],
    queryFn: async () => listProfiles(),
  });

  const { data: upvotes = [], isLoading: upvotesLoading } = useQuery({
    queryKey: ["team-appreciation", "upvotes"],
    queryFn: async () => getUpvoteFeed(),
  });

  const { data: reactionRows = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ["team-appreciation", "reactions"],
    queryFn: async () => listReactions(),
  });

  const currentUser = useMemo(() => {
    if (!profile) return null;
    return toTeamMember(profile.id, profile.display_name || "User");
  }, [profile]);

  const teamMembers = useMemo<TeamMember[]>(
    () => teamProfiles.map((member) => toTeamMember(member.id, member.display_name || "Unknown")),
    [teamProfiles],
  );

  const profileMap = useMemo(
    () => Object.fromEntries(teamProfiles.map((member) => [member.id, member])),
    [teamProfiles],
  );

  const reactionsByAppreciation = useMemo<Record<string, Reaction[]>>(() => {
    return reactionRows.reduce<Record<string, Reaction[]>>((acc, row) => {
      const userName = profileMap[row.user_id]?.display_name || "Unknown";
      if (!acc[row.appreciation_id]) {
        acc[row.appreciation_id] = [];
      }
      acc[row.appreciation_id].push({
        emoji: row.emoji,
        userId: row.user_id,
        userName,
      });
      return acc;
    }, {});
  }, [reactionRows, profileMap]);

  const currentUserReactionByAppreciation = useMemo<Record<string, string>>(() => {
    if (!currentUser) return {};

    return Object.fromEntries(
      Object.entries(reactionsByAppreciation).map(([appreciationId, reactions]) => [
        appreciationId,
        reactions.find((reaction) => reaction.userId === currentUser.id)?.emoji || "",
      ]),
    );
  }, [reactionsByAppreciation, currentUser]);

  const appreciations = useMemo<Appreciation[]>(() => {
    return upvotes
      .map((item) => {
        const fromProfile = profileMap[item.voter_id];
        const toProfile = profileMap[item.upvoted_id];

        if (!fromProfile || !toProfile) return null;

        return {
          id: item.id,
          fromUser: toTeamMember(fromProfile.id, fromProfile.display_name || "Unknown"),
          toUser: toTeamMember(toProfile.id, toProfile.display_name || "Unknown"),
          message: item.message,
          timestamp: new Date(item.created_at),
          reactions: reactionsByAppreciation[item.id] ?? [],
        };
      })
      .filter((item): item is Appreciation => item !== null);
  }, [upvotes, profileMap, reactionsByAppreciation]);

  const handleNewAppreciation = async (toUserId: string, message: string) => {
    if (!profile?.id) return;

    try {
      await createUpvote({
      voter_id: profile.id,
      upvoted_id: toUserId,
      message: message.trim(),
      });
    } catch (error: any) {
      toast.error(error.message || "Unable to send appreciation");
      throw error;
    }

    toast.success("Appreciation sent");
    await queryClient.invalidateQueries({ queryKey: ["team-appreciation", "upvotes"] });
    await queryClient.invalidateQueries({ queryKey: ["upvotes"] });
  };

  const handleReact = async (appreciationId: string, emoji: string) => {
    if (!currentUser) return;

    const currentEmoji = currentUserReactionByAppreciation[appreciationId];

    if (currentEmoji === emoji) {
      try {
        await deleteReaction(appreciationId);
      } catch (error: any) {
        toast.error(error.message || "Unable to remove reaction");
        return;
      }
    } else {
      try {
        await upsertReaction({ appreciation_id: appreciationId, emoji });
      } catch (error: any) {
        toast.error(error.message || "Unable to save reaction");
        return;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["team-appreciation", "reactions"] });
  };

  return (
    <AppLayout noPadding>
      <div className="h-screen flex flex-col bg-background">
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-6 py-6 gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">xAIP Appreciations</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#5c068c] hover:bg-[#4a0570] text-white gap-2"
                size="lg"
                disabled={!currentUser}
              >
                <Heart className="h-5 w-5" />
                Give Appreciation
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-4xl mx-auto px-6 py-6">
                {profilesLoading || upvotesLoading || reactionsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading appreciations...</p>
                ) : (
                  <div className="space-y-3">
                    {appreciations.map((appreciation) => (
                      <AppreciationCard
                        key={appreciation.id}
                        appreciation={appreciation}
                        onReact={handleReact}
                        currentUserId={currentUser?.id || ""}
                      />
                    ))}
                    {appreciations.length === 0 && (
                      <p className="text-sm text-muted-foreground">No appreciations yet. Be the first to send one.</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {currentUser && (
          <NewAppreciationDialog
            currentUser={currentUser}
            teamMembers={teamMembers}
            onSubmit={handleNewAppreciation}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        )}
      </div>
    </AppLayout>
  );
}