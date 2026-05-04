export interface CustomerSearchResult {
  customer_id: number;
  full_name: string;
  phone_number: string;
  current_balance: number;
}

export interface CustomerListItem {
  customer_id: number;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  created_at: string;
  current_balance: number;
}

export interface CreateCustomerDebtParams {
  p_requesting_account_id: number;
  p_full_name: string;
  p_phone_number: string;
  p_email?: string | null;
  p_address?: string | null;
  p_items_to_debt?: { product_id: number; quantity: number }[];
  p_cash_loan_amount?: number;
  p_description?: string | null;
  p_occurred_at?: string | null;
}

export interface ManageDebtAccountParams {
  p_requesting_account_id: number;
  p_customer_id: number;
  p_action_type: 'PAYMENT' | 'DEPOSIT' | 'SETTLE';
  p_amount?: number;
  p_payment_method?: string;
  p_notes?: string | null;
}

export interface ManageDebtAccountResult {
  success: boolean;
  message: string;
  data: {
    new_balance?: number;
    created_order_id?: number;
  } | null;
}

export interface DebtItemDetail {
  product_name: string;
  quantity: number;
  price: number;
  unit_type: string;
}

export interface DebtUnsettledTransaction {
  transaction_id: number;
  date: string;
  type: string;
  amount: number;
  description: string;
  items: DebtItemDetail[];
}

export interface DebtSettledHistory {
  settled_order_id: number;
  settled_date: string;
  total_settled_amount: number;
  transactions: {
    type: string;
    amount: number;
    description: string;
    date: string;
  }[];
}

export interface CustomerDebtDetails {
  customer: CustomerListItem;
  account: {
    id?: number;
    current_balance: number;
    credit_limit: number;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
  unsettled: DebtUnsettledTransaction[];
  settled: DebtSettledHistory[];
}
