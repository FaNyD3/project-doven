import { TestBed, async, inject } from '@angular/core/testing';

import { GeneralAdminGuard } from './general-admin.guard';

describe('GeneralAdminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeneralAdminGuard]
    });
  });

  it('should ...', inject([GeneralAdminGuard], (guard: GeneralAdminGuard) => {
    expect(guard).toBeTruthy();
  }));
});
