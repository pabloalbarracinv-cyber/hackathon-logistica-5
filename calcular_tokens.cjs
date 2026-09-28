const fs = require('fs');
const path = require('path');

// Aproximación de tokens: 1 token ≈ 4 caracteres en promedio
const CHARS_PER_TOKEN = 4;

const transcriptPath = 'C:\\Users\\1331\\.gemini\\antigravity\\brain\\67060e56-e672-453f-a1a9-43f51fa7cca0\\.system_generated\\logs\\transcript.jsonl';

function calculateAntigravityTokens() {
  try {
    const fileContent = fs.readFileSync(transcriptPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    let inputTokens = 0;
    let outputTokens = 0;
    let totalMessages = 0;

    for (const line of lines) {
      const step = JSON.parse(line);
      
      if (step.source === 'USER_EXPLICIT' && step.content) {
        inputTokens += Math.ceil(step.content.length / CHARS_PER_TOKEN);
        totalMessages++;
      } else if (step.source === 'MODEL') {
        let modelText = (step.content || '') + (step.thinking || '');
        if (step.tool_calls) {
          modelText += JSON.stringify(step.tool_calls);
        }
        outputTokens += Math.ceil(modelText.length / CHARS_PER_TOKEN);
        totalMessages++;
      }
    }

    const totalTokens = inputTokens + outputTokens;

    console.log("=========================================================");
    console.log("🤖 COMPARATIVA DE TOKENS: AURA vs ANTIGRAVITY AGENT");
    console.log("=========================================================\n");

    console.log(">> 1. CONSUMO DURANTE EL DESARROLLO (Antigravity Agent)");
    console.log("   - Modelo usado: Gemini 3.1 Pro (Desarrollo Complejo)");
    console.log(`   - Interacciones Totales: ${totalMessages}`);
    console.log(`   - Tokens de Entrada (Prompts del usuario): ~${inputTokens.toLocaleString()}`);
    console.log(`   - Tokens de Salida (Código y respuestas): ~${outputTokens.toLocaleString()}`);
    console.log(`   - TOTAL ESTIMADO: ~${totalTokens.toLocaleString()} tokens\n`);

    console.log(">> 2. CONSUMO EN PRODUCCIÓN / EVENTO VIVO (A.U.R.A.)");
    console.log("   (Para ver los tokens exactos de AURA, revisa la consola del navegador)");
    console.log("   - Modelo usado: Gemini 2.5 Flash (Operación Rápida)");
    console.log("   - El consumo en producción será considerablemente menor");
    console.log("     porque el modelo Flash es más ligero y las respuestas son concisas.\n");
    console.log("=========================================================");

  } catch (error) {
    console.error("No se pudo leer el log de transcripción:", error.message);
  }
}

calculateAntigravityTokens();
