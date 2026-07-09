import { supabase } from '../lib/supabase';
import { ServiceResponse } from '../types/pos';
import {
  BusinessSettings,
  Terminal,
  UpsertBusinessSettingsParams,
  CreateTerminalParams,
  UpdateTerminalParams
} from '../types/settings';
import {
  getCachedBusinessSettings,
  saveCachedBusinessSettings,
  isSubscriptionExpired
} from '../utils/settingsCache';

export class SettingsService {
  static async getBusinessSettings(allowExpired = false): Promise<ServiceResponse<BusinessSettings | null>> {
    if (!navigator.onLine) {
      const settings = getCachedBusinessSettings(allowExpired);
      if (settings) {
        if (!allowExpired && isSubscriptionExpired(settings)) {
          return { data: null, error: 'Subscription has expired. Access denied.' };
        }
        return { data: settings, error: null };
      }
      return { data: null, error: 'Offline and no cached business settings found.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_business_settings');
      if (error) {
        console.error('Error fetching business settings:', error);
        const settings = getCachedBusinessSettings(allowExpired);
        if (settings) {
          if (!allowExpired && isSubscriptionExpired(settings)) {
            return { data: null, error: 'Subscription has expired. Access denied.' };
          }
          return { data: settings, error: null };
        }
        return { data: null, error: error.message };
      }
      
      const settings = data && data.length > 0 ? data[0] : null;
      if (settings) {
        settings.is_vat_registered = settings.billing_type === 'VAT';
        
        // Save to cache so it updates local state (e.g. after renewal or for Layout checking)
        saveCachedBusinessSettings(settings);

        if (!allowExpired && isSubscriptionExpired(settings)) {
          return { data: null, error: 'Subscription has expired. Access denied.' };
        }
      }
      return { data: settings, error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching business settings:', err);
      const settings = getCachedBusinessSettings(allowExpired);
      if (settings) {
        if (!allowExpired && isSubscriptionExpired(settings)) {
          return { data: null, error: 'Subscription has expired. Access denied.' };
        }
        return { data: settings, error: null };
      }
      return { data: null, error: err.message || 'Failed to fetch business settings' };
    }
  }

  static async upsertBusinessSettings(params: UpsertBusinessSettingsParams): Promise<ServiceResponse<{ success: boolean; message: string; data?: any }>> {
    if (!navigator.onLine) {
      return { data: null, error: 'Cannot update business settings while offline' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_upsert_business_settings', params);
      if (error) {
        console.error('Error upserting business settings:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No response received from server' };
      }

      const result = data[0];
      if (result.success) {
        // Refresh with allowExpired = true since we want the latest settings to render on the settings page
        const refreshResponse = await this.getBusinessSettings(true);
        if (refreshResponse.data) {
          result.data = refreshResponse.data;
        } else if (refreshResponse.error) {
          return { data: null, error: refreshResponse.error };
        }
      }
      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error upserting business settings:', err);
      return { data: null, error: err.message || 'Failed to upsert business settings' };
    }
  }

  static async getTerminals(): Promise<ServiceResponse<Terminal[]>> {
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('cached_terminals');
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
      } catch (err) {
        console.error('Error reading cached terminals:', err);
      }
      return { data: [], error: 'Offline and no cached terminals found.' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_get_terminals');
      if (error) {
        console.error('Error fetching terminals:', error);
        try {
          const cached = localStorage.getItem('cached_terminals');
          if (cached) {
            return { data: JSON.parse(cached), error: null };
          }
        } catch (err) {
          console.error('Error reading cached terminals on fallback:', err);
        }
        return { data: null, error: error.message };
      }
      const terminals = data || [];
      localStorage.setItem('cached_terminals', JSON.stringify(terminals));
      return { data: terminals, error: null };
    } catch (err: any) {
      console.error('Unexpected error fetching terminals:', err);
      try {
        const cached = localStorage.getItem('cached_terminals');
        if (cached) {
          return { data: JSON.parse(cached), error: null };
        }
      } catch (e) {
        console.error('Error reading cached terminals on fallback:', e);
      }
      return { data: null, error: err.message || 'Failed to fetch terminals' };
    }
  }

  static async createTerminal(params: CreateTerminalParams): Promise<ServiceResponse<{ success: boolean; message: string; terminal_id?: number }>> {
    if (!navigator.onLine) {
      return { data: null, error: 'Cannot create terminal while offline' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_admin_create_terminal', params);
      if (error) {
        console.error('Error creating terminal:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No response received from server' };
      }

      const result = data[0];
      if (result.success) {
        this.getTerminals().catch(console.error);
      }
      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error creating terminal:', err);
      return { data: null, error: err.message || 'Failed to create terminal' };
    }
  }

  static async updateTerminal(params: UpdateTerminalParams): Promise<ServiceResponse<{ success: boolean; message: string }>> {
    if (!navigator.onLine) {
      return { data: null, error: 'Cannot update terminal while offline' };
    }

    try {
      const { data, error } = await supabase.rpc('pos2_admin_update_terminal', params);
      if (error) {
        console.error('Error updating terminal:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No response received from server' };
      }

      const result = data[0];
      if (result.success) {
        this.getTerminals().catch(console.error);
      }
      return { data: result, error: null };
    } catch (err: any) {
      console.error('Unexpected error updating terminal:', err);
      return { data: null, error: err.message || 'Failed to update terminal' };
    }
  }
}
