// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
import { User, Company } from "./definitions";

const companies: Company[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Danaul Inc.',
    description: 'Sample company for multi-tenant demonstration',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'Goog',
    description: 'Another sample company',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const users: User[] = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    name: 'User',
    email: 'user@nextmail.com',
    password: '123456',
    isadmin: false,
    is_super_admin: false,
    company_id: '550e8400-e29b-41d4-a716-446655440000', // Linked to Danaul Inc.
    slug: 'user',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442b',
    name: 'Admin',
    email: 'admin@danaul.com',
    password: '123456',
    isadmin: true,
    is_super_admin: true,
    company_id: null, // Super admin doesn't need a company_id
    slug: 'admin',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442c',
    name: 'Standalone User',
    email: 'standalone@example.com',
    password: '123456',
    isadmin: false,
    is_super_admin: false,
    company_id: null, // User not belonging to any company
    slug: 'standalone-user',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export { users, companies };
