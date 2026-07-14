import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  Database, 
  ShieldAlert, 
  FileCheck2, 
  Users, 
  ArrowUpRight, 
  Clock, 
  Download,
  Lock,
  DollarSign,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import SystemLogo from './SystemLogo';

interface TestDrivePageProps {
  onBackToLanding: () => void;
  onGoToLoginPrefilled: (user: string, pass: string) => void;
  onAutoLogin: (user: string, pass: string) => void;
}

export default function TestDrivePage({ onBackToLanding, onGoToLoginPrefilled, onAutoLogin }: TestDrivePageProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Interactive Simulation States
  const [simulatedService, setSimulatedService] = useState({
    client: 'Geraldo Antunes Sobrinho',
    vehicle: 'TOYOTA COROLLA (GAZ-9H88)',
    selectedSub: 'TRANSFERÊNCIA',
    totalReceived: 650,
    costOut: 380,
  });

  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [tableConfig, setTableConfig] = useState([
    { name: 'Placa Mercosul', val: 280, cost: 222.22 },
    { name: 'Transferência de Propriedade', val: 650, cost: 380 },
    { name: 'Licenciamento / IPVA', val: 180, cost: 0 },
    { name: 'Emissão ATPV-e', val: 80, cost: 15 },
  ]);

  const [activeConfigIndex, setActiveConfigIndex] = useState(1);

  const runServiceSimulation = () => {
    if (simulationStatus !== 'idle') return;
    setSimulationStatus('running');
    setTimeout(() => {
      setSimulationStatus('completed');
    }, 1500);
  };

  const resetSimulation = () => {
    setSimulationStatus('idle');
  };

  const stepsData = [
    {
      title: "Lançamento Casado (Entrada vs Repasse)",
      icon: <Coins className="text-emerald-400" size={18} />,
      badge: "Passo 1",
      description: "A grande inovação do ConsulDesp: ao lançar um serviço, você define o valor recebido e o custo de repasse (taxa Detran ou fornecedor). O sistema calcula instantaneamente o lucro líquido real retido do seu escritório, separando o dinheiro que é seu do dinheiro de taxas.",
    },
    {
      title: "Configuração de Valores de Tabela",
      icon: <FileCheck2 className="text-teal-400" size={18} />,
      badge: "Passo 2",
      description: "Cadastre suas subcategorias com valores padrão de tabela para honorários, placas e repasses. Durante o lançamento de um serviço, basta selecionar a subcategoria para preencher os valores automaticamente em um único clique, economizando precioso tempo de digitação diária.",
    },
    {
      title: "Painel de Rentabilidade Real",
      icon: <LayoutDashboard className="text-blue-400" size={18} />,
      badge: "Passo 3",
      description: "Chega de somar papéis no final do dia. O painel central exibe em tempo real o total bruto de entradas, as saídas de custo operacional e o lucro líquido real limpo por operador. Gráficos de pizza dividem as receitas por tipo e categoria automaticamente.",
    },
    {
      title: "Auto-Backup Silencioso diário",
      icon: <Clock className="text-amber-400" size={18} />,
      badge: "Passo 4",
      description: "Segurança total sem depender da sua memória. Todos os dias, pontualmente às 16:35, o ConsulDesp realiza de forma automatizada o auto-backup silencioso gravando e substituindo o arquivo JSON local de forma transparente, além da sincronização em nuvem segura.",
    }
  ];

  const handleNextStep = () => {
    if (activeStep < stepsData.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-x-hidden relative flex flex-col justify-between">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0F1115]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SystemLogo size={24} className="border-none rounded" />
            <span className="text-sm font-black font-mono tracking-wider text-white">CONSULDESP</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
              Simulador Interativo
            </span>
          </div>

          <button
            onClick={onBackToLanding}
            className="px-4 py-2 rounded-xl bg-[#161B22] hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <ArrowLeft size={12} className="text-emerald-400" />
            <span>Voltar ao Site</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 flex-1 items-start">
        
        {/* Left Column: Title & Guide Info */}
        <div className="lg:col-span-5 space-y-8 text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
              <Sparkles size={10} />
              <span>Experimentar Sem Instalar</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight">
              Test-Drive Interativo <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                ConsulDesp Financeiro
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Descubra como nossa plataforma foi projetada exclusivamente para as necessidades financeiras de despachantes. Siga o passo a passo guiado abaixo e ative seu login de testes no final da página!
            </p>
          </div>

          {/* Stepper Timeline UI */}
          <div className="space-y-3.5 border-l border-slate-800/80 pl-4 py-1">
            {stepsData.map((step, index) => {
              const isActive = index === activeStep;
              const isPast = index < activeStep;
              return (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className="w-full text-left focus:outline-hidden block group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] font-bold transition-all shrink-0 ${
                      isActive 
                        ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10' 
                        : isPast 
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-500'
                        : 'bg-[#161B22] border-slate-800 text-slate-500 group-hover:text-slate-400 group-hover:border-slate-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wide transition-all ${
                        isActive ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {step.title}
                      </h4>
                      {isActive && (
                        <p className="text-[11px] text-slate-400 leading-normal mt-1 block max-w-sm">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons for step */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              className="px-4 py-2.5 rounded-xl bg-[#161B22] hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-[#161B22] border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
            >
              Anterior
            </button>
            <button
              onClick={handleNextStep}
              disabled={activeStep === stepsData.length - 1}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:hover:bg-slate-800 border border-slate-750 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span>Próximo</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Simulator Area */}
        <div className="lg:col-span-7 bg-[#161B22]/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col min-h-[440px] justify-between backdrop-blur-md">
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#0F1115] border border-slate-800 text-[8px] font-mono text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest font-black flex items-center gap-1.5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulador de Telas
          </div>

          <div className="flex-1 flex flex-col justify-between">
            {/* Simulation Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4 select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                <span className="text-[9px] font-mono text-slate-500 ml-2">consuldesp-saas / test-drive / screen_{activeStep + 1}</span>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {stepsData[activeStep].badge}
              </span>
            </div>

            {/* Simulated Screen Contents based on activeStep */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                
                {/* SCREEN 1: Lançamento Casado */}
                {activeStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850/80">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Novo Serviço (Operacional)</span>
                        <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">REPASSE CASADO</span>
                      </div>

                      {/* Simulador Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-slate-500 block">Cliente Final</span>
                          <div className="bg-[#161B22] border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-200">
                            {simulatedService.client}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-slate-500 block">Identificação Veículo</span>
                          <div className="bg-[#161B22] border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300">
                            {simulatedService.vehicle}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 bg-[#161B22] border border-slate-800 p-2.5 rounded-xl">
                          <span className="text-[8px] font-bold text-slate-500 block uppercase">Categoria</span>
                          <span className="text-[10px] font-black text-emerald-400 block mt-0.5">{simulatedService.selectedSub}</span>
                        </div>
                        <div className="space-y-1 bg-[#161B22] border border-slate-800 p-2.5 rounded-xl">
                          <span className="text-[8px] font-bold text-slate-500 block uppercase">Valor Pago</span>
                          <span className="text-[10px] font-mono font-bold text-white block mt-0.5">R$ {simulatedService.totalReceived.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 bg-rose-950/10 border border-rose-900/20 p-2.5 rounded-xl">
                          <span className="text-[8px] font-bold text-rose-400 block uppercase">Custo Repasse</span>
                          <span className="text-[10px] font-mono font-bold text-rose-400 block mt-0.5">R$ {simulatedService.costOut.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Conciliator Engine Output simulation */}
                      <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[7.5px] font-bold text-emerald-400 uppercase tracking-widest block">Lucro Líquido Retido (Honorário do Despachante)</span>
                          <span className="text-sm font-mono font-black text-emerald-400 mt-1 block">R$ {(simulatedService.totalReceived - simulatedService.costOut).toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-bold text-slate-500 block uppercase">Margem Escritório</span>
                          <span className="text-[10px] font-bold text-white font-mono block mt-0.5">41.5%</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={runServiceSimulation}
                          disabled={simulationStatus !== 'idle'}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-[10px] uppercase tracking-wide cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          {simulationStatus === 'idle' ? (
                            <>
                              <Play size={10} />
                              <span>Simular Lançamento de Teste</span>
                            </>
                          ) : simulationStatus === 'running' ? (
                            <span>Calculando Conciliação de Caixa...</span>
                          ) : (
                            <span className="text-emerald-300 font-bold flex items-center gap-1">✓ Lançado e Separado no Caixa!</span>
                          )}
                        </button>
                        {simulationStatus === 'completed' && (
                          <button
                            onClick={resetSimulation}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase transition-all"
                          >
                            Reiniciar
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SCREEN 2: Configuração de Tabela */}
                {activeStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-850/80">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Tabela de Subcategorias Pré-Definidas</span>
                        <span className="text-[8.5px] text-emerald-400 font-mono font-semibold">1 Clique na Digitação</span>
                      </div>

                      <div className="space-y-2">
                        {tableConfig.map((item, index) => {
                          const isActive = index === activeConfigIndex;
                          return (
                            <button
                              key={index}
                              onClick={() => setActiveConfigIndex(index)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-950/15 border-emerald-500/40 shadow-inner' 
                                  : 'bg-[#161B22]/60 border-slate-850 hover:border-slate-800 hover:bg-[#161B22]'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <p className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                                  {item.name}
                                </p>
                                <p className="text-[8px] text-slate-500 uppercase tracking-wider">Tipo: Receita Operacional</p>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <span className="text-[7px] text-slate-500 uppercase block">Cobrado</span>
                                  <span className="text-[10px] font-mono font-extrabold text-white">R$ {item.val.toFixed(2)}</span>
                                </div>
                                {item.cost > 0 && (
                                  <div>
                                    <span className="text-[7px] text-rose-500 uppercase block">Custo Repasse</span>
                                    <span className="text-[10px] font-mono font-extrabold text-rose-400">R$ {item.cost.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[8.5px] text-slate-500 italic text-center select-none">
                        💡 No sistema, ao selecionar "<strong className="text-emerald-500">{tableConfig[activeConfigIndex].name}</strong>" em qualquer serviço, os valores de <strong>R$ {tableConfig[activeConfigIndex].val.toFixed(2)}</strong> e repasses são preenchidos na hora!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SCREEN 3: Painel de Resultados */}
                {activeStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-850/80 pb-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Indicadores Consolidados de Caixa</span>
                        <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">TEMPO REAL</span>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#161B22] border border-slate-850 p-2.5 rounded-xl">
                          <span className="text-[7.5px] text-slate-500 font-bold block uppercase">Entradas (Bruto)</span>
                          <span className="text-[11px] font-black text-emerald-400 font-mono block mt-1">R$ 54.380,00</span>
                        </div>
                        <div className="bg-[#161B22] border border-slate-850 p-2.5 rounded-xl">
                          <span className="text-[7.5px] text-slate-500 font-bold block uppercase">Saídas (Repasses)</span>
                          <span className="text-[11px] font-black text-rose-400 font-mono block mt-1">R$ 41.250,00</span>
                        </div>
                        <div className="bg-emerald-950/10 border border-emerald-900/30 p-2.5 rounded-xl">
                          <span className="text-[7.5px] text-emerald-400 font-bold block uppercase">LUCRO REAL LIMPO</span>
                          <span className="text-[11px] font-black text-white font-mono block mt-1">R$ 13.130,00</span>
                        </div>
                      </div>

                      {/* Simulated Chart Container */}
                      <div className="bg-[#161B22]/50 border border-slate-850 p-3 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-400">PARTICIPAÇÃO DE SERVIÇOS NO FATURAMENTO</span>
                          <span className="text-emerald-400 font-mono">100% CONCILIADO</span>
                        </div>
                        
                        {/* Interactive Simulated Bar Charts */}
                        <div className="space-y-2 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-400">
                              <span>TRANSFERÊNCIA DE VEÍCULO</span>
                              <span className="font-mono">R$ 29.250,00 (53.8%)</span>
                            </div>
                            <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '53.8%' }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-400">
                              <span>EMPLACAMENTO MERCOSUL</span>
                              <span className="font-mono">R$ 18.130,00 (33.3%)</span>
                            </div>
                            <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '33.3%' }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-400">
                              <span>LICENCIAMENTO & OUTROS</span>
                              <span className="font-mono">R$ 7.000,00 (12.9%)</span>
                            </div>
                            <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full rounded-full" style={{ width: '12.9%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* SCREEN 4: Auto-Backup */}
                {activeStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full space-y-4 text-left"
                  >
                    <div className="bg-[#0F1115] border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-850/80 pb-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Cronômetro de Auto-Backup Local</span>
                        <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">ROTINA DIÁRIA</span>
                      </div>

                      <div className="p-4 bg-amber-950/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                          <Clock size={18} className="animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-[10px] font-extrabold uppercase text-white tracking-wider">Disparador Diário às 16:35</p>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            O sistema está configurado para sobrescrever seu arquivo físico de backup local ou gerar o download portátil de segurança automaticamente ao bater as 16:35 no relógio do seu navegador.
                          </p>
                        </div>
                      </div>

                      <div className="border border-slate-850 bg-[#161B22]/50 p-3 rounded-xl space-y-2 text-center">
                        <span className="text-[7.5px] font-black uppercase text-slate-500 block">Formato Portátil dos seus Dados</span>
                        <div className="flex items-center justify-center gap-2 text-emerald-400 bg-slate-900 border border-slate-850 p-2 rounded-lg font-mono text-[9px] select-all">
                          <Database size={11} />
                          <span>consuldesp_autobackup_2026-07-14.json</span>
                        </div>
                        <p className="text-[8px] text-slate-500 leading-normal">
                          Arquivo JSON portátil e autônomo. Você pode reimportá-lo em segundos caso queira transferir dados ou trocar de computador.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Prompt banner inside mock */}
          <div className="bg-[#0F1115] border border-slate-850/80 p-3 rounded-xl mt-4 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold uppercase">👉 Pronto para ver ao vivo com seus dados?</span>
            <span className="text-emerald-400 font-bold font-mono">Use o acesso de testes abaixo!</span>
          </div>
        </div>

      </main>

      {/* Bottom Section: Credentials & Access Action */}
      <section className="bg-[#161B22]/60 border-t border-slate-800/80 py-12 lg:py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#0F1115] border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-2xl shadow-emerald-950/10">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none"></div>

            <div className="space-y-2 max-w-2xl mx-auto">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Ambiente de Demonstração Aberto</span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                Seu Usuário de Testes está Pronto!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Utilize as credenciais públicas padrão abaixo para acessar a área restrita do sistema e testar todos os recursos com total autonomia e liberdade:
              </p>
            </div>

            {/* Credentials Card */}
            <div className="max-w-xs mx-auto bg-[#161B22] border border-slate-800 rounded-2xl p-5 space-y-3 text-left relative shadow-lg">
              <div className="absolute top-3 right-3 text-emerald-400 animate-pulse">
                <Lock size={12} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Nome de Usuário</span>
                <div className="bg-[#0F1115] border border-slate-850 px-3 py-2 rounded-xl text-xs font-mono font-black text-white flex justify-between items-center select-all">
                  <span>user</span>
                  <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-sans uppercase">Copiar</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Senha do Sistema</span>
                <div className="bg-[#0F1115] border border-slate-850 px-3 py-2 rounded-xl text-xs font-mono font-black text-white flex justify-between items-center select-all">
                  <span>teste</span>
                  <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-sans uppercase">Copiar</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto pt-4">
              
              {/* Auto Login Button */}
              <button
                onClick={() => onAutoLogin('user', 'teste')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Play size={12} fill="currentColor" />
                <span>Acesso Auto-Login</span>
              </button>

              {/* Prefilled Manual Login Button */}
              <button
                onClick={() => onGoToLoginPrefilled('user', 'teste')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#161B22] hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Ir para Login Manual</span>
                <ArrowRight size={12} />
              </button>

            </div>

            <p className="text-[9px] text-slate-500 italic block">
              Nota: Este ambiente de demonstração é local e portável. Seus lançamentos de teste serão salvos de forma segura no navegador.
            </p>

          </div>

        </div>
      </section>

    </div>
  );
}
