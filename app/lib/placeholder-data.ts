// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
import type { UserSettings } from "@/app/lib/definitions";

type PlaceholderUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  isadmin: boolean;
  settings?: UserSettings;
};

const users: PlaceholderUser[] = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    name: 'User',
    email: 'user@nextmail.com',
    password: '123456',
    isadmin: false,
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442b',
    name: 'Admin',
    email: 'admin@nextmail.com',
    password: '123456',
    isadmin: true,
  },
];

export { users };
