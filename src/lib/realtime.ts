import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to new messages for a specific exchange request.
 */
export function subscribeToExchangeMessages(
  supabase: SupabaseClient,
  exchangeRequestId: string,
  onMessage: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`messages:${exchangeRequestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'exchange_messages',
        filter: `exchange_request_id=eq.${exchangeRequestId}`,
      },
      onMessage
    )
    .subscribe();
}

/**
 * Subscribes to status updates for a specific exchange request.
 */
export function subscribeToExchangeRequestStatus(
  supabase: SupabaseClient,
  exchangeRequestId: string,
  onUpdate: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`request:${exchangeRequestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'exchange_requests',
        filter: `id=eq.${exchangeRequestId}`,
      },
      onUpdate
    )
    .subscribe();
}

/**
 * Subscribes to insert or updates for a confirmed exchange associated with a request.
 */
export function subscribeToExchangeUpdates(
  supabase: SupabaseClient,
  exchangeRequestId: string,
  onUpdate: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`exchange:${exchangeRequestId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // captures both INSERT and UPDATE
        schema: 'public',
        table: 'exchanges',
        filter: `exchange_request_id=eq.${exchangeRequestId}`,
      },
      onUpdate
    )
    .subscribe();
}

/**
 * Subscribes to status updates (or other changes) for a specific resource.
 */
export function subscribeToResourceUpdates(
  supabase: SupabaseClient,
  resourceId: string,
  onUpdate: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`resource:${resourceId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'resources',
        filter: `id=eq.${resourceId}`,
      },
      onUpdate
    )
    .subscribe();
}
