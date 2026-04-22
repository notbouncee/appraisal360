import { Button } from "@/components/atoms/button";
import { Textarea } from "@/components/atoms/textarea";
import { Label } from "@/components/atoms/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/molecules/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/molecules/command";
import { ThumbsUp, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";


const AppreciationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColleague, setSelectedColleague] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [appreciation, setAppreciation] = useState("");

  const { data: colleagues = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name, team").order("display_name");
      if (error) throw error;
      return data;
    },
  });


  const filteredColleagues = colleagues.filter((c) => c.id !== profile?.id);

  const submitUpvote = useMutation({
  mutationFn: async () => {
    const message = appreciation.trim();

    if (!message) {
      throw new Error("Message cannot be empty");
    }
    
    const { error } = await supabase.from("upvotes").insert({
      voter_id: profile!.id,
      upvoted_id: selectedColleague,
      message,
    });

    if (error) throw error;
  },

  onSuccess: () => {
    toast.success("Appreciation sent!");
    setSelectedColleague("");
    setAppreciation("");
    queryClient.invalidateQueries({ queryKey: ["upvotes"] });
    onSuccess?.(); // closes the dialog
  },

  onError: (err: any) => {
    toast.error(err.message);
  },
});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const wordCount = appreciation.trim().length === 0 ? 0 : appreciation.trim().split(/\s+/).length;

    if (!selectedColleague || appreciation.trim().length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (wordCount > 50) {
      toast.error("Please keep appreciation within 100 words");
      return;
    }

    submitUpvote.mutate();
  };

  const handleCancel = () => {
    setSelectedColleague("");
    setAppreciation("");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Search Employee</Label>
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between font-normal"
            >
              {selectedColleague
                ? (() => {
                    const c = filteredColleagues.find((c) => c.id === selectedColleague);
                    return c ? `${c.display_name} — ${c.team || "No team"}` : "Search employee";
                  })()
                : "Search employee"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Type a name to search..." />
              <CommandList>
                <CommandEmpty>No colleague found.</CommandEmpty>
                <CommandGroup>
                  {filteredColleagues.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.display_name} ${c.team || ""}`}
                      onSelect={() => {
                        setSelectedColleague(c.id === selectedColleague ? "" : c.id);
                        setComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedColleague === c.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {c.display_name} — {c.team || "No team"}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>
          Write your appreciation (max 100 words)
        </Label>
        <Textarea
          value={appreciation}
          onChange={(e) => setAppreciation(e.target.value)}
          rows={5}
          placeholder="Reason (mandatory field)"
        />
        <p className="text-xs text-muted-foreground">
          {appreciation.trim().length === 0 ? 0 : appreciation.trim().split(/\s+/).length}/100 words
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitUpvote.isPending}>
          <ThumbsUp className="h-4 w-4 mr-2" />
          {submitUpvote.isPending ? "Submitting..." : "Give Thanks"}
        </Button>
      </div>
    </form>
  );
};

export default AppreciationForm;
