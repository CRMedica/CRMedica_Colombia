-- SQL Schema for RespiraCRM Colombia
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'sales', 'tech', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- NIT, CC, CE
  document_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prospects Table
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  source TEXT, -- Website, Referral, Cold Call, etc.
  product_of_interest TEXT,
  budget DECIMAL(15,2),
  status TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
  assigned_to UUID REFERENCES users(id),
  next_follow_up TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 19.00, -- Default IVA Colombia
  stock INTEGER DEFAULT 0,
  provider TEXT,
  warranty TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quotes Table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number SERIAL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  total DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  shipping DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quote Items
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL
);

-- Sales Table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id),
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  total DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, paid, delivered, cancelled
  delivery_status TEXT DEFAULT 'not_shipped', -- not_shipped, shipped, delivered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id),
  amount DECIMAL(15,2) NOT NULL,
  method TEXT NOT NULL, -- Transfer, PSE, Card, Cash
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service Orders Table (Technical Support)
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  technical_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- preventive, corrective, installation
  status TEXT DEFAULT 'open', -- open, in_progress, completed, cancelled
  diagnosis TEXT,
  evidence_urls TEXT[],
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
-- Vendedores de prueba
-- Note: Passwords should be hashed. Here we use placeholders.
-- INSERT INTO users (email, password_hash, full_name, role) VALUES 
-- ('admin@respiracrm.com', '$2b$10$hashed_password', 'Admin Master', 'admin'),
-- ('laura@respiracrm.com', '$2b$10$hashed_password', 'Laura Martínez', 'sales'),
-- ('carlos@respiracrm.com', '$2b$10$hashed_password', 'Carlos Rojas', 'sales'),
-- ('ana@respiracrm.com', '$2b$10$hashed_password', 'Ana Parra', 'sales');
