// ---- Core Model ----

export interface Customer {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
    address: string | null;
    total_loyalty_points: number; // accumulated loyalty points balance
    created_at: string;
}

// ---- Service Params ----

export interface CreateCustomerParams {
    p_full_name: string;
    p_phone_number: string;
    p_email?: string | null;
    p_address?: string | null;
}

export interface UpdateCustomerParams {
    p_customer_id: number;
    p_full_name: string;
    p_phone_number: string;
    p_email?: string | null;
    p_address?: string | null;
}

export interface DeleteCustomerParams {
    p_requesting_account_id: number;
    p_customer_id: number;
}

// ---- Service Results ----

export interface CustomerMutationResult {
    success: boolean;
    message: string;
    data: Customer | null;
}

export interface DeleteCustomerResult {
    success: boolean;
    message: string;
}

// ---- Financial Summary (pos2_get_customer_financial_summary) ----

export interface CustomerUnsettledItem {
    product_name: string;
    quantity: number;
    price: number;
    date: string;
}

export interface CustomerRunningTabDebt {
    current_balance: number;
    credit_limit: number;
    unsettled_items: CustomerUnsettledItem[];
}

export interface CustomerActiveInstallment {
    contract_id: number;
    invoice_number: string;
    date_purchased: string;
    total_financed: number;
    status: string;
    months_to_pay: number;
    monthly_due: number;
    remaining_balance: number;
}

export interface CustomerFinancialSummary {
    customer: Customer;
    total_outstanding_amount: number;
    running_tab_debt: CustomerRunningTabDebt;
    active_installments: CustomerActiveInstallment[];
}

// ---- Loyalty Transactions ----

export interface LoyaltyTransaction {
    id: number;
    customer_id: number;
    order_id: number | null;
    transaction_type: 'EARN' | 'REDEEM';
    points: number;
    description: string | null;
    created_at: string;
}