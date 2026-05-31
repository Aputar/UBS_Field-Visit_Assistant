-- UBS FieldOS — Supabase Database Schema
-- Run this entire file in Supabase > SQL Editor > New Query

-- USERS
create table if not exists users (
  id text primary key,
  name text not null,
  role text not null default 'TRH',
  region text,
  password text not null,
  created_at timestamptz default now()
);

-- DEALERS
create table if not exists dealers (
  id text primary key,
  name text not null,
  code text,
  depot text,
  city text,
  contact text,
  trh_name text,
  re_name text,
  created_at timestamptz default now()
);

-- TRHs
create table if not exists trhs (
  id text primary key,
  name text not null,
  phone text,
  region text,
  created_at timestamptz default now()
);

-- REs
create table if not exists res (
  id text primary key,
  name text not null,
  phone text,
  depot text,
  created_at timestamptz default now()
);

-- VISITS
create table if not exists visits (
  id text primary key,
  dealer_id text,
  date date,
  depot text,
  categories text[],
  notes text,
  photos text[],
  created_by text,
  created_at timestamptz default now()
);

-- ACTIONS
create table if not exists actions (
  id text primary key,
  visit_id text,
  dealer_id text,
  depot text,
  title text,
  detail text,
  assigned_to text,
  priority text default 'Medium',
  deadline date,
  category text,
  status text default 'Open',
  remarks text,
  created_by text,
  created_at timestamptz default now()
);

-- CATEGORIES
create table if not exists categories (
  id serial primary key,
  name text unique not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security but allow all for now (no auth yet)
alter table users enable row level security;
alter table dealers enable row level security;
alter table trhs enable row level security;
alter table res enable row level security;
alter table visits enable row level security;
alter table actions enable row level security;
alter table categories enable row level security;

-- Allow all operations (open policy — app uses its own login)
create policy "allow all" on users for all using (true) with check (true);
create policy "allow all" on dealers for all using (true) with check (true);
create policy "allow all" on trhs for all using (true) with check (true);
create policy "allow all" on res for all using (true) with check (true);
create policy "allow all" on visits for all using (true) with check (true);
create policy "allow all" on actions for all using (true) with check (true);
create policy "allow all" on categories for all using (true) with check (true);

-- Enable real-time for all tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table dealers;
alter publication supabase_realtime add table trhs;
alter publication supabase_realtime add table res;
alter publication supabase_realtime add table visits;
alter publication supabase_realtime add table actions;
alter publication supabase_realtime add table categories;

-- Seed default users
insert into users (id, name, role, region, password) values
  ('u1', 'Rajesh Mehta', 'ZRH', 'West (Guj + Mumbai)', 'admin123'),
  ('u2', 'Naveen Ahuja', 'ZRH', 'Gujarat', 'admin123'),
  ('u3', 'Vikram Shah', 'TRH', 'Gujarat North', 'trh123'),
  ('u4', 'Priya Desai', 'RE', 'Ahmedabad', 're123')
on conflict (id) do nothing;

-- Seed default categories
insert into categories (name) values
  ('Cement'),('Paints'),('PVC'),('Sanitary'),('Tiles'),
  ('Waterproofing'),('Displays & Branding'),('Credit/Outstanding'),
  ('New Product'),('Competition'),('Team Issue'),('Store Experience'),
  ('Inventory'),('Influencer/Contractor'),('Payment Issue'),('Others')
on conflict (name) do nothing;
