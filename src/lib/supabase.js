import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url) {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

// VITE_SUPABASE_URL must be the project URL, not the REST endpoint.
const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || 'https://mstoweurzmfoshlwbpkg.supabase.co');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdG93ZXVyem1mb3NobHdicGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODQ5NTEsImV4cCI6MjA5NDc2MDk1MX0.QAWVymKkkqGzXlKU5OqpbpcyXuGjwdlqcY6ZIVS-r-E';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Log a played track to Supabase history
 */
export async function logTrackPlay(userId, track) {
  if (!userId || !track) return;
  try {
    const { error } = await supabase
      .from('listening_history')
      .insert({
        user_id: userId,
        track_id: track.id,
        track_name: track.name,
        artist_name: track.artist,
        played_at: new Date().toISOString()
      });
      
    if (error) console.error('Failed to log play:', error);
  } catch (err) {
    console.error('Supabase log error:', err);
  }
}

/**
 * Get user's recent top tracks to feed into Groq recommendations
 */
export async function getRecentTracks(userId, limit = 20) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('listening_history')
    .select('track_name, artist_name')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Fetch history error:', error);
    return [];
  }
  return data || [];
}

export function getLocalShareCode() {
  const existing = localStorage.getItem('audiosa_share_code');
  if (existing) return existing;

  const code = `AUD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  localStorage.setItem('audiosa_share_code', code);
  return code;
}

export function savePartnerCode(code) {
  localStorage.setItem('audiosa_partner_code', code.trim().toUpperCase());
}

export function getPartnerCode() {
  return localStorage.getItem('audiosa_partner_code') || '';
}

export async function shareTrackWithPartner(track, partnerCode = getPartnerCode(), ownerCode = getLocalShareCode()) {
  if (!track?.id) throw new Error('Pick a song before sharing.');
  if (!partnerCode?.trim()) throw new Error('Add your partner code first.');

  const { error } = await supabase
    .from('partner_shared_tracks')
    .insert({
      owner_code: ownerCode,
      partner_code: partnerCode.trim().toUpperCase(),
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artist,
      thumbnail_url: track.thumbnail,
    });

  if (error) throw error;
}

export async function getPartnerSharedTracks(ownerCode = getLocalShareCode()) {
  const { data, error } = await supabase
    .from('partner_shared_tracks')
    .select('*')
    .eq('partner_code', ownerCode)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((track) => ({
    id: track.track_id,
    name: track.track_name,
    artist: track.artist_name,
    thumbnail: track.thumbnail_url,
    sharedBy: track.owner_code,
    sharedAt: track.created_at,
  }));
}
