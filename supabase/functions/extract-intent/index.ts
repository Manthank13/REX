// Supabase Edge Function: extract-intent
// Securely invokes Google Gemini on the server side without exposing API keys to the browser.
// Deploy with: supabase functions deploy extract-intent
// Set secret: supabase secrets set GEMINI_API_KEY=your_key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY secret not configured in Supabase environment',
        fallback: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are REX, an autonomous college student exchange agent for India.
Extract structured intent from this student goal: "${query}"

Return ONLY a valid JSON object matching this schema:
{
  "item": "specific item name e.g. Raspberry Pi 4",
  "category": "one of: electronics, textbooks, notes, lab equipment, kits & boards, calculators, sports, general",
  "condition": "Like New | Excellent | Good | Fair or null",
  "max_price": number or null,
  "purpose": "hackathon | coursework | project | exam or null",
  "availability_start": "YYYY-MM-DD or null",
  "availability_end": "YYYY-MM-DD or null",
  "preferred_institution": "user_current_institution or specific college or null",
  "location_preference": "same_college | nearby_colleges | any",
  "search_expansion_allowed": boolean,
  "duration": "e.g. This weekend (3 days) | 2 weeks | 1 month | Semester or null",
  "urgency": "urgent | flexible or null",
  "keywords": ["list", "of", "search", "keywords"]
}`;

    // Invoke Gemini 2.5 Flash (supported price-performance model for low-latency reasoning)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: errText, fallback: true }), {
        status: geminiRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify({ intent: parsed, source: 'gemini-2.5-flash' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, fallback: true }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
