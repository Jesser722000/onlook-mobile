-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (if needed for credits)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  credits integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profile Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- 2. Create Generations Table
create table if not exists public.generations (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_email text not null,
    image_url text,
    status text default 'pending',
    prompt text,
    model text,
    cost_in_credits integer default 1,
    metadata jsonb,
    error_message text,
    duration_ms integer,
    provider text
);

-- Enable RLS on Generations
alter table public.generations enable row level security;

-- Generations Policies
create policy "Users can see their own generations" on public.generations for select using ( auth.jwt() ->> 'email' = user_email );
create policy "Users can insert their own generations" on public.generations for insert with check ( auth.jwt() ->> 'email' = user_email );

-- 3. Create Storage Bucket (onlook_public)
insert into storage.buckets (id, name, public)
values ('onlook_public', 'onlook_public', true)
on conflict (id) do update set public = true;

-- 4. Storage Policies (CRITICAL: allows anonymous reads)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'onlook_public' );

create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'onlook_public' and auth.role() = 'authenticated' );

-- 5. RPC Functions (Credits)
create or replace function consume_credit(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  current_credits integer;
begin
  select credits into current_credits from public.profiles where id = p_user_id;
  
  if current_credits > 0 then
    update public.profiles set credits = credits - 1 where id = p_user_id;
    return current_credits - 1;
  else
    return null; -- Not enough credits
  end if;
end;
$$;

create or replace function refund_credit(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles set credits = credits + 1 where id = p_user_id;
end;
$$;
