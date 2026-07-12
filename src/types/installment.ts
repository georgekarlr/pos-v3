// ---- Enums / Literals ----

export type ScheduleStatus = 'pending' | 'partial' | 'paid' | 'late' | 'defaulted';
export type ContractStatus = 'active' | 'completed' | 'defaulted';

// ---- Core Models ----

export interface InstallmentSchedule {
  schedule_id: number;
  month_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: ScheduleStatus;
  paid_at: string | null;
}

export interface InstallmentContract {
  contract_id: number;
  invoice_number: string;
  order_id: number;
  date_purchased: string;
  total_contract_value: number;
  downpayment_amount: number;
  financed_amount: number;
  interest_rate: number;         // NEW: Interest Rate (%)
  total_interest_amount: number; // NEW: Total Flat Interest Amount
  months_to_pay: number;
  monthly_due: number;
  contract_status: ContractStatus;
  schedules: InstallmentSchedule[];
}

export interface CustomerInstallments {
  customer: {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
    address: string | null;
    created_at: string;
  };
  contracts: InstallmentContract[];
}

// ---- All-Contracts List (paginated admin view) ----

/** A single row returned by pos2_get_all_installment_contracts */
export interface InstallmentContractSummary {
  contract_id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  phone_number: string;
  date_created: string;
  total_contract_value: number;
  downpayment_amount: number;
  financed_amount: number;
  total_interest_amount: number;
  months_to_pay: number;
  monthly_due: number;
  /** Sum of all payments made across the contract's schedules */
  total_paid: number;
  /** Remaining balance = (financed + interest) - total_paid */
  remaining_balance: number;
  status: ContractStatus;
}

export interface GetAllInstallmentContractsParams {
  p_requesting_account_id: number;
  p_limit: number;
  p_offset: number;
  p_search_term?: string | null;
  p_status_filter?: ContractStatus | null;
}

// ---- Service Params & Results ----

export interface CreateInstallmentSaleParams {
  p_account_id: number;
  p_terminal_id: number;
  p_customer_id: number;
  p_cart_items: { product_id: number; quantity: number }[];
  p_downpayment_amount: number;
  p_downpayment_method: string;
  p_months_to_pay: number;
  p_interest_rate: number;       // NEW: Interest Rate Param
  p_occurred_at?: string | null;
}

export interface CreateInstallmentSaleResult {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    invoice_number: string;
    contract_id: number;
    monthly_due: number;
    total_interest: number;      // NEW: Returned total interest
  } | null;
}

export interface PayInstallmentScheduleParams {
  p_requesting_account_id: number;
  p_terminal_id: number;
  p_contract_id: number;
  p_payment_amount: number;
  p_payment_method: string;
}

export interface PayInstallmentScheduleResult {
  success: boolean;
  message: string;
  data: {
    amount_applied: number;
    months_affected: {
      month: number;
      amount_applied: number;
      new_status: ScheduleStatus;
    }[];
    contract_completed: boolean;
  } | null;
}

export interface WriteOffInstallmentContractParams {
  p_requesting_account_id: number;
  p_contract_id: number;
  p_reason: string;
}

export interface WriteOffInstallmentContractResult {
  success: boolean;
  message: string;
  data: {
    amount_written_off: number;
    contract_status: 'defaulted';
  } | null;
}

export interface RecoverInstallmentDebtParams {
  p_requesting_account_id: number;
  p_contract_id: number;
  p_recovery_amount: number;
  p_payment_method: string;
  p_notes?: string;
}

export interface RecoverInstallmentDebtResult {
  success: boolean;
  message: string;
  data: {
    contract_id: number;
    amount_recovered: number;
  } | null;
}