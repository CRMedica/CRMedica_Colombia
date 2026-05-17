export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'sales' | 'tech' | 'client';
}

export interface Customer {
  id: string;
  name: string;
  document_type: string;
  document_id: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  department: string;
  status: 'active' | 'inactive';
}

export interface Prospect {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  product_of_interest: string;
  budget: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  assigned_to: string;
  next_follow_up: string;
  notes: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  tax_rate: number;
  stock: number;
  provider: string;
  warranty: string;
  image_url: string;
}

export interface Quote {
  id: string;
  quote_number: number;
  customer_id: string;
  user_id: string;
  total: number;
  tax: number;
  discount: number;
  shipping: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes: string;
  created_at: string;
}

export interface Sale {
  id: string;
  quote_id: string;
  customer_id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'paid' | 'delivered' | 'cancelled';
  delivery_status: 'not_shipped' | 'shipped' | 'delivered';
  created_at: string;
}

export interface ServiceOrder {
  id: string;
  customer_id: string;
  product_id: string;
  technical_id: string;
  type: 'preventive' | 'corrective' | 'installation';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  diagnosis: string;
  evidence_urls: string[];
  signature_url: string;
}
