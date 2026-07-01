import { supabase } from '../lib/supabase'

export interface PersonaValidationResult {
  success: boolean
  message: string
  data?: {
    id?: number
    name?: string
    user_type?: string
    person_name?: string
  }
}

export interface StaffAccount {
  account_id: number
  role_name: string
  person_name: string | null
  user_type: string
  created_at: string
}

export class PersonaService {
  static async validateAdminPersona(password: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_pos_account_password', {
        p_account_password: password
      })

      if (error) {
        console.error('Admin validation error:', error)
        return {
          success: false,
          message: 'Failed to validate admin credentials'
        }
      }

      // The function returns a table, so we get the first row
      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred',
        data: result?.data || undefined
      }
    } catch (error) {
      console.error('Admin validation error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  static async validateStaffPersona(loginName: string, password: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_pos_staff_user', {
        p_login_name: loginName,
        p_login_password: password
      })

      if (error) {
        console.error('Staff validation error:', error)
        return {
          success: false,
          message: 'Failed to validate staff credentials'
        }
      }

      // The function returns a table, so we get the first row
      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred',
        data: result?.data || undefined
      }
    } catch (error) {
      console.error('Staff validation error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  // Staff Management Functions
  static async createStaffAccount(name: string, password: string, personName: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('pos_create_staff_account', {
        p_name: name,
        p_password: password,
        p_person_name: personName
      })

      if (error) {
        console.error('Create staff error:', error)
        return {
          success: false,
          message: 'Failed to create staff account'
        }
      }

      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred'
      }
    } catch (error) {
      console.error('Create staff error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  static async deleteStaffAccount(name: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('pos_delete_staff_account', {
        p_name: name
      })

      if (error) {
        console.error('Delete staff error:', error)
        return {
          success: false,
          message: 'Failed to delete staff account'
        }
      }

      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred'
      }
    } catch (error) {
      console.error('Delete staff error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  static async updateAdminPassword(oldPassword: string, newPassword: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('pos_update_admin_password_with_old', {
        p_old_password: oldPassword,
        p_new_password: newPassword
      })

      if (error) {
        console.error('Update admin password error:', error)
        return {
          success: false,
          message: 'Failed to update admin password'
        }
      }

      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred'
      }
    } catch (error) {
      console.error('Update admin password error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  static async updateStaffPassword(name: string, newPassword: string): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('pos_update_staff_password', {
        p_name: name,
        p_new_password: newPassword
      })

      if (error) {
        console.error('Update staff password error:', error)
        return {
          success: false,
          message: 'Failed to update staff password'
        }
      }

      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred'
      }
    } catch (error) {
      console.error('Update staff password error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }

  static async getStaffAccountNames(): Promise<{ success: boolean; data: string[]; message: string }> {
    try {
      const { data, error } = await supabase.rpc('pos_get_staff_account_names')
      if (error) {
        console.error('Get staff names error:', error)
        return {
          success: false,
          data: [],
          message: 'Failed to fetch staff account names'
        }
      }

      console.log('Staff names retrieved successfully', data)

      return {
        success: true,
        data: data || [],
        message: 'Staff names retrieved successfully'
      }
    } catch (error) {
      console.error('Get staff names error:', error)
      return {
        success: false,
        data: [],
        message: 'Network error occurred'
      }
    }
  }

  static async getStaffAccounts(): Promise<{ success: boolean; data: StaffAccount[]; message: string }> {
    try {
      const { data, error } = await supabase.rpc('pos2_get_staff_accounts')
      if (error) {
        console.error('Get staff accounts error:', error)
        return {
          success: false,
          data: [],
          message: 'Failed to fetch staff accounts'
        }
      }

      console.log('Staff accounts retrieved successfully', data)
      console.log('error retrieved successfully', error)
      return {
        success: true,
        data: data || [],
        message: 'Staff accounts retrieved successfully'
      }
    } catch (error) {
      console.error('Get staff accounts error:', error)
      return {
        success: false,
        data: [],
        message: 'Network error occurred'
      }
    }
  }

  static async updateAccountCredentials(
    requestingAccountId: number,
    targetAccountId: number,
    newName: string | null,
    newPersonName: string | null,
    newPassword: string | null
  ): Promise<PersonaValidationResult> {
    try {
      const { data, error } = await supabase.rpc('pos2_update_account_credentials', {
        p_requesting_account_id: requestingAccountId,
        p_target_account_id: targetAccountId,
        p_new_name: newName || null,
        p_new_person_name: newPersonName || null,
        p_new_password: newPassword || null
      })

      console.log('Update account credentials result:', data, error)
      if (error) {
        console.error('Update account credentials error:', error)
        return {
          success: false,
          message: 'Failed to update account credentials'
        }
      }

      const result = data?.[0]
      return {
        success: result?.success || false,
        message: result?.message || 'Unknown error occurred'
      }
    } catch (error) {
      console.error('Update account credentials error:', error)
      return {
        success: false,
        message: 'Network error occurred'
      }
    }
  }
}