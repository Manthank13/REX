DO $$
DECLARE
  v_resource_id uuid;
  v_owner_id uuid;
  v_requester_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  v_exchange_request_id uuid;
  v_exchange_id uuid;
  v_meetup_location_id uuid;
BEGIN
  -- Fix constraint to allow CONFIRMED on exchange_requests as required by Phase 5
  ALTER TABLE public.exchange_requests DROP CONSTRAINT IF EXISTS exchange_requests_status_check;
  ALTER TABLE public.exchange_requests ADD CONSTRAINT exchange_requests_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'COUNTERED', 'DECLINED', 'CANCELLED', 'CONFIRMED', 'COMPLETED'));

  -- We need the Raspberry Pi at IIT Madras
  SELECT id, owner_id INTO v_resource_id, v_owner_id FROM public.resources WHERE title ILIKE '%Raspberry Pi%' LIMIT 1;
  
  -- We need a meetup location
  SELECT id INTO v_meetup_location_id FROM public.meetup_locations WHERE name = 'IIT Madras Main Library' LIMIT 1;

  -- Test A - Initial Request
  INSERT INTO public.exchange_requests (resource_id, requester_id, offer_price, status)
  VALUES (v_resource_id, v_requester_id, 650, 'PENDING')
  RETURNING id INTO v_exchange_request_id;

  INSERT INTO public.exchange_messages (exchange_request_id, sender_id, message)
  VALUES (v_exchange_request_id, v_requester_id, 'I can pick it up this weekend.');

  -- Verify PENDING and resource ACTIVE
  IF (SELECT status FROM public.exchange_requests WHERE id = v_exchange_request_id) != 'PENDING' THEN
    RAISE EXCEPTION 'Failed Test A: Request not PENDING';
  END IF;

  IF (SELECT status FROM public.resources WHERE id = v_resource_id) != 'ACTIVE' THEN
    RAISE EXCEPTION 'Failed Test A: Resource not ACTIVE';
  END IF;

  -- Test B - Counter offer
  UPDATE public.exchange_requests
  SET offer_price = 700, status = 'COUNTERED'
  WHERE id = v_exchange_request_id AND status = 'PENDING';

  INSERT INTO public.exchange_messages (exchange_request_id, sender_id, message)
  VALUES (v_exchange_request_id, v_owner_id, 'I can do 700.');

  -- Verify COUNTERED and offer_price = 700
  IF (SELECT status FROM public.exchange_requests WHERE id = v_exchange_request_id) != 'COUNTERED' THEN
    RAISE EXCEPTION 'Failed Test B: Request not COUNTERED';
  END IF;
  IF (SELECT offer_price FROM public.exchange_requests WHERE id = v_exchange_request_id) != 700 THEN
    RAISE EXCEPTION 'Failed Test B: Offer price not 700';
  END IF;

  -- Test C - Accept counter
  UPDATE public.exchange_requests
  SET status = 'ACCEPTED'
  WHERE id = v_exchange_request_id AND status = 'COUNTERED';

  -- Verify ACCEPTED
  IF (SELECT status FROM public.exchange_requests WHERE id = v_exchange_request_id) != 'ACCEPTED' THEN
    RAISE EXCEPTION 'Failed Test C: Request not ACCEPTED';
  END IF;

  -- Test D - Confirm
  INSERT INTO public.exchanges (exchange_request_id, resource_id, owner_id, requester_id, final_price, status, meetup_location_id, confirmed_at)
  VALUES (v_exchange_request_id, v_resource_id, v_owner_id, v_requester_id, 700, 'CONFIRMED', v_meetup_location_id, now())
  RETURNING id INTO v_exchange_id;

  UPDATE public.exchange_requests SET status = 'CONFIRMED' WHERE id = v_exchange_request_id;
  UPDATE public.resources SET status = 'RESERVED' WHERE id = v_resource_id;

  -- Verify CONFIRMED
  IF (SELECT status FROM public.exchanges WHERE id = v_exchange_id) != 'CONFIRMED' THEN
    RAISE EXCEPTION 'Failed Test D: Exchange not CONFIRMED';
  END IF;
  IF (SELECT status FROM public.resources WHERE id = v_resource_id) != 'RESERVED' THEN
    RAISE EXCEPTION 'Failed Test D: Resource not RESERVED';
  END IF;

  -- Test E - Complete
  UPDATE public.exchanges SET status = 'COMPLETED', completed_at = now() WHERE id = v_exchange_id;
  UPDATE public.exchange_requests SET status = 'COMPLETED' WHERE id = v_exchange_request_id;
  UPDATE public.resources SET status = 'EXCHANGED' WHERE id = v_resource_id;

  -- Verify COMPLETED
  IF (SELECT status FROM public.exchanges WHERE id = v_exchange_id) != 'COMPLETED' THEN
    RAISE EXCEPTION 'Failed Test E: Exchange not COMPLETED';
  END IF;
  IF (SELECT status FROM public.resources WHERE id = v_resource_id) != 'EXCHANGED' THEN
    RAISE EXCEPTION 'Failed Test E: Resource not EXCHANGED';
  END IF;

  RAISE NOTICE 'All tests passed successfully!';
END $$;
