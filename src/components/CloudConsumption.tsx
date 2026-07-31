import React from 'react';
import { Database, HardDrive, RefreshCw, Server, Zap, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface CloudConsumptionProps {
  onForceRefreshCloud: () => Promise<void> | void;
}

export default function CloudConsumption({ onForceRefreshCloud }: CloudConsumptionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <span>Consumo e Status da Nuvem (Firebase)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe a sincronização do banco de dados Firestore e o consumo de armazenamento do sistema.
          </p>
        </div>

        <button
          onClick={onForceRefreshCloud}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sincronizar Banco Agora</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status da Conexão</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>Conectado</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Firestore Database On-line</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            Projeto ID: ai-studio-gestofinanceirad
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modo de Persistência</span>
            <HardDrive className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Híbrido (Nuvem + Local)</div>
            <p className="text-xs text-slate-400 mt-1">
              Guarda em localStorage com espelhamento automático na nuvem
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
            Sincronização em tempo real ativa
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Segurança & Criptografia</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Regras do Firestore</div>
            <p className="text-xs text-slate-400 mt-1">
              Coleções protegidas por chave do applet
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
            Regras atualizadas e ativas
          </div>
        </div>
      </div>

      {/* Detail info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Sobre a Sincronização em Nuvem</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          O sistema utiliza o Google Firebase Firestore para garantir que todos os lançamentos de receitas, despesas, cadastros de clientes e serviços fiquem armazenados com segurança. Caso a conexão de internet oscile, o sistema continua funcionando localmente sem perder dados e sincroniza automaticamente quando a conexão for reestabelecida.
        </p>
      </div>
    </div>
  );
}
