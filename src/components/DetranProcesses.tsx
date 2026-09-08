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
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  FileCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { DetranProcess, Service, Expense, UserSession, ProcessMessage, ProcessStage } from '../types';
import { plateMatchesSearch } from '../utils/plateMatcher';

export type ProcessFilterTab = 
  | 'ACTIVE' 
  | 'PENDENTE_ABERTURA' 
  | 'EM_ANALISE_DETRAN' 
  | 'PENDENTE_TAXA' 
  | 'PENDENTE_PLACA' 
  | 'FINALIZADO' 
  | 'ALL';

interface DetranProcessesProps {
  processes: DetranProcess[];
  services: Service[];
  expenses: Expense[];
  currentSession: UserSession | null;
  onSaveProcess: (process: DetranProcess) => void;
  onDeleteProcess: (id: string) => void;
  onSyncWithServices: () => void;
}

function DetranProcesses({
  processes = [],
  services = [],
  expenses = [],
  currentSession,
  onSaveProcess,
  onDeleteProcess,
  onSyncWithServices
}: DetranProcessesProps) {
  const safeProcesses = useMemo(() => Array.isArray(processes) ? processes.filter(Boolean) : [], [processes]);
  const safeServices = useMemo(() => Array.isArray(services) ? services.filter(Boolean) : [], [services]);
  const safeExpenses = useMemo(() => Array.isArray(expenses) ? expenses.filter(Boolean) : [], [expenses]);

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<ProcessFilterTab>('ACTIVE');
  const [inspectionFilter, setInspectionFilter] = useState<'ALL' | 'DONE' | 'PENDING'>('ALL');
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState<{ [processId: string]: string }>({});
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Selected Month and Year for finalized processes (monthly view, identical to Painel Geral)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0'); // e.g. "09"
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString(); // e.g. "2026"
  });

  const monthsOptions = useMemo(() => [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ], []);

  const handleSyncClick = () => {
    setIsSyncing(true);
    onSyncWithServices();
    setTimeout(() => setIsSyncing(false), 900);
  };

  // New process manual state
  const [newClient, setNewClient] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newDescription, setNewDescription] = useState('TRANSF ');
  const [newRequiresInspection, setNewRequiresInspection] = useState(true);
  const [newFeePayer, setNewFeePayer] = useState<'ESCRITORIO' | 'CLIENTE'>('ESCRITORIO');
  const [newRequiresPlate, setNewRequiresPlate] = useState(false);
  const [newRequiresReceipt, setNewRequiresReceipt] = useState(false);

  // Helper to detect 1º Emplacamento
  const isFirstPlating = (desc: string = '') => {
    const d = (desc || '').toUpperCase();
    return (
      d.includes('1º EMP') ||
      d.includes('PRIMEIRO EMP') ||
      d.includes('1ºEMP') ||
      d.includes('PRIMEIRO PLAC') ||
      d.includes('1º PLAC') ||
      d.includes('0KM')
    );
  };

  // Clean plate helper
  const cleanPlate = (p?: string) => (p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Safe date formatter helper
  const formatSafeDate = (d?: any) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('pt-BR');
    } catch {
      return String(d);
    }
  };

  // Detect expense matches for a plate - isolates specific item values when expenses are launched together
  // and distinguishes between 2ª via / recibo and transferência when both exist for the same plate
  const getPlateExpenses = useMemo(() => {
    const cache = new Map<string, { inspection: Expense | null; fee: Expense | null; plate: Expense | null }>();

    return (plate: string, processDescription?: string) => {
      const cPlate = cleanPlate(plate);
      if (!cPlate) return { inspection: null, fee: null, plate: null };

      const cacheKey = `${cPlate}__${(processDescription || '').toUpperCase()}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }

      const pDescUpper = (processDescription || '').toUpperCase();
      const isProcRecibo = pDescUpper.includes('2ª VIA') || pDescUpper.includes('2 VIA') || pDescUpper.includes('SEGUNDA VIA') || pDescUpper.includes('RECIBO') || pDescUpper.includes('ATPV');
      const isProcTransf = pDescUpper.includes('TRANSF') || pDescUpper.includes('TRANSFERENCIA') || pDescUpper.includes('TRANSFERÊNCIA');

      let inspectionExp: Expense | null = null;
      let feeExp: Expense | null = null;
      let plateExp: Expense | null = null;

      for (const exp of safeExpenses) {
        if (!exp) continue;
        let isMatch = false;
        let plateValue = Number(exp.value) || 0;
        let plateItems = Array.isArray(exp.items) ? exp.items : undefined;

        if (plateItems && plateItems.length > 0) {
          // Gasto com múltiplos veículos cadastrados juntos (Saída Caixa com itens de placa)
          const matchingItems = plateItems.filter(item => {
            if (!item) return false;
            const itemPlateClean = cleanPlate(item.plate);
            return (
              itemPlateClean === cPlate ||
              plateMatchesSearch(item.plate, cPlate) ||
              plateMatchesSearch(cPlate, item.plate)
            );
          });

          if (matchingItems.length > 0) {
            isMatch = true;
            plateValue = matchingItems.reduce((sum, item) => sum + (Number(item?.value) || 0), 0);
            plateItems = matchingItems;
          }
        } else {
          // Gasto individual
          const expPlate = cleanPlate(exp.plate);
          const descMatch = cleanPlate(exp.description).includes(cPlate);
          const plateMatch = 
            expPlate === cPlate || 
            plateMatchesSearch(exp.plate, cPlate) || 
            plateMatchesSearch(cPlate, exp.plate);

          if (plateMatch || descMatch) {
            isMatch = true;
            plateValue = Number(exp.value) || 0;
          }
        }

        if (isMatch) {
          const catUpper = String(exp.category || '').toUpperCase();
          const descUpper = String(exp.description || '').toUpperCase();
          const catAndDesc = `${catUpper} ${descUpper}`;

          // Se a despesa especificou explicitamente o tipo do processo, respeita o direcionamento
          const isExpRecibo = catAndDesc.includes('2ª VIA') || catAndDesc.includes('2 VIA') || catAndDesc.includes('SEGUNDA VIA') || catAndDesc.includes('RECIBO') || catAndDesc.includes('ATPV');
          const isExpTransf = catAndDesc.includes('TRANSF') || catAndDesc.includes('TRANSFERENCIA') || catAndDesc.includes('TRANSFERÊNCIA');

          // Se a saída menciona especificamente Recibo/2ª via mas este processo é de Transferência, ignora
          if (isExpRecibo && isProcTransf && !isProcRecibo) {
            continue;
          }
          // Se a saída menciona especificamente Transferência mas este processo é de Recibo/2ª via, ignora
          if (isExpTransf && isProcRecibo && !isProcTransf) {
            continue;
          }

          const specificExp: Expense = {
            ...exp,
            value: plateValue,
            plate: plate,
            items: plateItems
          };

          if (catAndDesc.includes('VISTORIA') || catAndDesc.includes('LAUDO') || catAndDesc.includes('ECV')) {
            if (!inspectionExp) {
              inspectionExp = specificExp;
            } else {
              inspectionExp = {
                ...inspectionExp,
                value: (Number(inspectionExp.value) || 0) + (Number(specificExp.value) || 0),
                paymentMethod: inspectionExp.paymentMethod || specificExp.paymentMethod
              };
            }
          }
          if (catAndDesc.includes('TAXA') || catAndDesc.includes('DETRAN') || catAndDesc.includes('DUDA') || catAndDesc.includes('IPVA') || catAndDesc.includes('LICENCIAMENTO')) {
            if (!feeExp) {
              feeExp = specificExp;
            } else {
              feeExp = {
                ...feeExp,
                value: (Number(feeExp.value) || 0) + (Number(specificExp.value) || 0),
                paymentMethod: feeExp.paymentMethod || specificExp.paymentMethod
              };
            }
          }
          if (catAndDesc.includes('PLACA') || catAndDesc.includes('ESTAMPA') || catAndDesc.includes('MERCOSUL')) {
            if (!plateExp) {
              plateExp = specificExp;
            } else {
              plateExp = {
                ...plateExp,
                value: (Number(plateExp.value) || 0) + (Number(specificExp.value) || 0),
                paymentMethod: plateExp.paymentMethod || specificExp.paymentMethod
              };
            }
          }
        }
      }

      const res = {
        inspection: inspectionExp,
        fee: feeExp,
        plate: plateExp
      };
      cache.set(cacheKey, res);
      return res;
    };
  }, [safeExpenses]);

  // Helper to retrieve corresponding service to determine revenue payment method
  const getProcessService = useMemo(() => {
    const serviceById = new Map<string, Service>();
    const serviceByPlate = new Map<string, Service>();

    for (const s of safeServices) {
      if (!s) continue;
      if (s.id) serviceById.set(s.id, s);
      const cp = cleanPlate(s.plate);
      if (cp && !serviceByPlate.has(cp)) {
        serviceByPlate.set(cp, s);
      }
    }

    return (p: DetranProcess) => {
      if (!p) return null;
      if (p.serviceId && serviceById.has(p.serviceId)) {
        return serviceById.get(p.serviceId)!;
      }
      const cPlate = cleanPlate(p.plate);
      if (cPlate && serviceByPlate.has(cPlate)) {
        return serviceByPlate.get(cPlate)!;
      }
      return null;
    };
  }, [safeServices]);

  // Helper to extract YYYY-MM from diverse date formats (ISO, DD/MM/YYYY, Timestamp, etc.)
  const extractYearMonth = (dateStr?: any): string | null => {
    if (!dateStr) return null;
    let str = '';
    if (typeof dateStr === 'string') {
      str = dateStr.trim();
    } else if (dateStr.seconds && typeof dateStr.seconds === 'number') {
      str = new Date(dateStr.seconds * 1000).toISOString();
    } else {
      try {
        const dt = new Date(dateStr);
        if (!isNaN(dt.getTime())) str = dt.toISOString();
        else str = String(dateStr);
      } catch {
        return null;
      }
    }

    if (/^\d{4}-\d{2}/.test(str)) {
      return str.substring(0, 7);
    }
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3 && parts[2]?.length >= 4) {
        const year = parts[2].substring(0, 4);
        const month = parts[1].padStart(2, '0');
        return `${year}-${month}`;
      }
    }
    return null;
  };

  // Helper to identify the month/year of completion for a finalized process
  const getProcessCompletionMonthYear = useMemo(() => {
    return (p: DetranProcess): string => {
      if (!p) return '';
      const crlvYm = extractYearMonth(p.crlvIssuedDate);
      if (crlvYm) return crlvYm;

      const delivYm = extractYearMonth(p.deliveredDate);
      if (delivYm) return delivYm;

      const apprvYm = extractYearMonth(p.detranApprovedDate);
      if (apprvYm) return apprvYm;

      const srv = getProcessService(p);
      const srvYm = extractYearMonth(srv?.date);
      if (srvYm) return srvYm;

      const updYm = extractYearMonth(p.updatedAt);
      if (updYm) return updYm;

      const crtYm = extractYearMonth(p.createdAt);
      if (crtYm) return crtYm;

      return '';
    };
  }, [getProcessService]);

  // Unique years option list for finalized processes
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);

    safeProcesses.forEach(p => {
      if (!p) return;
      const dates = [p.crlvIssuedDate, p.deliveredDate, p.detranApprovedDate, p.updatedAt, p.createdAt];
      dates.forEach(d => {
        const ym = extractYearMonth(d);
        if (ym) {
          yearsSet.add(ym.substring(0, 4));
        }
      });
    });

    return Array.from(yearsSet).sort();
  }, [safeProcesses]);

  // Compute active stage dynamically or update
  const calculateProcessStage = (p?: DetranProcess | null): ProcessStage => {
    if (!p) return 'ENTRADA';
    if (p.crlvIssued || p.deliveredToClient || p.stage === 'FINALIZADO' || p.stage === 'CONCLUIDO') {
      return 'FINALIZADO';
    }
    if (p.detranApproved) return 'LIBERADO';
    const isOpened = Boolean(p.processOpened || (p.protocolNumber && String(p.protocolNumber).trim().length > 0));
    if (isOpened) return 'AGUARDANDO_DETRAN';
    // Vistoria é feita antes do processo aberto; status permanece Recebido (Sem Abertura)
    return 'ENTRADA';
  };

  // Filter processes (only from 01/09/2026 onwards)
  // In-progress processes are shown in full regardless of month.
  // Finalized processes are shown for the selected month/year.
  const filteredProcesses = useMemo(() => {
    const selectedTargetYm = `${selectedYear}-${selectedMonth}`;

    return safeProcesses.filter(p => {
      if (!p) return false;
      // Must only start on services from 01/09/2026 onwards
      const dateStr = p.createdAt && typeof p.createdAt === 'string' ? p.createdAt.substring(0, 10) : '';
      if (dateStr && dateStr < '2026-09-01') return false;

      const term = (searchTerm || '').toLowerCase().trim();
      const clientStr = String(p.client || '').toLowerCase();
      const plateStr = String(p.plate || '').toLowerCase();
      const descStr = String(p.description || '').toLowerCase();
      const protStr = String(p.protocolNumber || '').toLowerCase();

      const matchSearch = 
        !term ||
        clientStr.includes(term) ||
        plateStr.includes(term) ||
        plateMatchesSearch(p.plate, term) ||
        descStr.includes(term) ||
        protStr.includes(term);

      if (!matchSearch) return false;

      const currentStage = calculateProcessStage(p);
      const isFinalized = currentStage === 'FINALIZADO' || currentStage === 'CONCLUIDO' || currentStage === 'PRONTO_ENTREGA';
      const isProcessOpened = Boolean(p.processOpened || (p.protocolNumber && String(p.protocolNumber).trim().length > 0));
      const pExpenses = getPlateExpenses(p.plate, p.description);
      const isFeePaid = Boolean(p.feePaid || pExpenses.fee);
      const isPlateDone = Boolean(p.plateOrdered || p.plateInstalled || pExpenses.plate);
      const isInspDone = Boolean(p.inspectionDone || pExpenses.inspection);

      if (stageFilter === 'ALL') return true;
      if (stageFilter === 'ACTIVE') return !isFinalized;
      if (stageFilter === 'PENDENTE_ABERTURA') {
        if (isFinalized || isProcessOpened) return false;
        if (inspectionFilter === 'DONE') return isInspDone;
        if (inspectionFilter === 'PENDING') return p.requiresInspection !== false && !isInspDone;
        return true;
      }
      if (stageFilter === 'EM_ANALISE_DETRAN') {
        return !isFinalized && isProcessOpened && !p.detranApproved;
      }
      if (stageFilter === 'PENDENTE_TAXA') {
        return !isFinalized && !isFeePaid;
      }
      if (stageFilter === 'PENDENTE_PLACA') {
        return !isFinalized && p.requiresPlate && !isPlateDone;
      }
      if (stageFilter === 'FINALIZADO') {
        if (!isFinalized) return false;
        if (selectedMonth === 'ALL') return true;
        const pYm = getProcessCompletionMonthYear(p);
        return pYm === selectedTargetYm;
      }
      return currentStage === stageFilter;
    });
  }, [safeProcesses, searchTerm, stageFilter, inspectionFilter, getPlateExpenses, selectedMonth, selectedYear, getProcessCompletionMonthYear]);

  // Counts for tabs (only from 01/09/2026 onwards)
  const counts = useMemo(() => {
    const selectedTargetYm = `${selectedYear}-${selectedMonth}`;
    const validProcesses = safeProcesses.filter(p => {
      if (!p) return false;
      const dateStr = p.createdAt && typeof p.createdAt === 'string' ? p.createdAt.substring(0, 10) : '';
      return !dateStr || dateStr >= '2026-09-01';
    });

    let total = validProcesses.length;
    let active = 0;
    let pendenteAbertura = 0;
    let vistoriaPendente = 0;
    let vistoriaConcluida = 0;
    let emAnaliseDetran = 0;
    let pendenteTaxa = 0;
    let pendentePlaca = 0;
    let finalizado = 0;
    let finalizadoMonth = 0;

    validProcesses.forEach(p => {
      const currentStage = calculateProcessStage(p);
      const isFinalized = currentStage === 'FINALIZADO' || currentStage === 'CONCLUIDO' || currentStage === 'PRONTO_ENTREGA';
      const isProcessOpened = Boolean(p.processOpened || (p.protocolNumber && String(p.protocolNumber).trim().length > 0));
      const pExpenses = getPlateExpenses(p.plate, p.description);
      const isFeePaid = Boolean(p.feePaid || pExpenses.fee);
      const isPlateDone = Boolean(p.plateOrdered || p.plateInstalled || pExpenses.plate);
      const isInspDone = Boolean(p.inspectionDone || pExpenses.inspection);

      if (!isFinalized) {
        active++;
        if (!isProcessOpened) {
          pendenteAbertura++;
          if (p.requiresInspection !== false) {
            if (isInspDone) vistoriaConcluida++;
            else vistoriaPendente++;
          }
        }
        if (isProcessOpened && !p.detranApproved) {
          emAnaliseDetran++;
        }
        if (!isFeePaid) {
          pendenteTaxa++;
        }
        if (p.requiresPlate && !isPlateDone) {
          pendentePlaca++;
        }
      } else {
        finalizado++;
        const pYm = getProcessCompletionMonthYear(p);
        if (selectedMonth === 'ALL' || pYm === selectedTargetYm) {
          finalizadoMonth++;
        }
      }
    });

    return { 
      total, 
      active, 
      pendenteAbertura, 
      vistoriaPendente, 
      vistoriaConcluida, 
      emAnaliseDetran, 
      pendenteTaxa, 
      pendentePlaca, 
      finalizado,
      finalizadoMonth
    };
  }, [safeProcesses, getPlateExpenses, selectedMonth, selectedYear, getProcessCompletionMonthYear]);

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

    if (stepKey === 'processOpened') {
      const isOpened = !!value;
      updated.processOpened = isOpened;
      if (isOpened) {
        if (!updated.processOpenedDate) {
          updated.processOpenedDate = new Date().toLocaleDateString('pt-BR');
        }
        if (!updated.protocolDate) {
          updated.protocolDate = new Date().toLocaleDateString('pt-BR');
        }
      } else {
        updated.processOpenedDate = undefined;
        if (!updated.protocolNumber?.trim()) {
          updated.protocolDate = undefined;
        }
      }
    }

    if (stepKey === 'detranApproved') {
      const isApproved = !!value;
      updated.detranApproved = isApproved;
      if (isApproved) {
        if (!updated.detranApprovedDate) {
          updated.detranApprovedDate = new Date().toLocaleDateString('pt-BR');
        }
      } else {
        updated.detranApprovedDate = undefined;
      }
    }

    if (stepKey === 'crlvIssued') {
      const isIssued = !!value;
      updated.crlvIssued = isIssued;
      updated.deliveredToClient = isIssued;
      if (isIssued) {
        updated.crlvIssuedDate = new Date().toISOString();
        updated.deliveredDate = new Date().toISOString();
      } else {
        updated.crlvIssuedDate = undefined;
        updated.deliveredDate = undefined;
      }
    }

    // Auto-update stage
    updated.stage = calculateProcessStage(updated);
    onSaveProcess(updated);
  };

  // Quick protocol update
  const handleUpdateProtocol = (processId: string, protocolVal: string) => {
    const targetProcess = processes.find(p => p.id === processId);
    if (!targetProcess) return;

    const hasProtocol = protocolVal.trim().length > 0;
    const updated: DetranProcess = {
      ...targetProcess,
      protocolNumber: protocolVal,
      protocolDate: hasProtocol ? (targetProcess.protocolDate || new Date().toLocaleDateString('pt-BR')) : targetProcess.protocolDate,
      updatedAt: new Date().toISOString()
    };
    updated.stage = calculateProcessStage(updated);
    onSaveProcess(updated);
  };

  // Handle Manual Process Creation
  const handleCreateManualProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newPlate.trim()) return;

    const isFirstRegModal = isFirstPlating(newDescription);
    const newProc: DetranProcess = {
      id: 'proc-' + Date.now(),
      client: newClient.trim().toUpperCase(),
      plate: newPlate.trim().toUpperCase(),
      description: newDescription.trim().toUpperCase() || 'PROCESSO DETRAN',
      stage: 'ENTRADA',
      requiresInspection: newRequiresInspection,
      inspectionDone: false,
      detranApproved: false,
      feePayer: newFeePayer,
      feePaid: false,
      requiresPlate: newRequiresPlate,
      plateOrdered: false,
      plateInstalled: false,
      // 1º Emplacamento NUNCA exige recolhimento de CRV (veículo 0km sem CRV anterior)
      requiresReceiptCollection: isFirstRegModal ? false : newRequiresReceipt,
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
    setNewRequiresInspection(true);
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
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60"
              title="Verifica novos serviços e atualiza dados corrigidos (placas, taxas e categorias)"
            >
              <RefreshCw size={14} className={`text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Serviços'}</span>
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
            onClick={() => { setStageFilter('ACTIVE'); setInspectionFilter('ALL'); }}
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
            onClick={() => { setStageFilter('PENDENTE_ABERTURA'); setInspectionFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'PENDENTE_ABERTURA'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Pendente Abertura</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.pendenteAbertura}</span>
          </button>

          <button
            onClick={() => { setStageFilter('EM_ANALISE_DETRAN'); setInspectionFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'EM_ANALISE_DETRAN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Em Análise DETRAN</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.emAnaliseDetran}</span>
          </button>

          <button
            onClick={() => { setStageFilter('PENDENTE_TAXA'); setInspectionFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'PENDENTE_TAXA'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Pendente Taxa</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.pendenteTaxa}</span>
          </button>

          <button
            onClick={() => { setStageFilter('PENDENTE_PLACA'); setInspectionFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'PENDENTE_PLACA'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>Pendente Placa</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.pendentePlaca}</span>
          </button>

          <button
            onClick={() => { setStageFilter('FINALIZADO'); setInspectionFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              stageFilter === 'FINALIZADO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#161B22] text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
            }`}
            title={`Concluídos em ${selectedMonth === 'ALL' ? 'todos os meses' : ((monthsOptions.find(m => m.value === selectedMonth)?.label || selectedMonth) + '/' + selectedYear)}: ${counts.finalizadoMonth} (Total histórico: ${counts.finalizado})`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Finalizados</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{counts.finalizadoMonth}</span>
          </button>

          <button
            onClick={() => { setStageFilter('ALL'); setInspectionFilter('ALL'); }}
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

        {/* Seletor Mensal de Competência exclusivo para Processos Concluídos / Finalizados */}
        {stageFilter === 'FINALIZADO' && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/50 bg-[#0E131F]/50 p-3 rounded-xl border border-slate-800/60">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <Calendar size={15} />
                <span className="uppercase tracking-wider text-[11px] text-slate-300">Competência de Conclusão:</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Mês:</span>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 bg-[#161B22] border border-slate-800 rounded-lg text-xs font-bold text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-500 uppercase transition-all"
                  >
                    {monthsOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                    <option value="ALL">Todos os Meses</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Ano:</span>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 bg-[#161B22] border border-slate-800 rounded-lg text-xs font-bold text-slate-200 font-mono cursor-pointer focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-[11px] font-semibold">
                {counts.finalizadoMonth} {counts.finalizadoMonth === 1 ? 'processo concluído' : 'processos concluídos'} em {selectedMonth === 'ALL' ? 'todos os meses' : `${monthsOptions.find(m => m.value === selectedMonth)?.label || selectedMonth}/${selectedYear}`}
              </span>
              {counts.finalizado > counts.finalizadoMonth && (
                <span className="text-[10px] text-slate-500 font-medium">
                  (Histórico total: {counts.finalizado})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sub-filtros de Vistoria quando na etapa Pendente Abertura */}
        {stageFilter === 'PENDENTE_ABERTURA' && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vistoria prévia:
            </span>
            <button
              onClick={() => setInspectionFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                inspectionFilter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-750'
              }`}
            >
              Todos ({counts.pendenteAbertura})
            </button>
            <button
              onClick={() => setInspectionFilter('DONE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inspectionFilter === 'DONE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-750'
              }`}
            >
              <Check size={12} />
              <span>Vistoria Concluída ({counts.vistoriaConcluida})</span>
            </button>
            <button
              onClick={() => setInspectionFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inspectionFilter === 'PENDING'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-750'
              }`}
            >
              <Clock size={12} />
              <span>Aguardando Vistoria ({counts.vistoriaPendente})</span>
            </button>
          </div>
        )}

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
              : stageFilter === 'FINALIZADO'
                ? `Nenhum processo concluído encontrado para ${selectedMonth === 'ALL' ? 'o período' : `${monthsOptions.find(m => m.value === selectedMonth)?.label || selectedMonth}/${selectedYear}`}. Selecione outro mês no filtro acima ou visualize todos os meses.`
                : 'A esteira exibe processos para serviços a partir de 01/09/2026. Assim que o operador lançar serviços com HONORÁRIO a partir desta data, eles aparecerão aqui automaticamente, ou você pode clicar no botão "+ Novo Processo".'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw size={14} className={`text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Serviços'}</span>
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
            const plateExpenses = getPlateExpenses(proc.plate, proc.description);
            const service = getProcessService(proc);
            const isChatExpanded = expandedChatId === proc.id;
            const messageCount = (proc.messages || []).length;
            const isFirstReg = isFirstPlating(proc.description);

            // Automatic detection:
            // FEE: auto-detected when expense exists for plate OR proc.feePaid is true
            const isFeePaid = Boolean(proc.feePaid || plateExpenses.fee);

            // INSPECTION: auto-detected when expense exists for plate OR proc.inspectionDone is true
            const isInspectionDone = proc.requiresInspection === false 
              ? false 
              : Boolean(proc.inspectionDone || plateExpenses.inspection);

            // PLATE: auto-detected when expense exists for plate OR proc.plateInstalled/plateOrdered is true
            const isPlateDone = proc.requiresPlate 
              ? Boolean(proc.plateInstalled || proc.plateOrdered || plateExpenses.plate) 
              : false;

            // Format payment methods for clean display (DINHEIRO or PIX)
            const rawServicePayment = (service?.paymentMethod || '').toUpperCase();
            const servicePaymentMethodDisplay = rawServicePayment.includes('PIX') 
              ? 'PIX' 
              : rawServicePayment.includes('DINHEIRO') 
                ? 'DINHEIRO' 
                : rawServicePayment;

            const rawFeePayment = (plateExpenses.fee?.paymentMethod || proc.feePaymentMethod || '').toUpperCase();
            const feePaymentMethodDisplay = rawFeePayment.includes('PIX') 
              ? 'PIX' 
              : rawFeePayment.includes('DINHEIRO') 
                ? 'DINHEIRO' 
                : rawFeePayment;

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
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            currentStage === 'FINALIZADO' || currentStage === 'CONCLUIDO' || currentStage === 'PRONTO_ENTREGA' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-sm' :
                            currentStage === 'LIBERADO' ? 'bg-purple-950/80 text-purple-300 border-purple-800' :
                            currentStage === 'AGUARDANDO_DETRAN' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' :
                            'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}>
                            {(currentStage === 'FINALIZADO' || currentStage === 'CONCLUIDO' || currentStage === 'PRONTO_ENTREGA') && (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span>Finalizado</span>
                              </>
                            )}
                            {currentStage === 'LIBERADO' && 'Liberado pelo Detran'}
                            {currentStage === 'AGUARDANDO_DETRAN' && 'Em Análise no Detran'}
                            {currentStage === 'ENTRADA' && 'Recebido (Sem Abertura)'}
                          </span>

                          {/* Tag complementar de vistoria quando o processo ainda está Recebido (Sem Abertura) */}
                          {currentStage === 'ENTRADA' && (
                            proc.requiresInspection === false ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 uppercase">
                                Isento de Vistoria
                              </span>
                            ) : isInspectionDone ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center gap-1 uppercase">
                                <Check size={10} className="text-emerald-400" />
                                <span>Vistoria Concluída</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/40 flex items-center gap-1 uppercase">
                                <Clock size={10} className="text-sky-400" />
                                <span>Aguardando Vistoria</span>
                              </span>
                            )
                          )}
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
                            Cadastrado em: {formatSafeDate(proc.createdAt)}
                          </span>
                        </div>

                        {/* Formas de Recebimento do Atendimento e Pagamento da Taxa */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-slate-800">
                            <span className="text-slate-400 text-[11px] font-medium">Recebimento:</span>
                            {servicePaymentMethodDisplay ? (
                              <span className={`text-[11px] font-black uppercase tracking-wider ${
                                servicePaymentMethodDisplay === 'PIX' ? 'text-teal-400' : 'text-emerald-400'
                              }`}>
                                {servicePaymentMethodDisplay}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[11px]">-</span>
                            )}
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-slate-800">
                            <span className="text-slate-400 text-[11px] font-medium">Pagamento Taxa:</span>
                            {isFeePaid ? (
                              <span className={`text-[11px] font-black uppercase tracking-wider ${
                                feePaymentMethodDisplay === 'PIX' ? 'text-teal-400' : 'text-emerald-400'
                              }`}>
                                {feePaymentMethodDisplay || 'PAGA'}
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold uppercase text-[10px]">
                                PENDENTE
                              </span>
                            )}
                          </div>
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
                  {/* Step 1: Vistoria (Nem sempre exigida) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.requiresInspection === false
                      ? 'opacity-75 bg-[#12151C] border-slate-800/60'
                      : isInspectionDone 
                        ? 'bg-emerald-950/15 border-emerald-900/50' 
                        : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">1</span>
                        Vistoria Veicular
                      </span>
                      <button
                        onClick={() => handleToggleStep(proc.id, 'requiresInspection', proc.requiresInspection === false ? true : false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline decoration-dotted"
                        title="Alternar se o processo exige vistoria ou se é isento"
                      >
                        {proc.requiresInspection === false ? 'Não Exige' : 'Exige [X]'}
                      </button>
                    </div>

                    {proc.requiresInspection === false ? (
                      <div className="space-y-2 py-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <Check size={14} className="text-emerald-400" />
                          <span>Isento de Vistoria {isFirstReg && '(1º Emplacamento)'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Processo dispensado de laudo de vistoria física.
                        </p>
                        <button
                          onClick={() => handleToggleStep(proc.id, 'requiresInspection', true)}
                          className="w-full py-1 px-2 rounded-lg text-[10px] font-bold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition-all cursor-pointer"
                        >
                          Alterar para "Exigir Vistoria"
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-[11px] text-slate-400 mb-2">
                          {plateExpenses.inspection ? (
                            <span className="text-emerald-400 block font-mono text-[10px]">
                              ✓ Saída no Caixa: R$ {(Number(plateExpenses.inspection.value) || 0).toFixed(2)}
                              {plateExpenses.inspection.paymentMethod ? ` • ${plateExpenses.inspection.paymentMethod}` : ''}
                            </span>
                          ) : (
                            <span>{isInspectionDone ? 'Vistoria aprovada e cadastrada.' : 'Aguardando vistoria ou laudo ECV.'}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <span className="text-xs font-bold text-slate-300">Vistoria Feita:</span>
                          <button
                            type="button"
                            onClick={() => handleToggleStep(proc.id, 'inspectionDone', !isInspectionDone)}
                            className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                              isInspectionDone
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/40'
                            }`}
                            title={plateExpenses.inspection ? 'Identificado automaticamente pela saída no caixa' : 'Clique para alternar'}
                          >
                            {isInspectionDone ? <Check size={13} className="stroke-[3]" /> : <X size={13} className="stroke-[3]" />}
                            <span>{isInspectionDone ? 'SIM' : 'NÃO'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 2: Processo DETRAN */}
                  {(() => {
                    const isProcessOpened = proc.processOpened ?? (!!proc.protocolNumber && proc.protocolNumber.trim().length > 0);
                    return (
                      <div className={`p-3.5 rounded-xl border transition-all ${
                        proc.detranApproved 
                          ? 'bg-emerald-950/15 border-emerald-900/50' 
                          : isProcessOpened 
                            ? 'bg-indigo-950/15 border-indigo-900/50' 
                            : 'bg-[#151921] border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">2</span>
                            Processo DETRAN
                          </span>
                          {(proc.processOpenedDate || proc.protocolDate) && (
                            <span className="text-[10px] text-slate-400">
                              {proc.processOpenedDate || proc.protocolDate}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={proc.protocolNumber || ''}
                              onChange={(e) => handleUpdateProtocol(proc.id, e.target.value)}
                              placeholder="Inserir número do processo..."
                              className="w-full px-2.5 py-1.5 bg-[#0D1015] border border-slate-750 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleStep(proc.id, 'processOpened', !isProcessOpened)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                isProcessOpened
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700'
                              }`}
                              title={isProcessOpened ? "Processo aberto (clique para alternar)" : "Marcar como processo aberto"}
                            >
                              <Check size={12} className={isProcessOpened ? "text-white" : "text-slate-500"} />
                              <span>Processo aberto</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400">Detran Liberou?</span>
                            <button
                              type="button"
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
                    );
                  })()}

                  {/* Step 3: Taxa DETRAN */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    isFeePaid 
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

                    <div className="text-[11px] text-slate-400 mb-2">
                      {plateExpenses.fee ? (
                        <span className="text-emerald-400 block font-mono text-[10px]">
                          ✓ Saída no Caixa: R$ {(Number(plateExpenses.fee.value) || 0).toFixed(2)}
                          {plateExpenses.fee.paymentMethod ? ` • ${plateExpenses.fee.paymentMethod}` : ''}
                        </span>
                      ) : proc.feePayer === 'CLIENTE' ? (
                        <span>Enviar boleto para o cliente pagar.</span>
                      ) : (
                        <span>Pagar taxa após liberação do Detran.</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-xs font-bold text-slate-300">Taxa Paga:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleStep(proc.id, 'feePaid', !isFeePaid)}
                        className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          isFeePaid
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/40'
                        }`}
                        title={plateExpenses.fee ? 'Identificado automaticamente pela saída no caixa' : 'Clique para alternar'}
                      >
                        {isFeePaid ? <Check size={13} className="stroke-[3]" /> : <X size={13} className="stroke-[3]" />}
                        <span>{isFeePaid ? 'SIM' : 'NÃO'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-800/50 text-slate-400">
                      <span>Forma Pagto Taxa:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStep(proc.id, 'feePaymentMethod', 'DINHEIRO')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            feePaymentMethodDisplay === 'DINHEIRO' 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          DINHEIRO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStep(proc.id, 'feePaymentMethod', 'PIX')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            feePaymentMethodDisplay === 'PIX' 
                              ? 'bg-teal-600 text-white' 
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          PIX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Placa Mercosul (Conditional) */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    !proc.requiresPlate 
                      ? 'opacity-60 bg-[#12151C] border-slate-800/60' 
                      : isPlateDone 
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
                        {plateExpenses.plate && (
                          <span className="text-emerald-400 block font-mono text-[10px]">
                            ✓ Saída no Caixa: R$ {(Number(plateExpenses.plate.value) || 0).toFixed(2)}
                            {plateExpenses.plate.paymentMethod ? ` • ${plateExpenses.plate.paymentMethod}` : ''}
                          </span>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                          <span className="text-xs font-bold text-slate-300">Placa Feita:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !isPlateDone;
                              handleToggleStep(proc.id, 'plateInstalled', nextVal);
                              if (nextVal) handleToggleStep(proc.id, 'plateOrdered', true);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                              isPlateDone
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/40'
                            }`}
                            title={plateExpenses.plate ? 'Identificado automaticamente pela saída no caixa' : 'Clique para alternar'}
                          >
                            {isPlateDone ? <Check size={13} className="stroke-[3]" /> : <X size={13} className="stroke-[3]" />}
                            <span>{isPlateDone ? 'SIM' : 'NÃO'}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 text-[11px]">Pedido / Estampa:</span>
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
                    isFirstReg
                      ? 'opacity-70 bg-[#12151C] border-slate-800/60'
                      : !proc.requiresReceiptCollection 
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
                      {isFirstReg ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750">
                          Nunca Exige (1º Emp)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStep(proc.id, 'requiresReceiptCollection', !proc.requiresReceiptCollection)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer underline decoration-dotted"
                          title="Alternar se o Detran exige recolhimento físico do recibo antigo"
                        >
                          {proc.requiresReceiptCollection ? 'Exige Recibo [X]' : 'Não Exige'}
                        </button>
                      )}
                    </div>

                    {isFirstReg ? (
                      <div className="py-1">
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300 font-semibold">Veículo novo (0km):</strong> Nunca exige recolhimento de CRV (não possui recibo anterior).
                        </p>
                      </div>
                    ) : proc.requiresReceiptCollection ? (
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

                  {/* Step 6: CRVe EMITIDO */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    proc.crlvIssued 
                      ? 'bg-emerald-950/25 border-emerald-600/80 shadow-md' 
                      : 'bg-[#151921] border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">6</span>
                        CRVe EMITIDO
                      </span>
                      {proc.crlvIssued && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                          <Check size={10} />
                          FINALIZADO
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mb-3">
                      {proc.crlvIssued 
                        ? 'CRVe emitido com sucesso. Processo finalizado!' 
                        : 'Aguardando emissão do documento CRVe.'}
                    </p>

                    <button
                      onClick={() => handleToggleStep(proc.id, 'crlvIssued', !proc.crlvIssued)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        proc.crlvIssued
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <FileCheck size={14} />
                      <span>{proc.crlvIssued ? 'CRVe Emitido (Finalizado) ✓' : 'Marcar CRVe Emitido'}</span>
                    </button>
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
                      onClick={() => {
                        setNewDescription(at);
                        if (isFirstPlating(at)) {
                          setNewRequiresPlate(true);
                          setNewRequiresReceipt(false);
                        }
                      }}
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
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setNewDescription(val);
                    if (isFirstPlating(val)) {
                      setNewRequiresReceipt(false);
                    }
                  }}
                  placeholder="Ex: TRANSF SAVEIRO, 1º EMPLACAMENTO"
                  className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Exige Vistoria?
                  </label>
                  <select
                    value={newRequiresInspection ? 'sim' : 'nao'}
                    onChange={(e) => setNewRequiresInspection(e.target.value === 'sim')}
                    className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="sim">Sim, Exige Vistoria</option>
                    <option value="nao">Não Exige (Isento)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Quem Paga a Taxa?
                  </label>
                  <select
                    value={newFeePayer}
                    onChange={(e) => setNewFeePayer(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="ESCRITORIO">Escritório Paga</option>
                    <option value="CLIENTE">Cliente Paga</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                    Requer Placa?
                  </label>
                  <select
                    value={newRequiresPlate ? 'sim' : 'nao'}
                    onChange={(e) => setNewRequiresPlate(e.target.value === 'sim')}
                    className="w-full px-3 py-2 bg-[#0D1015] border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="nao">Não Requer</option>
                    <option value="sim">Sim, Requer Placa</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  {isFirstPlating(newDescription) && (
                    <span className="text-[10px] text-slate-400">
                      ℹ️ 1º Emplacamento: vistoria nem sempre exigida e nunca exige CRV.
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isFirstPlating(newDescription) ? (
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[9px] uppercase">
                      1º Emplacamento
                    </span>
                    <span>Nunca exige recolhimento de CRV (veículo novo 0km).</span>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1 text-xs">
                    <input
                      type="checkbox"
                      checked={newRequiresReceipt}
                      onChange={(e) => setNewRequiresReceipt(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Exige recolhimento do recibo antigo no Detran</span>
                  </label>
                )}
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

const MemoizedDetranProcesses = React.memo(DetranProcesses);
export default MemoizedDetranProcesses;
