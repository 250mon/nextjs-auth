"use client";

import { useState, useTransition } from "react";
import { updateUserSettings } from "@/app/actions/settings-actions";
import type { UserSettings } from "@/app/lib/definitions";
import { Button } from "@/app/ui/button";

interface SettingsFormProps {
  initialSettings: UserSettings;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    startTransition(async () => {
      const result = await updateUserSettings(settings);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    });
  };

  const handleToggle = (key: keyof UserSettings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleNumberChange = (key: keyof UserSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStringChange = (key: keyof UserSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Table Display Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900">Table Filters</h3>
        
        {/* Hide Inactive Items */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="hideInactiveItems" className="text-sm font-medium text-gray-700">
              Hide Inactive Items
            </label>
            <p className="text-sm text-gray-500">
              When enabled, inactive items will be filtered out from the items table
            </p>
          </div>
          <button
            type="button"
            id="hideInactiveItems"
            onClick={() => handleToggle('hideInactiveItems')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              settings.hideInactiveItems ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.hideInactiveItems ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Hide Inactive SKUs */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="hideInactiveSKUs" className="text-sm font-medium text-gray-700">
              Hide Inactive SKUs
            </label>
            <p className="text-sm text-gray-500">
              When enabled, inactive SKUs will be filtered out from the SKUs table
            </p>
          </div>
          <button
            type="button"
            id="hideInactiveSKUs"
            onClick={() => handleToggle('hideInactiveSKUs')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              settings.hideInactiveSKUs ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.hideInactiveSKUs ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Pagination Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900">Pagination</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
              Items Per Page
            </label>
            <p className="text-sm text-gray-500">
              Number of items to display per page in tables
            </p>
          </div>
          <select
            id="itemsPerPage"
            value={settings.itemsPerPage}
            onChange={(e) => handleNumberChange('itemsPerPage', parseInt(e.target.value))}
            className="rounded-md border border-gray-300 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900">Language Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="language" className="text-sm font-medium text-gray-700">
              Interface Language
            </label>
            <p className="text-sm text-gray-500">
              Choose your preferred language for the application interface
            </p>
            {settings.language === 'ko' && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Korean language support is now active
              </p>
            )}
          </div>
          <select
            id="language"
            value={settings.language}
            onChange={(e) => handleStringChange('language', e.target.value as 'en' | 'ko')}
            className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[120px]"
          >
            <option value="en">🇺🇸 English</option>
            <option value="ko">🇰🇷 한국어 (Korean)</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
} 