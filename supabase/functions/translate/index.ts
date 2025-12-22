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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Translating word:", word, "with context:", contextSentence);

    const prompt = `You are a language learning assistant. Translate the following word from English to Persian (Farsi).

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No response from Gemini");
    }

    console.log("Gemini response:", textContent);

    // Parse the JSON response
    let translation;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedContent = textContent.replace(/```json\n?|\n?```/g, "").trim();
      translation = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
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
