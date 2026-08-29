import { describe, it, expect } from 'vitest';
import { getValidNextStatuses } from '../../src/lib/constants/workflow';

describe('Workflow Transitions', () => {
  it('should allow SUBMITTED to transition to ACKNOWLEDGED or REJECTED', () => {
    const valid = getValidNextStatuses('SUBMITTED');
    expect(valid).toContain('ACKNOWLEDGED');
    expect(valid).toContain('REJECTED');
    expect(valid).not.toContain('RESOLVED');
  });

  it('should allow IN_PROGRESS to transition to ACTION_TAKEN or ADDITIONAL_INFORMATION_REQUIRED', () => {
    const valid = getValidNextStatuses('IN_PROGRESS');
    expect(valid).toContain('ACTION_TAKEN');
    expect(valid).toContain('ADDITIONAL_INFORMATION_REQUIRED');
  });

  it('should not allow CLOSED to transition anywhere', () => {
    const valid = getValidNextStatuses('CLOSED');
    expect(valid.length).toBe(0);
  });
});
