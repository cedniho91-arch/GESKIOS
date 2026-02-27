export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: number;
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  name: string; // For UI display
}

export interface Sale {
  id: string;
  total_amount: number;
  payment_mode: 'ORANGE_MONEY' | 'CASH' | 'WAVE' | 'MOOV_MONEY' | 'SANKMONEY';
  items: SaleItem[];
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  category: 'ACHAT' | 'SALAIRE' | 'FACTURE' | 'AUTRE';
  date?: string;
}

export interface DashboardData {
  ca: number;
  charges: number;
  profit: number;
}
