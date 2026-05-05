import AppLayout from "@/app/templates/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/molecules/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/molecules/command";
import { useState } from "react";
import { toast } from "sonner";
import { Send, ChevronsUpDown, Check, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFeedback, listFeedbackQuestions, listProfiles } from "@/services/backendApi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const GiveFeedback = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColleague, setSelectedColleague] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [situations, setSituations] = useState([
  { situation: "", behaviour: "", impact: "", optional: "" }
]);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const { data: colleagues = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => listProfiles(),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["feedback-questions"],
    queryFn: async () => listFeedbackQuestions(),
  });

  const activeQuestions = questions
    .filter((q) => q.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const questionDefaults = [
    {
      label: "SITUATION",
      description: "Briefly explain the situation/interaction you had with this person",
    },
    {
      label: "BEHAVIOUR",
      description: "What did they do in that situation that stood out (positively or negatively)?",
    },
    {
      label: "IMPACT",
      description: "How did it impact you, the team or the work outcome?",
    },
    {
      label: "Additional Comments",
      description: "(Optional) What is one thing you'd encourage them to continue or suggest doing differently",
    },
  ];

  const questionLabels = questionDefaults.map((fallback, index) => {
    const label = activeQuestions[index]?.label?.trim() || fallback.label;
    const description = activeQuestions[index]?.description?.trim() || fallback.description;
    if (label.includes(":")) return label;
    return `${label}: ${description}`;
  });

  const requiredMap: Record<"situation" | "behaviour" | "impact" | "optional", boolean> = {
    situation: activeQuestions[0]?.is_required ?? true,
    behaviour: activeQuestions[1]?.is_required ?? true,
    impact: activeQuestions[2]?.is_required ?? true,
    optional: activeQuestions[3]?.is_required ?? false,
  };

  const filteredColleagues = colleagues.filter((c) => c.id !== profile?.id);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const rows = situations
        .filter(
          (s) =>
            s.situation.trim() ||
            s.behaviour.trim() ||
            s.impact.trim() ||
            s.optional.trim()
        )
        .map((s) => ({
          author_id: profile!.id,
          recipient_id: selectedColleague,
          situation: s.situation.trim(),
          behaviour: s.behaviour.trim(),
          impact: s.impact.trim(),
          optional: s.optional.trim(),
          is_anonymous: isAnonymous,
        }));

      if (rows.length === 0) {
        throw new Error("Please fill in at least one situation");
      }

      await createFeedback(rows);
    },

    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setSelectedColleague("");
      setSituations([
        { situation: "", behaviour: "", impact: "", optional: "" },
      ]);
      setIsAnonymous(true);
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },

    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAtLeastOneValid = situations.some((s) => {
      const requiredFields = ["situation", "behaviour", "impact", "optional"] as const;
      return requiredFields.every((field) => {
        if (!requiredMap[field]) return true;
        return s[field].trim().length > 0;
      });
    });
    if (!selectedColleague) {
    toast.error("Please select a colleague");
    return;
  }

  if (!hasAtLeastOneValid) {
    toast.error("Please complete all required fields");
    return;
  }
    submitMutation.mutate();
  };

  const updateSituation = (index: number, field: "situation" | "behaviour" | "impact" | "optional", value: string) => {
  setSituations((prev) =>
    prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
  );
};

  const addSituation = () => {
  setSituations((prev) => [
    ...prev,
    { situation: "", behaviour: "", impact: "", optional: "" },
  ]);
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

                {situations.map((item, index) => (
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
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-foreground/80">{questionLabels[0]}</Label>
                      <Textarea
                        value={item.situation}
                        onChange={(e) =>
                          updateSituation(index, "situation", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-normal text-foreground/80">{questionLabels[1]}</Label>
                        <Textarea
                          value={item.behaviour}
                          onChange={(e) =>
                            updateSituation(index, "behaviour", e.target.value)
                          }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-normal text-foreground/80">{questionLabels[2]}</Label>
                        <Textarea
                          value={item.impact}
                          onChange={(e) =>
                            updateSituation(index, "impact", e.target.value)
                          }
                        />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-foreground/80">{questionLabels[3]}</Label>
                      <Textarea
                        value={item.optional}
                        onChange={(e) =>
                          updateSituation(index, "optional", e.target.value)
                        }
                      />
                    </div>
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
