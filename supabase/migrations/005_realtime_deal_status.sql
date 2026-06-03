-- Enable Realtime for deal status UI (badge, feed, disputes)
ALTER PUBLICATION supabase_realtime ADD TABLE deals;
ALTER PUBLICATION supabase_realtime ADD TABLE deal_events;
ALTER PUBLICATION supabase_realtime ADD TABLE disputes;
