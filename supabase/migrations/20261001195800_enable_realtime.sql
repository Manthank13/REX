BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchanges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
