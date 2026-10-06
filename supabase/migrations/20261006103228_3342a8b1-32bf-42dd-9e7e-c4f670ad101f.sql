alter table public.panchayat_info add column upi_id text default 'vivekshinde18200@oksbi', add column upi_name text default 'Gram Panchayat';
update public.panchayat_info set upi_id='vivekshinde18200@oksbi', upi_name='Gram Panchayat Shivpur' where id=1;
alter table public.tax_records add column payment_method text, add column utr text, add column submitted_at timestamptz;

create or replace function public.submit_tax_payment(_id uuid, _utr text) returns public.tax_records language plpgsql security definer set search_path=public as $$
declare r public.tax_records; begin
 if _utr !~ '^[A-Za-z0-9]{8,30}$' then raise exception 'Enter a valid UPI transaction ID (8-30 letters/numbers)'; end if;
 update public.tax_records set status='verifying', payment_method='UPI', utr=_utr, submitted_at=now()
 where id=_id and user_id=auth.uid() and status in ('unpaid','rejected') returning * into r;
 if r.id is null then raise exception 'Bill not found or already submitted'; end if; return r; end; $$;
revoke execute on function public.submit_tax_payment(uuid,text) from anon, public;
grant execute on function public.submit_tax_payment(uuid,text) to authenticated;
drop function public.pay_tax(uuid);