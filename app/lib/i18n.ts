import { getUserSettings } from "@/app/actions/settings-actions";

// Language configuration
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ko: '한국어'
} as const;

export type Language = keyof typeof SUPPORTED_LANGUAGES;

// Translation dictionary for menu items and common UI text
export const translations = {
  en: {
    // Navigation Menu Items
    home: 'Home',
    settings: 'Settings',
    profile: 'Profile',
    signOut: 'Sign Out',
    
    // Common Actions
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    update: 'Update',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    
    // Page Titles
    dashboard: 'Dashboard',
    userPreferences: 'User Preferences',
    authenticationDashboard: 'Authentication Dashboard',

    // Profile Labels
    name: 'Name',
    email: 'Email',
    isAdmin: 'Is Admin',
    team: 'Team',
    teams: 'Teams',
    editProfile: 'Edit Profile',
    profileInformation: 'Profile Information',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    notAvailable: 'Not available',
    yes: 'Yes',
    no: 'No',
    profileUpdatedSuccessfully: 'Profile updated successfully!',
    passwordChangedSuccessfully: 'Password changed successfully!',
    backToProfile: 'Back to Profile',
    
    // Admin Actions
    admin: 'Admin',
    adminEdit: 'Admin Edit',
    editAsAdmin: 'Edit as Admin',
  },
  ko: {
    // Navigation Menu Items  
    home: '홈',
    settings: '설정',
    profile: '프로필',
    signOut: '로그아웃',
    
    // Common Actions
    create: '생성',
    edit: '편집',
    delete: '삭제',
    update: '업데이트',
    save: '저장',
    cancel: '취소',
    search: '검색',
    
    // Page Titles
    dashboard: '대시보드',
    userPreferences: '사용자 설정',
    authenticationDashboard: '인증 대시보드',

    // Profile Labels
    name: '이름',
    email: '이메일',
    isAdmin: '관리자',
    team: '팀',
    teams: '팀',
    editProfile: '프로필 편집',
    profileInformation: '프로필 정보',
    changePassword: '비밀번호 변경',
    currentPassword: '현재 비밀번호',
    newPassword: '새 비밀번호',
    confirmPassword: '새 비밀번호 확인',
    notAvailable: '정보 없음',
    yes: '예',
    no: '아니오',
    profileUpdatedSuccessfully: '프로필이 성공적으로 업데이트되었습니다!',
    passwordChangedSuccessfully: '비밀번호가 성공적으로 변경되었습니다!',
    backToProfile: '프로필로 돌아가기',
    
    // Admin Actions
    admin: '관리자',
    adminEdit: '관리자 편집',
    editAsAdmin: '관리자로 편집',
  }
} as const;

// Get current user's language preference (server-side)
export async function getCurrentLanguage(): Promise<Language> {
  try {
    const settings = await getUserSettings();
    return settings.language || 'en';
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en'; // Default to English
  }
}

// Server-side translation helper - gets translated text directly
export async function getTranslatedText(key: keyof typeof translations.en): Promise<string> {
  const language = await getCurrentLanguage();
  return t(key, language);
}

// Get all translations for current user's language (server-side)
export async function getCurrentTranslations() {
  const language = await getCurrentLanguage();
  return {
    language,
    translations: translations[language],
    t: (key: keyof typeof translations.en) => t(key, language)
  };
}

// Translation function - gets text in current language
export function t(key: keyof typeof translations.en, language: Language = 'en'): string {
  return translations[language][key] || translations.en[key];
}

// Helper to get translations for a specific language
export function getTranslations(language: Language) {
  return translations[language];
}

// Basic translation helper (can be extended later)
export function getLanguageDisplayName(lang: Language): string {
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
}

// Helper to check if a language is supported
export function isValidLanguage(lang: string): lang is Language {
  return lang in SUPPORTED_LANGUAGES;
}
