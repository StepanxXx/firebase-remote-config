import { Component, OnInit } from '@angular/core';
import { RemoteConfigService } from '../services/remote-config.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  template: any;

  constructor(private remoteConfigService: RemoteConfigService) {}

  ngOnInit(): void {
    this.remoteConfigService.getTemplate().subscribe(
      (data) => (this.template = data),
      (error) => console.error('Error fetching template:', error)
    );
  }
}
