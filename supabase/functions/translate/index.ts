import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, contextSentence } = await req.json();

    if (!word) {
      throw new Error("No word provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Translating word:", word, "with context:", contextSentence);

    const systemPrompt = `You are a language learning assistant specialized in translating words and sentences to Persian (Farsi). Provide accurate translations with pronunciation guides.`;

    const userPrompt = `Translate the following word from English/German to Persian (Farsi).

Word: "${word}"
${contextSentence ? `Context sentence: "${contextSentence}"` : ""}

Provide the response in the following JSON format:
{
  "wordTranslation": "Persian translation of the word",
  "sentenceTranslation": "Persian translation of the full sentence (if context provided)",
  "pronunciation": "Transliteration/pronunciation guide in Latin script",
  "partOfSpeech": "noun/verb/adjective/etc",
  "notes": "Any relevant usage notes or context"
}

Important: Return ONLY valid JSON, no additional text or markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", textContent);

    // Parse the JSON response
    let translation;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedContent = textContent.replace(/```json\n?|\n?```/g, "").trim();
      translation = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback response
      translation = {
        wordTranslation: textContent,
        sentenceTranslation: null,
        pronunciation: null,
        partOfSpeech: null,
        notes: null,
      };
    }

    return new Response(JSON.stringify(translation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
