
export type Subscription = {
  id: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  provider: string;
  last_four: string;
  card_type: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  payment_date: string | null;
  description: string | null;
  created_at: string;
};
