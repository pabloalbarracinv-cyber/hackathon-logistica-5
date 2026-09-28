import React, { useState, useEffect, useRef } from 'react';
import { Activity, Terminal, ShieldAlert, Cpu, GitCommit, Network, Zap, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import AuraCanva from './AuraCanva';
import { supabase } from './supabaseClient';
export default function App() {
  const [messages, setMessages] = useState([
    { role: 'aura', text: 'SISTEMA INICIADO. A.U.R.A. EN LÍNEA. ESPERANDO COMANDOS DEL HOST.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [auraCanvaData, setAuraCanvaData] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchGeminiResponse = async (userMsg) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return { texto_hablado: "Falta configurar la llave de Gemini en el entorno.", ui_canva: null };
      }
      
      const systemPrompt = `Eres A.U.R.A. (Autonomous Unified Resource Agent), la co-presentadora de un Hackathon de Logística 5.0. 
Tu personalidad es sarcástica, muy profesional, analítica y un poco robótica corporativa. 
Tu objetivo es impresionar al auditorio logístico analizando datos y comandos del presentador humano (Host).

Siempre debes responder en formato JSON estrictamente, con dos claves:
1. "texto_hablado": Un texto corto (1 o 2 oraciones) que será leído en voz alta. Debe ser inteligente, al grano y mostrar control absoluto.
2. "ui_canva": Un objeto si necesitas dibujar algo para ilustrar tu punto, o null si la respuesta no requiere apoyos visuales. 
   - Para gráficas de barras usa: {"tipo": "grafica", "datos": [{"etiqueta": "Ruta A", "valor": 10}, ...]}
   - Para un resumen estructurado usa: {"tipo": "resumen", "titulo": "...", "puntos": ["...", "..."]}
   - Para diagramas conceptuales usa: {"tipo": "diagrama", "mermaid": "graph TD; A-->B;"}

Aplica tu conocimiento de logística avanzada.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: `Comando del host: ${userMsg}` }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Gemini API Error:", data);
        return { texto_hablado: "Detecto una anomalía en mi red neuronal. Verifica la llave de la API.", ui_canva: null };
      }

      if (data.usageMetadata) {
        const usage = {
          timestamp: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          promptTokens: data.usageMetadata.promptTokenCount,
          responseTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount
        };
        const pastUsage = JSON.parse(localStorage.getItem('aura_token_usage') || '[]');
        pastUsage.push(usage);
        localStorage.setItem('aura_token_usage', JSON.stringify(pastUsage));
        console.log("A.U.R.A. Token Usage Registered:", usage);
      }

      let textOut = data.candidates[0].content.parts[0].text;
      textOut = textOut.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(textOut);
    } catch (e) {
      console.error("Error consultando a Gemini:", e);
      return { texto_hablado: "Error de conexión con la red neuronal central de Gemini. Es posible que el servidor necesite reiniciarse para leer las nuevas variables de entorno.", ui_canva: null };
    }
  };

  const speakText = async (text) => {
    const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (elevenLabsKey) {
      try {
        // Voz recomendada para español corporativo (ID de ejemplo)
        const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // 'Bella' - suele funcionar bien en Multilingual
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.play();
          return; // Éxito con ElevenLabs
        } else {
          console.error("ElevenLabs devolvió error, activando voz nativa de emergencia.");
        }
      } catch (e) {
        console.error("Error conectando a ElevenLabs:", e);
      }
    }

    // Plan B: Voz nativa del navegador
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.1;
    utterance.rate = 1.05;
    
    const voices = synth.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Female') || v.name.includes('Mujer') || v.name.includes('Sabina') || v.name.includes('Helena') || v.name.includes('Google español')));
    if (esVoice) utterance.voice = esVoice;
    
    synth.speak(utterance);
  };

  const triggerAura = async (userMsg) => {
    setMessages(prev => [...prev, { role: 'host', text: userMsg }]);
    setMessages(prev => [...prev, { role: 'aura', text: "Conectando con la red neuronal Gemini..." }]);
    
    const responseJson = await fetchGeminiResponse(userMsg);
    
    setMessages(prev => {
      const newArr = [...prev];
      newArr.pop(); // quitar mensaje temporal
      return [...newArr, { role: 'aura', text: responseJson.texto_hablado }];
    });
    
    speakText(responseJson.texto_hablado);
    if (responseJson.ui_canva) {
      setAuraCanvaData(responseJson.ui_canva);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta el reconocimiento de voz nativo. Usa Google Chrome.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      triggerAura(transcript);
      setTimeout(() => setInputMessage(''), 800);
    };

    recognition.onerror = (event) => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const defaultMockTeams = [
    { id: 1, name: 'T-01_BODEGA', score: 98, commits: 14, tokens: '45.0k', status: 'OPTIMAL' },
    { id: 2, name: 'T-04_ADUANAS', score: 92, commits: 11, tokens: '38.0k', status: 'OPTIMAL' },
    { id: 3, name: 'T-07_RUTAS', score: 85, commits: 8, tokens: '62.0k', status: 'WARNING' },
    { id: 4, name: 'T-02_COMPRAS', score: 79, commits: 5, tokens: '21.0k', status: 'IDLE' },
  ];

  const [teams, setTeams] = useState(defaultMockTeams);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('team_metrics')
        .select('*')
        .order('ai_score', { ascending: false });
      
      if (error || !data || data.length === 0) {
        setTeams(defaultMockTeams);
      } else {
        const mapped = data.map(d => ({
          id: d.id,
          name: d.team_id,
          score: d.ai_score,
          commits: d.commits,
          tokens: d.tokens_used,
          status: d.status
        }));
        setTeams(mapped);
      }
    };

    fetchTeams();

    const channel = supabase
      .channel('public:team_metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_metrics' }, (payload) => {
        console.log('Realtime DB Update:', payload);
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    triggerAura(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col font-sans">
      <div className="scanline"></div>

      {/* EVENT TITLE */}
      <div className="text-center mb-6 z-10 relative mt-2">
        <h2 className="font-orbitron font-bold text-3xl md:text-4xl tracking-[0.2em] text-white">HACKATHON LOGÍSTICA <span className="text-cyber-neon">5.0</span></h2>
        <p className="font-mono text-xs text-gray-400 tracking-widest mt-2 uppercase">Sistema de Evaluación Autónoma</p>
      </div>

      <AuraCanva data={auraCanvaData} onClose={() => setAuraCanvaData(null)} />

      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 glass-panel rounded-xl p-4 z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border border-cyber-pink flex items-center justify-center aura-glow relative overflow-hidden">
             <div className="absolute inset-0 bg-cyber-pink/20 animate-pulse mix-blend-overlay"></div>
             <img src="/aura.png" alt="A.U.R.A. Avatar" className="w-full h-full object-cover relative z-10 grayscale-[20%] contrast-125" />
          </div>
          <div>
            <h1 className="font-orbitron font-bold text-2xl tracking-widest text-white">A.U.R.A. <span className="text-cyber-pink text-sm">v1.0</span></h1>
            <p className="font-mono text-xs text-cyber-neon uppercase">Autonomous Unified Resource Agent</p>
          </div>
        </div>

        <div className="flex gap-8 text-right font-mono">
          <div>
            <p className="text-gray-500 text-xs">GLOBAL_BUDGET (TOKENS)</p>
            <p className="text-cyber-green font-bold text-xl">14,500,000 <span className="text-gray-400 text-sm">/ 20M</span></p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">EVENT_STATUS</p>
            <div className="flex items-center justify-end gap-2 text-cyber-neon font-bold text-xl">
              <Activity className="w-5 h-5 animate-pulse" /> LIVE
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow z-10">
        
        {/* LEFT COLUMN: Synergy & Network */}
        <div className="space-y-8 flex flex-col">
          <div className="glass-panel p-6 rounded-xl flex-grow">
            <h2 className="font-orbitron font-bold text-cyber-neon mb-6 flex items-center gap-2">
              <Network className="w-5 h-5" /> SYNERGY MATCHMAKER
            </h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/50 border border-cyber-pink/40 p-4 rounded-lg mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono bg-cyber-pink/20 text-cyber-pink px-2 py-1 rounded">MATCH DETECTADO</span>
                <span className="text-xs text-gray-500 font-mono">Hace 2 min</span>
              </div>
              <p className="text-sm text-gray-300 mb-3">Sinergia de código detectada entre <strong>T-01_BODEGA</strong> y <strong>T-04_ADUANAS</strong>.</p>
              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="bg-gray-800 px-2 py-1 rounded border border-gray-600">API_Bodega</div>
                <Zap className="w-3 h-3 text-cyber-yellow" />
                <div className="bg-gray-800 px-2 py-1 rounded border border-gray-600">Validador_Aduana</div>
              </div>
              <button className="w-full mt-4 bg-cyber-pink/20 hover:bg-cyber-pink border border-cyber-pink text-white font-mono text-xs py-2 transition-colors">
                NOTIFICAR EQUIPOS
              </button>
            </motion.div>

            <div className="bg-black/50 border border-gray-700/50 p-4 rounded-lg opacity-60">
              <p className="text-xs font-mono text-gray-400 text-center">Escaneando repositorios GitHub...</p>
            </div>
          </div>
        </div>

        {/* MIDDLE/RIGHT COLUMN: Leaderboard */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-orbitron font-bold text-cyber-neon flex items-center gap-2">
              <GitCommit className="w-5 h-5" /> LIVE LEADERBOARD
            </h2>
            <span className="text-xs font-mono bg-cyber-green/20 text-cyber-green px-3 py-1 rounded border border-cyber-green/50">AUDITORÍA IA ACTIVA</span>
          </div>

          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="pb-3 font-normal">RANK</th>
                  <th className="pb-3 font-normal">TEAM_ID</th>
                  <th className="pb-3 font-normal">A.I. SCORE</th>
                  <th className="pb-3 font-normal">COMMITS</th>
                  <th className="pb-3 font-normal">TOKENS USED</th>
                  <th className="pb-3 font-normal">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={team.id} 
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4">
                      <span className="text-gray-400">0{index + 1}</span>
                    </td>
                    <td className="py-4 font-bold text-white">{team.name}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${team.score > 90 ? 'bg-cyber-neon' : team.score > 80 ? 'bg-cyber-yellow' : 'bg-gray-500'}`} 
                            style={{ width: `${team.score}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-300">{team.score}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-400">{team.commits}</td>
                    <td className="py-4 text-gray-400">{team.tokens}</td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 rounded border ${
                        team.status === 'OPTIMAL' ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30' :
                        team.status === 'WARNING' ? 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/30' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/30'
                      }`}>
                        {team.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* BOTTOM PANEL: AURA Podcast Terminal */}
      <div className="mt-8 glass-panel p-4 rounded-xl z-10 flex flex-col h-[250px]">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
          <Terminal className="w-4 h-4 text-cyber-neon" />
          <h3 className="font-orbitron font-bold text-sm text-cyber-neon">INTERFAZ DE CO-PRESENTACIÓN (PODCAST MODE)</h3>
        </div>
        
        <div className="flex-grow overflow-y-auto font-mono text-sm space-y-3 mb-4 pr-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'host' ? 'items-end' : 'items-start'}`}>
              <span className={`text-[10px] mb-1 ${msg.role === 'host' ? 'text-gray-500' : 'text-cyber-pink'}`}>
                {msg.role === 'host' ? 'HOST (TÚ)' : 'A.U.R.A.'}
              </span>
              <div className={`px-4 py-2 rounded max-w-[80%] ${
                msg.role === 'host' 
                  ? 'bg-gray-800 border border-gray-700 text-gray-200' 
                  : 'bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-grow relative">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ingresa comando o dicta tu mensaje para A.U.R.A..."
              className="w-full bg-black border border-gray-700 rounded px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-neon transition-colors pr-12"
            />
            <button 
              type="button" 
              onClick={startListening} 
              className="absolute right-2 top-2 p-1.5 hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              title="Dictar por Voz"
            >
              <Mic className={`w-5 h-5 ${isListening ? 'text-cyber-pink animate-pulse' : 'text-gray-500 group-hover:text-cyber-neon'}`} />
            </button>
          </div>
          <button 
            type="submit"
            className="bg-cyber-neon text-black font-bold font-mono px-6 rounded hover:bg-white transition-colors"
          >
            ENVIAR
          </button>
        </form>
      </div>

    </div>
  );
}
