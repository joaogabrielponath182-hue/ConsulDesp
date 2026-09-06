import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Car, 
  User, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  FileCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { DetranProcess, Service, Expense, UserSession, ProcessMessage, ProcessStage } from '../types';

interface DetranProcessesProps {
  processes: DetranProcess[];
  services: Service[];
  expenses: Expense[];
  currentSession: UserSession | null;
  onSaveProcess: (process: DetranProcess) => void;
  onDeleteProcess: (id: string) => void;
  onSyncWithServices: () => void;
}

export default function DetranProcesses({
  processes,
  services,
  expenses,
  currentSession,
  onSaveProcess,
  onDeleteProcess,
  onSyncWithServices
}: DetranProcessesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'ACTIVE' | ProcessStage>('ACTIVE');
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState<{ [processId: string]: string }>({});
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);

  // New process manual state
  const [newClient, setNewClient] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newDescription, setNewDescription] = useState('TRANSF ');
  const [newFeePayer, setNewFeePayer] = useState<'ESCRITORIO' | 'CLIENTE'>('ESCRITORIO');
  const [newRequiresPlate, setNewRequiresPlate] = useState(false);
  const [newRequiresReceipt, setNewRequiresReceipt] = useState(false);

  // Clean plate helper
  const cleanPlate = (p?: string) => (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Detect expense matches for a plate
  const getPlateExpenses = useMemo(() => {
    return (plate: string) => {
      const cPlate = cleanPlate(plate);
      if (!cPlate) return { inspection: null, fee: null, plate: null };

      let inspectionExp: Expense | null = null;
      let feeExp: Expense | null = null;
      let plateExp: Expense | null = null;

      for (const exp of expenses) {
        const expPlate = cleanPlate(exp.plate);
        // Match either plate attribute or plate mentioned in description
        const descMatch = cleanPlate(exp.description).includes(cPlate);
        if (expPlate === cPlate || descMatch) {
          const catAndDesc = `${exp.category} ${exp.description}`.toUpperCase();
          if (catAndDesc.includes('VISTORIA') && !inspectionExp) {
            inspectionExp = exp;
          }
          if ((catAndDesc.includes('TAXA') || catAndDesc.includes('DETRAN')) && !feeExp) {
            feeExp = exp;
          }
          if (catAndDesc.includes('PLACA') && !plateExp) {
            plateExp = exp;
          }
        }
      }

      return {
        inspection: inspectionExp,
        fee: feeExp,
        plate: plateExp
      };
    };
  }, [expenses]);

  // Compute active stage dynamically or update
  const calculateProcessStage = (p: DetranProcess): ProcessStage => {
    if (p.deliveredToClient) return 'CONCLUIDO';
    if (p.crlvIssued) return 'PRONTO_ENTREGA';
    if (p.detranApproved) return 'LIBERADO';
    if (p.protocolNumber && p.protocolNumber.trim().length > 0) return 'AGUARDANDO_DETRAN';
    if (p.inspectionDone) return 'VISTORIA';
    return 'ENTRADA';
  };

  // Filter processes (only from 01/09/2026 onwards)
  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
      // Must only start on services from 01/09/2026 onwards
      const dateStr = p.createdAt ? p.createdAt.substring(0, 10) : '';
      if (dateStr && dateStr < '2026-09-01') return false;

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        !term ||
        p.client.toLowerCase().includes(term) ||
        p.plate.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.protocolNumber && p.protocolNumber.toLowerCase().includes(term));

      if (!matchSearch) return false;

      const currentStage = calculateProcessStage(p);

      if (stageFilter === 'ALL') return true;
      if (stageFilter === 'ACTIVE') return currentStage !== 'CONCLUIDO';
      return currentStage === stageFilter;
    });
  }, [processes, searchTerm, stageFilter]);

  // Counts for tabs (only from 01/09/2026 onwards)
  const counts = useMemo(() => {
    const validProcesses = processes.filter(p => {
      const dateStr = p.createdAt ? p.createdAt.substring(0, 10) : '';
      return !dateStr || dateStr >= '2026-09-01';
    });

    let total = validProcesses.length;
    let active = 0;
    let entrada = 0;
    let vistoria = 0;
    let aguardandoDetran = 0;
    let liberado = 0;
    let prontoEntrega = 0;
    let concluido = 0;

    validProcesses.forEach(p => {
      const st = calculateProcessStage(p);
      if (st !== 'CONCLUIDO') active++;
      if (st === 'ENTRADA') entrada++;
      if (st === 'VISTORIA') vistoria++;
      if (st === 'AGUARDANDO_DETRAN') aguardandoDetran++;
      if (st === 'LIBERADO') liberado++;
      if (st === 'PRONTO_ENTREGA') prontoEntrega++;
      if (st === 'CONCLUIDO') concluido++;
    });

    return { total, active, entrada, vistoria, aguardandoDetran, liberado, prontoEntrega, concluido };
  }, [processes]);

  // Send new message in chat
  const handleSendMessage = (processId: string) => {
    const text = (newMessageText[processId] || '').trim();
    if (!text) return;

    const targetProcess = processes.find(p => p.id === processId);
    if (!targetProcess) return;

    const authorName = currentSession?.fullName || (currentSession?.isAdmin ? 'Administrador' : 'Operador');
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const newMsg: ProcessMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      author: authorName,
      text,
      timestamp: formattedDate
    };

    const updated: DetranProcess = {
      ...targetProcess,
      messages: [...(targetProcess.messages || []), newMsg],
      updatedAt: new Date().toISOString()
    };

    onSaveProcess(updated);
    setNewMessageText(prev => ({ ...prev, [processId]: '' }));
  };

  // Toggle stage step
  const handleToggleStep = (processId: string, stepKey: keyof DetranProcess, value: any) => {
    const targetProcess = processes.find(p => p.id === processId);
    if (!targetProcess) return;

    const updated: DetranProcess = {
      ...targetProcess,
      [stepKey]: value,
      updatedAt: new Date().toISOString()
    };

    // Auto-update stage
    updated.stage = calculateProcessStage(updated);
    onSaveProcess(updated);
  };

  // Quick protocol update
  const handleUpdateProtocol = (processId: string, protocolVal: string) => {
    const targetProcess = processes.find(p => p.id === processId);
    if (!targetProcess) return;

    const updated: DetranProcess = {
      ...targetProcess,
      protocolNumber: protocolVal,
      protocolDate: protocolVal.trim() ? new Date().toLocaleDateString('pt-BR') : undefined,
      updatedAt: new Date().toISOString()
    };
    updated.stage = calculateProcessStage(updated);
    onSaveProcess(updated);
  };

  // Handle Manual Process Creation
  const handleCreateManualProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newPlate.trim()) return;

    const newProc: DetranProcess = {
      id: 'proc-' + Date.now(),
      client: newClient.trim().toUpperCase(),
      plate: newPlate.trim().toUpperCase(),
      description: newDescription.trim().toUpperCase() || 'PROCESSO DETRAN',
      stage: 'ENTRADA',
      inspectionDone: false,
      detranApproved: false,
      feePayer: newFeePayer,
      feePaid: false,
      requiresPlate: newRequiresPlate,
      plateOrdered: false,
      plateInstalled: false,
      requiresReceiptCollection: newRequiresReceipt,
      receiptCollected: false,
      crlvIssued: false,
      deliveredToClient: false,
      messages: [
        {
          id: 'msg-init-' + Date.now(),
          author: currentSession?.fullName || 'Sistema',
          text: 'Processo aberto no sistema.',
          timestamp: `${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operator: currentSession?.fullName || 'admin'
    };

    onSaveProcess(newProc);
    setIsNewProcessModalOpen(false);
    setNewClient('');
    setNewPlate('');
    setNewDescription('TRANSF ');
    setNewFeePayer('ESCRITORIO');
    setNewRequiresPlate(false);
    setNewRequiresReceipt(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-[#11141A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FolderKanban size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Esteira de Processos DETRAN
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {counts.active} em andamento
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhamento integrado de vistorias, protocolos, taxas, placas e recados internos em tempo real.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSyncWithServices}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Verifica se há novos serviços com HONORÁRIO para criar os processos automaticamente"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Sincronizar Serviços</span>
            </button>

            <button
              onClick={() => setIsNewProcessModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/20"
            >
              <Plus size={15} />
              <span>Novo Processo</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setStageFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span>Em Andamento</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.active}</span>
          </button>

          <button
            onClick={() => setStageFilter('ENTRADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'ENTRADA'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Balcão / Entrada</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.entrada}</span>
          </button>

          <button
            onClick={() => setStageFilter('VISTORIA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'VISTORIA'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>Vistoria</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.vistoria}</span>
          </button>

          <button
            onClick={() => setStageFilter('AGUARDANDO_DETRAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'AGUARDANDO_DETRAN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Em Análise DETRAN</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.aguardandoDetran}</span>
          </button>

          <button
            onClick={() => setStageFilter('LIBERADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'LIBERADO'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Liberado (Taxa / Placa)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.liberado}</span>
          </button>

          <button
            onClick={() => setStageFilter('PRONTO_ENTREGA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'PRONTO_ENTREGA'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Pronto p/ Entrega</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.prontoEntrega}</span>
          </button>

          <button
            onClick={() => setStageFilter('CONCLUIDO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'CONCLUIDO'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span>Concluídos / Arquivo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.concluido}</span>
          </button>

          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'ALL'
                ? 'bg-slate-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.total}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, cliente, descrição (ex: SAVEIRO, 1º EMP) ou protocolo..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0D1015] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Process List */}
      {filteredProcesses.length === 0 ? (
        <div className="bg-[#11141A] border border-slate-800 rounded-2xl p-12 text-center">
          <Car size={40} className="mx-auto text-slate-600 mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nenhum processo encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm 
              ? 'Nenhum veículo corresponde à sua busca atual.' 
              : 'A esteira exibe processos para serviços a partir de 01/09/2026. Assim que o operador lançar serviços com HONORÁRIO a partir desta data, eles aparecerão aqui automaticamente, ou você pode clicar no botão "+ Novo Processo".'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={onSyncWithServices}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Sincronizar com Serviços</span>
            </button>
            <button
              onClick={() => setIsNewProcessModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Criar Processo Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProcesses.map(proc => {
            const currentStage = calculateProcessStage(proc);
            const plateExpenses = getPlateExpenses(proc.plate);
            const isChatExpanded = expandedChatId === proc.id;
            const messageCount = (proc.messages || []).length;

            // Is First Registration?
            const isFirstReg = 
              proc.description.includes('1º EMP') || 
              proc.description.includes('PRIMEIRO EMP') || 
              proc.description.includes('0KM');

            return (
              <div 
                key={proc.id}
                className="bg-[#11141A] border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all shadow-md"
              >
                {/* Header of Process Card */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/50 via-slate-900/20 to-transparent">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Description & Plate & Client */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Vehicle Plate Badge */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-24 py-1.5 px-2 bg-[#0A0D12] border-2 border-slate-700 rounded-lg shadow-inner">
                        <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest leading-none">BRASIL</span>
                        <span className="text-sm font-black font-mono text-white tracking-wider my-0.5">{proc.plate || 'SEM PLACA'}</span>
                        <span className="text-[8px] font-bold text-slate-500 leading-none">MERCOSUL</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                            {proc.description}
                          </span>
                          {/* Stage Badge */}
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            currentStage === 'CONCLUIDO' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                            currentStage === 'PRONTO_ENTREGA' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 animate-pulse' :
                            currentStage === 'LIBERADO' ? 'bg-purple-950/80 text-purple-300 border-purple-800' :
                            currentStage === 'AGUARDANDO_DETRAN' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' :
                            currentStage === 'VISTORIA' ? 'bg-sky-950/80 text-sky-300 border-sky-800' :
                            'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}>
                            {currentStage === 'CONCLUIDO' && 'Concluído e Entregue'}
                            {currentStage === 'PRONTO_ENTREGA' && '🎉 Pronto para Entrega'}
                            {currentStage === 'LIBERADO' && 'Liberado pelo Detran'}
                            {currentStage === 'AGUARDANDO_DETRAN' && 'Em Análise no Detran'}
                            {currentStage === 'VISTORIA' && 'Aguardando Vistoria'}
                            {currentStage === 'ENTRADA' && 'Entrada / Balcão'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <User size={13} className="text-slate-500" />
                            {proc.client}
                          </span>
                          {proc.operator && (
                            <span className="text-[11px] text-slate-500">
                              Atendido por: <strong className="text-slate-400 font-semibold">{proc.operator}</strong>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            Cadastrado em: {new Date(proc.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Chat Toggle and Delete */}
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={() => setExpandedChatId(isChatExpanded ? null : proc.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          messageCount > 0
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/40'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <MessageSquare size={14} className={messageCount > 0 ? 'text-emerald-400' : ''} />
                        <span>Recados ({messageCount})</span>
                        {isChatExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {currentSession?.isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja remover o processo do veículo ${proc.plate}?`)) {
                              onDeleteProcess(proc.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-all cursor-pointer"
                          title="Remover processo"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workflow Checklist Grid */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Step 1: Vistoria */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.inspectionDone 
                      ? 'bg-emerald-950/15 border-emerald-900/50' 
                      : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">1</span>
                        Vistoria Veicular
                      </span>
                      {plateExpenses.inspection && (
                        <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                          ✓ Gasto R$ {plateExpenses.inspection.value.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3">
                      {proc.inspectionDone ? 'Vistoria aprovada e cadastrada.' : 'Aguardando vistoria ou laudo ECV.'}
                    </p>

                    <button
                      onClick={() => handleToggleStep(proc.id, 'inspectionDone', !proc.inspectionDone)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        proc.inspectionDone
                          ? 'bg-emerald-600/90 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <Check size={14} />
                      <span>{proc.inspectionDone ? 'Vistoria Concluída' : 'Marcar Vistoria Concluída'}</span>
                    </button>
                  </div>

                  {/* Step 2: Protocolo DETRAN */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.detranApproved 
                      ? 'bg-emerald-950/15 border-emerald-900/50' 
                      : proc.protocolNumber?.trim() 
                        ? 'bg-indigo-950/15 border-indigo-900/50' 
                        : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">2</span>
                        Protocolo DETRAN
                      </span>
                      {proc.protocolDate && (
                        <span className="text-[10px] text-slate-400">{proc.protocolDate}</span>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={proc.protocolNumber || ''}
                          onChange={(e) => handleUpdateProtocol(proc.id, e.target.value)}
                          placeholder={isFirstReg ? "Ex: 2026/..." : "36.XXX.XXX"}
                          className="w-full px-2.5 py-1.5 bg-[#0D1015] border border-slate-750 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                        {!isFirstReg && (!proc.protocolNumber || !proc.protocolNumber.startsWith('36.')) && (
                          <button
                            onClick={() => handleUpdateProtocol(proc.id, '36.')}
                            className="px-2 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800 text-indigo-300 rounded-lg text-[10px] font-mono font-bold cursor-pointer shrink-0"
                            title="Preencher prefixo padrão 36."
                          >
                            +36.
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">Detran Liberou?</span>
                        <button
                          onClick={() => handleToggleStep(proc.id, 'detranApproved', !proc.detranApproved)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            proc.detranApproved
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                        >
                          <Check size={12} />
                          <span>{proc.detranApproved ? 'Liberado' : 'Aguardando'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Taxa DETRAN */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.feePaid 
                      ? 'bg-emerald-950/15 border-emerald-900/50' 
                      : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">3</span>
                        Taxa DETRAN
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        proc.feePayer === 'ESCRITORIO'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800/40'
                      }`}>
                        {proc.feePayer === 'ESCRITORIO' ? 'Paga pelo Escritório' : 'Cliente Paga'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-3">
                      {plateExpenses.fee ? (
                        <span className="text-emerald-400 block font-mono text-[10px]">
                          ✓ Gasto detectado: R$ {plateExpenses.fee.value.toFixed(2)}
                        </span>
                      ) : proc.feePayer === 'CLIENTE' ? (
                        <span>Enviar boleto para o cliente pagar.</span>
                      ) : (
                        <span>Pagar taxa após liberação do Detran.</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleStep(proc.id, 'feePaid', !proc.feePaid)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        proc.feePaid
                          ? 'bg-emerald-600/90 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <Check size={14} />
                      <span>{proc.feePaid ? 'Taxa Paga / Compensada' : 'Confirmar Pagamento Taxa'}</span>
                    </button>
                  </div>

                  {/* Step 4: Placa Mercosul (Conditional) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    !proc.requiresPlate 
                      ? 'opacity-60 bg-[#12151C] border-slate-800/60' 
                      : proc.plateInstalled 
                        ? 'bg-emerald-950/15 border-emerald-900/50' 
                        : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">4</span>
                        Placa Mercosul
                      </span>
                      <button
                        onClick={() => handleToggleStep(proc.id, 'requiresPlate', !proc.requiresPlate)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline decoration-dotted"
                        title="Alternar se o serviço precisa ou não de placa"
                      >
                        {proc.requiresPlate ? 'Requer Placa [X]' : 'Não Requer'}
                      </button>
                    </div>

                    {proc.requiresPlate ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Pedido / Estampagem:</span>
                          <button
                            onClick={() => handleToggleStep(proc.id, 'plateOrdered', !proc.plateOrdered)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              proc.plateOrdered ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {proc.plateOrdered ? 'Pedida' : 'Pendente'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Instalação no Carro:</span>
                          <button
                            onClick={() => handleToggleStep(proc.id, 'plateInstalled', !proc.plateInstalled)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              proc.plateInstalled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {proc.plateInstalled ? 'Instalada' : 'Não Instalada'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        Não contratada neste processo.
                      </p>
                    )}
                  </div>

                  {/* Step 5: Recolhimento de Recibo (Conditional) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    !proc.requiresReceiptCollection 
                      ? 'opacity-60 bg-[#12151C] border-slate-800/60' 
                      : proc.receiptCollected 
                        ? 'bg-emerald-950/15 border-emerald-900/50' 
                        : 'bg-amber-950/15 border-amber-900/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">5</span>
                        Recolhimento Recibo
                      </span>
                      <button
                        onClick={() => handleToggleStep(proc.id, 'requiresReceiptCollection', !proc.requiresReceiptCollection)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline decoration-dotted"
                        title="Alternar se o Detran exige recolhimento físico do recibo antigo"
                      >
                        {proc.requiresReceiptCollection ? 'Exige Recibo [X]' : 'Não Exige'}
                      </button>
                    </div>

                    {proc.requiresReceiptCollection ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-amber-300/80">
                          {proc.receiptCollected 
                            ? '✓ Recibo antigo já entregue no Detran.' 
                            : '⚠️ Atenção: entregar recibo antigo no Detran.'}
                        </p>
                        <button
                          onClick={() => handleToggleStep(proc.id, 'receiptCollected', !proc.receiptCollected)}
                          className={`w-full py-1 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            proc.receiptCollected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-600 text-white hover:bg-amber-500'
                          }`}
                        >
                          <Check size={12} />
                          <span>{proc.receiptCollected ? 'Recibo Recolhido' : 'Confirmar Recolhimento'}</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        Processo digital sem exigência de recolhimento físico.
                      </p>
                    )}
                  </div>

                  {/* Step 6: Emissão do Documento & Entrega */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.deliveredToClient 
                      ? 'bg-slate-900 border-slate-750 opacity-80' 
                      : proc.crlvIssued 
                        ? 'bg-emerald-950/25 border-emerald-600 shadow-md' 
                        : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">6</span>
                        CRLV-e & Entrega
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleToggleStep(proc.id, 'crlvIssued', !proc.crlvIssued)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          proc.crlvIssued
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        <FileCheck size={14} />
                        <span>{proc.crlvIssued ? 'CRLV-e Emitido ✓' : 'Emitir CRLV-e'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleStep(proc.id, 'deliveredToClient', !proc.deliveredToClient)}
                        disabled={!proc.crlvIssued}
                        className={`w-full py-1 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          proc.deliveredToClient
                            ? 'bg-slate-700 text-slate-300'
                            : proc.crlvIssued
                              ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60'
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Check size={12} />
                        <span>{proc.deliveredToClient ? 'Entregue ao Cliente (Finalizado)' : 'Entregar ao Cliente'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Internal Chat / Recados Drawer (Expandable) */}
                {isChatExpanded && (
                  <div className="p-4 sm:p-5 bg-[#0D1015] border-t border-slate-800 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <MessageSquare size={14} className="text-emerald-400" />
                        Mural de Recados Internos • {proc.plate}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        Troca de informações entre balcão e retaguarda (sem WhatsApp)
                      </span>
                    </div>

                    {/* Messages Scrollbox */}
                    <div className="max-h-48 overflow-y-auto space-y-2 mb-3 pr-1">
                      {(proc.messages || []).length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">
                          Nenhum recado ainda neste processo. Envie uma mensagem abaixo!
                        </p>
                      ) : (
                        proc.messages.map(msg => {
                          const isCurrentUser = msg.author === currentSession?.fullName;
                          return (
                            <div 
                              key={msg.id}
                              className={`p-2.5 rounded-xl text-xs max-w-xl ${
                                isCurrentUser 
                                  ? 'ml-auto bg-emerald-950/40 border border-emerald-800/40 text-slate-200' 
                                  : 'mr-auto bg-slate-900 border border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4 mb-1 text-[10px]">
                                <strong className={`font-bold ${isCurrentUser ? 'text-emerald-400' : 'text-blue-400'}`}>
                                  {msg.author}
                                </strong>
                                <span className="text-slate-500">{msg.timestamp}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* New message input */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(proc.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newMessageText[proc.id] || ''}
                        onChange={(e) => setNewMessageText(prev => ({ ...prev, [proc.id]: e.target.value }))}
                        placeholder="Escreva um recado rápido (ex: 'Cliente trouxe o laudo', 'Aguardando taxa compensar')..."
                        className="flex-1 px-3.5 py-2 bg-[#161B22] border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!(newMessageText[proc.id] || '').trim()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Send size={13} />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Processo Manual */}
      {isNewProcessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#11141A] border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" />
                Novo Processo DETRAN
              </h3>
              <button
                onClick={() => setIsNewProcessModalOpen(false)}
                className="text-slate-500 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualProcess} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ex: MARCOS DA SILVA"
                  className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC1D23"
                  className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Identificação do Processo (Descrição) *
                </label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {['TRANSF ', '1º EMPLACAMENTO ', 'MUDANÇA CATEGORIA ', 'SUBST PLACAS '].map(at => (
                    <button
                      key={at}
                      type="button"
                      onClick={() => setNewDescription(at)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                    >
                      {at.trim()}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value.toUpperCase())}
                  placeholder="Ex: TRANSF SAVEIRO, 1º EMPLACAMENTO"
                  className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Quem Paga a Taxa?
                  </label>
                  <select
                    value={newFeePayer}
                    onChange={(e) => setNewFeePayer(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ESCRITORIO">Escritório Paga</option>
                    <option value="CLIENTE">Cliente Paga</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Requer Placa?
                  </label>
                  <select
                    value={newRequiresPlate ? 'sim' : 'nao'}
                    onChange={(e) => setNewRequiresPlate(e.target.value === 'sim')}
                    className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="nao">Não Requer</option>
                    <option value="sim">Sim, Requer Placa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newRequiresReceipt}
                    onChange={(e) => setNewRequiresReceipt(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>Exige recolhimento do recibo antigo no Detran</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewProcessModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Criar Processo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
