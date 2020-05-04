import { TestBed, async, inject } from '@angular/core/testing';

import { LogisticsGuard } from './logistics.guard';

describe('LogisticsGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogisticsGuard]
    });
  });

  it('should ...', inject([LogisticsGuard], (guard: LogisticsGuard) => {
    expect(guard).toBeTruthy();
  }));
});
