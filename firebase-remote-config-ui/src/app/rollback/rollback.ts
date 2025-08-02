import { Component } from '@angular/core';
import { RemoteConfigService } from '../services/remote-config.service';

@Component({
  selector: 'app-rollback',
  templateUrl: './rollback.html',
  styleUrls: ['./rollback.scss']
})
export class Rollback {
  versionNumber: number | null = null;

  constructor(private remoteConfigService: RemoteConfigService) {}

  rollback(): void {
    if (this.versionNumber) {
      this.remoteConfigService.rollback({ versionNumber: this.versionNumber }).subscribe(
        () => alert('Rollback successful'),
        (error) => console.error('Error during rollback:', error)
      );
    }
  }
}
