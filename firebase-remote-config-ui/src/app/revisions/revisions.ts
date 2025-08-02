import { Component, OnInit } from '@angular/core';
import { RemoteConfigService } from '../services/remote-config.service';

@Component({
  selector: 'app-revisions',
  templateUrl: './revisions.html',
  styleUrls: ['./revisions.scss']
})
export class Revisions implements OnInit {
  versions: any[] = [];

  constructor(private remoteConfigService: RemoteConfigService) {}

  ngOnInit(): void {
    this.remoteConfigService.getVersions().subscribe(
      (data) => (this.versions = data.versions || []),
      (error) => console.error('Error fetching versions:', error)
    );
  }
}
