export type UserSettings = {
  hideInactiveItems: boolean;
  hideInactiveSKUs: boolean;
  itemsPerPage: number;
  language: "en" | "ko";
  // Add more settings as needed
};

export type Team = {
  id: number;
  name: string;
  description?: string;
  role?: string; // Role when used in user context
  created_at: Date;
  updated_at: Date;
};

export type UserTeam = {
  user_id: string;
  team_id: number;
  role?: string;
  created_at: Date;
};

// Access control types
export type ResourceType =
  | "item"
  | "sku"
  | "transaction"
  | "category"
  | "user"
  | "dashboard";

export type TeamPermission = {
  id: number;
  resource_type: ResourceType;
  team_id: number;
  team_name: string;
  permissions: {
    member: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
    lead: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
    admin: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
  };
  created_at: Date;
  updated_at: Date;
};

export type PagePermission = {
  id: number;
  page_path: string;
  required_team_ids: number[];
  required_team_names: string[];
  fallback_type: "any" | "admin" | "none";
  created_at: Date;
  updated_at: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  isadmin: boolean;
  slug: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  settings?: UserSettings;
  teams?: Team[];
};

// Inventory Management System
export type UsersTable = {
  user_id: number;
  user_name: string;
  user_password: string;
};
