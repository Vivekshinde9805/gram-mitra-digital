
create type public.app_role as enum ('admin','user');
create type public.app_status as enum ('pending','in_review','approved','rejected','completed');

create or replace function public.update_updated_at_column() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;

create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, village text, email text, mobile text, address text, avatar_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id,role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid,_role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id=auth.uid());
create trigger profiles_upd before update on public.profiles for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,email,village,mobile) values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'village',new.raw_user_meta_data->>'mobile');
 insert into public.user_roles(user_id,role) values(new.id,'user');
 if not exists(select 1 from public.user_roles where role='admin') then insert into public.user_roles(user_id,role) values(new.id,'admin'); end if;
 insert into public.tax_records(user_id,tax_type,financial_year,amount,due_date) values
  (new.id,'property','2026-27',1250,'2027-03-31'),(new.id,'water','2026-27',600,'2027-03-31');
 return new; end; $$;

create table public.panchayat_info(id int primary key default 1, name text, name_mr text, village text, taluka text, district text, state text, population int, households int, area_sq_km numeric, phone text, email text, address text, office_hours text, about text, about_mr text, updated_at timestamptz not null default now());
grant select on public.panchayat_info to anon, authenticated; grant update on public.panchayat_info to authenticated; grant all on public.panchayat_info to service_role;
alter table public.panchayat_info enable row level security;
create policy "public read info" on public.panchayat_info for select to anon, authenticated using (true);
create policy "admin update info" on public.panchayat_info for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.panchayat_info values(1,'Gram Panchayat Shivpur','ग्रामपंचायत शिवपूर','Shivpur','Haveli','Pune','Maharashtra',4820,1035,12.4,'+91 20 2345 6789','gp.shivpur@maharashtra.gov.in','Gram Panchayat Office, Main Chowk, Shivpur, Tal. Haveli, Dist. Pune - 412205','Mon–Sat, 10:00 AM – 5:30 PM','Shivpur is an agricultural village known for sugarcane and grapes, with a primary school, health sub-centre and two water reservoirs.','शिवपूर हे ऊस व द्राक्ष शेतीसाठी ओळखले जाणारे गाव असून येथे प्राथमिक शाळा, आरोग्य उपकेंद्र आणि दोन जलाशय आहेत.',now());

create table public.panchayat_members(id uuid primary key default gen_random_uuid(), name text not null, designation text not null, designation_mr text, ward text, phone text, sort_order int default 0, created_at timestamptz not null default now());
grant select on public.panchayat_members to anon, authenticated; grant insert, update, delete on public.panchayat_members to authenticated; grant all on public.panchayat_members to service_role;
alter table public.panchayat_members enable row level security;
create policy "public read members" on public.panchayat_members for select to anon, authenticated using (true);
create policy "admin manage members" on public.panchayat_members for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.panchayat_members(name,designation,designation_mr,ward,phone,sort_order) values
('Smt. Sunita Patil','Sarpanch','सरपंच','—','+91 98220 11111',1),
('Shri. Rajesh Jadhav','Upa-Sarpanch','उपसरपंच','Ward 2','+91 98220 22222',2),
('Shri. Anil Kulkarni','Gram Sevak','ग्रामसेवक','—','+91 98220 33333',3),
('Smt. Meena Shinde','Member','सदस्य','Ward 1','+91 98220 44444',4),
('Shri. Ganesh Pawar','Member','सदस्य','Ward 3','+91 98220 55555',5),
('Smt. Lata More','Member','सदस्य','Ward 4','+91 98220 66666',6);

create table public.notices(id uuid primary key default gen_random_uuid(), title text not null, title_mr text, body text, body_mr text, created_at timestamptz not null default now());
grant select on public.notices to anon, authenticated; grant insert, update, delete on public.notices to authenticated; grant all on public.notices to service_role;
alter table public.notices enable row level security;
create policy "public read notices" on public.notices for select to anon, authenticated using (true);
create policy "admin manage notices" on public.notices for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.notices(title,title_mr,body,body_mr) values
('Gram Sabha on 2 October','२ ऑक्टोबर रोजी ग्रामसभा','Special Gram Sabha at 11 AM in the Panchayat hall. All villagers are requested to attend.','पंचायत सभागृहात सकाळी ११ वाजता विशेष ग्रामसभा. सर्व ग्रामस्थांनी उपस्थित राहावे.'),
('Property tax rebate till 31 Dec','३१ डिसेंबरपर्यंत मालमत्ता कर सवलत','Pay property tax before 31 December and get 5% rebate.','३१ डिसेंबरपूर्वी मालमत्ता कर भरा आणि ५% सवलत मिळवा.'),
('Water supply schedule','पाणीपुरवठा वेळापत्रक','Water supply 6–8 AM daily in all wards.','सर्व प्रभागांत दररोज सकाळी ६ ते ८ पाणीपुरवठा.');

create table public.applications(id uuid primary key default gen_random_uuid(), ref_no text not null default ('GP-'||to_char(now(),'YYMMDD')||'-'||upper(substr(md5(random()::text),1,5))), user_id uuid not null references auth.users(id) on delete cascade, service_type text not null, applicant_name text not null, mobile text not null, address text not null, description text, documents text[] not null default '{}', status app_status not null default 'pending', admin_remark text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update on public.applications to authenticated; grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "app read" on public.applications for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "app insert" on public.applications for insert to authenticated with check (user_id=auth.uid());
create policy "app admin update" on public.applications for update to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger applications_upd before update on public.applications for each row execute function public.update_updated_at_column();

create table public.complaints(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, category text not null, subject text not null, description text not null, status app_status not null default 'pending', admin_remark text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert, update on public.complaints to authenticated; grant all on public.complaints to service_role;
alter table public.complaints enable row level security;
create policy "c read" on public.complaints for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "c insert" on public.complaints for insert to authenticated with check (user_id=auth.uid());
create policy "c admin update" on public.complaints for update to authenticated using (public.has_role(auth.uid(),'admin'));
create trigger complaints_upd before update on public.complaints for each row execute function public.update_updated_at_column();

create table public.tax_records(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tax_type text not null, financial_year text not null, amount numeric not null, due_date date, status text not null default 'unpaid', paid_at timestamptz, receipt_no text, created_at timestamptz not null default now());
grant select, insert, update on public.tax_records to authenticated; grant all on public.tax_records to service_role;
alter table public.tax_records enable row level security;
create policy "t read" on public.tax_records for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "t admin insert" on public.tax_records for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "t admin update" on public.tax_records for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.pay_tax(_id uuid) returns public.tax_records language plpgsql security definer set search_path=public as $$
declare r public.tax_records; begin
 update public.tax_records set status='paid', paid_at=now(), receipt_no='RCPT-'||upper(substr(md5(random()::text),1,8))
 where id=_id and user_id=auth.uid() and status='unpaid' returning * into r;
 if r.id is null then raise exception 'Not found or already paid'; end if; return r; end; $$;
revoke execute on function public.pay_tax(uuid) from anon, public; grant execute on function public.pay_tax(uuid) to authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create policy "docs own upload" on storage.objects for insert to authenticated with check (bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "docs own read" on storage.objects for select to authenticated using (bucket_id='documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "avatars read" on storage.objects for select using (bucket_id='avatars');
create policy "avatars own write" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars own update" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
