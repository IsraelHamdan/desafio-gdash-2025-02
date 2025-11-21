import { Test, TestingModule } from '@nestjs/testing';
import { InsigthsService } from './insigths.service';

describe('InsigthsService', () => {
  let service: InsigthsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsigthsService],
    }).compile();

    service = module.get<InsigthsService>(InsigthsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
