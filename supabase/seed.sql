-- Run after creating test users in Supabase Auth (Dashboard or signup).
-- Replace UUIDs with your test user IDs, or use emails to look up:
--
-- UPDATE profiles SET is_mediator = TRUE, role = 'mediator' WHERE id = '<mediator-uuid>';

-- Example: promote first user with email containing 'mediator'
-- UPDATE profiles SET is_mediator = TRUE, role = 'mediator'
-- WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%mediator%');
