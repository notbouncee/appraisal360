import { formatDistanceToNow } from "date-fns";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/molecules/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Appreciation {
  id: string;
  fromUser: TeamMember;
  toUser: TeamMember;
  message: string;
  timestamp: Date;
  reactions: Reaction[];
}

interface AppreciationCardProps {
  appreciation: Appreciation;
  onReact: (appreciationId: string, emoji: string) => void | Promise<void>;
  currentUserId: string;
}

const quickReactions = ["👍", "❤️", "🎉", "👏", "🔥", "🙌"];

export function AppreciationCard({ appreciation, onReact, currentUserId }: AppreciationCardProps) {
  const groupedReactions = appreciation.reactions.reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const userReaction = appreciation.reactions.find((reaction) => reaction.userId === currentUserId)?.emoji;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4 pb-3 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: appreciation.fromUser.color }}
              aria-label={appreciation.fromUser.name}
            >
              {appreciation.fromUser.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <p className="font-semibold truncate">{appreciation.fromUser.name}</p>
                <span className="text-muted-foreground shrink-0">appreciated</span>
                <p className="font-semibold truncate">{appreciation.toUser.name}</p>
              </div>
            </div>
          </div>

          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: appreciation.toUser.color }}
            aria-label={appreciation.toUser.name}
          >
            {appreciation.toUser.initials}
          </div>

          <p className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(appreciation.timestamp, { addSuffix: true })}
          </p>
        </div>

        <p className="text-sm leading-relaxed mt-4 whitespace-pre-line">{appreciation.message}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", userReaction && "bg-accent")}
              >
                <SmilePlus className="h-4 w-4" />
                {userReaction ? <span className="text-base leading-none">{userReaction}</span> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-0 flex items-center gap-1 p-1">
              {quickReactions.map((emoji) => (
                <DropdownMenuItem
                  key={emoji}
                  className="h-8 w-8 p-0 text-base justify-center"
                  onClick={() => onReact(appreciation.id, emoji)}
                >
                  {emoji}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {Object.entries(groupedReactions).map(([emoji, count]) => (
            <span key={emoji} className="h-8 px-2 rounded-md border text-xs text-muted-foreground inline-flex items-center">
              {emoji} {count}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
