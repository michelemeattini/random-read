import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching random Wikipedia article...');
    
    // Get random Wikipedia article
    const wikiResponse = await fetch(
      'https://en.wikipedia.org/api/rest_v1/page/random/summary'
    );
    
    if (!wikiResponse.ok) {
      throw new Error('Failed to fetch Wikipedia article');
    }

    const wikiData = await wikiResponse.json();
    
    console.log('Wikipedia article fetched:', wikiData.title);

    // Generate engaging summary using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Sei un divulgatore culturale esperto. Crea riassunti coinvolgenti e accattivanti di articoli Wikipedia in italiano. Il riassunto deve essere interessante, educativo e far venire voglia di saperne di più. Usa un tono moderno ma professionale. Massimo 200 parole.'
          },
          {
            role: 'user',
            content: `Crea un riassunto coinvolgente per questo articolo Wikipedia:\n\nTitolo: ${wikiData.title}\n\nContenuto: ${wikiData.extract}\n\nUrl: ${wikiData.content_urls.desktop.page}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit superato. Riprova tra poco.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti esauriti. Ricarica il tuo workspace Lovable AI.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to generate AI summary');
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    console.log('AI summary generated');

    // Get image - prefer Wikipedia thumbnail, fallback to Unsplash
    let imageUrl = wikiData.thumbnail?.source || 
                   wikiData.originalimage?.source || 
                   `https://source.unsplash.com/1080x1920/?${encodeURIComponent(wikiData.title)}`;

    // If image is too small, use Unsplash
    if (wikiData.thumbnail?.width && wikiData.thumbnail.width < 800) {
      imageUrl = `https://source.unsplash.com/1080x1920/?${encodeURIComponent(wikiData.title)}`;
    }

    // Save to database
    const { data: post, error: dbError } = await supabase
      .from('wiki_posts')
      .insert({
        title: wikiData.title,
        summary: summary,
        image_url: imageUrl,
        source_url: wikiData.content_urls.desktop.page,
        wikipedia_page_id: wikiData.pageid.toString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Post saved to database:', post.id);

    return new Response(
      JSON.stringify({ success: true, post }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-wiki-post:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
