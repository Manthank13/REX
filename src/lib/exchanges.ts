import { SupabaseClient } from '@supabase/supabase-js';

export const REQ_STATUS = {
  PENDING: 'PENDING',
  COUNTERED: 'COUNTERED',
  ACCEPTED: 'ACCEPTED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  DECLINED: 'DECLINED'
};

export const RES_STATUS = {
  ACTIVE: 'ACTIVE',
  RESERVED: 'RESERVED',
  EXCHANGED: 'EXCHANGED'
};

export async function createExchangeRequest(
  supabase: SupabaseClient,
  params: { resource_id: string; requester_id: string; offer_price: number; message?: string }
) {
  const { data: resource, error: resErr } = await supabase
    .from('resources')
    .select('id, owner_id, status')
    .eq('id', params.resource_id)
    .single();

  if (resErr || !resource) throw new Error('Resource not found');
  if (resource.status !== RES_STATUS.ACTIVE) throw new Error('Resource is not ACTIVE');
  if (resource.owner_id === params.requester_id) throw new Error('Cannot request your own resource');

  const { data: reqData, error: reqErr } = await supabase
    .from('exchange_requests')
    .insert({
      resource_id: params.resource_id,
      requester_id: params.requester_id,
      offer_price: params.offer_price,
      status: REQ_STATUS.PENDING
    })
    .select()
    .single();

  if (reqErr || !reqData) throw new Error(`Failed to create request: ${reqErr?.message}`);

  if (params.message) {
    await supabase.from('exchange_messages').insert({
      exchange_request_id: reqData.id,
      sender_id: params.requester_id,
      message: params.message
    });
  }

  return reqData;
}

export async function getExchangeRequests(supabase: SupabaseClient, user_id: string) {
  // We can't do a simple OR on joined table owner_id without inner joining in a complex way.
  // Instead, fetch requests where requester_id = user_id OR resource.owner_id = user_id.
  // Using Supabase related filtering:
  const { data, error } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      resource:resources!inner(id, title, category, owner_id, status, institution:institutions(name, city)),
      requester:profiles!requester_id(name, avatar_url)
    `)
    .or(`requester_id.eq.${user_id},resource.owner_id.eq.${user_id}`);

  if (error) throw new Error(error.message);
  return data;
}

export async function counterExchangeRequest(
  supabase: SupabaseClient,
  params: { exchange_request_id: string; sender_id: string; counter_price: number; message: string }
) {
  const { data: req, error: reqErr } = await supabase
    .from('exchange_requests')
    .select('id, status, resource_id, resource:resources!inner(owner_id)')
    .eq('id', params.exchange_request_id)
    .single();

  if (reqErr || !req) throw new Error('Exchange request not found');
  
  // @ts-ignore
  if (req.resource.owner_id !== params.sender_id) throw new Error('Only the owner can counter');
  if (req.status !== REQ_STATUS.PENDING) throw new Error('Only PENDING requests can be countered');

  const { data: updatedReq, error: upErr } = await supabase
    .from('exchange_requests')
    .update({ 
      offer_price: params.counter_price,
      status: REQ_STATUS.COUNTERED
    })
    .eq('id', params.exchange_request_id)
    .select()
    .single();

  if (upErr || !updatedReq) throw new Error('Failed to update request');

  await supabase.from('exchange_messages').insert({
    exchange_request_id: params.exchange_request_id,
    sender_id: params.sender_id,
    message: params.message
  });

  return updatedReq;
}

export async function acceptExchangeRequest(
  supabase: SupabaseClient,
  params: { exchange_request_id: string; accepting_user_id: string; message?: string }
) {
  const { data: req, error: reqErr } = await supabase
    .from('exchange_requests')
    .select('id, status, requester_id, resource:resources!inner(owner_id)')
    .eq('id', params.exchange_request_id)
    .single();

  if (reqErr || !req) throw new Error('Exchange request not found');

  // @ts-ignore
  const isOwner = req.resource.owner_id === params.accepting_user_id;
  const isRequester = req.requester_id === params.accepting_user_id;

  let newStatus = REQ_STATUS.ACCEPTED;

  if (req.status === REQ_STATUS.PENDING) {
    if (!isOwner) throw new Error('Only owner can accept a PENDING offer');
  } else if (req.status === REQ_STATUS.COUNTERED) {
    if (!isRequester) throw new Error('Only requester can accept a COUNTERED offer');
  } else {
    throw new Error('Can only accept PENDING or COUNTERED requests');
  }

  const { data: updatedReq, error: upErr } = await supabase
    .from('exchange_requests')
    .update({ status: newStatus })
    .eq('id', params.exchange_request_id)
    .select()
    .single();

  if (upErr || !updatedReq) throw new Error('Failed to accept request');

  if (params.message) {
    await supabase.from('exchange_messages').insert({
      exchange_request_id: params.exchange_request_id,
      sender_id: params.accepting_user_id,
      message: params.message
    });
  }

  return updatedReq;
}

export async function declineExchangeRequest(
  supabase: SupabaseClient,
  params: { exchange_request_id: string; user_id: string; message?: string }
) {
  const { data: req, error: reqErr } = await supabase
    .from('exchange_requests')
    .select('id, status, requester_id, resource:resources!inner(owner_id)')
    .eq('id', params.exchange_request_id)
    .single();

  if (reqErr || !req) throw new Error('Exchange request not found');

  // @ts-ignore
  const isOwner = req.resource.owner_id === params.user_id;
  const isRequester = req.requester_id === params.user_id;

  if (!isOwner && !isRequester) throw new Error('Only owner or requester can decline');
  if (req.status !== REQ_STATUS.PENDING && req.status !== REQ_STATUS.COUNTERED) {
    throw new Error('Can only decline PENDING or COUNTERED requests');
  }

  const { data: updatedReq, error: upErr } = await supabase
    .from('exchange_requests')
    .update({ status: REQ_STATUS.DECLINED })
    .eq('id', params.exchange_request_id)
    .select()
    .single();

  if (upErr) throw new Error('Failed to decline request');

  if (params.message) {
    await supabase.from('exchange_messages').insert({
      exchange_request_id: params.exchange_request_id,
      sender_id: params.user_id,
      message: params.message
    });
  }

  return updatedReq;
}

export async function confirmExchange(
  supabase: SupabaseClient,
  params: { exchange_request_id: string; confirming_user_id: string; meetup_location_id?: string }
) {
  const { data: req, error: reqErr } = await supabase
    .from('exchange_requests')
    .select('id, status, requester_id, offer_price, resource_id, resource:resources!inner(owner_id, status)')
    .eq('id', params.exchange_request_id)
    .single();

  if (reqErr || !req) throw new Error('Exchange request not found');
  if (req.status !== REQ_STATUS.ACCEPTED) throw new Error('Request must be ACCEPTED to confirm');
  // @ts-ignore
  if (req.resource.status !== RES_STATUS.ACTIVE) throw new Error('Resource is no longer ACTIVE');

  // @ts-ignore
  const owner_id = req.resource.owner_id;
  const requester_id = req.requester_id;
  const resource_id = req.resource_id;

  if (params.confirming_user_id !== owner_id && params.confirming_user_id !== requester_id) {
    throw new Error('Not authorized to confirm this exchange');
  }

  // Validate meetup location if provided
  if (params.meetup_location_id) {
    const { data: meetup, error: meetupErr } = await supabase
      .from('meetup_locations')
      .select('id')
      .eq('id', params.meetup_location_id)
      .single();
    
    if (meetupErr || !meetup) {
      throw new Error('Invalid or non-public meetup location');
    }
  }

  // To prevent race conditions safely via REST, we rely on checking constraints and then executing.
  // 1. Create exchange record
  const { data: exchange, error: exErr } = await supabase
    .from('exchanges')
    .insert({
      exchange_request_id: params.exchange_request_id,
      resource_id: resource_id,
      owner_id: owner_id,
      requester_id: requester_id,
      final_price: req.offer_price,
      status: REQ_STATUS.CONFIRMED,
      meetup_location_id: params.meetup_location_id,
      confirmed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (exErr) throw new Error(`Failed to create exchange: ${exErr.message}`);

  // 2. Update request status
  await supabase
    .from('exchange_requests')
    .update({ status: REQ_STATUS.CONFIRMED })
    .eq('id', params.exchange_request_id);

  // 3. Update resource status
  await supabase
    .from('resources')
    .update({ status: RES_STATUS.RESERVED })
    .eq('id', resource_id);

  return exchange;
}

export async function completeExchange(
  supabase: SupabaseClient,
  params: { exchange_id: string; completing_user_id: string }
) {
  const { data: exchange, error: exErr } = await supabase
    .from('exchanges')
    .select('id, status, exchange_request_id, resource_id, owner_id, requester_id')
    .eq('id', params.exchange_id)
    .single();

  if (exErr || !exchange) throw new Error('Exchange not found');
  if (exchange.status !== REQ_STATUS.CONFIRMED) throw new Error('Exchange must be CONFIRMED to complete');

  if (params.completing_user_id !== exchange.owner_id && params.completing_user_id !== exchange.requester_id) {
    throw new Error('Not authorized to complete this exchange');
  }

  // Update exchange
  const { data: updatedEx, error: upExErr } = await supabase
    .from('exchanges')
    .update({ 
      status: REQ_STATUS.COMPLETED,
      completed_at: new Date().toISOString()
    })
    .eq('id', params.exchange_id)
    .select()
    .single();

  if (upExErr) throw new Error('Failed to complete exchange');

  // Update request
  await supabase
    .from('exchange_requests')
    .update({ status: REQ_STATUS.COMPLETED })
    .eq('id', exchange.exchange_request_id);

  // Update resource
  await supabase
    .from('resources')
    .update({ status: RES_STATUS.EXCHANGED })
    .eq('id', exchange.resource_id);

  return updatedEx;
}

export async function getExchangeByRequestId(supabase: SupabaseClient, exchange_request_id: string, user_id: string) {
  const { data: exchange, error } = await supabase
    .from('exchanges')
    .select(`
      *,
      meetup_location:meetup_locations(id, name, address, instructions, latitude, longitude),
      resource:resources(id, title, category, status),
      owner:profiles!owner_id(name, avatar_url),
      requester:profiles!requester_id(name, avatar_url)
    `)
    .eq('exchange_request_id', exchange_request_id)
    .single();

  if (error || !exchange) {
    throw new Error('Exchange not found or not confirmed');
  }

  // Security check: Only the involved participants can view the confirmed exchange meetup details
  if (exchange.owner_id !== user_id && exchange.requester_id !== user_id) {
    throw new Error('Not authorized to view this exchange');
  }

  return exchange;
}

