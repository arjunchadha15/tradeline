-- Backfill phone numbers to E.164 format
-- Run manually in Supabase SQL Editor

update public.calls
set caller_phone = '+1' || regexp_replace(caller_phone, '\D', '', 'g')
where caller_phone is not null
  and caller_phone !~ '^\+';

update public.bookings
set customer_phone = '+1' || regexp_replace(customer_phone, '\D', '', 'g')
where customer_phone is not null
  and customer_phone !~ '^\+';
