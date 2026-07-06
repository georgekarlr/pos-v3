// ---- Core Model ----

export interface Customer {
    id: number;
    full_name: string;
    phone_number: string;
    email: string | null;
    address: string | null;
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