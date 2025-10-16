"use server";

import { query } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/dal";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/app/lib/definitions";

const DEFAULT_SETTINGS: UserSettings = {
  hideInactiveItems: false,
  hideInactiveSKUs: false,
  itemsPerPage: 6,
  language: 'en',
};

// Get user settings with defaults
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return DEFAULT_SETTINGS;
    }

    const result = await query(
      'SELECT settings FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].settings) {
      return DEFAULT_SETTINGS;
    }

    // Parse JSON settings and merge with defaults
    try {
      const settingsData = result.rows[0].settings;
      
      // Handle case where settings might be an object already (PostgreSQL JSONB)
      let userSettings;
      if (typeof settingsData === 'string') {
        userSettings = JSON.parse(settingsData);
      } else if (typeof settingsData === 'object' && settingsData !== null) {
        userSettings = settingsData;
      } else {
        console.warn('Invalid settings format, using defaults');
        return DEFAULT_SETTINGS;
      }
      
      return {
        ...DEFAULT_SETTINGS,
        ...userSettings,
      };
    } catch (parseError) {
      console.error('Failed to parse user settings:', parseError);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return DEFAULT_SETTINGS;
  }
}

// Update user settings
export async function updateUserSettings(settings: Partial<UserSettings>) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    // Get current settings
    const currentSettings = await getUserSettings();
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

    // Update in database
    await query(
      'UPDATE users SET settings = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedSettings), user.id]
    );

    // Revalidate relevant pages
    revalidatePath('/dashboard/items');
    revalidatePath('/dashboard/skus');
    revalidatePath('/dashboard/settings');

    return { success: true, settings: updatedSettings };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

// Toggle specific setting
export async function toggleSetting(settingKey: keyof UserSettings) {
  try {
    const currentSettings = await getUserSettings();
    const currentValue = currentSettings[settingKey];
    
    if (typeof currentValue === 'boolean') {
      return await updateUserSettings({
        [settingKey]: !currentValue
      });
    } else {
      throw new Error(`Setting ${settingKey} is not a boolean value`);
    }
  } catch (error) {
    console.error("Error toggling setting:", error);
    return { success: false, error: "Failed to toggle setting" };
  }
} 