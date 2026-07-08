export interface BusinessSettings {
  id?: number;
  user_id?: string;
  business_name: string;
  address: string | null;
  tin: string | null;
  min: string | null;
  ptu_issued_by: string | null;
  software_provider_name: string | null;
  software_provider_address: string | null;
  software_provider_tin: string | null;
  software_provider_accreditation_no: string | null;
  software_provider_date_issued: string | null; // format YYYY-MM-DD
  is_vat_registered: boolean;
  updated_at?: string;
}

export interface Terminal {
  terminal_id: number;
  terminal_name: string;
  min: string | null;
  serial_number: string | null;
  ptu_number: string | null;
  ptu_date_issued: string | null; // format YYYY-MM-DD
  current_invoice_number: number;
  cumulative_grand_total: number;
  is_active: boolean;
  created_at: string;
}

export interface UpsertBusinessSettingsParams {
  p_requesting_account_id: number;
  p_business_name: string;
  p_address?: string | null;
  p_tin?: string | null;
  p_min?: string | null;
  p_ptu_issued_by?: string | null;
}

export interface CreateTerminalParams {
  p_requesting_account_id: number;
  p_terminal_name: string;
  p_min: string;
  p_ptu_number: string;
  p_ptu_date_issued: string;
}

export interface UpdateTerminalParams {
  p_requesting_account_id: number;
  p_terminal_id: number;
  p_terminal_name: string;
  p_min: string;
  p_ptu_number: string;
  p_ptu_date_issued: string;
  p_is_active: boolean;
}
