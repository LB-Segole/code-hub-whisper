
import { backendService } from './BackendService';

export interface CallRecord {
  id: string;
  phone_number: string;
  status: string;
  duration: number;
  created_at: string;
  summary?: string;
  external_id?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_company?: string;
  campaign_name?: string;
  recording_url?: string;
}

export interface CallStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_duration: number;
  average_duration: number;
  success_rate: number;
}

class CallService {
  async getAllCalls(): Promise<CallRecord[]> {
    try {
      const calls = await backendService.select('calls', {
        orderBy: { column: 'created_at', ascending: false }
      });

      return calls.map(call => ({
        id: call.id || '',
        phone_number: call.phone_number || 'Unknown',
        status: call.status || 'unknown',
        duration: call.duration || 0,
        created_at: call.created_at || '',
        summary: call.summary || undefined,
        external_id: call.external_id || undefined,
        contact_name: call.contact_name || undefined,
        contact_phone: call.contact_phone || undefined,
        contact_company: call.contact_company || undefined,
        campaign_name: call.campaign_name || undefined,
        recording_url: call.recording_url || undefined
      }));
    } catch (error) {
      console.error('Error fetching calls:', error);
      return [];
    }
  }

  async getCallById(callId: string): Promise<CallRecord | null> {
    try {
      if (!callId) {
        console.warn('getCallById called with undefined callId');
        return null;
      }

      const calls = await backendService.select('calls', {
        where: { id: callId },
        limit: 1
      });

      if (calls.length === 0) return null;

      const call = calls[0];
      return {
        id: call.id || '',
        phone_number: call.phone_number || 'Unknown',
        status: call.status || 'unknown',
        duration: call.duration || 0,
        created_at: call.created_at || '',
        summary: call.summary || undefined,
        external_id: call.external_id || undefined,
        contact_name: call.contact_name || undefined,
        contact_phone: call.contact_phone || undefined,
        contact_company: call.contact_company || undefined,
        campaign_name: call.campaign_name || undefined,
        recording_url: call.recording_url || undefined
      };
    } catch (error) {
      console.error('Error fetching call:', error);
      return null;
    }
  }

  async initiateCall(phoneNumber: string, campaignId?: string): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const newCall = await backendService.insert('calls', {
        phone_number: phoneNumber,
        campaign_id: campaignId || null,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
      return { 
        success: true, 
        callId: newCall.id
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initiate call'
      };
    }
  }

  async endCall(callId: string, summary?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await backendService.update('calls', callId, {
        status: 'completed',
        summary: summary || null,
        completed_at: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to end call'
      };
    }
  }

  async getCallStats(): Promise<CallStats> {
    try {
      const calls = await backendService.select('calls');

      const totalCalls = calls.length;
      const successfulCalls = calls.filter(call => call.status === 'completed').length;
      const failedCalls = calls.filter(call => call.status === 'failed').length;
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

      return {
        total_calls: totalCalls,
        successful_calls: successfulCalls,
        failed_calls: failedCalls,
        total_duration: totalDuration,
        average_duration: averageDuration,
        success_rate: successRate
      };
    } catch (error) {
      console.error('Error fetching call stats:', error);
      return {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        total_duration: 0,
        average_duration: 0,
        success_rate: 0
      };
    }
  }
}

export const callService = new CallService();
