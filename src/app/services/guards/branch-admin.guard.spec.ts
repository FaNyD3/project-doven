import { TestBed, async, inject } from '@angular/core/testing';

import { BranchAdminGuard } from './branch-admin.guard';

describe('BranchAdminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BranchAdminGuard]
    });
  });

  it('should ...', inject([BranchAdminGuard], (guard: BranchAdminGuard) => {
    expect(guard).toBeTruthy();
  }));
});
