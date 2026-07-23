/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Service, Expense, ExpenseCategory, SubCategory } from '../types';
import { 
  Calendar, 
  Filter, 
  FileText, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Layers, 
  Tag, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowUpDown
} from 'lucide-react';
import { plateMatchesSearch } from '../utils/plateMatcher';

interface ReportsProps {
  services: Service[];
  expenses: Expense[];
  subCategories: SubCategory[];
}

interface LedgerItem {
  id: string;
  type: 'ENTRADA' | 'SAÍDA';
  date: string;
  title: string;
  description: string;
  plate?: string;
  plates?: string[];
  paymentMethod: string;
  value: number;
  status?: string;
  paidValue?: number;
  items?: Array<{ name: string; value: number }>;
}
interface MultiSelectOption {
  id: string;
  name: string;
  categoryGroup?: 'SERVIÇOS' | 'PESSOAIS' | 'OUTROS';
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
}

function MultiSelect({ label, options, selected, onChange, allLabel }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (value === 'all') {
      onChange(['all']);
    } else if (value === 'none') {
      onChange(['none']);
    } else if (value === 'SERVIÇOS' || value === 'PESSOAIS' || value === 'OUTROS') {
      const groupIds = options
        .filter(o => (o.categoryGroup || 'SERVIÇOS') === value)
        .map(o => o.id);
      onChange(groupIds.length > 0 ? groupIds : ['none']);
    } else {
      let currentSelected: string[] = [];
      if (selected.includes('all')) {
        currentSelected = options.map(o => o.id);
      } else if (selected.includes('none')) {
        currentSelected = [];
      } else {
        currentSelected = [...selected];
      }

      if (currentSelected.includes(value)) {
        currentSelected = currentSelected.filter(v => v !== value);
      } else {
        currentSelected.push(value);
      }

      if (currentSelected.length === 0) {
        onChange(['none']);
      } else if (currentSelected.length === options.length) {
        onChange(['all']);
      } else {
        onChange(currentSelected);
      }
    }
  };

  const isGroupSelected = (group: 'SERVIÇOS' | 'PESSOAIS' | 'OUTROS') => {
    if (selected.includes('all') || selected.includes('none')) return false;
    const groupOptions = options.filter(o => (o.categoryGroup || 'SERVIÇOS') === group);
    if (groupOptions.length === 0) return false;
    const groupIds = groupOptions.map(o => o.id);
    const selectedNonGroup = selected.filter(id => !groupIds.includes(id));
    const allGroupSelected = groupIds.every(id => selected.includes(id));
    return allGroupSelected && selectedNonGroup.length === 0;
  };

  const getDisplayText = () => {
    if (selected.includes('all')) return allLabel;
    if (selected.includes('none')) return 'NENHUM';
    if (isGroupSelected('SERVIÇOS')) return 'SERVIÇOS';
    if (isGroupSelected('PESSOAIS')) return 'PESSOAIS';
    if (isGroupSelected('OUTROS')) return 'OUTROS';

    const selectedLabels = selected.map(val => {
      const opt = options.find(o => o.id === val);
      return opt ? opt.name : val;
    });

    if (selectedLabels.length === 0) return 'NENHUM';
    if (selectedLabels.length <= 2) return selectedLabels.join(', ');
    return `${selectedLabels.length} SELECIONADOS`;
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-left focus:outline-none focus:border-emerald-500 text-slate-200 font-bold uppercase cursor-pointer select-none truncate h-[38px]"
      >
        <span className="truncate mr-2">{getDisplayText()}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-slate-400 size-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[220px] bg-[#11141B] border border-slate-800 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider px-2 pt-1 pb-0.5">
            Filtros Rápidos
          </div>

          <div className="grid grid-cols-2 gap-1">
            {/* TODAS */}
            <div
              onClick={() => handleToggle('all')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                selected.includes('all') 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className={`size-3 rounded border flex items-center justify-center transition-all ${
                selected.includes('all')
                  ? 'border-emerald-500 bg-emerald-600'
                  : 'border-slate-700 bg-[#0F1115]'
              }`}>
                {selected.includes('all') && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
              <span>{allLabel}</span>
            </div>

            {/* NENHUM */}
            <div
              onClick={() => handleToggle('none')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                selected.includes('none') 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className={`size-3 rounded border flex items-center justify-center transition-all ${
                selected.includes('none')
                  ? 'border-rose-500 bg-rose-600'
                  : 'border-slate-700 bg-[#0F1115]'
              }`}>
                {selected.includes('none') && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
              <span>NENHUM</span>
            </div>
          </div>

          <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider px-2 pt-1.5 pb-0.5">
            Por Categoria
          </div>

          <div className="space-y-0.5">
            {/* SERVIÇOS */}
            <div
              onClick={() => handleToggle('SERVIÇOS')}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                isGroupSelected('SERVIÇOS')
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded border flex items-center justify-center transition-all ${
                  isGroupSelected('SERVIÇOS')
                    ? 'border-blue-500 bg-blue-600'
                    : 'border-slate-700 bg-[#0F1115]'
                }`}>
                  {isGroupSelected('SERVIÇOS') && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span>SERVIÇOS</span>
              </div>
              <span className="text-[9px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded font-mono">
                {options.filter(o => (o.categoryGroup || 'SERVIÇOS') === 'SERVIÇOS').length}
              </span>
            </div>

            {/* PESSOAIS */}
            <div
              onClick={() => handleToggle('PESSOAIS')}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                isGroupSelected('PESSOAIS')
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded border flex items-center justify-center transition-all ${
                  isGroupSelected('PESSOAIS')
                    ? 'border-purple-500 bg-purple-600'
                    : 'border-slate-700 bg-[#0F1115]'
                }`}>
                  {isGroupSelected('PESSOAIS') && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span>PESSOAIS</span>
              </div>
              <span className="text-[9px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded font-mono">
                {options.filter(o => (o.categoryGroup || 'SERVIÇOS') === 'PESSOAIS').length}
              </span>
            </div>

            {/* OUTROS */}
            <div
              onClick={() => handleToggle('OUTROS')}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                isGroupSelected('OUTROS')
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded border flex items-center justify-center transition-all ${
                  isGroupSelected('OUTROS')
                    ? 'border-amber-500 bg-amber-600'
                    : 'border-slate-700 bg-[#0F1115]'
                }`}>
                  {isGroupSelected('OUTROS') && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <span>OUTROS</span>
              </div>
              <span className="text-[9px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded font-mono">
                {options.filter(o => (o.categoryGroup || 'SERVIÇOS') === 'OUTROS').length}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-800 my-1.5" />

          <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider px-2 pb-1">
            Todas ({options.length})
          </div>

          {options.map(opt => {
            const isChecked = selected.includes('all') || selected.includes(opt.id);
            const group = opt.categoryGroup || 'SERVIÇOS';
            return (
              <div
                key={opt.id}
                onClick={() => handleToggle(opt.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${
                  isChecked 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className={`size-3 rounded border flex items-center justify-center transition-all shrink-0 ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-600'
                      : 'border-slate-700 bg-[#0F1115]'
                  }`}>
                    {isChecked && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-2 text-white">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{opt.name}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 font-mono ${
                  group === 'PESSOAIS'
                    ? 'text-purple-400 bg-purple-950/40 border border-purple-900/30'
                    : group === 'OUTROS'
                    ? 'text-amber-400 bg-amber-950/40 border border-amber-900/30'
                    : 'text-blue-400 bg-blue-950/40 border border-blue-900/30'
                }`}>
                  {group}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Reports({ services, expenses, subCategories }: ReportsProps) {  // Filter states (instant updates, no submit button needed)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(['all']);
  const [search, setSearch] = useState<string>('');
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>(['all']);
  const [paymentMethod, setPaymentMethod] = useState<string>('all');

  // Sort order state for general report detailed statement ('oldest' first or 'newest' first)
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Derive filter lists
  // 1. Subcategories list (of type RECEITA + used)
  const serviceSubCategories = useMemo(() => {
    const list: MultiSelectOption[] = [];

    subCategories
      .filter(sub => (sub.type || 'RECEITA') === 'RECEITA')
      .forEach(sub => {
        list.push({
          id: sub.id,
          name: sub.name.toUpperCase(),
          categoryGroup: sub.categoryGroup || 'SERVIÇOS'
        });
      });

    // Extract ones actually used in services to prevent duplicates
    services.forEach(srv => {
      srv.items.forEach(item => {
        const itemUpper = item.name.toUpperCase();
        if (!list.some(l => l.name === itemUpper)) {
          const matchedSub = subCategories.find(s => s.name.toUpperCase() === itemUpper);
          list.push({
            id: item.subCategoryId || item.name,
            name: itemUpper,
            categoryGroup: matchedSub?.categoryGroup || 'SERVIÇOS'
          });
        }
      });
    });
    return list;
  }, [subCategories, services]);

  // 2. Expense (GASTO) Categories
  const gastoExpenseCategories = useMemo(() => {
    const list: MultiSelectOption[] = [];

    subCategories
      .filter(sub => (sub.type || 'RECEITA') === 'GASTO')
      .forEach(sub => {
        list.push({
          id: sub.name.toUpperCase(),
          name: sub.name.toUpperCase(),
          categoryGroup: sub.categoryGroup || 'SERVIÇOS'
        });
      });

    // also append any dynamic categories from actual expenses
    expenses.forEach(exp => {
      const upper = exp.category.toUpperCase();
      if (!list.some(l => l.name === upper)) {
        const matchedSub = subCategories.find(s => s.name.toUpperCase() === upper);
        list.push({
          id: upper,
          name: upper,
          categoryGroup: matchedSub?.categoryGroup || 'SERVIÇOS'
        });
      }
    });

    return list;
  }, [subCategories, expenses]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSubCategories(['all']);
    setSearch('');
    setSelectedExpenseCategories(['all']);
    setPaymentMethod('all');
  };

  // Filter processes/services based on active states
  const filteredServices = useMemo(() => {
    if (selectedSubCategories.includes('none')) {
      return [];
    }

    const hasAll = selectedSubCategories.includes('all');

    return services
      .map(s => {
        if (!hasAll) {
          const matchingItems = s.items.filter(item => {
            const itemUpper = item.name.toUpperCase().trim();
            const idMatch = item.subCategoryId && selectedSubCategories.includes(item.subCategoryId);
            const nameMatch = selectedSubCategories.includes(itemUpper);
            const matchedSub = subCategories.find(sub => sub.id === item.subCategoryId || sub.name.toUpperCase().trim() === itemUpper);
            const subMatch = matchedSub ? (selectedSubCategories.includes(matchedSub.id) || selectedSubCategories.includes(matchedSub.name.toUpperCase().trim())) : false;
            return idMatch || nameMatch || subMatch;
          });
          if (matchingItems.length === 0) return null;
          
          return {
            ...s,
            items: matchingItems,
            totalValue: matchingItems.reduce((sum, item) => sum + item.value, 0)
          };
        }
        return s;
      })
      .filter((s): s is Service => s !== null)
      .filter(s => {
        // 1. Date Interval
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;

        // 2. Text search (Matches plate, client name, description or items)
        if (search) {
          const sLower = search.toLowerCase();
          const matchesPlate = plateMatchesSearch(s.plate, search);
          const matchesClient = s.client.toLowerCase().includes(sLower);
          const matchesDesc = s.description.toLowerCase().includes(sLower);
          const matchesItem = s.items.some(item => item.name.toLowerCase().includes(sLower));
          
          if (!matchesPlate && !matchesClient && !matchesDesc && !matchesItem) {
            return false;
          }
        }

        // 4. Payment Method
        if (paymentMethod !== 'all' && s.paymentMethod !== paymentMethod) return false;

        return true;
      });
  }, [services, startDate, endDate, search, selectedSubCategories, paymentMethod]);

  // Filter expenses based on active states
  const filteredExpenses = useMemo(() => {
    if (selectedExpenseCategories.includes('none')) {
      return [];
    }

    const hasAll = selectedExpenseCategories.includes('all');

    return expenses
      .map(e => {
        // If there is an active search filter, and the expense has items,
        // we must clone the expense keeping only the items matching the plate/search if search looks like a plate,
        // or keeping all items if search matches description/category.
        if (search && e.items && e.items.length > 0) {
          const sLower = search.toLowerCase();
          const hasPlateMatch = e.items.some(it => plateMatchesSearch(it.plate, search));
          const hasDescCategoryMatch = e.description.toLowerCase().includes(sLower) || e.category.toLowerCase().includes(sLower);

          if (hasPlateMatch) {
            const matchingItems = e.items.filter(it => plateMatchesSearch(it.plate, search));
            return {
              ...e,
              items: matchingItems,
              value: matchingItems.reduce((sum, item) => sum + item.value, 0)
            };
          } else if (hasDescCategoryMatch) {
            return e;
          } else {
            return null;
          }
        }
        return e;
      })
      .filter((e): e is Expense => e !== null)
      .filter(e => {
        // 1. Date Interval
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;

        // 2. Text Search
        if (search) {
          const sLower = search.toLowerCase();
          const matchesPlate = plateMatchesSearch(e.plate, search) ||
                               (e.items && e.items.some(it => plateMatchesSearch(it.plate, search)));
          const matchesDesc = e.description.toLowerCase().includes(sLower);
          const matchesCategory = e.category.toLowerCase().includes(sLower);
          
          if (!matchesPlate && !matchesDesc && !matchesCategory) return false;
        }

        // 3. Expense Category
        if (!hasAll) {
          const upper = e.category.toUpperCase().trim();
          const matchedSub = subCategories.find(s => s.name.toUpperCase().trim() === upper || s.id === e.category);
          const isSelected = selectedExpenseCategories.includes(upper) || (matchedSub && (selectedExpenseCategories.includes(matchedSub.id) || selectedExpenseCategories.includes(matchedSub.name.toUpperCase().trim())));
          if (!isSelected) return false;
        }

        // 4. Payment Method
        const method = e.paymentMethod || 'PIX';
        if (paymentMethod !== 'all' && method !== paymentMethod) return false;

        return true;
      });
  }, [expenses, startDate, endDate, search, selectedExpenseCategories, paymentMethod]);

  // Compile chronologically sorted unified transaction ledger
  const ledgerItems = useMemo(() => {
    const list: LedgerItem[] = [];

    // Group filtered services by groupId or (client + description + date) if they have no groupId
    const groupedFiltered: {
      groupId: string;
      id: string;
      client: string;
      description: string;
      date: string;
      services: Service[];
      totalValue: number;
    }[] = [];

    filteredServices.forEach(srv => {
      let foundGroup = groupedFiltered.find(g => {
        if (srv.groupId && g.groupId === srv.groupId) {
          return true;
        }
        if (!srv.groupId && !g.groupId) {
          return (
            g.client.trim().toUpperCase() === srv.client.trim().toUpperCase() &&
            g.description.trim().toUpperCase() === srv.description.trim().toUpperCase() &&
            g.date === srv.date
          );
        }
        return false;
      });

      if (foundGroup) {
        foundGroup.services.push(srv);
        foundGroup.totalValue += srv.totalValue;
      } else {
        groupedFiltered.push({
          groupId: srv.groupId || '',
          id: srv.id,
          client: srv.client,
          description: srv.description,
          date: srv.date,
          services: [srv],
          totalValue: srv.totalValue
        });
      }
    });

    // Add grouped services to list
    groupedFiltered.forEach(group => {
      const isMulti = group.services.length > 1;
      const methods = Array.from(new Set(group.services.map(s => s.paymentMethod)));
      const paymentMethodStr = methods.join(' + ');

      const paidValue = group.services.filter(s => s.status === 'PAGO').reduce((sum, s) => sum + s.totalValue, 0);
      const isGroupPending = group.services.every(s => s.status === 'PENDENTE') ? 'PENDENTE' : group.services.some(s => s.status === 'PENDENTE') ? 'PARCIAL' : 'PAGO';

      if (isMulti) {
        // Multi-vehicle item
        list.push({
          id: group.id,
          type: 'ENTRADA',
          date: group.date,
          title: `Serviço: ${group.client}`,
          description: `${group.description} (${group.services.length} veículos)`,
          plates: group.services.map(s => s.plate),
          paymentMethod: paymentMethodStr,
          value: group.totalValue,
          status: isGroupPending,
          paidValue: paidValue,
          items: group.services.flatMap(s => 
            s.items.map(it => ({ 
              name: `[${s.plate}] ${it.name}`, 
              value: it.value 
            }))
          )
        });
      } else {
        // Single vehicle item
        const s = group.services[0];
        list.push({
          id: s.id,
          type: 'ENTRADA',
          date: s.date,
          title: `Serviço: ${s.client}`,
          description: s.description,
          plate: s.plate,
          paymentMethod: s.paymentMethod,
          value: s.totalValue,
          status: s.status,
          paidValue: s.status === 'PAGO' ? s.totalValue : 0,
          items: s.items.map(it => ({ name: it.name, value: it.value }))
        });
      }
    });

    // Add Expenses
    filteredExpenses.forEach(e => {
      list.push({
        id: e.id,
        type: 'SAÍDA',
        date: e.date,
        title: `Gasto: ${e.description}`,
        description: `Categoria: ${e.category}`,
        plate: e.plate,
        paymentMethod: e.paymentMethod || 'PIX',
        value: e.value,
        items: e.items ? e.items.map(it => ({ name: `Placa: ${it.plate}`, value: it.value })) : undefined
      });
    });

    // Sort oldest first (ascending) so the running total accumulates logically
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredServices, filteredExpenses]);

  // Compute ledger with dynamic running balance (cumulative sum) row by row
  const ledgerWithBalances = useMemo(() => {
    let currentBalance = 0;
    return ledgerItems.map(item => {
      if (item.type === 'ENTRADA') {
        const valueToAdd = item.paidValue !== undefined ? item.paidValue : (item.status === 'PAGO' ? item.value : 0);
        currentBalance += valueToAdd;
      } else {
        currentBalance -= item.value;
      }
      return {
        ...item,
        runningBalance: currentBalance
      };
    });
  }, [ledgerItems]);

  // Display items in preferred sort order
  const displayedLedgerItems = useMemo(() => {
    const list = [...ledgerWithBalances];
    if (sortOrder === 'newest') {
      return list.reverse();
    }
    return list;
  }, [ledgerWithBalances, sortOrder]);

  // Compute totals for summary box of filtered dataset
  // Strictly consider PAGO status services as requested:
  const totalRevenuesSum = filteredServices.filter(s => s.status === 'PAGO').reduce((acc, curr) => acc + curr.totalValue, 0);
  const totalExpensesSum = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);
  const totalPaidRevenues = filteredServices.filter(s => s.status === 'PAGO').reduce((acc, curr) => acc + curr.totalValue, 0);
  const totalPendingRevenues = filteredServices.filter(s => s.status === 'PENDENTE').reduce((acc, curr) => acc + curr.totalValue, 0);
  const netEarningsSum = totalRevenuesSum - totalExpensesSum;

  // Receipts distribution format: PIX vs Cash (only PAGO services)
  const pixRevenues = filteredServices
    .filter(s => s.status === 'PAGO' && s.paymentMethod === 'PIX')
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  const dineroRevenues = filteredServices
    .filter(s => s.status === 'PAGO' && s.paymentMethod === 'DINHEIRO')
    .reduce((acc, curr) => acc + curr.totalValue, 0);

  const totalPaymentSum = pixRevenues + dineroRevenues;
  const pixPercentage = totalPaymentSum > 0 ? (pixRevenues / totalPaymentSum) * 100 : 0;
  const dineroPercentage = totalPaymentSum > 0 ? (dineroRevenues / totalPaymentSum) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm">
        
        {/* Upper state header */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white block">Demonstrativo de Caixa Consolidado</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Auditoria geral de entradas e saídas com filtro instantâneo e saldo acumulado</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto font-sans">
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1115] hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-bold text-slate-300 rounded-xl cursor-pointer transition-all shrink-0 select-none"
            >
              <ArrowUpDown size={13} className="text-emerald-450" />
              <span>Ordenação: <strong className="text-emerald-400">{sortOrder === 'oldest' ? 'Mais Velho → Mais Novo' : 'Mais Novo → Mais Velho'}</strong></span>
            </button>

            {/* Consolidated balance box at the header, right beside the sort option */}
            <div className="flex items-center gap-3 bg-[#0F1115] border border-slate-800 px-4 py-2 rounded-xl text-xs select-none">
              <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-slate-400 font-medium">
                <span>Serviços: <strong className="text-emerald-400 font-mono">{formatCurrency(totalRevenuesSum)}</strong></span>
                <span>Despesas: <strong className="text-rose-400 font-mono">{formatCurrency(totalExpensesSum)}</strong></span>
                <span>Saldo Final: <strong className={`font-mono ${netEarningsSum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(netEarningsSum)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters section (just like services list header) */}
        <div className="space-y-4 my-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Buscar por Texto */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar por Texto</span>
              <input 
                type="text"
                placeholder="Cliente, Placa, Descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white shadow-xs placeholder-slate-650 h-[38px] font-medium"
              />
            </div>

            {/* 2. Start Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Inicial</span>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-emerald-500 text-white shadow-xs h-[38px]"
              />
            </div>

            {/* 3. End Date */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Final</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-emerald-500 text-white shadow-xs h-[38px]"
              />
            </div>

            {/* 4. Subcategories selector */}
            <MultiSelect
              label="Subcategoria"
              options={serviceSubCategories}
              selected={selectedSubCategories}
              onChange={setSelectedSubCategories}
              allLabel="TODAS"
            />

            {/* 5. GASTO Categories selector */}
            <MultiSelect
              label="Registro de Gastos"
              options={gastoExpenseCategories}
              selected={selectedExpenseCategories}
              onChange={setSelectedExpenseCategories}
              allLabel="TODAS"
            />

            {/* 6. METODO DE PAGAMENTO Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de Pagamento</span>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-200 font-bold uppercase cursor-pointer h-[38px]"
              >
                <option value="all">TODOS</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">DINHEIRO</option>
              </select>
            </div>
          </div>

          {/* Reset Filters and Sub-summaries row inside filter box */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/50">
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-350 select-none">
              <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded-lg">Pago: {formatCurrency(totalPaidRevenues)}</span>
              <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2.5 py-1 rounded-lg">Pendente: {formatCurrency(totalPendingRevenues)}</span>
            </div>

            {(startDate || endDate || selectedSubCategories.length > 1 || !selectedSubCategories.includes('all') || search || selectedExpenseCategories.length > 1 || !selectedExpenseCategories.includes('all') || paymentMethod !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-emerald-450 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
              >
                <RefreshCw size={11} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Ledger List (Extrato) */}
        <div className="mt-6 space-y-4">
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3.5 flex items-center gap-2 select-none">
              <FileText size={14} className="text-emerald-450" />
              Extrato Detalhado de Lançamentos ({displayedLedgerItems.length})
            </h4>
          </div>

          {displayedLedgerItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl select-none">
              Nenhuma movimentação localizada para o conjunto de critérios selecionado. Use o formulário de filtros para ampliar a pesquisa.
            </div>
          ) : (
            <div className="border border-slate-850 rounded-xl bg-[#0F1115] overflow-hidden divide-y divide-slate-850 max-h-[640px] overflow-y-auto pr-1">
              {displayedLedgerItems.map((item) => {
                const isEntrada = item.type === 'ENTRADA';
                const isPending = item.status === 'PENDENTE';
                const isParcial = item.status === 'PARCIAL';
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-900/30 transition-all font-sans text-xs">
                    {/* Ledger line main meta */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Date badge */}
                          <span className="font-mono text-[9px] text-slate-450 bg-[#161B22] border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 select-none">
                            <Calendar size={9} className="text-slate-500" />
                            {item.date}
                          </span>

                          {/* Entrada / Saida badge */}
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-0.5 select-none ${
                            isEntrada 
                              ? isPending
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                                : isParcial
                                  ? 'bg-amber-950/30 text-amber-300 border border-amber-900/30'
                                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                          }`}>
                            {isEntrada ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
                            {isEntrada ? isPending ? 'ENTRADA (PENDENTE)' : isParcial ? 'ENTRADA (PARCIAL PAGO)' : 'ENTRADA' : 'SAÍDA'}
                          </span>

                          {/* Payment method badge */}
                          <span className="text-[9px] bg-[#161B22] text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-800 select-none">
                            {item.paymentMethod}
                          </span>

                          {/* Plate number if specified */}
                          {item.plate && (
                            <span className="px-2 py-0.5 rounded bg-[#161B22] text-amber-400 border border-slate-800 font-mono font-bold text-[9px] tracking-wide uppercase select-none">
                              {item.plate}
                            </span>
                          )}

                          {/* Group with multiple plates if specified */}
                          {item.plates && item.plates.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.plates.map((p, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-[#161B22] text-amber-450 border border-slate-800 font-mono font-bold text-[8px] tracking-wide uppercase select-none">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white mt-1">{item.title}</h4>
                        <p className="text-[11px] text-slate-450 font-medium">{item.description}</p>
                      </div>

                      <div className="text-right sm:self-center self-end space-y-1">
                        {/* Transaction amount */}
                        <span className={`text-sm font-extrabold font-mono block ${isEntrada ? isPending ? 'text-amber-400/80 line-through' : 'text-emerald-400' : 'text-rose-400'}`}>
                          {isEntrada ? '+' : '-'}{formatCurrency(item.value)}
                        </span>
                        {/* Cumulative sum */}
                        <span className="text-[10px] text-slate-550 font-bold block select-none">
                          Acumulado: <strong className={`font-mono ${item.runningBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(item.runningBalance)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Subtaxas / Subcategorias desdobradas */}
                    {item.items && item.items.length > 0 && (
                      <div className="mt-3 pl-3.5 border-l border-slate-800 space-y-1.5 select-none animate-fadeIn">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Subtaxas / Veículos de Origem:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.items.map((subItem, sIdx) => (
                            <div key={sIdx} className="px-2 py-1 bg-slate-950/45 border border-slate-850 rounded flex items-center gap-1.5 text-[9px] font-mono text-slate-300">
                              <span className="truncate max-w-[150px]">{subItem.name}</span>
                              <span className="text-white font-bold">{formatCurrency(subItem.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Visual Analytics row */}
      <div className="max-w-4xl mx-auto">
        {/* Payment Methods Audit (PIX vs Cash) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-white">
          <div>
            <h3 className="text-base font-bold text-white">Auditoria de Meio de Pagamento (Faturamento)</h3>
            <p className="text-xs text-slate-450">Mapeamento detalhado de recebimentos para controle do caixa diário do intervalo filtrado (exclui pendentes)</p>
          </div>

          {totalPaymentSum === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Nenhum faturamento registrado para o filtro/intervalo selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider font-sans select-none">
                <span>PIX (Transferência)</span>
                <span>DINHEIRO (Moeda Física)</span>
              </div>

              {/* Group representation bar */}
              <div className="w-full h-6 rounded-xl overflow-hidden flex shadow-xs bg-[#0F1115] border border-slate-850 select-none">
                {pixPercentage > 0 && (
                  <div 
                    className="bg-emerald-550 flex items-center justify-center text-[10px] text-white font-black font-mono transition-all duration-200"
                    style={{ width: `${pixPercentage}%` }}
                    title={`PIX: ${pixPercentage.toFixed(1)}%`}
                  >
                    {pixPercentage >= 15 ? `PIX: ${pixPercentage.toFixed(0)}%` : ''}
                  </div>
                )}
                {dineroPercentage > 0 && (
                  <div 
                    className="bg-amber-500 flex items-center justify-center text-[10px] text-zinc-950 font-black font-mono transition-all duration-200"
                    style={{ width: `${dineroPercentage}%` }}
                    title={`Dinheiro: ${dineroPercentage.toFixed(1)}%`}
                  >
                    {dineroPercentage >= 15 ? `Dinheiro: ${dineroPercentage.toFixed(0)}%` : ''}
                  </div>
                )}
              </div>

              {/* Sub details boxes list */}
              <div className="grid grid-cols-2 gap-4 select-none animate-fadeIn">
                <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-emerald-400">TOTAL PIX</span>
                  <span className="text-lg font-bold font-mono text-emerald-300 mt-1">{formatCurrency(pixRevenues)}</span>
                </div>
                <div className="p-3 bg-amber-955/20 rounded-xl border border-amber-900/40 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-400">TOTAL DINHEIRO</span>
                  <span className="text-lg font-bold font-mono text-amber-300 mt-1">{formatCurrency(dineroRevenues)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
