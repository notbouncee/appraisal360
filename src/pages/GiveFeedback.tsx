import AppLayout from "@/components/templates/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { Textarea } from "@/components/atoms/textarea";
import { Label } from "@/components/atoms/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/molecules/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/molecules/command";
import { useState } from "react";
import { toast } from "sonner";
import { Send, ChevronsUpDown, Check, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const GiveFeedback = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColleague, setSelectedColleague] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [situations, setSituations] = useState([""]);
  const [isAnonymous, setIsAnonymous] = useState(true);

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

  const getStructuredContent = () => {
    const filledSituations = situations
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return filledSituations
      .map((situation, index) => `Situation ${index + 1}\n${situation}`)
      .join("\n\n");
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const content = getStructuredContent();
      const payload = {
        author_id: profile!.id,
        recipient_id: selectedColleague,
        content,
        is_anonymous: isAnonymous,
      };

      const { error } = await supabase.from("feedback").insert(payload);
      if (!error) return;

      // Allow older schemas to continue functioning until migrations are applied.
      if (error.message?.toLowerCase().includes("is_anonymous")) {
        const { error: fallbackError } = await supabase.from("feedback").insert({
          author_id: profile!.id,
          recipient_id: selectedColleague,
          content,
        });
        if (fallbackError) throw fallbackError;
        return;
      }

      throw error;
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setSelectedColleague("");
      setSituations([""]);
      setIsAnonymous(true);
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasRequiredSituation = situations[0].trim().length > 0;

    if (!selectedColleague || !hasRequiredSituation) {
      toast.error("Please fill in all fields");
      return;
    }

    submitMutation.mutate();
  };

  const updateSituation = (index: number, value: string) => {
    setSituations((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addSituation = () => {
    setSituations((prev) => [...prev, ""]);
  };

  const removeSituation = (index: number) => {
    setSituations((prev) => prev.filter((_, i) => i !== index));
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

              <div className="space-y-3">
                <Label>Think of one/a few interaction(s) you had with this person.</Label>
                <p className="text-sm text-muted-foreground">
                  Add one mandatory situation, then click + Add Situation if you want to provide more.
                </p>

                {situations.map((situation, index) => (
                  <div key={`situation-${index}`} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Label>Situation {index + 1}{index === 0 ? " (required)" : ""}</Label>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSituation(index)}
                          className="h-8 px-2 text-muted-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="Describe the context, what happened, impact, and what to continue or improve."
                      value={situation}
                      onChange={(e) => updateSituation(index, e.target.value)}
                      rows={6}
                    />
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addSituation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Situation
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <Checkbox
                  id="anonymous-feedback"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="anonymous-feedback" className="cursor-pointer">
                    Remain anonymous
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep this checked if you do not want your name shown to the recipient.
                  </p>
                </div>
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
