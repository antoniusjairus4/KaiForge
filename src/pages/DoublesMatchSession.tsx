import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

const doublesMatchSchema = z.object({
  partner_name: z.string().trim().min(1, "Partner name is required"),
  opponent_names: z.string().trim().min(1, "Opponent names are required"),
  result: z.enum(["Win", "Loss", "Draw"], { required_error: "Result is required" }),
  score: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required")
});

export default function DoublesMatchSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    partner_name: '',
    opponent_names: '',
    result: '',
    score: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = doublesMatchSchema.parse(formData);
      
      const { error } = await supabase
        .from('doubles_performances')
        .insert({
          user_id: user?.id,
          partner_name: validatedData.partner_name,
          opponent_names: validatedData.opponent_names,
          result: validatedData.result,
          score: validatedData.score || null,
          notes: validatedData.notes || null,
          date: validatedData.date
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doubles match logged successfully!",
      });

      navigate('/doubles-history');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "Failed to log doubles match. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="responsive-container mx-auto">
      <Card className="glass-card animate-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">🏓 Log Doubles Match</CardTitle>
          <CardDescription>
            Record your doubles match session, including your partner and match details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="partner_name">Partner Name *</Label>
                <Input
                  id="partner_name"
                  value={formData.partner_name}
                  onChange={(e) => handleInputChange('partner_name', e.target.value)}
                  className={errors.partner_name ? 'border-destructive' : ''}
                />
                {errors.partner_name && (
                  <p className="text-sm text-destructive">{errors.partner_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opponent_names">Opponent Names *</Label>
                <Input
                  id="opponent_names"
                  placeholder="Enter both opponents separated by a comma"
                  value={formData.opponent_names}
                  onChange={(e) => handleInputChange('opponent_names', e.target.value)}
                  className={errors.opponent_names ? 'border-destructive' : ''}
                />
                {errors.opponent_names && (
                  <p className="text-sm text-destructive">{errors.opponent_names}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>
                <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                  <SelectTrigger className={errors.result ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="Draw">Draw</SelectItem>
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
                  placeholder="e.g., 3-2, 21-18"
                  value={formData.score}
                  onChange={(e) => handleInputChange('score', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Personal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the match..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Match'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}