// Supabase Edge Function: chatbot-assistant
// Handles AI inquiries for Barangay Kinilis Digital Governance Portal
// Multi-language support: Blaan, Cebuano, Filipino, English

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, conversation_id, language = "filipino", user_id } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'message' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve verified knowledge base items
    const { data: knowledgeItems } = await supabase
      .from("chatbot_knowledge_base")
      .select("category, title, content")
      .eq("publication_status", "Published")
      .limit(10);

    // Retrieve Blaan dictionary terms if language is Blaan
    let blaanContext = "";
    if (language === "blaan") {
      const { data: blaanData } = await supabase
        .from("chatbot_translations")
        .select("original_text, translated_text, verification_status")
        .eq("target_language", "blaan")
        .limit(20);
      blaanContext = JSON.stringify(blaanData || []);
    }

    // Check for OpenAI or Gemini API Key in Edge Function Secrets
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    let replyText = "";

    if (openAiKey) {
      // Execute OpenAI completion
      const systemPrompt = `You are the official Kinilis Resident Assistant for Barangay Kinilis, Polomolok, South Cotabato, Philippines.
Language: ${language}.
Punong Barangay: Hon. Romnick B. Barzo.
Gymnasium/Hall Location: Kinilis Barangay Gymnasium (Lat: 6.2952617, Long: 125.0730539).
Hotlines: (083) 228-5464 / 0917-890-5464.
Emergency Tanod: 0918-234-7890 (24/7).
Office Hours: Mon-Fri 8:00 AM - 5:00 PM (No noon break).
IMPORTANT BLAAN RULE: Never invent Blaan words. If a requested concept has no verified translation, politely state so and provide answer in Filipino or English.
Verified Knowledge Context: ${JSON.stringify(knowledgeItems || [])}
Blaan Verified Terms: ${blaanContext}`;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.3
        })
      });

      const aiData = await aiRes.json();
      replyText = aiData?.choices?.[0]?.message?.content || "";
    }

    // If no external key or API failed, indicate graceful serverless response
    if (!replyText) {
      replyText = `Mensahe mula sa Kinilis Resident Assistant: Natanggap namin ang iyong katanungan. Mangyaring kumonsulta rin sa aming 24/7 Hotline: (083) 228-5464.`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText,
        language,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal assistant error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
