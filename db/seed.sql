-- Inserts a demo client for Arjun. Run after signing in via /login at
-- least once so the auth.users row exists.
insert into public.clients (
  owner_user_id, business_name, trade, owner_name, owner_phone,
  twilio_number, agent_name,
  pricing_json
)
select id,
  'Spaira Plumbing',
  'plumber',
  'Joe',
  '+19085551234',
  '+19088299875',
  'Mike',
  '{"water heater 50gal replace":"$1400-$1800","faucet replace":"$200-$350","clogged drain":"$150-$300","leak repair":"$200-$500","toilet replace":"$400-$700"}'::jsonb
from auth.users where email = 'aschadha15@gmail.com'
on conflict do nothing;
