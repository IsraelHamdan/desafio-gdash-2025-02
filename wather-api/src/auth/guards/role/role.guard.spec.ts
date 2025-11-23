import { RolesGuard } from './role.guard';
import { Reflector } from '@nestjs/core';

describe('RoleGuard', () => {
  it('should be defined', () => {
    expect(new RolesGuard(Reflector)).toBeDefined();
  });
});
