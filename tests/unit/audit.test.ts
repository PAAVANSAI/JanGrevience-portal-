import { describe, it, expect, vi } from 'vitest';
import { logAuditEvent, AuditLogPayload } from '../../src/lib/audit';

describe('Audit Logger', () => {
  it('should attempt to insert a log entry correctly', async () => {
    // Mock Supabase client
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    
    // Mock user and profile retrieval
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } });
    const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'OFFICER' } });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === 'profiles') return { select: mockSelect };
        if (table === 'audit_logs') return { insert: mockInsert };
      }
    } as any;

    const payload: AuditLogPayload = {
      action_type: 'STATUS_CHANGED',
      resource_type: 'grievance',
      resource_id: 'g-123',
      previous_value: { status: 'IN_PROGRESS' },
      new_value: { status: 'RESOLVED' }
    };

    const result = await logAuditEvent(mockSupabase, payload);
    
    expect(result).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user',
      user_role: 'OFFICER',
      action_type: 'STATUS_CHANGED',
      resource_type: 'grievance',
      resource_id: 'g-123',
      previous_value: { status: 'IN_PROGRESS' },
      new_value: { status: 'RESOLVED' }
    });
  });
});
