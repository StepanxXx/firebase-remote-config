import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { RemoteConfig, RemoteConfigParameter, RemoteConfigCondition } from '../models/remote-config.model';
import { RemoteConfigService } from '../services/remote-config.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule
  ]
})
export class DashboardComponent implements OnInit {
  title = 'Firebase Remote Config Dashboard';
  templateData: RemoteConfig | null = null;
  isLoading = true;
  
  // Compact mode settings - not used, removed to reduce bundle size
  readonly COMPACT_THRESHOLD = 100;
  editingParameter: string | null = null;
  editValue = '';

  constructor(
    private remoteConfigService: RemoteConfigService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTemplate();
  }

  loadTemplate() {
    console.log('loadTemplate called, setting isLoading to true');
    this.isLoading = true;
    
    this.remoteConfigService.getTemplate().subscribe({
      next: (data) => {
        console.log('Data received successfully:', data);
        this.templateData = data;
        this.isLoading = false;
        console.log('isLoading set to false:', this.isLoading);
        console.log('Template data:', data);
      },
      error: (error) => {
        console.error('Failed to fetch template data:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load template data', 'Close', {
          duration: 3000
        });
        
        // Fallback to mock data for demonstration
        this.templateData = this.getMockData();
      }
    });
  }

  getMockData(): RemoteConfig {
    return {
      parameters: {
        app_name: {
          defaultValue: { value: 'My Firebase App' },
          description: 'The name of the application displayed to users',
          valueType: 'STRING',
          conditionalValues: {
            'is_ios': { value: 'My iOS App', useInAppDefault: false },
            'is_android': { value: 'My Android App', useInAppDefault: false },
            'is_web': { value: 'My Web App', personalizationValue: { personalizationId: 'web_app_personalization' } }
          }
        },
        welcome_message: {
          defaultValue: { 
            value: 'Welcome to our app!',
            rolloutValue: { rolloutId: 'welcome_message_rollout', value: 'Welcome to our amazing new app!', percent: 30 }
          },
          description: 'Welcome message displayed to new users',
          valueType: 'STRING',
          conditionalValues: {
            'first_time_user': { value: 'Welcome! Let us show you around.', useInAppDefault: false },
            'returning_user': { value: 'Welcome back!', rolloutValue: { rolloutId: 'returning_user_message', value: 'Great to see you again!', percent: 50 } }
          }
        },
        feature_enabled: {
          defaultValue: { value: 'false', personalizationValue: { personalizationId: 'feature_toggle_personalization' } },
          description: 'Toggle for enabling experimental features',
          valueType: 'BOOLEAN',
          conditionalValues: {
            'beta_user': { value: 'true', useInAppDefault: false },
            'premium_user': { value: 'true', personalizationValue: { personalizationId: 'premium_features' } }
          }
        }
      },
      parameterGroups: {
        ui_settings: {
          parameters: {
            theme_color: {
              defaultValue: { value: '#1976d2' },
              description: 'Primary theme color for the application',
              valueType: 'STRING',
              conditionalValues: {
                'is_ios': { value: '#007AFF', useInAppDefault: false },
                'dark_mode': { value: '#bb86fc', rolloutValue: { rolloutId: 'dark_theme_rollout', value: '#bb86fc', percent: 25 } }
              }
            }
          },
          description: 'UI appearance and behavior settings'
        }
      },
      conditions: [
        { name: 'is_ios', expression: 'device.os == "ios"', tagColor: 'BLUE' },
        { name: 'is_android', expression: 'device.os == "android"', tagColor: 'GREEN' },
        { name: 'beta_user', expression: 'user.group == "beta"', tagColor: 'PINK' },
        { name: 'premium_user', expression: 'user.isPremium == true', tagColor: 'DEEP_ORANGE' }
      ],
      version: {
        versionNumber: 42,
        updateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updateUser: { email: 'developer@example.com', name: 'John Developer', userId: 'user_12345' },
        description: 'Added new feature flags for mobile app rollout and updated API configuration.',
        updateOrigin: 'REST_API',
        updateType: 'INCREMENTAL_UPDATE',
        rollbackSource: undefined
      }
    };
  }

  startEdit(parameterKey: string, currentValue: string) {
    this.editingParameter = parameterKey;
    this.editValue = currentValue;
  }

  cancelEdit() {
    this.editingParameter = null;
    this.editValue = '';
  }

  saveEdit(parameterKey: string) {
    if (this.templateData && this.templateData.parameters) {
      if (this.templateData.parameters[parameterKey]) {
        this.templateData.parameters[parameterKey].defaultValue = { value: this.editValue };
      }
    }
    this.editingParameter = null;
    this.editValue = '';
    this.snackBar.open('Parameter updated successfully', 'Close', {
      duration: 2000
    });
  }

  saveTemplate() {
    if (this.templateData) {
      // Спочатку валідуємо
      this.remoteConfigService.validateTemplate(this.templateData).subscribe({
        next: (validatedTemplate) => {
          // Якщо валідація пройшла успішно, зберігаємо
          this.remoteConfigService.updateTemplate(this.templateData!).subscribe({
            next: (response) => {
              this.snackBar.open('Template saved successfully', 'Close', {
                duration: 3000
              });
              this.templateData = response; // Оновлюємо з відповіді
            },
            error: (error) => {
              console.error('Failed to save template:', error);
              this.snackBar.open('Failed to save template', 'Close', {
                duration: 3000
              });
            }
          });
        },
        error: (validationError) => {
          console.error('Validation failed:', validationError);
          this.snackBar.open('Template validation failed', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  // Додаткові методи для завантаження та роботи з форматами
  downloadDefaults(format: 'JSON' | 'XML' | 'PLIST' = 'JSON') {
    this.remoteConfigService.downloadDefaults(format).subscribe({
      next: (response) => {
        const contentType = response.contentType || 'application/json';
        const data = response.data || '';
        this.downloadFile(data, `remote-config-defaults.${format.toLowerCase()}`, contentType);
        this.snackBar.open(`Defaults downloaded as ${format}`, 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Failed to download defaults:', error);
        this.snackBar.open('Failed to download defaults', 'Close', {
          duration: 3000
        });
      }
    });
  }

  private downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Тестування fetch API
  testFetchConfig() {
    const mockAppInstanceId = 'test-app-instance-id';
    const mockAppId = 'test-app-id';
    const mockAppInstanceIdToken = 'test-token';
    
    this.remoteConfigService.fetchConfig({
      appInstanceId: mockAppInstanceId,
      appId: mockAppId,
      appInstanceIdToken: mockAppInstanceIdToken
    }).subscribe({
      next: (response) => {
        console.log('Fetch config response:', response);
        this.snackBar.open('Fetch config test successful', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Fetch config failed:', error);
        this.snackBar.open('Fetch config test failed', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Метод для визначення кольору чипа типу значення
  getValueTypeColor(valueType: string): string {
    switch (valueType) {
      case 'STRING': return 'primary';
      case 'BOOLEAN': return 'accent';
      case 'NUMBER': return 'warn';
      case 'JSON': return '';
      default: return '';
    }
  }

  // Метод для визначення кольору умов
  getConditionColor(tagColor: string): string {
    switch (tagColor) {
      case 'BLUE': return 'primary';
      case 'GREEN': return 'accent';
      case 'ORANGE': return 'warn';
      case 'PURPLE': 
      case 'PINK':
      case 'DEEP_ORANGE':
      case 'TEAL':
      case 'BROWN':
      case 'CYAN': return '';
      default: return '';
    }
  }

  // Методи для Version Info
  getUpdateOriginColor(updateOrigin?: string): string {
    switch (updateOrigin) {
      case 'CONSOLE': return 'primary';
      case 'REST_API': return 'accent';
      case 'ADMIN_SDK_NODE': return 'warn';
      default: return '';
    }
  }

  getParametersCount(): number {
    return Object.keys(this.templateData?.parameters || {}).length;
  }

  getParameterGroupsCount(): number {
    return Object.keys(this.templateData?.parameterGroups || {}).length;
  }

  getConditionsCount(): number {
    return this.templateData?.conditions?.length || 0;
  }

  getRolloutCount(): number {
    let rolloutCount = 0;
    
    // Count rollouts in parameters
    Object.values(this.templateData?.parameters || {}).forEach(param => {
      if (param.defaultValue?.rolloutValue) rolloutCount++;
      Object.values(param.conditionalValues || {}).forEach(condValue => {
        if (condValue.rolloutValue) rolloutCount++;
      });
    });
    
    // Count rollouts in parameter groups
    Object.values(this.templateData?.parameterGroups || {}).forEach(group => {
      Object.values(group.parameters || {}).forEach(param => {
        if (param.defaultValue?.rolloutValue) rolloutCount++;
        Object.values(param.conditionalValues || {}).forEach(condValue => {
          if (condValue.rolloutValue) rolloutCount++;
        });
      });
    });
    
    return rolloutCount;
  }

  // Advanced statistics methods
  getParametersWithConditionsCount(): number {
    const allParams = {
      ...this.templateData?.parameters || {},
      ...this.getAllParametersFromGroups()
    };
    
    return Object.values(allParams).filter(param => 
      param.conditionalValues && Object.keys(param.conditionalValues).length > 0
    ).length;
  }

  getTotalParametersInGroups(): number {
    let count = 0;
    Object.values(this.templateData?.parameterGroups || {}).forEach(group => {
      count += Object.keys(group.parameters || {}).length;
    });
    return count;
  }

  getComplexConditionsCount(): number {
    return this.templateData?.conditions?.filter(condition => 
      this.getExpressionComplexity(condition.expression || '') === 'Complex'
    ).length || 0;
  }

  getPersonalizationCount(): number {
    let count = 0;
    
    // Count personalization in parameters
    Object.values(this.templateData?.parameters || {}).forEach(param => {
      if (param.defaultValue?.personalizationValue) count++;
      Object.values(param.conditionalValues || {}).forEach(condValue => {
        if (condValue.personalizationValue) count++;
      });
    });
    
    // Count personalization in parameter groups
    Object.values(this.templateData?.parameterGroups || {}).forEach(group => {
      Object.values(group.parameters || {}).forEach(param => {
        if (param.defaultValue?.personalizationValue) count++;
        Object.values(param.conditionalValues || {}).forEach(condValue => {
          if (condValue.personalizationValue) count++;
        });
      });
    });
    
    return count;
  }

  getTotalConditionalValues(): number {
    let count = 0;
    
    Object.values(this.templateData?.parameters || {}).forEach(param => {
      count += Object.keys(param.conditionalValues || {}).length;
    });
    
    Object.values(this.templateData?.parameterGroups || {}).forEach(group => {
      Object.values(group.parameters || {}).forEach(param => {
        count += Object.keys(param.conditionalValues || {}).length;
      });
    });
    
    return count;
  }

  getParametersWithRolloutsCount(): number {
    const allParams = {
      ...this.templateData?.parameters || {},
      ...this.getAllParametersFromGroups()
    };
    
    return Object.values(allParams).filter(param => {
      const hasDefaultRollout = param.defaultValue?.rolloutValue;
      const hasConditionalRollout = Object.values(param.conditionalValues || {}).some(cv => cv.rolloutValue);
      return hasDefaultRollout || hasConditionalRollout;
    }).length;
  }

  getParametersWithPersonalizationCount(): number {
    const allParams = {
      ...this.templateData?.parameters || {},
      ...this.getAllParametersFromGroups()
    };
    
    return Object.values(allParams).filter(param => {
      const hasDefaultPersonalization = param.defaultValue?.personalizationValue;
      const hasConditionalPersonalization = Object.values(param.conditionalValues || {}).some(cv => cv.personalizationValue);
      return hasDefaultPersonalization || hasConditionalPersonalization;
    }).length;
  }

  getAverageConditionsPerParameter(): string {
    const totalParams = this.getParametersCount() + this.getTotalParametersInGroups();
    const totalConditions = this.getTotalConditionalValues();
    
    if (totalParams === 0) return '0';
    return (totalConditions / totalParams).toFixed(1);
  }

  getMostCommonValueTypes(): string {
    const typeCount: {[key: string]: number} = {};
    
    const allParams = {
      ...this.templateData?.parameters || {},
      ...this.getAllParametersFromGroups()
    };
    
    Object.values(allParams).forEach(param => {
      const type = param.valueType || 'UNSPECIFIED';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    const sortedTypes = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
    
    return sortedTypes || 'None';
  }

  private getAllParametersFromGroups(): {[key: string]: RemoteConfigParameter} {
    const params: {[key: string]: RemoteConfigParameter} = {};
    
    Object.values(this.templateData?.parameterGroups || {}).forEach(group => {
      Object.assign(params, group.parameters || {});
    });
    
    return params;
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }

  // TrackBy functions for performance optimization
  trackByParameterName(index: number, item: any): string {
    return item.key;
  }

  trackByGroupName(index: number, item: any): string {
    return item.key;
  }

  trackByConditionName(index: number, item: any): string {
    return item.name;
  }

  // Expression analysis methods
  getExpressionComplexity(expression: string): string {
    if (!expression) return 'Unknown';
    
    const operatorCount = (expression.match(/&&|\|\||==|!=|<|>|<=|>=|contains|in/g) || []).length;
    const variableCount = (expression.match(/\w+\.\w+/g) || []).length;
    
    if (operatorCount === 0 && variableCount <= 1) return 'Simple';
    if (operatorCount <= 2 && variableCount <= 3) return 'Medium';
    return 'Complex';
  }

  getExpressionVariables(expression: string): string[] {
    if (!expression) return [];
    
    const variables = expression.match(/\w+\.\w+/g) || [];
    return [...new Set(variables)]; // Remove duplicates
  }
}
