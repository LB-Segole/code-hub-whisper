
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface ContactUploaderProps {
  campaignId?: string;
  onSuccess?: (contacts: any[]) => void;
}

const ContactUploader: React.FC<ContactUploaderProps> = ({ campaignId, onSuccess }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          Contact upload functionality will be available with the local backend.
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactUploader;
