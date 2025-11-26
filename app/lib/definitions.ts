export type UserSettings = {
  hideInactiveItems: boolean;
  hideInactiveSKUs: boolean;
  itemsPerPage: number;
  language: "en" | "ko";
  // Add more settings as needed
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
};