import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/molecules/select";
import { Label } from "@/components/atoms/label";
import { Textarea } from "@/components/atoms/textarea";
import { Button } from "@/components/atoms/button";
import type { TeamMember } from "@/components/organisms/team-appreciation/AppreciationCard";
import { toast } from "sonner";

interface NewAppreciationDialogProps {
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onSubmit: (toUserId: string, message: string) => Promise<void> | void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAppreciationDialog({
  currentUser,
  teamMembers,
  onSubmit,
  open,
  onOpenChange,
}: NewAppreciationDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const colleagues = useMemo(
    () => teamMembers.filter((member) => member.id !== currentUser.id),
    [teamMembers, currentUser.id],
  );

  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSelectedUserId("");
      setMessage("");
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId || !message.trim()) {
      toast.error("Please choose a colleague and add a message");
      return;
    }

    if (wordCount > 100) {
      toast.error("Please keep appreciation within 100 words");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(selectedUserId, message.trim());
      handleClose(false);
    } catch {
      // Parent handles Supabase errors/toasts.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give thanks to someone</DialogTitle>
          <DialogDescription>
            Recognize a teammate with a short message of appreciation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appreciation-recipient">Teammate</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="appreciation-recipient">
                <SelectValue placeholder="Select a teammate" />
              </SelectTrigger>
              <SelectContent>
                {colleagues.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appreciation-message">Message</Label>
            <Textarea
              id="appreciation-message"
              rows={5}
              placeholder="Share what you appreciated"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{wordCount}/100 words</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleClose(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send appreciation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
