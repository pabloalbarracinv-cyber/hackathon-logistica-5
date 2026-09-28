import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Code2, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AuraCanva({ data, onClose }) {
  if (!data) return null;

  const renderContent = () => {
    switch (data.tipo) {
      case 'grafica':
        return (
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="etiqueta" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ff003c' }} />
                <Bar dataKey="valor" fill="#ff003c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'resumen':
        return (
          <div className="mt-4 space-y-3">
            <h4 className="text-cyber-neon font-bold text-lg font-orbitron">{data.titulo}</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-sm">
              {data.puntos.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 bg-black/40 p-2.5 rounded border border-gray-800">
                  <span className="text-cyber-pink font-bold">❯</span> {pt}
                </li>
              ))}
            </ul>
          </div>
        );
      case 'sinergia_codigo':
        return (
          <div className="mt-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-cyber-pink/10 border border-cyber-pink/40 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="bg-cyber-pink text-black font-bold font-mono text-xs px-2.5 py-1 rounded">MATCH DETECTADO</span>
                <span className="font-orbitron font-bold text-white text-sm">{data.teamA} ↔ {data.teamB}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyber-neon">
                <Sparkles className="w-4 h-4 animate-spin" />
                A.U.R.A. AI COMPATIBILITY: 96.4%
              </div>
            </div>

            <p className="font-mono text-sm text-gray-300 bg-black/50 p-3 rounded border border-gray-800">
              {data.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/80 border border-gray-700 rounded-lg p-3 font-mono text-xs">
                <div className="flex items-center justify-between mb-2 text-cyber-neon border-b border-gray-800 pb-1">
                  <span>MÓDULO: {data.moduleA}</span>
                  <span className="text-[10px] text-gray-500">{data.teamA}</span>
                </div>
                <pre className="text-gray-300 overflow-x-auto p-2 bg-black rounded max-h-48 leading-relaxed">
                  {data.codeA || '// Endpoint de exportación de datos'}
                </pre>
              </div>

              <div className="bg-black/80 border border-gray-700 rounded-lg p-3 font-mono text-xs">
                <div className="flex items-center justify-between mb-2 text-cyber-pink border-b border-gray-800 pb-1">
                  <span>MÓDULO: {data.moduleB}</span>
                  <span className="text-[10px] text-gray-500">{data.teamB}</span>
                </div>
                <pre className="text-gray-300 overflow-x-auto p-2 bg-black rounded max-h-48 leading-relaxed">
                  {data.codeB || '// Consumo y validación de API'}
                </pre>
              </div>
            </div>

            <div className="bg-cyber-neon/10 border border-cyber-neon/30 p-3 rounded flex items-center justify-between font-mono text-xs text-cyber-neon">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyber-yellow" />
                <span>Recomendación AURA: Fusionar a microservicio REST compartido.</span>
              </div>
              <span className="bg-cyber-neon text-black font-bold px-2 py-0.5 rounded text-[10px]">+15 PTS SINERGIA</span>
            </div>
          </div>
        );
      case 'diagrama':
        return (
          <div className="mt-4 p-4 bg-black/50 border border-gray-700 rounded font-mono text-xs text-cyber-green overflow-x-auto">
            <pre>{data.mermaid}</pre>
          </div>
        );
      default:
        return <p className="text-gray-400 mt-4">Formato visual no soportado.</p>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="absolute inset-x-4 md:inset-x-8 top-16 bottom-16 z-50 glass-panel rounded-xl border-2 border-cyber-pink shadow-[0_0_60px_rgba(255,0,60,0.35)] flex flex-col overflow-hidden backdrop-blur-2xl bg-black/90"
      >
        <div className="flex justify-between items-center p-4 border-b border-cyber-pink/30 bg-cyber-pink/10">
          <div className="flex items-center gap-2 text-cyber-pink font-orbitron font-bold text-sm tracking-wider">
            <Share2 className="w-5 h-5" />
            A.U.R.A. VISUAL CANVA
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 md:p-8 flex-grow overflow-y-auto">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
