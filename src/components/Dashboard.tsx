/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Service, Expense, SubCategory, UserSession } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Plus, 
  FileText, 
  CreditCard,
  User,
  Calendar,
  Layers,
  Pencil,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  services: Service[];
  expenses: Expense[];
  subCategories: SubCategory[];
  onNavigate: (tab: string, initialStatus?: string) => void;
  onOpenNewServiceModal: () => void;
  onOpenNewExpenseModal: () => void;
  currentSession?: UserSession | null;
}

export default function Dashboard({
  services,
  expenses,
  subCategories,
  onNavigate,
  onOpenNewServiceModal,
  onOpenNewExpenseModal,
  currentSession
}: DashboardProps) {
  // Selected Month and Year states, defaulting to current month and year
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0'); // e.g. "06"
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString(); // e.g. "2026"
  });

  // "Lucro Livre" settings and calculations state
  const [selectedRevenueCats, setSelectedRevenueCats] = useState<string[]>([]);
  const [selectedExpenseCats, setSelectedExpenseCats] = useState<string[]>([]);
  const [selectedPersonalExpenseCats, setSelectedPersonalExpenseCats] = useState<string[]>([]);

  const username = currentSession?.username || 'admin';

  useEffect(() => {
    const savedRev = localStorage.getItem(`lucro_livre_revenue_cats_${username}`);
    if (savedRev) {
      try {
        setSelectedRevenueCats(JSON.parse(savedRev));
      } catch (e) {
        // Fallback
      }
    } else {
      // Default: find subcategories that match default names, or select all of them as fallback
      const userSubs = subCategories.filter(s => (s.type || 'RECEITA') === 'RECEITA');
      const defaultNames = ["HONORARIO", "HONORÁRIO", "RET. CRLV-E", "ATPV-E"];
      const matched = userSubs.filter(s => defaultNames.includes(s.name.toUpperCase().trim())).map(s => s.name.toUpperCase().trim());
      if (matched.length > 0) {
        setSelectedRevenueCats(matched);
      } else {
        setSelectedRevenueCats(userSubs.map(s => s.name.toUpperCase().trim()));
      }
    }

    const savedExp = localStorage.getItem(`lucro_livre_expense_cats_${username}`);
    if (savedExp) {
      try {
        setSelectedExpenseCats(JSON.parse(savedExp));
      } catch (e) {
        // Fallback
      }
    } else {
      // Default: find subcategories that match default names, or select all of them as fallback
      const userSubs = subCategories.filter(s => (s.type || 'RECEITA') === 'GASTO');
      const defaultNames = ["ALUGUEL", "EDP", "PLANO DE SAÚDE", "TAMANINI", "VIVO", "GRUPO LIMA", "TERMOS", "DAS MEI"];
      const matched = userSubs.filter(s => defaultNames.includes(s.name.toUpperCase().trim())).map(s => s.name.toUpperCase().trim());
      if (matched.length > 0) {
        setSelectedExpenseCats(matched);
      } else {
        setSelectedExpenseCats(userSubs.map(s => s.name.toUpperCase().trim()));
      }
    }

    const savedPersonalExp = localStorage.getItem(`personal_expense_cats_${username}`);
    if (savedPersonalExp) {
      try {
        setSelectedPersonalExpenseCats(JSON.parse(savedPersonalExp));
      } catch (e) {
        // Fallback
      }
    } else {
      setSelectedPersonalExpenseCats([]);
    }
  }, [username, subCategories]);

  const [editingType, setEditingType] = useState<'RECEITA' | 'GASTO' | 'PERSONAL_GASTO' | null>(null);
  const [tempSelectedCats, setTempSelectedCats] = useState<string[]>([]);

  // States to toggle collapse/expand details of Faturamento and Gastos cards
  const [isRevenuesExpanded, setIsRevenuesExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(`dashboard_revenues_expanded_${username}`);
      return stored !== 'false'; // defaults to true
    } catch {
      return true;
    }
  });

  const [isExpensesExpanded, setIsExpensesExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(`dashboard_expenses_expanded_${username}`);
      return stored !== 'false'; // defaults to true
    } catch {
      return true;
    }
  });

  const toggleRevenuesExpanded = () => {
    const nextVal = !isRevenuesExpanded;
    setIsRevenuesExpanded(nextVal);
    try {
      localStorage.setItem(`dashboard_revenues_expanded_${username}`, String(nextVal));
    } catch (e) {
      // ignore
    }
  };

  const toggleExpensesExpanded = () => {
    const nextVal = !isExpensesExpanded;
    setIsExpensesExpanded(nextVal);
    try {
      localStorage.setItem(`dashboard_expenses_expanded_${username}`, String(nextVal));
    } catch (e) {
      // ignore
    }
  };

  // Unique years option list extracted dynamically from services & expenses
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();
    
    services.forEach(s => {
      if (s.date && s.date.length >= 4) {
        yearsSet.add(s.date.substring(0, 4));
      }
    });
    expenses.forEach(e => {
      if (e.date && e.date.length >= 4) {
        yearsSet.add(e.date.substring(0, 4));
      }
    });
    
    // Fallback: If no registrations ever made, add the current year so select is never empty
    if (yearsSet.size === 0) {
      const currentYear = new Date().getFullYear().toString();
      yearsSet.add(currentYear);
    }
    
    return Array.from(yearsSet).sort();
  }, [services, expenses]);

  const monthsOptions = [
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
  ];

  const currentYearMonth = `${selectedYear}-${selectedMonth}`; 

  // Format currency in BRL
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Filter items for selected Year-Month (strictly PAID services only, as per user requirement)
  const servicesThisMonth = React.useMemo(() => {
    return services.filter(s => s.date.startsWith(currentYearMonth) && s.status === 'PAGO');
  }, [services, currentYearMonth]);

  const expensesThisMonth = React.useMemo(() => {
    return expenses.filter(e => e.date.startsWith(currentYearMonth));
  }, [expenses, currentYearMonth]);

  // Build lookup map for subcategory categoryGroup ('SERVIÇOS' | 'PESSOAIS' | 'OUTROS')
  const subCategoryGroupMap = React.useMemo(() => {
    const map: Record<string, 'SERVIÇOS' | 'PESSOAIS' | 'OUTROS'> = {};
    subCategories.forEach(sub => {
      const name = sub.name.trim().toUpperCase();
      map[name] = sub.categoryGroup || 'SERVIÇOS';
    });
    return map;
  }, [subCategories]);

  const servicosSubCategories = React.useMemo(() => {
    return subCategories.filter(s => (s.categoryGroup || 'SERVIÇOS') === 'SERVIÇOS');
  }, [subCategories]);

  const pessoaisSubCategories = React.useMemo(() => {
    return subCategories.filter(s => (s.categoryGroup || 'SERVIÇOS') === 'PESSOAIS');
  }, [subCategories]);

  const outrosSubCategories = React.useMemo(() => {
    return subCategories.filter(s => (s.categoryGroup || 'SERVIÇOS') === 'OUTROS');
  }, [subCategories]);

  // Collect all unique revenue categories
  const allRevenueCategories = React.useMemo(() => {
    const set = new Set<string>();
    subCategories
      .filter(s => (s.type || 'RECEITA') === 'RECEITA')
      .forEach(s => set.add(s.name.toUpperCase().trim()));
    return Array.from(set).sort();
  }, [subCategories]);

  // Collect all unique expense categories
  const allExpenseCategories = React.useMemo(() => {
    const set = new Set<string>();
    subCategories
      .filter(s => (s.type || 'RECEITA') === 'GASTO')
      .forEach(s => set.add(s.name.toUpperCase().trim()));
    return Array.from(set).sort();
  }, [subCategories]);

  // Filter and sum SERVIÇOS revenues for this month (Lucro Livre - Entradas)
  const selectedRevenuesSumThisMonth = React.useMemo(() => {
    let sum = 0;
    servicesThisMonth.forEach(srv => {
      if (srv.items) {
        srv.items.forEach(item => {
          const catName = (item.name || '').trim().toUpperCase();
          const group = subCategoryGroupMap[catName] || 'SERVIÇOS';
          if (group === 'SERVIÇOS') {
            sum += item.value;
          }
        });
      }
    });
    return sum;
  }, [servicesThisMonth, subCategoryGroupMap]);

  // Filter and sum SERVIÇOS expenses for this month (Lucro Livre - Saídas)
  const selectedExpensesSumThisMonth = React.useMemo(() => {
    let sum = 0;
    expensesThisMonth.forEach(exp => {
      if (exp.category) {
        const catName = exp.category.trim().toUpperCase();
        const group = subCategoryGroupMap[catName] || 'SERVIÇOS';
        if (group === 'SERVIÇOS') {
          sum += exp.value;
        }
      }
    });
    return sum;
  }, [expensesThisMonth, subCategoryGroupMap]);

  const lucroLivreTotalThisMonth = selectedRevenuesSumThisMonth - selectedExpensesSumThisMonth;

  // Filter and sum PESSOAIS expenses for this month (Gastos Pessoais)
  const personalExpensesSumThisMonth = React.useMemo(() => {
    let sum = 0;
    expensesThisMonth.forEach(exp => {
      if (exp.category) {
        const catName = exp.category.trim().toUpperCase();
        const group = subCategoryGroupMap[catName] || 'SERVIÇOS';
        if (group === 'PESSOAIS') {
          sum += exp.value;
        }
      }
    });
    return sum;
  }, [expensesThisMonth, subCategoryGroupMap]);

  // Filter and sum OUTROS revenues and expenses for this month
  const outrosRevenuesSumThisMonth = React.useMemo(() => {
    let sum = 0;
    servicesThisMonth.forEach(srv => {
      if (srv.items) {
        srv.items.forEach(item => {
          const catName = (item.name || '').trim().toUpperCase();
          const group = subCategoryGroupMap[catName] || 'SERVIÇOS';
          if (group === 'OUTROS') {
            sum += item.value;
          }
        });
      }
    });
    return sum;
  }, [servicesThisMonth, subCategoryGroupMap]);

  const outrosExpensesSumThisMonth = React.useMemo(() => {
    let sum = 0;
    expensesThisMonth.forEach(exp => {
      if (exp.category) {
        const catName = exp.category.trim().toUpperCase();
        const group = subCategoryGroupMap[catName] || 'SERVIÇOS';
        if (group === 'OUTROS') {
          sum += exp.value;
        }
      }
    });
    return sum;
  }, [expensesThisMonth, subCategoryGroupMap]);

  const outrosBalanceThisMonth = outrosRevenuesSumThisMonth - outrosExpensesSumThisMonth;

  // Metrics calculations
  const totalRevenuesThisMonth = React.useMemo(() => {
    return servicesThisMonth.reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [servicesThisMonth]);

  const paidRevenuesThisMonth = React.useMemo(() => {
    return servicesThisMonth
      .filter(s => s.status === 'PAGO')
      .reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [servicesThisMonth]);

  const pendingRevenuesThisMonth = React.useMemo(() => {
    return services
      .filter(s => s.date.startsWith(currentYearMonth) && s.status === 'PENDENTE')
      .reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [services, currentYearMonth]);

  const totalExpensesThisMonth = React.useMemo(() => {
    return expensesThisMonth.reduce((acc, curr) => acc + curr.value, 0);
  }, [expensesThisMonth]);
  const netBalanceThisMonth = totalRevenuesThisMonth - totalExpensesThisMonth;

  // Pending services (Contas a Receber)
  const pendingServicesAllTime = React.useMemo(() => {
    return services.filter(s => s.status === 'PENDENTE');
  }, [services]);

  const totalPendingAllTime = React.useMemo(() => {
    return pendingServicesAllTime.reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [pendingServicesAllTime]);

  // All Time calculations (Excluding PENDENTE status services)
  const totalRevenuesAllTime = React.useMemo(() => {
    return services
      .filter(s => s.status !== 'PENDENTE')
      .reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [services]);

  const totalExpensesAllTime = React.useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.value, 0);
  }, [expenses]);

  const netBalanceAllTime = totalRevenuesAllTime - totalExpensesAllTime;

  // Segmented calculations by payment method for the selected month
  const cashRevenues = React.useMemo(() => {
    return servicesThisMonth
      .filter(s => s.paymentMethod === 'DINHEIRO')
      .reduce((acc, s) => acc + s.totalValue, 0);
  }, [servicesThisMonth]);

  const cashExpenses = React.useMemo(() => {
    return expensesThisMonth
      .filter(e => (e.paymentMethod || 'PIX') === 'DINHEIRO')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expensesThisMonth]);

  const cashBalance = cashRevenues - cashExpenses;

  const pixRevenues = React.useMemo(() => {
    return servicesThisMonth
      .filter(s => s.paymentMethod === 'PIX')
      .reduce((acc, s) => acc + s.totalValue, 0);
  }, [servicesThisMonth]);

  const pixExpenses = React.useMemo(() => {
    return expensesThisMonth
      .filter(e => (e.paymentMethod || 'PIX') === 'PIX')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expensesThisMonth]);

  const pixBalance = pixRevenues - pixExpenses;

  // Segmented calculations by payment method - ALL TIME (Geral) (Excluding PENDENTE status services)
  const cashRevenuesAllTime = React.useMemo(() => {
    return services
      .filter(s => s.paymentMethod === 'DINHEIRO' && s.status !== 'PENDENTE')
      .reduce((acc, s) => acc + s.totalValue, 0);
  }, [services]);

  const cashExpensesAllTime = React.useMemo(() => {
    return expenses
      .filter(e => (e.paymentMethod || 'PIX') === 'DINHEIRO')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expenses]);

  const cashBalanceAllTime = cashRevenuesAllTime - cashExpensesAllTime;

  const pixRevenuesAllTime = React.useMemo(() => {
    return services
      .filter(s => s.paymentMethod === 'PIX' && s.status !== 'PENDENTE')
      .reduce((acc, s) => acc + s.totalValue, 0);
  }, [services]);

  const pixExpensesAllTime = React.useMemo(() => {
    return expenses
      .filter(e => (e.paymentMethod || 'PIX') === 'PIX')
      .reduce((acc, e) => acc + e.value, 0);
  }, [expenses]);

  const pixBalanceAllTime = pixRevenuesAllTime - pixExpensesAllTime;

  // Compute billing (revenues) by category for the selected month (from service items)
  const revenuesByCategory = React.useMemo(() => {
    const agg: { [key: string]: number } = {};
    servicesThisMonth.forEach(srv => {
      if (srv.items && srv.items.length > 0) {
        srv.items.forEach(item => {
          const catName = (item.name || 'OUTROS').trim().toUpperCase();
          agg[catName] = (agg[catName] || 0) + item.value;
        });
      }
    });
    return agg;
  }, [servicesThisMonth]);

  // Compute expenses (gastos) by category for the selected month
  const expensesByCategory = React.useMemo(() => {
    const agg: { [key: string]: number } = {};
    expensesThisMonth.forEach(exp => {
      const catName = (exp.category || 'OUTROS').trim().toUpperCase();
      agg[catName] = (agg[catName] || 0) + exp.value;
    });
    return agg;
  }, [expensesThisMonth]);

  // Compute counts for specific subcategories for the selected month
  const subcategoryCounts = React.useMemo(() => {
    let honorarios = 0;
    let honorariosRevenda = 0;
    let placas = 0;
    let retCrlve = 0;
    let atpv = 0;

    servicesThisMonth.forEach(srv => {
      if (srv.items && srv.items.length > 0) {
        srv.items.forEach(item => {
          const name = (item.name || '').trim().toUpperCase();
          const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          if (normalized === "HONORARIO REVENDA" || normalized.startsWith("HONORARIO REVENDA") || normalized.includes("REVENDA")) {
            honorariosRevenda++;
          } else if (normalized === "HONORARIO" || normalized === "HONORARIOS" || normalized.startsWith("HONORARIO")) {
            honorarios++;
          } else if (normalized === "PLACA" || normalized === "PLACAS" || normalized.startsWith("PLACA")) {
            placas++;
          } else if (normalized.includes("CRLV")) {
            retCrlve++;
          } else if (normalized === "ATPV-E" || normalized === "ATPV" || normalized.includes("ATPV")) {
            atpv++;
          }
        });
      }
    });

    return { honorarios, honorariosRevenda, placas, retCrlve, atpv };
  }, [servicesThisMonth]);

  // Find subcategories with matching/coincident names in both RECEITA and GASTO for this month
  const coincidentCategories = React.useMemo(() => {
    const list: Array<{ name: string; revenue: number; expense: number; balance: number }> = [];
    const revKeys = Object.keys(revenuesByCategory);
    revKeys.forEach(cat => {
      const catNorm = cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const expKey = Object.keys(expensesByCategory).find(k => {
        const kNorm = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return kNorm === catNorm || k.trim().toUpperCase() === cat.trim().toUpperCase();
      });
      
      if (expKey !== undefined) {
        const revVal = revenuesByCategory[cat];
        const expVal = expensesByCategory[expKey];
        list.push({
          name: cat,
          revenue: revVal,
          expense: expVal,
          balance: revVal - expVal
        });
      }
    });
    return list;
  }, [revenuesByCategory, expensesByCategory]);

  // Monthly stats for the 12 months of the selected year
  const monthsList = React.useMemo(() => [
    { name: 'Jan', key: `${selectedYear}-01`, label: 'Janeiro' },
    { name: 'Fev', key: `${selectedYear}-02`, label: 'Fevereiro' },
    { name: 'Mar', key: `${selectedYear}-03`, label: 'Março' },
    { name: 'Abr', key: `${selectedYear}-04`, label: 'Abril' },
    { name: 'Mai', key: `${selectedYear}-05`, label: 'Maio' },
    { name: 'Jun', key: `${selectedYear}-06`, label: 'Junho' },
    { name: 'Jul', key: `${selectedYear}-07`, label: 'Julho' },
    { name: 'Ago', key: `${selectedYear}-08`, label: 'Agosto' },
    { name: 'Set', key: `${selectedYear}-09`, label: 'Setembro' },
    { name: 'Out', key: `${selectedYear}-10`, label: 'Outubro' },
    { name: 'Nov', key: `${selectedYear}-11`, label: 'Novembro' },
    { name: 'Dez', key: `${selectedYear}-12`, label: 'Dezembro' }
  ], [selectedYear]);

  const chartData = React.useMemo(() => {
    return monthsList.map(month => {
      const monthServices = services.filter(s => s.date.startsWith(month.key) && s.status === 'PAGO');
      const monthExpenses = expenses.filter(e => e.date.startsWith(month.key));
      
      return {
        name: month.name,
        label: month.label,
        revenues: monthServices.reduce((acc, s) => acc + s.totalValue, 0),
        expenses: monthExpenses.reduce((acc, e) => acc + e.value, 0)
      };
    });
  }, [services, expenses, monthsList]);

  const maxChartValue = React.useMemo(() => {
    return Math.max(
      ...chartData.map(d => Math.max(d.revenues, d.expenses, 1000))
    ) * 1.15; // 15% padding top
  }, [chartData]);

  // Set selected hover data state for interactive chart tooltip
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Painel Principal</h1>
          <p className="text-slate-450 text-sm mt-1">
            Visão geral financeira e controle de documentações ({monthsOptions.find(m => m.value === selectedMonth)?.label}/{selectedYear})
          </p>
          
          {/* Month & Year Selectors */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mês:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3.5 py-1.5 bg-[#161B22] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-200 font-bold cursor-pointer transition-all uppercase"
              >
                {monthsOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ano:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="px-3.5 py-1.5 bg-[#161B22] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-200 font-bold cursor-pointer transition-all font-mono"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenNewServiceModal}
            id="btn-quick-service"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer border border-emerald-500/20"
          >
            <Plus size={16} />
            Novo Serviço
          </button>
          <button
            onClick={onOpenNewExpenseModal}
            id="btn-quick-expense"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-slate-100 font-medium text-sm rounded-xl shadow-sm border border-slate-700 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Main KPI Widget Grid - Row 1: Faturamento & Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Faturamento (Taller Card) */}
        <div className="space-y-6">
          {/* Metric Card: Total Receitas */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Faturamento (Mês)</p>
                <h3 className="text-2xl font-bold text-white mt-1.5 font-sans tracking-tight">
                  {formatCurrency(totalRevenuesThisMonth)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRevenuesExpanded}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title={isRevenuesExpanded ? "Esconder detalhes" : "Mostrar detalhes"}
                >
                  {isRevenuesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
            
            {isRevenuesExpanded && (
              <div className="animate-fadeIn">
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-400" />
                    Pago: <span className="font-semibold text-emerald-400">{formatCurrency(paidRevenuesThisMonth)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-amber-400" />
                    Pendente: <span className="font-semibold text-amber-400">{formatCurrency(pendingRevenuesThisMonth)}</span>
                  </span>
                </div>

                {/* Breakdown by Category */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento por Categoria:</span>
                  </div>
                  <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 select-none scrollbar-thin">
                    {(Object.entries(revenuesByCategory) as [string, number][]).length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">Nenhum faturamento registrado.</div>
                    ) : (
                      (Object.entries(revenuesByCategory) as [string, number][]).map(([cat, val]) => (
                        <div key={cat} className="flex justify-between items-center text-xs">
                           <span className="text-slate-300 font-medium truncate max-w-[130px]">{cat}</span>
                          <span className="font-mono font-bold text-emerald-400">{formatCurrency(val)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coincident Subcategories (Same name in Receita & Gasto) */}
                {coincidentCategories.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-800">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                      Saldos de Subcategorias Coincidentes:
                    </span>
                    <div className="space-y-2">
                      {coincidentCategories.map(item => (
                        <div key={item.name} className="p-2 bg-[#0F1115] border border-slate-800/60 rounded-xl text-xs leading-tight">
                          <div className="flex justify-between font-bold text-white mb-1.5 uppercase tracking-wide font-sans">
                            <span>{item.name}</span>
                            <span className={item.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              Saldo: {formatCurrency(item.balance)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-450 font-medium font-mono">
                            <span>Rec: +{formatCurrency(item.revenue)}</span>
                            <span>Gas: -{formatCurrency(item.expense)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Gastos Totais, Serviços Prestados & Saldo Líquido Total */}
        <div className="space-y-6">
          {/* Metric Card: Total Despesas */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gastos Totais (Mês)</p>
                <h3 className="text-2xl font-bold text-white mt-1.5 font-sans tracking-tight">
                  {formatCurrency(totalExpensesThisMonth)}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleExpensesExpanded}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title={isExpensesExpanded ? "Esconder detalhes" : "Mostrar detalhes"}
                >
                  {isExpensesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                  <TrendingDown size={20} />
                </div>
              </div>
            </div>
            
            {isExpensesExpanded && (
              <div className="animate-fadeIn">
                <div className="mt-4 text-[10px] text-slate-400 border-t border-slate-800/80 pt-3 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-450 animate-pulse"></span>
                  Total destinado a taxas, impostos e despesas internas
                </div>

                {/* Breakdown by Category */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gastos por Categoria:</span>
                  <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 select-none scrollbar-thin">
                    {(Object.entries(expensesByCategory) as [string, number][]).length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">Nenhum gasto registrado.</div>
                    ) : (
                      (Object.entries(expensesByCategory) as [string, number][]).map(([cat, val]) => (
                        <div key={cat} className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[130px]">{cat}</span>
                          <span className="font-mono font-bold text-rose-400">{formatCurrency(val)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metric Card: Serviços Prestados */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Serviços Prestados</p>
                <div className="space-y-1.5 mt-3">
                  <div className="flex justify-between items-center text-xs text-slate-300 pb-1 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Honorário:</span>
                    <span className="font-mono text-xs font-extrabold text-emerald-400">
                      {subcategoryCounts.honorarios}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300 pb-1 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Honorário Revenda:</span>
                    <span className="font-mono text-xs font-extrabold text-teal-400">
                      {subcategoryCounts.honorariosRevenda}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300 pb-1 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Placa:</span>
                    <span className="font-mono text-xs font-extrabold text-amber-400">
                      {subcategoryCounts.placas}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300 pb-1 border-b border-slate-800/60 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Ret. CRLV-E:</span>
                    <span className="font-mono text-xs font-extrabold text-blue-400">
                      {subcategoryCounts.retCrlve}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">ATPV-E:</span>
                    <span className="font-mono text-xs font-extrabold text-teal-400">
                      {subcategoryCounts.atpv}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Layers size={20} />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
              Quantidade de lançamentos das subcategorias no mês selecionado
            </div>
          </div>

          {/* Metric Card: Saldo Real */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Saldo Líquido Geral</p>
                <h3 className={`text-2xl font-bold mt-1.5 font-sans tracking-tight ${netBalanceAllTime >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netBalanceAllTime)}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              {/* DINHEIRO Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dinheiro</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Faturado</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatCurrency(cashRevenuesAllTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Gastos</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatCurrency(cashExpensesAllTime)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Saldo</span>
                    <span className={`font-mono font-bold ${cashBalanceAllTime >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(cashBalanceAllTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PIX Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pix</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Faturado</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatCurrency(pixRevenuesAllTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Gastos</span>
                    <span className="font-mono text-slate-300 font-semibold">{formatCurrency(pixExpensesAllTime)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Saldo</span>
                    <span className={`font-mono font-bold ${pixBalanceAllTime >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(pixBalanceAllTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TOTAL Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Faturado</span>
                    <span className="font-mono text-slate-200 font-semibold">{formatCurrency(totalRevenuesAllTime)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Gastos</span>
                    <span className="font-mono text-slate-200 font-semibold">{formatCurrency(totalExpensesAllTime)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Saldo</span>
                    <span className={`font-mono font-bold ${netBalanceAllTime >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(netBalanceAllTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center justify-between">
              <span>Filtro: Acumulado (Todos os Lançamentos)</span>
              <span className="font-mono text-slate-400">Geral</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Widget Grid - Row 2: Entradas por Canal, Saídas por Canal, Total do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Metric Card: Métodos de Pagamento */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Entradas por Canal</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between gap-12 text-sm text-slate-350">
                  <span className="font-semibold text-emerald-400">PIX:</span>
                  <span>
                    {formatCurrency(servicesThisMonth.filter(s => s.paymentMethod === 'PIX').reduce((acc, s) => acc + s.totalValue, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-350">
                  <span className="font-semibold text-amber-400 font-mono text-xs">DINHEIRO:</span>
                  <span>
                    {formatCurrency(servicesThisMonth.filter(s => s.paymentMethod === 'DINHEIRO').reduce((acc, s) => acc + s.totalValue, 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
            Estatísticas de recebíveis do mês selecionado
          </div>
        </div>

        {/* Metric Card: Saídas por Canal */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Saídas por Canal</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between gap-12 text-sm text-slate-350">
                  <span className="font-semibold text-emerald-400">PIX:</span>
                  <span>
                    {formatCurrency(expensesThisMonth.filter(e => (e.paymentMethod || 'PIX') === 'PIX').reduce((acc, e) => acc + e.value, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-350">
                  <span className="font-semibold text-amber-400 font-mono text-xs">DINHEIRO:</span>
                  <span>
                    {formatCurrency(expensesThisMonth.filter(e => (e.paymentMethod || 'PIX') === 'DINHEIRO').reduce((acc, e) => acc + e.value, 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
            Estatísticas de pagamentos do mês selecionado
          </div>
        </div>

        {/* Metric Card: Total do Mês */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div className="w-full">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total do Mês</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between gap-12 text-sm text-slate-350">
                  <span className="font-semibold text-emerald-400">ENTRADA TOTAL:</span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(totalRevenuesThisMonth)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-350">
                  <span className="font-semibold text-rose-400">SAÍDA TOTAL:</span>
                  <span className="font-semibold text-rose-400">
                    {formatCurrency(totalExpensesThisMonth)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-350 border-t border-slate-800/80 pt-1 mt-1">
                  <span className="font-semibold text-slate-300">SALDO DO MÊS:</span>
                  <span className={`font-bold ${netBalanceThisMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(netBalanceThisMonth)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 ml-2">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
            Estatísticas consolidadas do mês selecionado
          </div>
        </div>
      </div>

      {/* Main KPI Widget Grid - Row 3: Quadros de Tipos (Serviços / Pessoais / Outros) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Quadro 1: Lucro Livre (Categoria SERVIÇOS) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Lucro Livre (Serviços)
                </p>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
                  Categoria: SERVIÇOS
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-4">
              {/* Entradas */}
              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Entradas (Serviços)</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {servicosSubCategories.filter(s => (s.type || 'RECEITA') === 'RECEITA').length} subcat.
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200 block font-mono">
                  {formatCurrency(selectedRevenuesSumThisMonth)}
                </span>
              </div>

              {/* Saídas */}
              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Saídas (Serviços)</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {servicosSubCategories.filter(s => (s.type || 'RECEITA') === 'GASTO').length} subcat.
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200 block font-mono">
                  {formatCurrency(selectedExpensesSumThisMonth)}
                </span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex justify-between text-sm text-slate-350 border-t border-slate-800/80 pt-2.5 mt-3">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">LUCRO LIVRE TOTAL:</span>
              <span className={`font-bold text-xs font-mono ${lucroLivreTotalThisMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(lucroLivreTotalThisMonth)}
              </span>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2.5">
            Automaticamente calculado para a categoria SERVIÇOS
          </div>
        </div>

        {/* Quadro 2: Gastos Pessoais (Categoria PESSOAIS) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Gastos Pessoais
                </p>
                <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block mt-0.5">
                  Categoria: PESSOAIS
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
                <User size={18} />
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Subcategorias de Pessoais
                </span>
                <p className="text-[11px] text-slate-300 font-medium truncate">
                  {pessoaisSubCategories.length === 0 
                    ? 'Nenhuma subcategoria cadastrada' 
                    : pessoaisSubCategories.map(s => s.name).join(', ')}
                </p>
              </div>

              <div className="bg-[#0F1115] p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                  Total de Gastos (Mês)
                </span>
                <span className="text-xl font-black text-white block font-mono">
                  {formatCurrency(personalExpensesSumThisMonth)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2.5">
            Automaticamente calculado para a categoria PESSOAIS
          </div>
        </div>

        {/* Quadro 3: Outros (Categoria OUTROS) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Movimentações Outros
                </p>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mt-0.5">
                  Categoria: OUTROS
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Layers size={18} />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mt-4">
              {/* Entradas Outros */}
              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Entradas (Outros)</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {outrosSubCategories.filter(s => (s.type || 'RECEITA') === 'RECEITA').length} subcat.
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200 block font-mono">
                  {formatCurrency(outrosRevenuesSumThisMonth)}
                </span>
              </div>

              {/* Saídas Outros */}
              <div className="bg-[#0F1115] p-2.5 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Saídas (Outros)</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {outrosSubCategories.filter(s => (s.type || 'RECEITA') === 'GASTO').length} subcat.
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-200 block font-mono">
                  {formatCurrency(outrosExpensesSumThisMonth)}
                </span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex justify-between text-sm text-slate-350 border-t border-slate-800/80 pt-2.5 mt-3">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">SALDO OUTROS:</span>
              <span className={`font-bold text-xs font-mono ${outrosBalanceThisMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(outrosBalanceThisMonth)}
              </span>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-2.5">
            Automaticamente calculado para a categoria OUTROS
          </div>
        </div>
      </div>

      {/* Contas a Receber (Accounts Receivable) Widget */}
      <div 
        onClick={() => onNavigate('reports-services', 'PENDENTE')}
        className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm mb-6 hover:border-amber-500/45 hover:bg-slate-800/10 transition-all cursor-pointer relative overflow-hidden group select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Contas a Receber</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-amber-500 font-mono">
                {formatCurrency(totalPendingAllTime)}
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                ({pendingServicesAllTime.length} {pendingServicesAllTime.length === 1 ? 'lançamento pendente' : 'lançamentos pendentes'})
              </span>
            </div>
            <p className="text-xs text-slate-450 mt-1">Clique para abrir o relatório de serviços filtrado por faturas pendentes</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-amber-500/20 group-hover:border-amber-500/40 cursor-pointer self-start sm:self-center">
          <span>Ver Detalhes</span>
          <FileText size={14} />
        </div>
      </div>

      {/* Main Stats Column with Custom Grouped SVG Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-3 bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Evolução Financeira {selectedYear}</h3>
              <p className="text-xs text-slate-400">Comparação anual entre receitas brutas de serviços e despesas internas de {selectedYear}</p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span className="text-slate-300">Receitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-500 inline-block"></span>
                <span className="text-slate-300">Despesas</span>
              </div>
            </div>
          </div>

          {/* Interactive Responsive SVG Bar Chart */}
          <div className="relative h-64 w-full">
            <svg viewBox="0 0 600 240" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 20 + ratio * 180;
                const valueLine = maxChartValue * (1 - ratio);
                return (
                  <g key={i}>
                    <line x1="45" y1={y} x2="580" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="5" y={y + 4} fill="#64748b" className="text-[10px] font-mono font-medium">
                      {Math.round(valueLine)}
                    </text>
                  </g>
                );
              })}

              {/* Draw Bars */}
              {chartData.map((data, index) => {
                const groupWidth = 44;
                const gap = 3;
                const barWidth = 8;
                const startX = 50 + index * groupWidth + 6;

                // Compute heights based on ratio
                const rHeight = (data.revenues / maxChartValue) * 180;
                const eHeight = (data.expenses / maxChartValue) * 180;

                const rY = 200 - rHeight;
                const eY = 200 - eHeight;

                const isHovered = hoveredBarIndex === index;

                return (
                  <g 
                    key={index} 
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover highlights background column zone */}
                    {isHovered && (
                      <rect 
                        x={startX - 4} 
                        y="10" 
                        width={barWidth * 2 + gap + 8} 
                        height="200" 
                        fill="#1e293b" 
                        rx="4" 
                        opacity="0.6" 
                      />
                    )}

                    {/* Revenue Bar (Emerald Green) */}
                    <rect
                      x={startX}
                      y={rY}
                      width={barWidth}
                      height={Math.max(rHeight, 4)}
                      rx="1.5"
                      fill={isHovered ? '#34d399' : '#10b981'}
                      className="transition-all duration-300"
                    />

                    {/* Expense Bar (Slate Gray) */}
                    <rect
                      x={startX + barWidth + gap}
                      y={eY}
                      width={barWidth}
                      height={Math.max(eHeight, 4)}
                      rx="1.5"
                      fill={isHovered ? '#94a3b8' : '#64748b'}
                      className="transition-all duration-300"
                    />

                    {/* Month Text Anchor */}
                    <text
                      x={startX + barWidth / 2 + gap / 2}
                      y="218"
                      textAnchor="middle"
                      fill={isHovered ? '#ffffff' : '#94a3b8'}
                      className="text-[9px] font-bold tracking-wide"
                    >
                      {data.name}
                    </text>
                  </g>
                );
              })}

              {/* Bottom solid line */}
              <line x1="45" y1="200" x2="580" y2="200" stroke="#334155" strokeWidth="1.5" />
            </svg>

            {/* Interactive Float Tooltip overlay */}
            {hoveredBarIndex !== null && (
              <div 
                className="absolute z-10 p-3 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-700 text-xs flex flex-col gap-1 w-44"
                style={{
                  left: `${Math.min(70, Math.max(5, 5 + hoveredBarIndex * 7.5))}%`,
                  top: '15px',
                  pointerEvents: 'none'
                }}
              >
                <div className="font-bold border-b border-slate-800 pb-1 text-emerald-450">
                  {chartData[hoveredBarIndex].label} de {selectedYear}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-400">Serviços:</span>
                  <span className="font-semibold text-emerald-450">
                    {formatCurrency(chartData[hoveredBarIndex].revenues)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Despesas:</span>
                  <span className="font-semibold text-slate-300">
                    {formatCurrency(chartData[hoveredBarIndex].expenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-0.5 font-bold animate-fadeIn">
                  <span className="text-slate-300">Saldo:</span>
                  <span className={chartData[hoveredBarIndex].revenues - chartData[hoveredBarIndex].expenses >= 0 ? 'text-emerald-450' : 'text-red-400'}>
                    {formatCurrency(chartData[hoveredBarIndex].revenues - chartData[hoveredBarIndex].expenses)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-center">
            <p className="text-[11px] text-slate-400 font-medium">Passe o mouse por cima das colunas dos meses para ver os dados detalhados em tempo real.</p>
          </div>
        </div>
      </div>

      {/* Lucro Livre Configuration Modal */}
      {editingType !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl relative animate-scaleIn">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Pencil size={14} className="text-indigo-400" />
                  <span>Configurar {editingType === 'RECEITA' ? 'Entradas' : editingType === 'GASTO' ? 'Saídas' : 'Gastos Pessoais'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {editingType === 'PERSONAL_GASTO' ? 'Selecione as categorias de Gastos Pessoais' : 'Selecione as categorias do Lucro Livre'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-850 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-1.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {editingType === 'RECEITA' ? (
                allRevenueCategories.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhuma categoria encontrada.</p>
                ) : (
                  allRevenueCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-2.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer text-xs font-semibold text-slate-300 transition-all">
                      <input
                        type="checkbox"
                        checked={tempSelectedCats.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedCats([...tempSelectedCats, cat]);
                          } else {
                            setTempSelectedCats(tempSelectedCats.filter(c => c !== cat));
                          }
                        }}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  ))
                )
              ) : (
                allExpenseCategories.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhuma categoria encontrada.</p>
                ) : (
                  allExpenseCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-2.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer text-xs font-semibold text-slate-300 transition-all">
                      <input
                        type="checkbox"
                        checked={tempSelectedCats.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedCats([...tempSelectedCats, cat]);
                          } else {
                            setTempSelectedCats(tempSelectedCats.filter(c => c !== cat));
                          }
                        }}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end border-t border-slate-800 pt-4 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingType === 'RECEITA') {
                    setSelectedRevenueCats(tempSelectedCats);
                    localStorage.setItem(`lucro_livre_revenue_cats_${username}`, JSON.stringify(tempSelectedCats));
                  } else if (editingType === 'GASTO') {
                    setSelectedExpenseCats(tempSelectedCats);
                    localStorage.setItem(`lucro_livre_expense_cats_${username}`, JSON.stringify(tempSelectedCats));
                  } else if (editingType === 'PERSONAL_GASTO') {
                    setSelectedPersonalExpenseCats(tempSelectedCats);
                    localStorage.setItem(`personal_expense_cats_${username}`, JSON.stringify(tempSelectedCats));
                  }
                  setEditingType(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Salvar
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
