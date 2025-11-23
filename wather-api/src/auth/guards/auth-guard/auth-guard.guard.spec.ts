import { Guardian } from './auth-guard.guard';

describe('AuthGuardGuard', () => {
  it('should be defined', () => {
    expect(new Guardian()).toBeDefined();
  });
});
