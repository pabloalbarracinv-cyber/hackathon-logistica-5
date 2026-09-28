import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, FileText, Share2 } from 'lucide-react';
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
          <div className="mt-4 space-y-2">
            <h4 className="text-cyber-neon font-bold text-lg">{data.titulo}</h4>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              {data.puntos.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        );
      case 'diagrama':
        return (
          <div className="mt-4 p-4 bg-black/50 border border-gray-700 rounded font-mono text-xs text-cyber-green overflow-x-auto">
            <pre>{data.mermaid}</pre>
            <p className="text-gray-500 mt-2 text-[10px] italic">*Renderizado Mermaid nativo pendiente de librería*</p>
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
        className="absolute inset-x-8 top-24 bottom-24 z-50 glass-panel rounded-xl border-2 border-cyber-pink shadow-[0_0_50px_rgba(255,0,60,0.3)] flex flex-col overflow-hidden backdrop-blur-xl bg-black/80"
      >
        <div className="flex justify-between items-center p-4 border-b border-cyber-pink/30 bg-cyber-pink/10">
          <div className="flex items-center gap-2 text-cyber-pink font-orbitron font-bold">
            <Share2 className="w-5 h-5" />
            A.U.R.A. VISUAL CANVA
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 flex-grow overflow-y-auto">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
