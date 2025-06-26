import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Assistant } from '@/types/assistant';
import { Edit, Trash2, Phone, Mic } from 'lucide-react';

interface AssistantCardProps {
  assistant: Assistant;
  onEdit: (assistant: Assistant) => void;
  onDelete: (id: string) => void;
  onStartVoiceChat: (assistant: Assistant) => void;
  onMakeCall: (assistant: Assistant) => void;
}

const AssistantCard: React.FC<AssistantCardProps> = ({
  assistant,
  onEdit,
  onDelete,
  onStartVoiceChat,
  onMakeCall,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{assistant.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{assistant.voice_id}</Badge>
              <Badge variant="secondary">{assistant.model}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(assistant)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(assistant.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          <p className="line-clamp-3">{assistant.system_prompt}</p>
        </div>
        
        {assistant.first_message && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <strong>First Message:</strong> {assistant.first_message}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onStartVoiceChat(assistant)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Mic className="h-4 w-4 mr-1" />
            Voice Chat
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMakeCall(assistant)}
          >
            <Phone className="h-4 w-4 mr-1" />
            Make Call
          </Button>
        </div>
        
        <div className="text-xs text-gray-400">
          Created: {assistant.created_at ? new Date(assistant.created_at).toLocaleDateString() : 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssistantCard;
