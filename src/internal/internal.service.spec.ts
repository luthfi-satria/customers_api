import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from 'src/customers/customers.service';
import { InternalService } from './internal.service';

describe('InternalService', () => {
  let service: InternalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalService,
        {
          provide: CustomersService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InternalService>(InternalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
