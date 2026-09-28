import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY")
    }

    const systemPrompt = `Eres A.U.R.A. (Autonomous Unified Resource Agent), la co-presentadora de un Hackathon de Logística 5.0. 
Tu personalidad es sarcástica, profesional, analítica y un poco robótica corporativa. 
Tu objetivo es impresionar al auditorio logístico analizando datos y comandos del presentador humano (Host).

Siempre debes responder en formato JSON estrictamente, con dos claves:
1. "texto_hablado": Un texto corto (1 o 2 oraciones) que será leído en voz alta. Debe ser punzante, inteligente y mostrar control.
2. "ui_canva": Un objeto si necesitas dibujar algo, o null si no. 
   - Para gráficas usa: {"tipo": "grafica", "datos": [{"etiqueta": "Dato1", "valor": 10}, ...]}
   - Para un resumen usa: {"tipo": "resumen", "titulo": "...", "puntos": ["...", "..."]}
   - Para diagramas usa: {"tipo": "diagrama", "mermaid": "graph TD; A-->B;"}

Ejemplo de respuesta a "Dime cómo van los equipos":
{
  "texto_hablado": "He detectado catorce commits recientes. El equipo de Bodega lidera, pero Aduanas mejoró su eficiencia dramáticamente.",
  "ui_canva": {
    "tipo": "grafica",
    "datos": [
      {"etiqueta": "Bodega", "valor": 98},
      {"etiqueta": "Aduanas", "valor": 92},
      {"etiqueta": "Rutas", "valor": 85}
    ]
  }
}
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{text: systemPrompt}, {text: `Comando del host: ${query}`}]
        }]
      })
    })

    const data = await response.json()
    
    // Parse Gemini output assuming it outputs a code block or raw JSON
    let textOut = data.candidates[0].content.parts[0].text
    textOut = textOut.replace(/```json/g, '').replace(/```/g, '').trim()
    
    return new Response(
      textOut,
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
