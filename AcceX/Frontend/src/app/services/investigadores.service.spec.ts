import { TestBed } from '@angular/core/testing';

import { InvestigadoresService } from './investigadores.service';

describe('InvestigadoresService', () => {
  let service: InvestigadoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvestigadoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
