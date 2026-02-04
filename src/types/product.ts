// types/posProducts.ts

// --- Generic Response Wrapper ---
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

// --- Enum Types ---
export type ProductSellingMethod = 'unit' | 'measured';
export type ProductInventoryType = 'non_perishable' | 'perishable';
export type ProductUnitType = 'pieces' | 'box' | 'pack' | 'set' | 'pair' | 'dozen' | 'kg' | 'g' | 'l' | 'ml' | 'm' | 'cm' | 'sq_m' | 'roll';

export const PRODUCT_UNIT_LABELS: Record<ProductUnitType, string> = {
  pieces: 'pieces',
  box: 'box',
  pack: 'pack',
  set: 'set',
  pair: 'pair',
  dozen: 'dozen',
  kg: 'kg',
  g: 'g',
  l: 'l',
  ml: 'ml',
  m: 'm',
  cm: 'cm',
  sq_m: 'sq_m',
  roll: 'roll',
};

// --- Entity Types ---

export interface StockBatch {
  batch_id: number;
  quantity: number;
  expiration_date: string | null;
  received_at: string;
}

export interface Product {
  id: number;
  user_id: string; // UUID
  name: string;
  description: string | null;
  base_price: number;
  tax_rate: number;
  display_price: number;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
  total_stock: number;
  stock_batches: StockBatch[];
  selling_method: ProductSellingMethod;
  inventory_type: ProductInventoryType;
  unit_type: ProductUnitType | null;
}

// --- Parameter Interfaces ---

export interface CreatePosProductParams {
  p_account_id: number;
  p_name: string;
  p_description: string | null;
  p_base_price: number;
  p_tax_rate: number;
  p_sku: string | null;
  p_barcode: string | null;
  p_image_url: string | null;
  p_selling_method: ProductSellingMethod;
  p_inventory_type: ProductInventoryType;
  p_unit_type: ProductUnitType | null;
}

export interface UpdatePosProductParams extends CreatePosProductParams {
  p_product_id: number;
}

// --- Result Interface ---

export interface PosProductOperationResult {
  success: boolean;
  message: string;
  data: Product | null; // The JSONB data returned is cast to the PosProduct type
}