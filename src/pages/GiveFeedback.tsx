import AppLayout from "@/components/templates/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import { Button } from "@/components/atoms/button";
import { Textarea } from "@/components/atoms/textarea";
import { Label } from "@/components/atoms/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/molecules/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/molecules/command";
import { useState } from "react";
import { toast } from "sonner";
import { Send, ChevronsUpDown, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const GiveFeedback = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColleague, setSelectedColleague] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data: colleagues = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, team")
        .order("display_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredColleagues = colleagues.filter((c) => c.id !== profile?.id);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feedback").insert({
        author_id: profile!.id,
        recipient_id: selectedColleague,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setSelectedColleague("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColleague || !content) {
      toast.error("Please fill in all fields");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6">Give Feedback</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share constructive feedback</CardTitle>
            <p className="text-sm text-muted-foreground">Your feedback helps colleagues grow. Be specific and actionable.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Select Colleague</Label>
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
                            return c ? `${c.display_name} — ${c.team || "No team"}` : "Search for a colleague...";
                          })()
                        : "Search for a colleague..."}
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
                <Label>What did this person do that made a difference, and how did it affect you or the team?</Label>
                <Textarea
                  placeholder="Describe the situation, what the colleague did, and the impact on the team or project..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default GiveFeedback;
