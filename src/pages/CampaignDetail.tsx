
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContactUploader from '@/components/CallCenter/ContactUploader';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mockCampaign = {
    id,
    name: 'Sample Campaign',
    status: 'active' as const,
    total_calls: 100,
    completed_calls: 25,
    success_rate: 80
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{mockCampaign.name}</h1>
          <Badge variant="secondary">{mockCampaign.status}</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCampaign.completed_calls}/{mockCampaign.total_calls}
            </div>
            <div className="text-sm text-gray-500">Calls completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCampaign.success_rate}%</div>
            <div className="text-sm text-gray-500">Successful connections</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
            <Button variant="outline" className="w-full">
              <Pause className="h-4 w-4 mr-2" />
              Pause Campaign
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ContactUploader campaignId={id} />
      </div>
    </div>
  );
};

export default CampaignDetail;
