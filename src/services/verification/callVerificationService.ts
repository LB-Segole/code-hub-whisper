
import { VerificationCheck, VerificationSession } from './types';

class CallVerificationService {
  private sessions: Map<string, VerificationSession> = new Map();

  startVerification(callId: string, phoneNumber: string): string {
    const sessionId = `session-${Date.now()}`;
    const session: VerificationSession = {
      sessionId,
      callId,
      phoneNumber,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      status: 'running',
      overallStatus: 'checking',
      checks: []
    };
    
    this.sessions.set(sessionId, session);
    this.runVerificationChecks(sessionId);
    return sessionId;
  }

  private async runVerificationChecks(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Simulate verification checks
    const checkTypes: VerificationCheck['type'][] = [
      'signalwire_api',
      'call_status', 
      'webhook_response',
      'ring_timeout'
    ];

    for (const type of checkTypes) {
      await this.delay(1000);
      const check: VerificationCheck = {
        id: `check-${Date.now()}`,
        type,
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        details: `${type} check completed`,
        timestamp: new Date().toISOString()
      };
      
      session.checks.push(check);
      session.lastUpdate = new Date().toISOString();
    }

    session.overallStatus = session.checks.every(c => c.status === 'passed') ? 'verified' : 'failed';
    session.status = 'completed';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAllSessions(): VerificationSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionResults(sessionId: string): VerificationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  startVerificationSession(callId: string, phoneNumber: string): string {
    return this.startVerification(callId, phoneNumber);
  }

  clearOldSessions(): void {
    // Clear sessions older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.startTime).getTime() < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export const callVerificationService = new CallVerificationService();
