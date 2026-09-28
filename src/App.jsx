import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Terminal, ShieldAlert, Cpu, GitCommit, Network, Zap, Mic, 
  Play, Pause, Sparkles, Code2, CheckCircle2, Radio, FileCode, Flame 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuraCanva from './AuraCanva';
import { supabase } from './supabaseClient';
import { mockCommitStream } from './data/mockCommits';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'aura', text: 'SISTEMA INICIADO. A.U.R.A. EN LÍNEA. MODO SIMULACIÓN EN VIVO DISPONIBLE.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [auraCanvaData, setAuraCanvaData] = useState(null);
  const messagesEndRef = useRef(null);

  // SIMULATOR STATE
  const [isSimulating, setIsSimulating] = useState(true);
  const [commitIndex, setCommitIndex] = useState(0);
  const [lastUpdatedTeam, setLastUpdatedTeam] = useState(null);
  const [activeSynergy, setActiveSynergy] = useState(mockCommitStream[1].synergy);
  const [synergyNotified, setSynergyNotified] = useState(false);
  const [liveFeed, setLiveFeed] = useState([
    {
      id: 'init-1',
      time: '15:02:10',
      teamId: 'T-01_BODEGA',
      file: 'src/algorithms/fifo_dispatch.ts',
      scoreDelta: 4,
      analysis: 'Optimización O(log n) en cola de despacho.'
    },
    {
      id: 'init-2',
      time: '15:05:42',
      teamId: 'T-04_ADUANAS',
      file: 'api/customs/tariff_validator.py',
      scoreDelta: 6,
      analysis: 'Validación regex de subpartidas arancelarias DIAN.'
    }
  ]);

  const defaultMockTeams = [
    { id: 1, name: 'T-01_BODEGA', score: 98, commits: 14, tokens: '45.0k', status: 'OPTIMAL' },
    { id: 2, name: 'T-04_ADUANAS', score: 92, commits: 11, tokens: '38.0k', status: 'OPTIMAL' },
    { id: 3, name: 'T-07_RUTAS', score: 85, commits: 8, tokens: '62.0k', status: 'WARNING' },
    { id: 4, name: 'T-02_COMPRAS', score: 79, commits: 5, tokens: '21.0k', status: 'IDLE' },
  ];

  const [teams, setTeams] = useState(defaultMockTeams);

  // 1. Fetch Supabase Data or fallback
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_metrics' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. LIVE SIMULATION ENGINE (Every 7 seconds)
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      const nextCommit = mockCommitStream[commitIndex % mockCommitStream.length];
      setCommitIndex(prev => prev + 1);

      // A. Update Team Score & Sort with Framer Motion layout animation
      setTeams(prevTeams => {
        const updated = prevTeams.map(t => {
          if (t.name === nextCommit.teamId) {
            const newScore = Math.min(100, t.score + nextCommit.scoreDelta);
            const currentTokensNum = parseFloat(t.tokens) || 40;
            const newTokens = (currentTokensNum + (nextCommit.tokenDelta / 1000)).toFixed(1) + 'k';
            return {
              ...t,
              score: newScore,
              commits: t.commits + nextCommit.commitCount,
              tokens: newTokens,
              status: nextCommit.status
            };
          }
          return t;
        });

        // Re-sort descending by score
        return [...updated].sort((a, b) => b.score - a.score);
      });

      setLastUpdatedTeam(nextCommit.teamId);
      setTimeout(() => setLastUpdatedTeam(null), 3000);

      // B. Append to Live Terminal Feed
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLiveFeed(prev => [
        {
          id: `${nextCommit.id}-${Date.now()}`,
          time: timeStr,
          teamId: nextCommit.teamId,
          file: nextCommit.file,
          scoreDelta: nextCommit.scoreDelta,
          analysis: nextCommit.aiAnalysis
        },
        ...prev.slice(0, 4)
      ]);

      // C. Handle Synergy Event
      if (nextCommit.synergy) {
        setActiveSynergy(nextCommit.synergy);
        setSynergyNotified(false);
        speakText(nextCommit.synergy.voiceAlert);
        setMessages(prev => [
          ...prev,
          { 
            role: 'aura', 
            text: `⚡ ALERTA DE SINERGIA: Match detectado entre ${nextCommit.synergy.teamA} y ${nextCommit.synergy.teamB}. Módulos compatibles: ${nextCommit.synergy.moduleA} ↔ ${nextCommit.synergy.moduleB}.` 
          }
        ]);
      }

    }, 7000);

    return () => clearInterval(timer);
  }, [isSimulating, commitIndex]);

  // 3. AI RESPONDER (OpenAI GPT-4o-mini with Gemini Fallback)
  const fetchAIResponse = async (userMsg) => {
    try {
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

      // Handle voice commands for simulation
      const lower = userMsg.toLowerCase();
      if (lower.includes('pausa') || lower.includes('detén') || lower.includes('para')) {
        setIsSimulating(false);
        return { texto_hablado: "Simulador en vivo pausado. Manteniendo estado actual de repositorios.", ui_canva: null };
      }
      if (lower.includes('inicia') || lower.includes('arranca') || lower.includes('simula') || lower.includes('activa')) {
        setIsSimulating(true);
        return { texto_hablado: "Simulador de Hackathon activado. Auditando flujo de commits en tiempo real.", ui_canva: null };
      }

      if (!openaiKey && !geminiKey) {
        return { texto_hablado: "Falta configurar la llave de OpenAI o Gemini en el entorno.", ui_canva: null };
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

      if (openaiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Comando del host: ${userMsg}` }
            ],
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("OpenAI API Error:", data);
          return { texto_hablado: "Anomalía en la red neuronal OpenAI. Revisa los créditos o la llave.", ui_canva: null };
        }

        if (data.usage) {
          const usage = {
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            promptTokens: data.usage.prompt_tokens,
            responseTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens
          };
          const pastUsage = JSON.parse(localStorage.getItem('aura_token_usage') || '[]');
          pastUsage.push(usage);
          localStorage.setItem('aura_token_usage', JSON.stringify(pastUsage));
          console.log("A.U.R.A. (OpenAI) Token Usage Registered:", usage);
        }

        return JSON.parse(data.choices[0].message.content);
      }

      // Fallback a Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
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

      let textOut = data.candidates[0].content.parts[0].text;
      textOut = textOut.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(textOut);
    } catch (e) {
      console.error("Error consultando a la IA:", e);
      return { texto_hablado: "Error de conexión con la red neuronal central.", ui_canva: null };
    }
  };

  // 4. TTS (ElevenLabs with browser fallback)
  const speakText = async (text) => {
    const elevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (elevenLabsKey) {
      try {
        const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // 'Bella'
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
          return;
        }
      } catch (e) {
        console.error("Error conectando a ElevenLabs:", e);
      }
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.1;
    utterance.rate = 1.05;
    const voices = synth.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Female') || v.name.includes('Mujer') || v.name.includes('Google español')));
    if (esVoice) utterance.voice = esVoice;
    synth.speak(utterance);
  };

  const triggerAura = async (userMsg) => {
    setMessages(prev => [...prev, { role: 'host', text: userMsg }]);
    setMessages(prev => [...prev, { role: 'aura', text: "Analizando comando..." }]);
    
    const responseJson = await fetchAIResponse(userMsg);
    
    setMessages(prev => {
      const newArr = [...prev];
      newArr.pop();
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

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

  const handleOpenSynergyCode = () => {
    if (!activeSynergy) return;
    setAuraCanvaData({
      tipo: 'sinergia_codigo',
      teamA: activeSynergy.teamA,
      teamB: activeSynergy.teamB,
      moduleA: activeSynergy.moduleA,
      moduleB: activeSynergy.moduleB,
      description: activeSynergy.description,
      codeA: mockCommitStream[0].codeSnippet,
      codeB: mockCommitStream[1].codeSnippet
    });
  };

  const handleNotifyTeams = () => {
    setSynergyNotified(true);
    setTimeout(() => setSynergyNotified(false), 4000);
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col font-sans">
      <div className="scanline"></div>

      {/* DEMO / SIMULATOR CONTROL BANNER */}
      <div className="mb-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-cyber-pink/15 border border-cyber-pink/50 rounded-xl px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSimulating ? 'bg-cyber-neon opacity-75' : 'bg-gray-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSimulating ? 'bg-cyber-neon' : 'bg-gray-500'}`}></span>
          </span>
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            MODO DEMOSTRACIÓN CLIENTE: {isSimulating ? <span className="text-cyber-neon">SIMULADOR EN VIVO ACTIVO</span> : <span className="text-gray-400">PAUSADO</span>}
          </span>
          <span className="hidden md:inline text-[10px] font-mono text-gray-400 border-l border-gray-700 pl-2">
            Auditando commits simulados cada 7s
          </span>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
            isSimulating 
              ? 'bg-cyber-pink/20 hover:bg-cyber-pink border border-cyber-pink text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]' 
              : 'bg-cyber-neon hover:bg-white text-black'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isSimulating ? 'PAUSAR SIMULACIÓN' : 'REANUDAR SIMULACIÓN'}
        </button>
      </div>

      {/* EVENT TITLE */}
      <div className="text-center mb-6 z-10 relative">
        <h2 className="font-orbitron font-bold text-3xl md:text-4xl tracking-[0.2em] text-white">
          HACKATHON LOGÍSTICA <span className="text-cyber-neon">5.0</span>
        </h2>
        <p className="font-mono text-xs text-gray-400 tracking-widest mt-2 uppercase">
          Sistema de Evaluación Autónoma & Matchmaker IA
        </p>
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

        <div className="flex gap-6 md:gap-8 text-right font-mono">
          <div>
            <p className="text-gray-500 text-xs">GLOBAL_BUDGET (TOKENS)</p>
            <p className="text-cyber-green font-bold text-lg md:text-xl">14,580,240 <span className="text-gray-400 text-sm">/ 20M</span></p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">EVENT_STATUS</p>
            <div className="flex items-center justify-end gap-2 text-cyber-neon font-bold text-lg md:text-xl">
              <Activity className="w-5 h-5 animate-pulse" /> LIVE
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow z-10">
        
        {/* LEFT COLUMN: Synergy Matchmaker & Live Commit Feed */}
        <div className="space-y-6 flex flex-col">
          
          {/* SYNERGY MATCHMAKER */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden border border-cyber-pink/40 shadow-[0_0_30px_rgba(255,0,60,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron font-bold text-cyber-pink text-sm flex items-center gap-2 tracking-wider">
                <Network className="w-4 h-4 animate-pulse" /> SYNERGY MATCHMAKER
              </h2>
              <span className="text-[10px] font-mono bg-cyber-pink/20 text-cyber-pink px-2 py-0.5 rounded border border-cyber-pink/40 animate-pulse">
                IA ACTIVA
              </span>
            </div>
            
            <motion.div 
              key={activeSynergy ? activeSynergy.teamA + activeSynergy.teamB : 'default'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-black/60 border border-cyber-pink/50 p-4 rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono bg-cyber-pink text-black font-bold px-2 py-0.5 rounded">
                  MATCH DETECTADO
                </span>
                <span className="text-[10px] text-gray-400 font-mono">En tiempo real</span>
              </div>
              
              <p className="text-xs font-mono text-gray-200 mb-3 leading-relaxed">
                {activeSynergy ? activeSynergy.description : 'Analizando repositorios GitHub para detectar sinergias de código...'}
              </p>

              {activeSynergy && (
                <div className="flex items-center gap-2 text-xs font-mono mb-4">
                  <div className="bg-gray-900 px-2 py-1 rounded border border-gray-700 text-cyber-neon">{activeSynergy.moduleA}</div>
                  <Zap className="w-3.5 h-3.5 text-cyber-yellow animate-bounce" />
                  <div className="bg-gray-900 px-2 py-1 rounded border border-gray-700 text-cyber-pink">{activeSynergy.moduleB}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleOpenSynergyCode}
                  className="bg-black/80 hover:bg-gray-900 border border-cyber-neon text-cyber-neon hover:text-white font-mono text-[11px] py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" /> VER CÓDIGO
                </button>
                <button 
                  onClick={handleNotifyTeams}
                  className="bg-cyber-pink hover:bg-pink-600 text-black font-bold font-mono text-[11px] py-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {synergyNotified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  {synergyNotified ? 'NOTIFICADO' : 'NOTIFICAR'}
                </button>
              </div>

              {synergyNotified && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center text-[10px] font-mono text-cyber-green bg-cyber-green/10 border border-cyber-green/30 py-1 rounded"
                >
                  ✓ Notificación enviada a terminales de los equipos
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* LIVE AUDIT STREAM FEED */}
          <div className="glass-panel p-4 rounded-xl flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
              <h3 className="font-orbitron font-bold text-xs text-cyber-neon flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" /> FEED DE COMMITS AUDITADOS
              </h3>
              <span className="text-[10px] font-mono text-gray-500">Auto-Evaluación</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-grow font-mono text-xs">
              <AnimatePresence>
                {liveFeed.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/50 border border-gray-800 hover:border-gray-700 p-2.5 rounded transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-white">{item.teamId}</span>
                      <span className="text-cyber-green font-bold bg-cyber-green/10 px-1.5 py-0.5 rounded border border-cyber-green/30">
                        +{item.scoreDelta} PTS
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mb-1">📄 {item.file}</p>
                    <p className="text-[10px] text-gray-300 italic">{item.analysis}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* MIDDLE/RIGHT COLUMN: Leaderboard */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-orbitron font-bold text-cyber-neon flex items-center gap-2">
                <GitCommit className="w-5 h-5" /> LIVE LEADERBOARD
              </h2>
              <p className="font-mono text-xs text-gray-500 mt-0.5">Ranking reordenado dinámicamente según commits y calidad de IA</p>
            </div>
            <span className="text-xs font-mono bg-cyber-green/20 text-cyber-green px-3 py-1 rounded border border-cyber-green/50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></span>
              AUDITORÍA IA ACTIVA
            </span>
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
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    key={team.name} 
                    className={`border-b border-gray-800/50 transition-colors ${
                      lastUpdatedTeam === team.name ? 'bg-cyber-neon/15 border-cyber-neon' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-4">
                      <span className={`font-bold ${index === 0 ? 'text-cyber-yellow' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        0{index + 1}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-white flex items-center gap-2">
                      {team.name}
                      {lastUpdatedTeam === team.name && (
                        <span className="text-[10px] font-mono text-cyber-neon bg-cyber-neon/20 px-1 rounded animate-pulse">
                          +COMMIT
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[120px] h-2.5 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${team.score > 90 ? 'bg-cyber-neon' : team.score > 80 ? 'bg-cyber-yellow' : 'bg-gray-500'}`} 
                            animate={{ width: `${team.score}%` }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                        </div>
                        <span className="text-gray-200 font-bold">{team.score}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{team.commits}</td>
                    <td className="py-4 text-gray-400">{team.tokens}</td>
                    <td className="py-4">
                      <span className={`text-xs px-2.5 py-1 rounded border font-bold ${
                        team.status === 'OPTIMAL' ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/40' :
                        team.status === 'WARNING' ? 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/40' :
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
      <div className="mt-8 glass-panel p-4 rounded-xl z-10 flex flex-col h-[230px]">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyber-neon" />
            <h3 className="font-orbitron font-bold text-xs md:text-sm text-cyber-neon">
              INTERFAZ DE CO-PRESENTACIÓN (PODCAST MODE)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Comandos de voz: "Pausa simulación" / "Reanuda simulación" / "Dame un resumen"
          </span>
        </div>
        
        <div className="flex-grow overflow-y-auto font-mono text-sm space-y-3 mb-3 pr-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'host' ? 'items-end' : 'items-start'}`}>
              <span className={`text-[10px] mb-1 ${msg.role === 'host' ? 'text-gray-500' : 'text-cyber-pink font-bold'}`}>
                {msg.role === 'host' ? 'HOST (TÚ)' : 'A.U.R.A.'}
              </span>
              <div className={`px-4 py-2 rounded-lg max-w-[85%] ${
                msg.role === 'host' 
                  ? 'bg-gray-800/90 border border-gray-700 text-gray-200' 
                  : 'bg-cyber-pink/10 border border-cyber-pink/40 text-cyber-pink shadow-[0_0_15px_rgba(255,0,60,0.15)]'
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
              className="w-full bg-black/90 border border-gray-700 rounded px-4 py-2.5 font-mono text-xs md:text-sm text-white focus:outline-none focus:border-cyber-neon transition-colors pr-12"
            />
            <button 
              type="button" 
              onClick={startListening} 
              className="absolute right-2 top-1.5 p-1.5 hover:bg-gray-800 rounded transition-colors group cursor-pointer"
              title="Dictar por Voz"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-cyber-pink animate-pulse' : 'text-gray-500 group-hover:text-cyber-neon'}`} />
            </button>
          </div>
          <button 
            type="submit"
            className="bg-cyber-neon text-black font-bold font-mono text-xs px-5 rounded hover:bg-white transition-colors cursor-pointer"
          >
            ENVIAR
          </button>
        </form>
      </div>

    </div>
  );
}
