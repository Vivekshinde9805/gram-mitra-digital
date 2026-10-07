alter type public.app_role rename value 'user' to 'citizen';
delete from public.user_roles where role='admin' and user_id <> (select r.user_id from public.user_roles r join auth.users u on u.id=r.user_id where r.role='admin' order by u.created_at limit 1);
create unique index one_admin_only on public.user_roles(role) where role='admin';

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,email,village,mobile) values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'village',new.raw_user_meta_data->>'mobile');
 insert into public.user_roles(user_id,role) values(new.id,'citizen');
 insert into public.tax_records(user_id,tax_type,financial_year,amount,due_date) values
  (new.id,'property','2026-27',1250,'2027-03-31'),(new.id,'water','2026-27',600,'2027-03-31');
 return new; end; $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

create table public.citizen_connections(
 id uuid primary key default gen_random_uuid(),
 citizen_id uuid not null references auth.users(id) on delete cascade,
 type text not null check (type in ('Water','Electricity')),
 connection_no text not null, meter_no text, address text not null,
 status text not null default 'Pending' check (status in ('Pending','Verified')),
 created_at timestamptz not null default now(),
 unique(type, connection_no));
grant select, insert, update on public.citizen_connections to authenticated; grant all on public.citizen_connections to service_role;
alter table public.citizen_connections enable row level security;
create policy "cc read" on public.citizen_connections for select to authenticated using (citizen_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "cc insert own" on public.citizen_connections for insert to authenticated with check (citizen_id=auth.uid() and status='Pending');
create policy "cc admin update" on public.citizen_connections for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.monthly_bills(
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null references public.citizen_connections(id) on delete cascade,
 month int not null check (month between 1 and 12), year int not null,
 units numeric, amount numeric not null check (amount > 0), due_date date,
 status text not null default 'Unpaid' check (status in ('Unpaid','Pending','Paid','Overdue')),
 utr text, submitted_at timestamptz, paid_at timestamptz, admin_remark text,
 created_at timestamptz not null default now(),
 unique(connection_id, month, year));
grant select, insert, update on public.monthly_bills to authenticated; grant all on public.monthly_bills to service_role;
alter table public.monthly_bills enable row level security;
create policy "mb read" on public.monthly_bills for select to authenticated using (public.has_role(auth.uid(),'admin') or exists(select 1 from public.citizen_connections c where c.id=connection_id and c.citizen_id=auth.uid()));
create policy "mb admin insert" on public.monthly_bills for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "mb admin update" on public.monthly_bills for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.submit_bill_payment(_id uuid, _utr text) returns public.monthly_bills language plpgsql security definer set search_path=public as $$
declare r public.monthly_bills; begin
 if _utr !~ '^[A-Za-z0-9]{8,30}$' then raise exception 'Enter a valid UPI transaction ID (8-30 letters/numbers)'; end if;
 update public.monthly_bills b set status='Pending', utr=_utr, submitted_at=now()
 where b.id=_id and b.status in ('Unpaid','Overdue') and exists(select 1 from public.citizen_connections c where c.id=b.connection_id and c.citizen_id=auth.uid())
 returning * into r;
 if r.id is null then raise exception 'Bill not found or already submitted'; end if; return r; end; $$;
revoke execute on function public.submit_bill_payment(uuid,text) from anon, public;
grant execute on function public.submit_bill_payment(uuid,text) to authenticated;