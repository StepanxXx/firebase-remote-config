import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
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
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
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
    MatDividerModule,
    MatSidenavModule,
    MatTooltipModule,
    MatRadioModule
  ]
})
export class DashboardComponent implements OnInit {
  @ViewChild('editSidenav') editSidenav!: MatSidenav;
  
  title = 'Firebase Remote Config Dashboard';
  templateData: RemoteConfig | null = null;
  isLoading = true;
  
  // Compact mode settings - not used, removed to reduce bundle size
  readonly COMPACT_THRESHOLD = 100;
  editingParameter: string | null = null;
  editValue = '';
  editingParameterData: any = null;

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
            'is_ios': { value: 'My iOS App' },
            'is_android': { value: 'My Android App' },
            'is_web': { personalizationValue: { personalizationId: 'web_app_personalization' } },
            'beta_users': { useInAppDefault: true }
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
            'first_time_user': { value: 'Welcome! Let us show you around.' },
            'returning_user': { rolloutValue: { rolloutId: 'returning_user_message', value: 'Great to see you again!', percent: 50 } }
          }
        },
        feature_enabled: {
          defaultValue: { value: 'false', personalizationValue: { personalizationId: 'feature_toggle_personalization' } },
          description: 'Toggle for enabling experimental features',
          valueType: 'BOOLEAN',
          conditionalValues: {
            'beta_user': { value: 'true' },
            'premium_user': { personalizationValue: { personalizationId: 'premium_features' } }
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
                'is_ios': { value: '#007AFF' },
                'dark_mode': { rolloutValue: { rolloutId: 'dark_theme_rollout', value: '#bb86fc', percent: 25 } }
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
        { name: 'beta_users', expression: 'user.inGroup("beta")', tagColor: 'PURPLE' },
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
    console.log('Starting edit for parameter:', parameterKey);
    console.log('Current value:', currentValue);
    
    this.editingParameter = parameterKey;
    this.editValue = currentValue;
    // Deep copy of the parameter data for editing
    if (this.templateData && this.templateData.parameters && this.templateData.parameters[parameterKey]) {
      this.editingParameterData = JSON.parse(JSON.stringify(this.templateData.parameters[parameterKey]));
      
      console.log('Original parameter data:', this.templateData.parameters[parameterKey]);
      console.log('Copied parameter data:', this.editingParameterData);
      
      // Ensure defaultValue exists
      if (!this.editingParameterData.defaultValue) {
        this.editingParameterData.defaultValue = { value: currentValue || '' };
      }
      
      // Ensure conditionalValues exists and has proper structure
      if (this.editingParameterData.conditionalValues) {
        console.log('Processing conditional values:', this.editingParameterData.conditionalValues);
        
        // Validate and fix conditionalValues structure if needed
        const fixedConditionalValues: any = {};
        
        Object.keys(this.editingParameterData.conditionalValues).forEach(key => {
          const condValue = this.editingParameterData.conditionalValues[key];
          console.log(`Processing conditional value for key "${key}":`, condValue);
          
          // Ensure each conditional value has proper structure
          if (condValue && typeof condValue === 'object') {
            // Firebase API expects oneof field - only one of these can be set
            if (condValue.useInAppDefault === true) {
              // If useInAppDefault is true, only set that field
              fixedConditionalValues[key] = {
                useInAppDefault: true
              };
            } else if (condValue.personalizationValue) {
              // If personalizationValue exists, use that
              fixedConditionalValues[key] = {
                personalizationValue: {
                  personalizationId: condValue.personalizationValue.personalizationId || ''
                }
              };
            } else if (condValue.rolloutValue) {
              // If rolloutValue exists, use that
              fixedConditionalValues[key] = {
                rolloutValue: {
                  rolloutId: condValue.rolloutValue.rolloutId || '',
                  value: condValue.rolloutValue.value || '',
                  percent: condValue.rolloutValue.percent || 0
                }
              };
            } else {
              // Default to value field
              fixedConditionalValues[key] = {
                value: condValue.value || ''
              };
            }
          }
        });
        
        this.editingParameterData.conditionalValues = fixedConditionalValues;
        console.log('Fixed conditional values:', fixedConditionalValues);
      }
    }
    
    // Open the sidenav
    setTimeout(() => {
      if (this.editSidenav) {
        this.editSidenav.open();
      }
    }, 0);
  }

  cancelEdit() {
    this.editingParameter = null;
    this.editValue = '';
    this.editingParameterData = null;
    
    // Clear cache
    this.conditionalValuesCache = null;
    this.lastEditingParameterData = null;
    
    // Close the sidenav
    if (this.editSidenav) {
      this.editSidenav.close();
    }
  }

  saveEdit(parameterKey: string) {
    if (this.templateData && this.templateData.parameters && this.editingParameterData) {
      // Update the parameter with edited data
      this.templateData.parameters[parameterKey] = JSON.parse(JSON.stringify(this.editingParameterData));
    }
    this.editingParameter = null;
    this.editValue = '';
    this.editingParameterData = null;
    this.snackBar.open('Parameter updated successfully', 'Close', {
      duration: 2000
    });
    
    // Close the sidenav
    if (this.editSidenav) {
      this.editSidenav.close();
    }
  }

  togglePersonalization(event: any) {
    if (!this.editingParameterData) return;
    
    if (!this.editingParameterData.defaultValue) {
      this.editingParameterData.defaultValue = { value: '' };
    }
    
    if (event.checked) {
      this.editingParameterData.defaultValue.personalizationValue = {
        personalizationId: ''
      };
    } else {
      delete this.editingParameterData.defaultValue.personalizationValue;
    }
  }

  toggleRollout(event: any) {
    if (!this.editingParameterData) return;
    
    if (!this.editingParameterData.defaultValue) {
      this.editingParameterData.defaultValue = { value: '' };
    }
    
    if (event.checked) {
      this.editingParameterData.defaultValue.rolloutValue = {
        rolloutId: '',
        value: '',
        percent: 0
      };
    } else {
      delete this.editingParameterData.defaultValue.rolloutValue;
    }
  }

  // Conditional Values methods
  get availableConditions(): RemoteConfigCondition[] {
    return this.templateData?.conditions || [];
  }

  addConditionalValue() {
    if (!this.editingParameterData) return;
    
    if (!this.editingParameterData.conditionalValues) {
      this.editingParameterData.conditionalValues = {};
    }
    
    // Створюємо тимчасову назву для нової умови
    const tempConditionKey = `new_condition_${Date.now()}`;
    
    // Firebase API expects oneof field - start with just value
    this.editingParameterData.conditionalValues[tempConditionKey] = {
      value: ''
    };
    
    // Clear cache to force refresh
    this.conditionalValuesCache = null;
  }

  removeConditionalValue(conditionName: string) {
    if (!this.editingParameterData?.conditionalValues) return;
    
    delete this.editingParameterData.conditionalValues[conditionName];
    
    // Clear cache to force refresh
    this.conditionalValuesCache = null;
  }

  getConditionExpression(conditionName: string): string {
    if (!conditionName || !this.templateData?.conditions) return '';
    
    try {
      const condition = this.templateData.conditions.find(c => c.name === conditionName);
      return condition?.expression || '';
    } catch (error) {
      console.error('Error getting condition expression:', error);
      return '';
    }
  }

  // Helper method to get conditional values as array for ngFor
  private conditionalValuesCache: { key: string, value: any }[] | null = null;
  private lastEditingParameterData: any = null;

  getConditionalValuesArray(): { key: string, value: any }[] {
    if (!this.editingParameterData?.conditionalValues) {
      console.log('No conditional values found');
      this.conditionalValuesCache = [];
      return [];
    }
    
    // Cache optimization to prevent excessive recalculation
    if (this.lastEditingParameterData === this.editingParameterData && this.conditionalValuesCache) {
      return this.conditionalValuesCache;
    }
    
    console.log('Getting conditional values array from:', this.editingParameterData.conditionalValues);
    
    try {
      const result = Object.keys(this.editingParameterData.conditionalValues)
        .filter(key => key && this.editingParameterData.conditionalValues[key])
        .map(key => ({
          key: key,
          value: this.editingParameterData.conditionalValues[key]
        }));
      
      console.log('Conditional values array result:', result);
      
      // Update cache
      this.lastEditingParameterData = this.editingParameterData;
      this.conditionalValuesCache = result;
      
      return result;
    } catch (error) {
      console.error('Error processing conditional values:', error);
      this.conditionalValuesCache = [];
      return [];
    }
  }

  // Update conditional value condition name
  updateConditionalValueCondition(oldKey: string, newConditionName: string) {
    if (!this.editingParameterData?.conditionalValues || !newConditionName || oldKey === newConditionName) return;
    
    try {
      // Перевіряємо чи існує старий ключ
      if (!this.editingParameterData.conditionalValues[oldKey]) {
        console.warn(`Conditional value with key "${oldKey}" not found`);
        return;
      }
      
      // Зберігаємо значення
      const value = this.editingParameterData.conditionalValues[oldKey];
      
      // Видаляємо старий ключ
      delete this.editingParameterData.conditionalValues[oldKey];
      
      // Додаємо з новим ключем
      this.editingParameterData.conditionalValues[newConditionName] = value;
      
      // Clear cache to force refresh
      this.conditionalValuesCache = null;
    } catch (error) {
      console.error('Error updating conditional value condition:', error);
    }
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

  trackByConditionalValue(index: number, item: any): string {
    return item.key;
  }

  // Methods for conditional value type management
  getConditionalValueType(conditionalValue: any): string {
    if (!conditionalValue?.value) return 'value';
    
    if (conditionalValue.value.useInAppDefault === true) {
      return 'useInAppDefault';
    } else if (conditionalValue.value.personalizationValue) {
      return 'personalizationValue';
    } else if (conditionalValue.value.rolloutValue) {
      return 'rolloutValue';
    } else {
      return 'value';
    }
  }

  updateConditionalValueType(conditionalValue: any, newType: string) {
    if (!conditionalValue?.value) return;
    
    // Clear all fields first
    const key = conditionalValue.key;
    
    switch (newType) {
      case 'useInAppDefault':
        this.editingParameterData.conditionalValues[key] = {
          useInAppDefault: true
        };
        break;
      case 'personalizationValue':
        this.editingParameterData.conditionalValues[key] = {
          personalizationValue: {
            personalizationId: ''
          }
        };
        break;
      case 'rolloutValue':
        this.editingParameterData.conditionalValues[key] = {
          rolloutValue: {
            rolloutId: '',
            value: '',
            percent: 0
          }
        };
        break;
      default: // 'value'
        this.editingParameterData.conditionalValues[key] = {
          value: ''
        };
        break;
    }
    
    // Clear cache to force refresh
    this.conditionalValuesCache = null;
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
