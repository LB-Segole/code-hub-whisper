
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Download, Calendar } from 'lucide-react';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: {
    system_prompt?: string;
    voice_model?: string;
    example_calls?: string[];
    is_active?: boolean;
  };
  created_by: string;
  team_id?: string;
  is_public: boolean;
  downloads_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  version?: string;
  tags: string[];
}

interface TemplateCardProps {
  template: AgentTemplate;
  onDownload: (template: AgentTemplate) => void;
  onRate: (templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDownload,
  onRate
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">
          ({template.rating_count})
        </span>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge variant="outline">v{template.version || '1.0.0'}</Badge>
            </div>
          </div>
          <div className="text-right">
            {renderRating(template.rating_average)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.downloads_count || 0}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(template.created_at)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onDownload(template)}
            className="flex-1"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Use Template
          </Button>
          <Button
            variant="outline"
            onClick={() => onRate(template.id)}
            size="sm"
          >
            <Star className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
