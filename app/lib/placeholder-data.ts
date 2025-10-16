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
    settings: {
      hideInactiveItems: true,
      hideInactiveSKUs: false,
      itemsPerPage: 12,
      language: 'en'
    }
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442b',
    name: 'Admin',
    email: 'admin@nextmail.com',
    password: '123456',
    isadmin: true,
    settings: {
      hideInactiveItems: false,
      hideInactiveSKUs: true,
      itemsPerPage: 24,
      language: 'en'
    }
  },
];

const teams = [
  {
    id: 1,
    name: 'Nursing',
    description: 'Nursing and patient care team'
  },
  {
    id: 2,
    name: 'PhysicalTherapy',
    description: 'Physical therapy and rehabilitation team'
  },
  {
    id: 3,
    name: 'Radiology',
    description: 'Radiology and imaging team'
  },
  {
    id: 4,
    name: 'ManipulationTherapy',
    description: 'Manipulation therapy and chiropractic team'
  }
];

// User-team relationships (many-to-many)
const userTeams = [
  // User belongs to Nursing and PhysicalTherapy
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442a', team_id: 1, role: 'lead' },
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442a', team_id: 2, role: 'member' },
  
  // Admin belongs to all teams
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442b', team_id: 1, role: 'lead' },
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442b', team_id: 2, role: 'lead' },
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442b', team_id: 3, role: 'lead' },
  { user_id: '410544b2-4001-4271-9855-fec4b6a6442b', team_id: 4, role: 'lead' }
];

export { users, teams, userTeams };
