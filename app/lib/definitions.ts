export type UserSettings = {
  hideInactiveItems: boolean;
  hideInactiveSKUs: boolean;
  itemsPerPage: number;
  language: "en" | "ko";
  // Add more settings as needed
};

export type Company = {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  isadmin: boolean;
  is_super_admin: boolean;
  company_id: string | null;
  slug: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  settings?: UserSettings;
};

export type Invitation = {
  id: string;
  email: string;
  company_id: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};