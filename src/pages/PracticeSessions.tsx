import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Save, Calendar } from 'lucide-react';

const practiceSessionSchema = z.object({
  practice_type: z.string().nonempty("Practice type is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  date: z.string().nonempty("Date is required")
});

const PracticeSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    practice_type: '',
    duration: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const practiceTypes = [
    'Forehand Loops',
    'Backhand Loops', 
    'Serve Practice',
    'Footwork Drills',
    'Multi-ball Drills',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to log practice sessions",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate form data
      const validatedData = practiceSessionSchema.parse({
        ...formData,
        duration: parseInt(formData.duration)
      });

      setIsSubmitting(true);

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          practice_type: validatedData.practice_type,
          duration: validatedData.duration,
          notes: validatedData.notes || null,
          date: validatedData.date
        });

      if (error) throw error;

      toast({
        title: "🏓 Practice Session Logged!",
        description: "Your practice session has been recorded successfully",
      });

      // Reset form
      setFormData({
        practice_type: '',
        duration: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Navigate to practice history
      navigate('/practice-history');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        console.error('Error saving practice session:', error);
        toast({
          title: "Error",
          description: "Failed to save practice session. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="glass-card animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏓</span>
              </div>
              <CardTitle className="text-2xl font-bold">Log Practice Session</CardTitle>
            </div>
            <p className="text-muted-foreground">
              Record your practice sessions and focus areas to track your training habits.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="practice_type">Practice Type *</Label>
                <Select 
                  value={formData.practice_type} 
                  onValueChange={(value) => handleInputChange('practice_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select practice type" />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Enter duration in minutes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any notes about your practice session..."
                  maxLength={1000}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.notes.length}/1000 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? (
                    <>
                      <Calendar className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Practice Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeSessions;