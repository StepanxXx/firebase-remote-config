import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Version, RollbackRemoteConfigRequest } from '../models/remote-config.model';
import { RemoteConfigService } from '../services/remote-config.service';

@Component({
  selector: 'app-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ]
})
export class VersionsComponent implements OnInit {
  displayedColumns: string[] = ['versionNumber', 'updateTime', 'updateUser', 'updateType', 'description', 'actions'];
  dataSource = new MatTableDataSource<Version>();
  isLoading = true;
  nextPageToken?: string;

  constructor(
    private remoteConfigService: RemoteConfigService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadVersions();
  }

  loadVersions() {
    this.isLoading = true;
    this.remoteConfigService.getVersions().subscribe({
      next: (response) => {
        this.dataSource.data = response.versions || [];
        this.nextPageToken = response.nextPageToken;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load versions:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load versions', 'Close', {
          duration: 3000
        });
      }
    });
  }

  rollbackToVersion(version: Version) {
    if (!version.versionNumber) return;

    const request: RollbackRemoteConfigRequest = {
      versionNumber: version.versionNumber
    };

    this.remoteConfigService.rollback(request).subscribe({
      next: (result) => {
        this.snackBar.open(`Successfully rolled back to version ${version.versionNumber}`, 'Close', {
          duration: 3000
        });
        this.loadVersions();
      },
      error: (error) => {
        console.error('Failed to rollback:', error);
        this.snackBar.open('Failed to rollback', 'Close', {
          duration: 3000
        });
      }
    });
  }

  downloadDefaults(format: 'XML' | 'PLIST' | 'JSON') {
    this.remoteConfigService.downloadDefaults(format).subscribe({
      next: (result) => {
        // Логіка для завантаження файлу
        const blob = new Blob([result.data || ''], { type: result.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `remote-config-defaults.${format.toLowerCase()}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Failed to download defaults:', error);
        this.snackBar.open('Failed to download defaults', 'Close', {
          duration: 3000
        });
      }
    });
  }

  loadMoreVersions() {
    if (!this.nextPageToken) return;

    this.remoteConfigService.getVersions(undefined, this.nextPageToken).subscribe({
      next: (response) => {
        const newVersions = response.versions || [];
        this.dataSource.data = [...this.dataSource.data, ...newVersions];
        this.nextPageToken = response.nextPageToken;
      },
      error: (error) => {
        console.error('Failed to load more versions:', error);
        this.snackBar.open('Failed to load more versions', 'Close', {
          duration: 3000
        });
      }
    });
  }
}
