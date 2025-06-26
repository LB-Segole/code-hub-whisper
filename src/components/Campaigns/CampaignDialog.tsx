import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAssistants } from '@/hooks/useAssistants';
import { toast } from 'sonner';

interface CampaignDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const CampaignDialog: React.FC<CampaignDialogProps> = ({ trigger, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assistant_id: '',
    total_calls: 100,
    status: 'draft' as const
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createCampaign } = useCampaigns();
  const { assistants } = useAssistants();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createCampaign(formData);
      toast.success('Campaign created successfully!');
      setFormData({
        name: '',
        description: '',
        assistant_id: '',
        total_calls: 100,
        status: 'draft'
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose of this campaign"
              className="min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              AI Assistant
            </label>
            <Select 
              value={formData.assistant_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assistant_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an AI assistant" />
              </SelectTrigger>
              <SelectContent>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Target Calls
            </label>
            <Input
              type="number"
              min="1"
              value={formData.total_calls}
              onChange={(e) => setFormData(prev => ({ ...prev, total_calls: parseInt(e.target.value) || 100 }))}
              placeholder="Number of calls to make"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
