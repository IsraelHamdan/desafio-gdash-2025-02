import { Test, TestingModule } from '@nestjs/testing';
import { ArgonService } from './argon.service';

describe('ArgonService', () => {
  let service: ArgonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArgonService],
    }).compile();

    service = module.get<ArgonService>(ArgonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
