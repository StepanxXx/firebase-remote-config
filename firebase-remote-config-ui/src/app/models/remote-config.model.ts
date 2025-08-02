export interface RemoteConfig {
  conditions?: RemoteConfigCondition[];
  parameters?: { [key: string]: RemoteConfigParameter };
  parameterGroups?: { [key: string]: RemoteConfigParameterGroup };
  version?: Version;
}

export interface RemoteConfigCondition {
  name: string;
  expression: string;
  tagColor?: 'CONDITION_DISPLAY_COLOR_UNSPECIFIED' | 'BLUE' | 'BROWN' | 'CYAN' | 'DEEP_ORANGE' | 'GREEN' | 'INDIGO' | 'LIME' | 'ORANGE' | 'PINK' | 'PURPLE' | 'TEAL';
}

export interface RemoteConfigParameter {
  defaultValue?: RemoteConfigParameterValue;
  conditionalValues?: { [key: string]: RemoteConfigParameterValue };
  description?: string;
  valueType?: 'PARAMETER_VALUE_TYPE_UNSPECIFIED' | 'STRING' | 'BOOLEAN' | 'NUMBER' | 'JSON';
}

export interface RemoteConfigParameterValue {
  value?: string;
  useInAppDefault?: boolean;
  personalizationValue?: PersonalizationValue;
  rolloutValue?: RolloutValue;
}

export interface PersonalizationValue {
  personalizationId?: string;
}

export interface RolloutValue {
  rolloutId?: string;
  value?: string;
  percent?: number;
}

export interface RemoteConfigParameterGroup {
  parameters: { [key: string]: RemoteConfigParameter };
  description?: string;
}

export interface Version {
  versionNumber?: number;
  updateTime?: string;
  updateUser?: RemoteConfigUser;
  description?: string;
  updateOrigin?: 'REMOTE_CONFIG_UPDATE_ORIGIN_UNSPECIFIED' | 'CONSOLE' | 'REST_API' | 'ADMIN_SDK_NODE';
  updateType?: 'REMOTE_CONFIG_UPDATE_TYPE_UNSPECIFIED' | 'INCREMENTAL_UPDATE' | 'FORCED_UPDATE' | 'ROLLBACK';
  rollbackSource?: number;
  isLegacy?: boolean;
}

export interface RemoteConfigUser {
  email?: string;
  name?: string;
  imageUrl?: string;
  userId?: string;
}

// Додаткові інтерфейси для API методів
export interface ListVersionsResponse {
  versions?: Version[];
  nextPageToken?: string;
}

export interface RollbackRemoteConfigRequest {
  versionNumber: number;
}

export interface HttpBody {
  contentType?: string;
  data?: string;
  extensions?: any[];
}

export interface FetchRemoteConfigRequest {
  appInstanceId: string;
  appInstanceIdToken: string;
  appId: string;
  countryCode?: string;
  languageCode?: string;
  platformVersion?: string;
  timeZone?: string;
  appVersion?: string;
  packageName?: string;
  sdkVersion?: string;
  analyticsUserProperties?: { [key: string]: string };
  appBuild?: string;
  firstOpenTime?: string;
  customSignals?: { [key: string]: string };
}

export interface FetchRemoteConfigResponse {
  entries?: { [key: string]: string };
  appName?: string;
  state?: 'INSTANCE_STATE_UNSPECIFIED' | 'UPDATE' | 'NO_TEMPLATE' | 'NO_CHANGE' | 'EMPTY_CONFIG';
  experimentDescriptions?: ExperimentDescription[];
  personalizationMetadata?: { [key: string]: PersonalizationMetadata };
  templateVersion?: number;
  rolloutMetadata?: RolloutMetadata[];
}

export interface ExperimentDescription {
  experimentId?: string;
  variantId?: string;
  triggerEvent?: string;
  experimentStartTime?: string;
  triggerTimeoutMillis?: number;
  timeToLiveMillis?: number;
}

export interface PersonalizationMetadata {
  personalizationId?: string;
  armIndex?: number;
  choiceId?: string;
  group?: 'GROUP_UNSPECIFIED' | 'BASELINE' | 'P13N';
}

export interface RolloutMetadata {
  rolloutId?: string;
  variantId?: string;
  affectedParameterKeys?: string[];
}
