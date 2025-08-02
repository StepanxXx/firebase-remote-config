import { TestBed } from '@angular/core/testing';

import { RemoteConfig } from './remote-config';

describe('RemoteConfig', () => {
  let service: RemoteConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemoteConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
