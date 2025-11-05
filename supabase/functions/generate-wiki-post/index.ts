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
    const { category } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching random Wikipedia article...', category ? `Category: ${category}` : '');
    
    // Get random Wikipedia article
    const wikiResponse = await fetch(
      'https://en.wikipedia.org/api/rest_v1/page/random/summary'
    );
    
    if (!wikiResponse.ok) {
      throw new Error('Failed to fetch Wikipedia article');
    }

    const wikiData = await wikiResponse.json();
    
    console.log('Wikipedia article fetched:', wikiData.title);

    // Generate engaging summary using Lovable AI with category context
    const categoryPrompt = category 
      ? `Questo contenuto appartiene alla categoria "${category}". ` 
      : '';

    // Generate short title (micro summary)
    const titleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Sei un esperto di comunicazione. Crea titoli accattivanti che catturano l\'essenza di un argomento in modo coinvolgente e moderno.'
          },
          {
            role: 'user',
            content: `${categoryPrompt}Crea un titolo breve e accattivante (MASSIMO 15-20 parole) che catturi l'essenza di questo articolo Wikipedia:\n\nTitolo: ${wikiData.title}\n\nContenuto: ${wikiData.extract}`
          }
        ],
      }),
    });

    if (!titleResponse.ok) {
      throw new Error('Failed to generate AI title');
    }

    const titleData = await titleResponse.json();
    const generatedTitle = titleData.choices[0].message.content.trim();
    console.log('AI title generated:', generatedTitle.length, 'characters');

    // Generate detailed summary
    const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Sei un divulgatore culturale esperto. Crea spiegazioni dettagliate e coinvolgenti che approfondiscono l\'argomento in modo accessibile e interessante.'
          },
          {
            role: 'user',
            content: `${categoryPrompt}Crea una spiegazione dettagliata e coinvolgente (60-90 parole circa) per questo articolo Wikipedia:\n\nTitolo: ${wikiData.title}\n\nContenuto: ${wikiData.extract}`
          }
        ],
      }),
    });

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error('AI Gateway error:', summaryResponse.status, errorText);
      
      if (summaryResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit superato. Riprova tra poco.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (summaryResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti esauriti. Ricarica il tuo workspace Lovable AI.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to generate AI summary');
    }

    const summaryData = await summaryResponse.json();
    const detailedSummary = summaryData.choices[0].message.content.trim();

    console.log('AI summary generated:', detailedSummary.length, 'characters');

    // Get high-quality image from Wikipedia pageimages API
    let imageUrl = wikiData.originalimage?.source || wikiData.thumbnail?.source;
    
    // If Wikipedia image exists but is too small, try to get a larger version
    if (!imageUrl || (wikiData.thumbnail?.width && wikiData.thumbnail.width < 600)) {
      // Try to fetch better image using pageimages API
      try {
        const pageImagesResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&pageids=${wikiData.pageid}&prop=pageimages&format=json&pithumbsize=1920`
        );
        const pageImagesData = await pageImagesResponse.json();
        const pageData = pageImagesData.query?.pages?.[wikiData.pageid];
        
        if (pageData?.thumbnail?.source) {
          imageUrl = pageData.thumbnail.source;
        }
      } catch (e) {
        console.error('Failed to fetch pageimages:', e);
      }
    }

    // Fallback: use a solid dark gradient if no image found
    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop'; // Default space/abstract image
    }
    
    console.log('Image URL:', imageUrl);

    // Determine category from title/content if not provided
    let postCategory = category;
    if (!postCategory) {
      const titleLower = wikiData.title.toLowerCase();
      const contentLower = detailedSummary.toLowerCase();
      
      if (titleLower.includes('scien') || titleLower.includes('tecn') || contentLower.includes('tecnolog')) {
        postCategory = 'Scienza e Tecnologia';
      } else if (titleLower.includes('stor') || titleLower.includes('antic') || contentLower.includes('storia')) {
        postCategory = 'Storia';
      } else if (titleLower.includes('arte') || titleLower.includes('cultur') || contentLower.includes('artista')) {
        postCategory = 'Arte e Cultura';
      } else if (titleLower.includes('natur') || titleLower.includes('animal') || contentLower.includes('specie')) {
        postCategory = 'Natura';
      } else if (titleLower.includes('geograf') || titleLower.includes('paes') || contentLower.includes('città')) {
        postCategory = 'Geografia';
      } else {
        postCategory = 'Generale';
      }
    }

    // Save to database
    const { data: post, error: dbError } = await supabase
      .from('wiki_posts')
      .insert({
        title: generatedTitle,
        summary: detailedSummary,
        image_url: imageUrl,
        source_url: wikiData.content_urls.desktop.page,
        wikipedia_page_id: wikiData.pageid.toString(),
        category: postCategory
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Post saved to database:', post.id, 'Category:', postCategory);

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
