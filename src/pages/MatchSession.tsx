import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

// Validation schema for match data
const matchSchema = z.object({
  matchType: z.enum(["singles", "doubles"], { required_error: "Match type is required" }),
  opponent: z.string().trim().min(1, "Opponent name is required").max(200, "Opponent name too long"),
  partnerName: z.string().trim().max(100, "Partner name too long").optional(),
  result: z.enum(["win", "loss"], { required_error: "Result is required" }),
  score: z.string().trim().max(50, "Score too long").optional(),
  notes: z.string().trim().max(1000, "Notes too long").optional(),
}).refine(
  (data) => data.matchType !== "doubles" || (data.partnerName && data.partnerName.length > 0),
  {
    message: "Partner name is required for doubles matches",
    path: ["partnerName"],
  }
);

const MatchSession = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    matchType: "",
    opponent: "",
    partnerName: "",
    result: "",
    score: "",
    notes: "",
  });

  useEffect(() => {
    setDate(new Date());
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    try {
      matchSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (formData.matchType === "doubles") {
        // Save as doubles performance
        const { error } = await supabase.from("doubles_performances").insert({
          user_id: user.id,
          opponent_names: formData.opponent,
          partner_name: formData.partnerName,
          result: formData.result,
          score: formData.score,
          notes: formData.notes,
          date: format(date || new Date(), "yyyy-MM-dd"),
        });

        if (error) throw error;
      } else {
        // Save as singles performance  
        const { error } = await supabase.from("performances").insert({
          user_id: user.id,
          opponent: formData.opponent,
          result: formData.result,
          score: formData.score,
          notes: formData.notes,
          session_type: "match",
          date: format(date || new Date(), "yyyy-MM-dd"),
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Match performance recorded successfully!",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        title: "Error",
        description: "Failed to save match performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.matchType && formData.opponent && formData.result &&
    (formData.matchType !== "doubles" || formData.partnerName);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">🏓 Record Match Performance</h1>
        <p className="text-muted-foreground">
          Track your singles or doubles match results
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
          <CardDescription>
            Enter the details of your match performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matchType">Match Type *</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={(value) => handleInputChange("matchType", value)}
                >
                  <SelectTrigger className={errors.matchType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>
                {errors.matchType && (
                  <p className="text-sm text-destructive">{errors.matchType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opponent">Opponent *</Label>
                <Input
                  id="opponent"
                  placeholder={formData.matchType === "doubles" ? "Opponent names" : "Opponent name"}
                  value={formData.opponent}
                  onChange={(e) => handleInputChange("opponent", e.target.value)}
                  maxLength={200}
                  className={errors.opponent ? "border-destructive" : ""}
                  required
                />
                {errors.opponent && (
                  <p className="text-sm text-destructive">{errors.opponent}</p>
                )}
              </div>
            </div>

            {formData.matchType === "doubles" && (
              <div className="space-y-2">
                <Label htmlFor="partnerName">Partner Name *</Label>
                <Input
                  id="partnerName"
                  placeholder="Your partner's name"
                  value={formData.partnerName}
                  onChange={(e) => handleInputChange("partnerName", e.target.value)}
                  maxLength={100}
                  className={errors.partnerName ? "border-destructive" : ""}
                  required
                />
                {errors.partnerName && (
                  <p className="text-sm text-destructive">{errors.partnerName}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>
                <Select
                  value={formData.result}
                  onValueChange={(value) => handleInputChange("result", value)}
                >
                  <SelectTrigger className={errors.result ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
                {errors.result && (
                  <p className="text-sm text-destructive">{errors.result}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  placeholder="e.g., 3-1, 21-19"
                  value={formData.score}
                  onChange={(e) => handleInputChange("score", e.target.value)}
                  maxLength={50}
                  className={errors.score ? "border-destructive" : ""}
                />
                {errors.score && (
                  <p className="text-sm text-destructive">{errors.score}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about the match..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                maxLength={1000}
                className={errors.notes ? "border-destructive" : ""}
                rows={4}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Match Performance"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchSession;