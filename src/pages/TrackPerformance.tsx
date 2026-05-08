import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart3, Loader2 } from 'lucide-react';
import { z } from 'zod';

const performanceSchema = z.object({
  sessionType: z.enum(['Practice', 'Match'], {
    required_error: 'Please select a session type',
  }),
  opponent: z.string().min(1, 'Opponent name is required'),
  result: z.enum(['Win', 'Loss'], {
    required_error: 'Please select a result',
  }),
  score: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

export default function TrackPerformance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sessionType: '',
    opponent: '',
    result: '',
    score: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setErrors({});

    try {
      const validated = performanceSchema.parse(formData);

      const { error } = await supabase
        .from('performances')
        .insert({
          user_id: user.id,
          session_type: validated.sessionType,
          opponent: validated.opponent,
          result: validated.result,
          score: validated.score || null,
          notes: validated.notes || null,
          date: validated.date,
        });

      if (error) {
        toast({
          title: "Error saving session",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Session recorded",
          description: `${validated.sessionType} against ${validated.opponent} saved successfully.`,
        });
        
        // Reset form
        setFormData({
          sessionType: '',
          opponent: '',
          result: '',
          score: '',
          notes: '',
          date: new Date().toISOString().split('T')[0],
        });

        // Navigate to history page
        navigate('/history');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-slide">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          <span>Record Match or Practice</span>
        </h1>
        <p className="text-muted-foreground">
          Track your table tennis sessions and analyze your performance
        </p>
      </div>

      <Card className="glass-card hover-lift">
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>
            Record the details of your match or practice session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type *</Label>
              <Select
                value={formData.sessionType}
                onValueChange={(value) => handleInputChange('sessionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Practice">Practice</SelectItem>
                  <SelectItem value="Match">Match</SelectItem>
                </SelectContent>
              </Select>
              {errors.sessionType && (
                <p className="text-sm text-destructive">{errors.sessionType}</p>
              )}
            </div>

            {/* Opponent Name */}
            <div className="space-y-2">
              <Label htmlFor="opponent">Opponent Name *</Label>
              <Input
                id="opponent"
                type="text"
                value={formData.opponent}
                onChange={(e) => handleInputChange('opponent', e.target.value)}
                placeholder="Enter opponent's name"
              />
              {errors.opponent && (
                <p className="text-sm text-destructive">{errors.opponent}</p>
              )}
            </div>

            {/* Result */}
            <div className="space-y-2">
              <Label htmlFor="result">Result *</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => handleInputChange('result', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                </SelectContent>
              </Select>
              {errors.result && (
                <p className="text-sm text-destructive">{errors.result}</p>
              )}
            </div>

            {/* Score */}
            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="text"
                value={formData.score}
                onChange={(e) => handleInputChange('score', e.target.value)}
                placeholder="e.g., 3-1, 11-9, 11-7, 11-5"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Enter the match score (e.g., 3-1 for sets, or individual game scores)
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            {/* Personal Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Personal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add notes about your performance, what went well, areas to improve..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Record insights, techniques used, or areas for improvement
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 animate-scale-bounce"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Session'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}