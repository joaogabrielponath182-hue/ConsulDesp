/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, ExpenseCategory, SubCategory, ExpenseItem, PaymentMethod } from '../types';
import { 
  Trash2, 
  Plus, 
  DollarSign, 
  Calendar, 
  Search, 
  Filter, 
  Clipboard, 
  AlertCircle, 
  Coins, 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  Tag,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { plateMatchesSearch } from '../utils/plateMatcher';

interface ExpensesProps {
  expenses: Expense[];
  subCategories: SubCategory[];
  onAddSubCategory: (name: string, defaultValue: number, type: 'RECEITA' | 'GASTO') => void;
  onAddExpense: (description: string, category: ExpenseCategory, value: number, date: string, plate?: string, paymentMethod?: 'DINHEIRO' | 'PIX', items?: any[], id?: string) => void;
  onRemoveExpense: (id: string) => void;
  onEditExpense?: (updated: Expense) => void;
  viewMode?: 'form' | 'list';
  onRedirectToForm?: () => void;
}

export default function Expenses({
  expenses,
  subCategories,
  onAddSubCategory,
  onAddExpense,
  onRemoveExpense,
  onEditExpense,
  viewMode = 'form',
  onRedirectToForm
}: ExpensesProps) {
  const expenseCategories = React.useMemo(() => {
    // 1. Filter only 'GASTO' subcategories
    const filteredSubs = subCategories.filter(sub => (sub.type || 'RECEITA') === 'GASTO');

    // 2. Count usage frequency of the subcategory name in existing expenses
    const usageCounts: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.category) {
        const catUpper = exp.category.toUpperCase().trim();
        usageCounts[catUpper] = (usageCounts[catUpper] || 0) + 1;
      }
    });

    // 3. Sort subcategories based on usage counts (descending) and name (alphabetical)
    const sortedSubs = [...filteredSubs].sort((a, b) => {
      const countA = usageCounts[a.name.toUpperCase().trim()] || 0;
      const countB = usageCounts[b.name.toUpperCase().trim()] || 0;
      if (countB !== countA) {
        return countB - countA;
      }
      return a.name.localeCompare(b.name);
    });

    const list = sortedSubs.map(sub => sub.name);

    // Fallback categories if empty
    if (list.length === 0) {
      return ['ALUGUEL', 'MATERIAIS', 'TRANSPORTE', 'IMPOSTOS', 'SISTEMAS / SOFTWARE', 'MARKETING', 'OUTROS'];
    }
    return list;
  }, [subCategories, expenses]);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');

  // Editing State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // New Expense form state
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [plate, setPlate] = useState('');
  const [val, setVal] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'DINHEIRO' | 'PIX'>('PIX');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Multi plate item addition state
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [itemError, setItemError] = useState('');

  // Expanded card rows state (for detailing lists)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // State to track last launched expense
  const [lastLaunchedExpenseId, setLastLaunchedExpenseId] = useState<string | null>(() => localStorage.getItem('lastLaunchedExpenseId'));

  React.useEffect(() => {
    if (lastLaunchedExpenseId) {
      localStorage.setItem('lastLaunchedExpenseId', lastLaunchedExpenseId);
    } else {
      localStorage.removeItem('lastLaunchedExpenseId');
    }
  }, [lastLaunchedExpenseId]);

  // Inline Category Creator state
  const [newCatName, setNewCatName] = useState('');
  const [catSuccessMsg, setCatSuccessMsg] = useState('');
  const [catErrorMsg, setCatErrorMsg] = useState('');

  // Sync category state default when dynamic categories load
  React.useEffect(() => {
    if (expenseCategories.length > 0 && !category) {
      const firstCat = expenseCategories[0];
      setCategory(firstCat);
      const sub = subCategories.find(s => s.name.toUpperCase() === firstCat.toUpperCase() && (s.type || 'RECEITA') === 'GASTO');
      if (sub && sub.defaultValue !== undefined && sub.defaultValue > 0) {
        setVal(sub.defaultValue);
      }
    }
  }, [expenseCategories, category, subCategories]);

  const handleCategoryChange = (selectedCat: string) => {
    setCategory(selectedCat);
    const sub = subCategories.find(s => s.name.toUpperCase() === selectedCat.toUpperCase() && (s.type || 'RECEITA') === 'GASTO');
    if (sub && sub.defaultValue !== undefined && sub.defaultValue > 0) {
      setVal(sub.defaultValue);
    } else {
      setVal('');
    }
  };

  const formatCurrency = (v: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(v);
  };

  // Add plate item helper ("NOVA PLACA")
  const handleAddPlateItem = (e: React.MouseEvent) => {
    e.preventDefault();
    setItemError('');

    const finalPlateName = plate.trim().toUpperCase() || 'NINFO';

    if (val === '' || Number(val) <= 0) {
      setItemError('Informe um valor acima de zero.');
      return;
    }

    const newItem: ExpenseItem = {
      id: `plate-exp-${Date.now()}-${Math.random()}`,
      plate: finalPlateName,
      value: Number(val)
    };

    setExpenseItems([...expenseItems, newItem]);
    setPlate('');
    setVal('');
  };

  const handleRemovePlateItem = (idToDelete: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== idToDelete));
  };

  const startEditingExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDesc(expense.description);
    setCategory(expense.category);
    setPaymentMethod(expense.paymentMethod || 'PIX');
    setDate(expense.date);
    if (expense.items && expense.items.length > 0) {
      setExpenseItems(expense.items);
      setPlate('');
      setVal('');
    } else {
      setExpenseItems([]);
      setPlate(expense.plate || '');
      setVal(expense.value);
    }
    setErrorMsg('');
    setItemError('');
    // No redirection from list view to allow inline overlay editing
    setTimeout(() => {
      const inputEl = document.getElementById('exp-desc');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }, 60);
  };

  const cancelEditingExpense = () => {
    setEditingExpense(null);
    setDesc('');
    setPlate('');
    setVal('');
    setExpenseItems([]);
    setPaymentMethod('PIX');
    setErrorMsg('');
    setItemError('');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!desc.trim()) {
      setErrorMsg('Por favor, informe a descrição da despesa.');
      return;
    }

    const activeCat = category || expenseCategories[0] || 'OUTROS';

    if (!date) {
      setErrorMsg('Por favor, indique a data da despesa.');
      return;
    }

    // Determine final list of items and total value
    let finalItems = expenseItems.length > 0 ? expenseItems : undefined;
    let finalValue = 0;
    let finalPlate: string | undefined = undefined;

    if (finalItems) {
      finalValue = finalItems.reduce((acc, curr) => acc + curr.value, 0);
    } else {
      if (val === '' || Number(val) <= 0) {
        // user might have filled plate/val but forgot to click Nova Placa. Let's make it easy:
        if (val !== '' && Number(val) > 0) {
          finalValue = Number(val);
          finalPlate = plate.trim().toUpperCase() || 'NINFO';
        } else {
          setErrorMsg('Por favor, informe um valor de despesa maior que zero ou adicione placas.');
          return;
        }
      } else {
        finalValue = Number(val);
        finalPlate = plate.trim().toUpperCase() || 'NINFO';
      }
    }

    if (editingExpense) {
      if (onEditExpense) {
        onEditExpense({
          ...editingExpense,
          description: desc.trim(),
          category: activeCat,
          value: finalValue,
          date,
          plate: finalPlate,
          paymentMethod,
          items: finalItems
        });
      }
      setEditingExpense(null);
      setLastLaunchedExpenseId(editingExpense.id);
    } else {
      const generatedId = `exp-${Date.now()}`;
      onAddExpense(desc.trim(), activeCat, finalValue, date, finalPlate, paymentMethod, finalItems, generatedId);
      setLastLaunchedExpenseId(generatedId);
    }

    // Reset fields
    setDesc('');
    setVal('');
    setPlate('');
    setExpenseItems([]);
    setPaymentMethod('PIX');
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
  };

  const handleCreateCategory = () => {
    setCatSuccessMsg('');
    setCatErrorMsg('');

    if (!newCatName.trim()) {
      setCatErrorMsg('Informe o nome da categoria.');
      return;
    }

    const clean = newCatName.trim().toUpperCase();

    // Check if it already exists as GASTO in subcategories
    const exists = subCategories.some(sub => sub.name.toUpperCase() === clean && (sub.type || 'RECEITA') === 'GASTO');
    if (exists) {
      setCatErrorMsg('Essa categoria já existe.');
      return;
    }

    // Call onAddSubCategory as GASTO
    onAddSubCategory(clean, 0, 'GASTO');
    setCatSuccessMsg(`Categoria "${clean}" criada com sucesso!`);
    setNewCatName('');
    
    // Auto select newly created category in dropdown
    setCategory(clean);
  };

  // Toggle row expanded card details
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter accounts details
  const filteredExpenses = React.useMemo(() => {
    const list = expenses.filter(exp => {
      const matchesSearch = 
        exp.description.toLowerCase().includes(search.toLowerCase()) || 
        plateMatchesSearch(exp.plate, search) ||
        (exp.items && exp.items.some(item => plateMatchesSearch(item.plate, search)));
        
      const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
      const matchesStartDate = !startDate || exp.date >= startDate;
      const matchesEndDate = !endDate || exp.date <= endDate;
      const matchesPaymentMethod = selectedPaymentMethod === 'all' || exp.paymentMethod === selectedPaymentMethod;

      return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate && matchesPaymentMethod;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'oldest') {
        return a.date.localeCompare(b.date);
      } else {
        return b.date.localeCompare(a.date);
      }
    });
  }, [expenses, search, selectedCategory, startDate, endDate, selectedPaymentMethod, sortOrder]);

  const totalFilteredValue = React.useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);
  }, [filteredExpenses]);
  
  // Live balance values inside the registry form
  const liveFormValue = expenseItems.length > 0 
    ? expenseItems.reduce((acc, curr) => acc + curr.value, 0)
    : (val === '' ? 0 : Number(val));

  // Retrieve the last launched/created expense for confirmation on the same screen
  const lastLaunchedExpense = React.useMemo(() => {
    if (!lastLaunchedExpenseId) return null;
    return expenses.find(exp => exp.id === lastLaunchedExpenseId);
  }, [expenses, lastLaunchedExpenseId]);

  const lastLaunchedExpensePanel = lastLaunchedExpense && (
    <div className="bg-[#161B22] border border-rose-500/25 rounded-2xl p-5 shadow-lg animate-fadeIn text-left space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
            Último Gasto Lançado Realizado
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setLastLaunchedExpenseId(null)}
          className="text-[9px] text-slate-400 hover:text-slate-200 uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-slate-800 bg-[#0F1115] cursor-pointer"
        >
          Esconder
        </button>
      </div>

      <div className="space-y-3">
        {/* General group information */}
        <div className="bg-[#0F1115] border border-slate-850 rounded-xl p-3.5 space-y-1 text-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Categoria</span>
              <span className="block text-xs font-black text-rose-450 mt-0.5 uppercase tracking-wider">{lastLaunchedExpense.category}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Data</span>
              <span className="block text-[10px] font-bold text-slate-300 font-mono flex items-center justify-end gap-1 mt-0.5">
                <Calendar size={10} className="text-slate-400" />
                {lastLaunchedExpense.date}
              </span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-850/60 mt-1.5 font-sans">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Descrição</span>
            <p className="text-[11px] text-slate-350 mt-0.5">{lastLaunchedExpense.description}</p>
          </div>

          {lastLaunchedExpense.plate && (
            <div className="pt-2 border-t border-slate-850/60 mt-1.5 flex justify-between items-center font-sans">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Placa Associada</span>
                <span className="block text-[10px] font-black px-1.5 py-0.5 mt-0.5 bg-slate-850 text-white border border-slate-700 rounded-md font-mono tracking-wider w-fit">
                  {lastLaunchedExpense.plate}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Forma de Pagamento</span>
                <span className="block text-[9px] font-black tracking-wider text-slate-300 uppercase mt-0.5">
                  {lastLaunchedExpense.paymentMethod || 'PIX'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed breakdown / multi plate if items exists */}
        {lastLaunchedExpense.items && lastLaunchedExpense.items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Detalhes por Veículo ({lastLaunchedExpense.items.length}):
              </span>
              <button
                type="button"
                onClick={() => toggleRow(`last-${lastLaunchedExpense.id}`)}
                className="text-[9px] text-slate-400 hover:text-slate-205 flex items-center gap-1 cursor-pointer select-none"
              >
                {expandedRows[`last-${lastLaunchedExpense.id}`] ? 'Recolher' : 'Expandir'}
                {expandedRows[`last-${lastLaunchedExpense.id}`] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            </div>

            {expandedRows[`last-${lastLaunchedExpense.id}`] && (
              <div className="bg-[#0F1115] border border-slate-850 rounded-xl overflow-hidden p-3.5 space-y-1.5 animate-fadeIn">
                <div className="space-y-1 bg-[#161B22] border border-slate-850 rounded-lg p-2 font-mono text-[11px] text-slate-300">
                  {lastLaunchedExpense.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-slate-850/60 last:border-0 last:pb-0">
                      <span>Placa: <strong className="text-white uppercase font-bold">{item.plate}</strong></span>
                      <span className="font-semibold text-rose-400 font-mono">-{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action controls (Edit, Delete) and Total sum */}
        <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => startEditingExpense(lastLaunchedExpense)}
              className="px-3 py-1.5 text-[10px] uppercase font-bold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-755 hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil size={10} />
              Editar Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                onRemoveExpense(lastLaunchedExpense.id);
                setLastLaunchedExpenseId(null);
              }}
              className="px-3 py-1.5 text-[10px] uppercase font-bold rounded-xl bg-[#0F1115] hover:bg-rose-955/20 text-slate-400 hover:text-rose-450 border border-slate-800 hover:border-rose-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={10} />
              Remover
            </button>
          </div>

          <div className="text-right font-sans text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>SOMA EXTRATO GASTO:</span>
            <span className="text-rose-450 font-mono text-xs font-black">
              -{formatCurrency(lastLaunchedExpense.value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const expenseForm = (
    <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm h-fit space-y-6 text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            {editingExpense ? <Pencil size={18} /> : <DollarSign size={18} />}
            <h2 className="text-md font-bold text-white">
              {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
            </h2>
          </div>
          {editingExpense && (
            <button 
              type="button" 
              onClick={cancelEditingExpense}
              className="text-[10px] text-rose-450 hover:text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 cursor-pointer"
            >
              Fechar
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-5">Informe as especificações do gasto comercial para debitar no balanço geral.</p>

        <form onSubmit={handleCreate} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-xs text-rose-400 font-medium font-sans">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="exp-desc" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
              Descrição do Gasto
            </label>
            <input
              id="exp-desc"
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ex: Vagas do Dia, Despesa Cartório, Vistoria"
              className="w-full px-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-sm placeholder-slate-650 focus:outline-none focus:border-rose-500 text-white transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="exp-category" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Categoria
              </label>
              <select
                id="exp-category"
                value={category || (expenseCategories[0] || 'OUTROS')}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-200 font-bold cursor-pointer uppercase text-ellipsis overflow-hidden"
              >
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exp-pay-method" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                Pagam. por
              </label>
              <select
                id="exp-pay-method"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-200 font-bold cursor-pointer"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">DINHEIRO</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC ADDPLETE (MULTIPLE VEHICLES ON SAME GASTO) */}
          <div className="border border-slate-850 rounded-xl p-3 bg-[#0F1115]/50 space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Vinculação de Veículos (Opcional):</span>
            
            {itemError && (
              <div className="text-[10px] text-rose-455 font-semibold bg-rose-950/20 border border-rose-900/30 p-1 rounded-md animate-fadeIn">
                {itemError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">Placa</label>
                <input
                  type="text"
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                  placeholder="NINFO"
                  className="w-full px-2 py-1.5 bg-[#0F1115] border border-slate-850 rounded-lg text-xs font-mono uppercase text-white shadow-inner animate-fadeIn focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans font-bold">Valor Unitário</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={val}
                  onChange={e => {
                    const v = e.target.value;
                    setVal(v === '' ? '' : parseFloat(v));
                  }}
                  placeholder="R$"
                  className="w-full px-2 py-1.5 bg-[#0F1115] border border-slate-850 rounded-lg text-xs font-mono text-white shadow-inner animate-fadeIn focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddPlateItem}
                className="flex-1 py-1.5 text-center text-[10px] font-black text-rose-400 bg-rose-600/10 hover:bg-rose-600/20 rounded-lg border border-rose-600/20 uppercase transition-all duration-150 cursor-pointer font-sans"
              >
                + Nova Placa
              </button>
            </div>

            {/* Plates listing temporary queue */}
            {expenseItems.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-850 pt-2.5 animate-fadeIn">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide font-sans">Placas Vincladas:</span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {expenseItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-[10px] bg-slate-900 border border-slate-850 rounded px-2 py-1 font-mono">
                      <span className="text-amber-450 font-bold">{item.plate}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white">{formatCurrency(item.value)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlateItem(item.id)}
                          className="text-rose-400 hover:text-rose-350 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="exp-date" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide font-sans">
              Data de Lançamento
            </label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F1115] border border-slate-850 rounded-xl text-xs font-mono focus:outline-none focus:border-rose-500 text-slate-350 cursor-pointer"
            />
          </div>

          <div className="border-t border-slate-850 pt-3 flex justify-between items-center text-xs font-bold text-slate-300 font-sans">
            <span>SAÍDA TOTAL CONTABILIZADA:</span>
            <span className="text-rose-400 font-mono text-sm">{formatCurrency(liveFormValue)}</span>
          </div>

          <button
            id="btn-add-expense"
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-550 active:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all border border-rose-500/20 shadow-lg shadow-rose-950/20 mt-2 cursor-pointer font-sans"
          >
            {editingExpense ? 'Salvar Edição' : 'Registrar Gasto'}
          </button>
        </form>
      </div>

      <div className="border-t border-slate-805/40 pt-5 pr-1 font-sans">
        <div className="flex items-center gap-1.5 mb-2 text-emerald-450">
          <Plus size={16} className="text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Criar Nova Categoria</h3>
        </div>
        <p className="text-[11px] text-slate-400 mb-3.5 leading-normal">
          Adicione categorias diretamente no seu Registro de Gastos e sincronize-as na aba de Subcategorias.
        </p>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="Exemplo: Marketing, Limpeza"
            className="flex-1 px-3.5 py-2 bg-[#0F1115] border border-slate-855 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-emerald-500 text-white font-bold uppercase transition-all"
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all h-[32px] cursor-pointer shrink-0"
          >
            Adicionar
          </button>
        </div>
        
        {catSuccessMsg && (
          <span className="text-[10px] text-emerald-400 mt-2 block font-medium">✓ {catSuccessMsg}</span>
        )}
        {catErrorMsg && (
          <span className="text-[10px] text-rose-400 mt-2 block font-medium">✗ {catErrorMsg}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      {viewMode === 'form' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Registro de Gastos</h1>
            <p className="text-slate-400 text-sm mt-1">Monitore os custos de funcionamento, taxas recolhidas para terceiros e gastos administrativos.</p>
          </div>
        </div>
      )}

      <div className={viewMode === 'form' ? "max-w-xl mx-auto w-full space-y-6" : "w-full"}>
        {/* Register Expense and Create Category combined container */}
        {viewMode === 'form' && expenseForm}

        {/* LAST LAUNCH CONFIRMATION PANEL FOR EXPENSES */}
        {viewMode === 'form' && lastLaunchedExpense && lastLaunchedExpensePanel}

        {/* INLINE EDIT EXPENSE OVERLAY MODAL */}
        {viewMode === 'list' && editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fadeIn">
              {expenseForm}
            </div>
          </div>
        )}

        {/* Expenses List & Filter Column */}
        {viewMode === 'list' && (
          <div className="space-y-5 animate-fadeIn">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* Filters bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white block">Movimentação de Saída</h3>
                <p className="text-xs text-slate-400 mt-0.5">Filtre despesas e confira os detalhamentos das despesas listadas</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1115] hover:bg-slate-900 border border-slate-800 hover:border-slate-750 text-xs font-bold text-slate-300 rounded-xl cursor-pointer transition-all shrink-0 select-none"
                >
                  <ArrowUpDown size={13} className="text-emerald-450" />
                  <span>Ordenação: <strong className="text-emerald-400">{sortOrder === 'oldest' ? 'Mais Velho → Mais Novo' : 'Mais Novo → Mais Velho'}</strong></span>
                </button>

                <span className="text-xs font-bold text-rose-455 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-lg font-mono">
                  Total Filtrado: -{formatCurrency(totalFilteredValue)}
                </span>
              </div>
            </div>

            {/* Filter selectors */}
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Search input */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buscar por Texto</span>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar por descrição, placa..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs placeholder-slate-650 focus:outline-none focus:border-rose-500 text-white font-medium"
                    />
                  </div>
                </div>

                {/* Category selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Categoria do Gasto</span>
                  <div className="relative">
                    <Filter size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405" />
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todas as Categorias</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Forma de Pagamento</span>
                  <div className="relative">
                    <Coins size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405" />
                    <select
                      value={selectedPaymentMethod}
                      onChange={e => setSelectedPaymentMethod(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="all">Todas as Formas</option>
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">DINHEIRO</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Start Date filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Início</span>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* End Date filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Data Fim</span>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0F1115] border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Filters button if any filter is dirty */}
              {(search || selectedCategory !== 'all' || startDate || endDate || selectedPaymentMethod !== 'all') && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('all');
                      setStartDate('');
                      setEndDate('');
                      setSelectedPaymentMethod('all');
                    }}
                    className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-rose-455 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-2xl">
                <Clipboard className="text-slate-600 w-12 h-12 mb-3" />
                <h4 className="font-bold text-slate-400 text-sm">Nenhuma despesa localizada</h4>
                <p className="text-xs text-slate-550 max-w-sm mt-1 mx-4">Insira novas despesas no formulário ao lado ou modifique as opções de pesquisa.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {filteredExpenses.map((expense) => {
                    const isExpanded = !!expandedRows[expense.id];
                    const hasItems = expense.items && expense.items.length > 0;
                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -15, transition: { duration: 0.15 } }}
                        layout
                        className="bg-[#0F1115] border border-slate-850 hover:border-slate-700 rounded-xl overflow-hidden transition-all shadow-xs animate-fadeIn"
                      >
                        <div 
                          onClick={() => hasItems && toggleRow(expense.id)}
                          className={`p-4 flex items-center justify-between ${hasItems ? 'cursor-pointer hover:bg-slate-900/40' : ''}`}
                        >
                          <div className="space-y-1.5 flex-1 pr-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-750 uppercase tracking-wider font-mono">
                                {expense.category}
                              </span>
                              
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                expense.paymentMethod === 'PIX' 
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                                  : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                              }`}>
                                {expense.paymentMethod || 'PIX'}
                              </span>

                              {expense.plate && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-850 text-amber-400 border border-amber-900/40 uppercase tracking-wider font-mono">
                                  {expense.plate}
                                </span>
                              )}

                              {hasItems && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-955/20 text-rose-400 border border-rose-900/30 uppercase tracking-wider font-mono">
                                  {expense.items?.length} Veículos
                                </span>
                              )}
                            </div>
                            
                            <h4 className="text-sm font-bold text-white font-sans">{expense.description}</h4>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-450 inline-flex items-center gap-1.5 font-medium">
                                <Calendar size={10} className="text-slate-500" />
                                {expense.date}
                              </span>
                              
                              {hasItems && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  Ver detalhado {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-bold text-rose-400 font-mono">
                                -{formatCurrency(expense.value)}
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingExpense(expense);
                                }}
                                className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-305 hover:text-emerald-400 border border-slate-755 transition-all cursor-pointer"
                                title="Editar Gasto"
                              >
                                <Pencil size={11} />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveExpense(expense.id);
                                }}
                                className="p-1 rounded bg-slate-850 hover:bg-rose-955/20 text-slate-305 hover:text-rose-450 border border-slate-755 transition-all cursor-pointer"
                                title="Remover Gasto"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsed breakdown of plates if multiple plates exists */}
                        {hasItems && isExpanded && (
                          <div className="px-5 pb-4 pt-2 bg-slate-900/30 border-t border-slate-850 space-y-2 animate-fadeIn">
                            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                              <Tag size={11} className="text-rose-450" />
                              Desdobramento de Custos por Veículo:
                            </span>
                            <div className="space-y-1 bg-[#161B22] border border-slate-850 rounded-lg p-2 font-mono text-[11px]">
                              {expense.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-850 last:border-0">
                                  <span>Placa: <strong className="text-white uppercase">{item.plate}</strong></span>
                                  <span className="font-semibold text-rose-400">{formatCurrency(item.value)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center text-xs font-bold text-white pt-1.5 border-t border-slate-850 mt-1 font-sans">
                                <span>SOMA CUMULATIVA:</span>
                                <span className="text-rose-400 font-mono">{formatCurrency(expense.value)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
          </div>
        )}

      </div>
    </div>
  );
}
