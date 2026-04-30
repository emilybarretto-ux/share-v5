export type Screen = 'home' | 'dashboard' | 'success' | 'verification' | 'password-gate' | 'login' | 'register' | 'how-it-works' | 'security' | 'create-request' | 'fill-request' | 'request-success' | 'fill-success' | 'view-secret' | 'form-builder' | 'view-form' | 'developer-portal';

export interface SharedLink {
  id: string;
  name: string;
  status: 'active' | 'waiting' | 'completed';
  views: number;
  created_at: string;
  expires_at?: string;
  content?: string;
  password?: string;
  max_views?: number | null;
  key_values?: Array<{ key: string, value: string }>;
  restrict_ip?: boolean;
  require_email?: boolean;
  allowed_email?: string | null;
  allowed_domain?: string | null;
  notify_access?: boolean;
  last_viewer_email?: string | null;
  creator_ip?: string | null;
  file_url?: string | null;
}

export interface DataRequest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  response?: string;
  created_at: string;
  expires_at?: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export type FieldType = 
  | 'text' | 'textarea' | 'tel' | 'email' | 'number' | 'password' | 'url' | 'regex'
  | 'radio' | 'checkbox' | 'dropdown' | 'likert' | 'scale'
  | 'grid-radio' | 'grid-checkbox'
  | 'date' | 'time' | 'datetime' | 'daterange'
  | 'rating' | 'range' | 'sortable' | 'file' | 'signature' | 'consent'
  | 'heading' | 'section' | 'divider' | 'page-break' | 'hidden' | 'calculation' | 'image';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  imageUrl?: string;
  required: boolean;
  options?: string[];
  imageOptions?: Record<string, string>; // option text -> image URL
  rows?: string[];
  columns?: string[];
  validation?: string; 
  defaultValue?: any;
  customColor?: string;
  mask?: 'none' | 'cpf' | 'cnpj' | 'tel' | 'cep' | 'email';
  logic?: {
    action: 'jump' | 'hide' | 'show' | 'terminate';
    targetId: string;
    conditionOperator?: 'equals' | 'not_equals' | 'greater' | 'less' | 'greater_equal' | 'less_equal' | 'contains';
    conditionValue: string;
  };
}

export interface DynamicForm {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: {
    logo?: string;
    primaryColor: string;
    fontFamily: string;
    layout: 'list' | 'step';
    successMessage: string;
    redirectUrl?: string;
    borderRadius?: 'none' | 'large' | '3xl';
    headerImage?: string;
    titleColor?: string;
    subtitleColor?: string;
    showProgressBar?: boolean;
    estimatedTime?: number; // in minutes
    themePreset?: 'default' | 'dark' | 'minimal' | 'enterprise' | 'vibrant' | 'glass';
  };
  status: 'draft' | 'published';
}

export interface FormSubmission {
  id: string;
  created_at: string;
  form_id: string;
  data: Record<string, any>;
  responder_ip?: string;
}
