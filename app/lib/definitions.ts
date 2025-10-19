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