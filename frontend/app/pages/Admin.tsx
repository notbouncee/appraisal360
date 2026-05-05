import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/app/templates/AppLayout";
import { Card, CardContent } from "@/components/molecules/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  adminCreateUser,
  createFeedbackQuestion,
  createReviewCycle,
  deleteFeedbackQuestion,
  deleteReviewCycle,
  exportFeedbackCsv,
  forcePasswordChange,
  listFeedbackQuestions,
  listReviewCycles,
  updateFeedbackQuestion,
  updateReviewCycle,
  type FeedbackQuestion,
  type ReviewCycle,
} from "@/services/backendApi";
import { toast } from "sonner";

const Admin = () => {
  const { profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = (profile?.role || "").toLowerCase() === "admin";

  const [questionsDrafts, setQuestionsDrafts] = useState<Record<string, FeedbackQuestion>>({});
  const [newQuestion, setNewQuestion] = useState({
    label: "",
    description: "",
    is_required: true,
    sort_order: 1,
    is_active: true,
  });

  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());
  const [newCycle, setNewCycle] = useState({
    year: new Date().getFullYear(),
    quarter: 1,
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [cycleDrafts, setCycleDrafts] = useState<Record<string, ReviewCycle>>({});

  const [newUser, setNewUser] = useState({
    email: "",
    display_name: "",
    team: "",
    role: "member",
    temp_password: "",
  });

  const [exportFilters, setExportFilters] = useState({
    start_date: "",
    end_date: "",
    recipient_id: "",
    author_id: "",
    is_anonymous: "",
  });

  const [forceEmail, setForceEmail] = useState("");

  const { data: questions = [] } = useQuery({
    queryKey: ["admin", "feedback-questions"],
    queryFn: async () => listFeedbackQuestions(),
    enabled: isAdmin,
  });

  const { data: reviewCycles = [] } = useQuery({
    queryKey: ["admin", "review-cycles", cycleYear],
    queryFn: async () => listReviewCycles(cycleYear),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!questions.length) return;
    const drafts: Record<string, FeedbackQuestion> = {};
    questions.forEach((q) => {
      drafts[q.id] = { ...q };
    });
    setQuestionsDrafts(drafts);
  }, [questions]);

  useEffect(() => {
    if (!reviewCycles.length) return;
    const drafts: Record<string, ReviewCycle> = {};
    reviewCycles.forEach((c) => {
      drafts[c.id] = { ...c };
    });
    setCycleDrafts(drafts);
  }, [reviewCycles]);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions],
  );

  if (loading) return null;
  if (!profile) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleQuestionCreate = async () => {
    try {
      if (!newQuestion.label.trim()) {
        toast.error("Label is required");
        return;
      }
      await createFeedbackQuestion({
        label: newQuestion.label.trim(),
        description: newQuestion.description.trim(),
        is_required: newQuestion.is_required,
        sort_order: Number(newQuestion.sort_order),
        is_active: newQuestion.is_active,
      });
      setNewQuestion({ label: "", description: "", is_required: true, sort_order: 1, is_active: true });
      await queryClient.invalidateQueries({ queryKey: ["admin", "feedback-questions"] });
      toast.success("Question created");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuestionUpdate = async (id: string) => {
    const draft = questionsDrafts[id];
    if (!draft) return;
    try {
      await updateFeedbackQuestion(id, {
        label: draft.label,
        description: draft.description,
        is_required: draft.is_required,
        sort_order: Number(draft.sort_order),
        is_active: draft.is_active,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "feedback-questions"] });
      toast.success("Question updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuestionDelete = async (id: string) => {
    try {
      await deleteFeedbackQuestion(id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "feedback-questions"] });
      toast.success("Question deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCycleCreate = async () => {
    try {
      await createReviewCycle({
        year: Number(newCycle.year),
        quarter: Number(newCycle.quarter),
        title: newCycle.title.trim(),
        description: newCycle.description.trim(),
        start_date: newCycle.start_date,
        end_date: newCycle.end_date,
      });
      setNewCycle({
        year: cycleYear,
        quarter: 1,
        title: "",
        description: "",
        start_date: "",
        end_date: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "review-cycles", cycleYear] });
      toast.success("Review cycle created");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCycleUpdate = async (id: string) => {
    const draft = cycleDrafts[id];
    if (!draft) return;
    try {
      await updateReviewCycle(id, {
        title: draft.title,
        description: draft.description,
        start_date: draft.start_date,
        end_date: draft.end_date,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "review-cycles", cycleYear] });
      toast.success("Review cycle updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCycleDelete = async (id: string) => {
    try {
      await deleteReviewCycle(id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "review-cycles", cycleYear] });
      toast.success("Review cycle deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      await adminCreateUser({
        email: newUser.email,
        display_name: newUser.display_name,
        team: newUser.team,
        role: newUser.role,
        temp_password: newUser.temp_password,
      });
      setNewUser({ email: "", display_name: "", team: "", role: "member", temp_password: "" });
      toast.success("User created")
    } catch (err: any) {
      toast.error(err.message)
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportFeedbackCsv({
        start_date: exportFilters.start_date || undefined,
        end_date: exportFilters.end_date || undefined,
        recipient_id: exportFilters.recipient_id || undefined,
        author_id: exportFilters.author_id || undefined,
        is_anonymous: exportFilters.is_anonymous === "" ? undefined : exportFilters.is_anonymous === "true",
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "feedback_export.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export ready")
    } catch (err: any) {
      toast.error(err.message)
    }
  };

  const handleForcePassword = async () => {
    try {
      await forcePasswordChange(forceEmail);
      setForceEmail("");
      toast.success("Password change enforced")
    } catch (err: any) {
      toast.error(err.message)
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Manage questions, review cycles, users, and exports.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Configurable Feedback Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <Label>Label</Label>
                <Input value={newQuestion.label} onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input value={newQuestion.description} onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })} />
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={newQuestion.sort_order} onChange={(e) => setNewQuestion({ ...newQuestion, sort_order: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Required</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={newQuestion.is_required ? "true" : "false"}
                  onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.value === "true" })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <Label>Active</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={newQuestion.is_active ? "true" : "false"}
                  onChange={(e) => setNewQuestion({ ...newQuestion, is_active: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-6">
                <Button onClick={handleQuestionCreate}>Add Question</Button>
              </div>
            </div>

            <div className="space-y-3">
              {sortedQuestions.map((q) => (
                <div key={q.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label>Label</Label>
                    <Input
                      value={questionsDrafts[q.id]?.label || ""}
                      onChange={(e) =>
                        setQuestionsDrafts({
                          ...questionsDrafts,
                          [q.id]: { ...questionsDrafts[q.id], label: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={questionsDrafts[q.id]?.description || ""}
                      onChange={(e) =>
                        setQuestionsDrafts({
                          ...questionsDrafts,
                          [q.id]: { ...questionsDrafts[q.id], description: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={questionsDrafts[q.id]?.sort_order ?? 0}
                      onChange={(e) =>
                        setQuestionsDrafts({
                          ...questionsDrafts,
                          [q.id]: { ...questionsDrafts[q.id], sort_order: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Required</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                      value={questionsDrafts[q.id]?.is_required ? "true" : "false"}
                      onChange={(e) =>
                        setQuestionsDrafts({
                          ...questionsDrafts,
                          [q.id]: { ...questionsDrafts[q.id], is_required: e.target.value === "true" },
                        })
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <Label>Active</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                      value={questionsDrafts[q.id]?.is_active ? "true" : "false"}
                      onChange={(e) =>
                        setQuestionsDrafts({
                          ...questionsDrafts,
                          [q.id]: { ...questionsDrafts[q.id], is_active: e.target.value === "true" },
                        })
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleQuestionUpdate(q.id)}>Save</Button>
                    <Button variant="destructive" onClick={() => handleQuestionDelete(q.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">Configure Review Cycles</h2>
            <div className="flex items-center gap-3">
              <Label>Year</Label>
              <Input
                type="number"
                value={cycleYear}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCycleYear(next);
                  setNewCycle({ ...newCycle, year: next });
                }}
                className="w-32"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <Label>Quarter</Label>
                <Input type="number" value={newCycle.quarter} onChange={(e) => setNewCycle({ ...newCycle, quarter: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input value={newCycle.title} onChange={(e) => setNewCycle({ ...newCycle, title: e.target.value })} />
              </div>
              <div className="md:col-span-3">
                <Label>Description</Label>
                <Input value={newCycle.description} onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newCycle.start_date} onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newCycle.end_date} onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })} />
              </div>
              <div className="md:col-span-6">
                <Button onClick={handleCycleCreate}>Add Review Cycle</Button>
              </div>
            </div>

            <div className="space-y-3">
              {reviewCycles.map((cycle) => (
                <div key={cycle.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                  <div>
                    <Label>Quarter</Label>
                    <Input value={cycle.quarter} disabled />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={cycleDrafts[cycle.id]?.title || ""}
                      onChange={(e) =>
                        setCycleDrafts({
                          ...cycleDrafts,
                          [cycle.id]: { ...cycleDrafts[cycle.id], title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={cycleDrafts[cycle.id]?.description || ""}
                      onChange={(e) =>
                        setCycleDrafts({
                          ...cycleDrafts,
                          [cycle.id]: { ...cycleDrafts[cycle.id], description: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="date"
                      value={cycleDrafts[cycle.id]?.start_date || ""}
                      onChange={(e) =>
                        setCycleDrafts({
                          ...cycleDrafts,
                          [cycle.id]: { ...cycleDrafts[cycle.id], start_date: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="date"
                      value={cycleDrafts[cycle.id]?.end_date || ""}
                      onChange={(e) =>
                        setCycleDrafts({
                          ...cycleDrafts,
                          [cycle.id]: { ...cycleDrafts[cycle.id], end_date: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleCycleUpdate(cycle.id)}>Save</Button>
                    <Button variant="destructive" onClick={() => handleCycleDelete(cycle.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={newUser.display_name} onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })} />
              </div>
              <div>
                <Label>Team</Label>
                <Input value={newUser.team} onChange={(e) => setNewUser({ ...newUser, team: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label>Temp Password</Label>
                <Input type="password" value={newUser.temp_password} onChange={(e) => setNewUser({ ...newUser, temp_password: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreateUser}>Create User</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Export Feedback</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={exportFilters.start_date} onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={exportFilters.end_date} onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })} />
              </div>
              <div>
                <Label>Recipient ID</Label>
                <Input value={exportFilters.recipient_id} onChange={(e) => setExportFilters({ ...exportFilters, recipient_id: e.target.value })} />
              </div>
              <div>
                <Label>Author ID</Label>
                <Input value={exportFilters.author_id} onChange={(e) => setExportFilters({ ...exportFilters, author_id: e.target.value })} />
              </div>
              <div>
                <Label>Anonymous</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={exportFilters.is_anonymous}
                  onChange={(e) => setExportFilters({ ...exportFilters, is_anonymous: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="true">Anonymous</option>
                  <option value="false">Non-anonymous</option>
                </select>
              </div>
            </div>
            <Button onClick={handleExport}>Export CSV</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Force Password Change</h2>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <Label>User Email</Label>
                <Input value={forceEmail} onChange={(e) => setForceEmail(e.target.value)} />
              </div>
              <Button variant="destructive" onClick={handleForcePassword}>Force Change</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Admin;
