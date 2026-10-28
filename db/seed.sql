-- Inserts a demo client. Run after signing in via /login at least once so
-- the auth.users row exists, and replace the email below with yours.
insert into public.clients (
  owner_user_id, business_name, trade, owner_name, owner_phone,
  twilio_number, agent_name,
  pricing_json
)
select id,
  'Spaira Plumbing',
  'plumber',
  'Joe',
  '+15555550100',
  '+15555550199',
  'Mike',
  '{"water heater 50gal replace":"$1400-$1800","faucet replace":"$200-$350","clogged drain":"$150-$300","leak repair":"$200-$500","toilet replace":"$400-$700"}'::jsonb
from auth.users where email = 'you@example.com'
on conflict do nothing;
