/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Service, Expense, SubCategory } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  Sparkles,
  Printer,
  User
} from 'lucide-react';

interface ReportsComparativeProps {
  services: Service[];
  expenses: Expense[];
  subCategories: SubCategory[];
  currentSession?: { username: string } | null;
}

export default function ReportsComparative({ services, expenses, subCategories, currentSession }: ReportsComparativeProps) {
  // Helper to get formatted dates
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() - offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthStartString = (monthOffset = 0) => {
    const d = new Date();
    if (monthOffset !== 0) {
      d.setMonth(d.getMonth() - monthOffset);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  // State for date ranges
  // Period A defaults: Current month start to today
  const [startDateA, setStartDateA] = useState<string>(getMonthStartString(0));
  const [endDateA, setEndDateA] = useState<string>(getLocalDateString(0));

  // Period B defaults: Previous month start to previous month today equivalent
  const [startDateB, setStartDateB] = useState<string>(getMonthStartString(1));
  const [endDateB, setEndDateB] = useState<string>(getLocalDateString(30)); // approx 30 days ago

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const username = currentSession?.username || 'admin';

  const selectedPersonalExpenseCats = useMemo(() => {
    const saved = localStorage.getItem(`personal_expense_cats_${username}`);
    if (saved) {
      try {
        return JSON.parse(saved) as string[];
      } catch (e) {
        // Fallback
      }
    }
    return [] as string[];
  }, [username]);

  // Helper to compute metrics for a single period
  const computePeriodMetrics = (start: string, end: string) => {
    const filteredServices = services.filter(s => s.date >= start && s.date <= end);
    const filteredExpenses = expenses.filter(e => e.date >= start && e.date <= end);

    // 1. Core revenues
    const totalRevenues = filteredServices.reduce((sum, s) => sum + s.totalValue, 0);
    const paidRevenues = filteredServices.filter(s => s.status === 'PAGO').reduce((sum, s) => sum + s.totalValue, 0);
    const pendingRevenues = filteredServices.filter(s => s.status === 'PENDENTE').reduce((sum, s) => sum + s.totalValue, 0);

    // 2. Core expenses
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.value, 0);

    // 3. Net profits
    const netProfitRealized = paidRevenues - totalExpenses;
    const netProfitTotal = totalRevenues - totalExpenses;

    // 4. Segmented payments (Pix vs Cash) for PAGO revenues
    const pixRevenues = filteredServices
      .filter(s => s.status === 'PAGO' && s.paymentMethod === 'PIX')
      .reduce((sum, s) => sum + s.totalValue, 0);
    const cashRevenues = filteredServices
      .filter(s => s.status === 'PAGO' && s.paymentMethod === 'DINHEIRO')
      .reduce((sum, s) => sum + s.totalValue, 0);

    // Segmented payments for Expenses
    const pixExpenses = filteredExpenses
      .filter(e => e.paymentMethod === 'PIX')
      .reduce((sum, e) => sum + e.value, 0);
    const cashExpenses = filteredExpenses
      .filter(e => e.paymentMethod === 'DINHEIRO')
      .reduce((sum, e) => sum + e.value, 0);

    // 5. Quantitative counts (same as dashboard)
    let honorarios = 0;
    let honorariosRevenda = 0;
    let placas = 0;
    let retCrlve = 0;
    let atpv = 0;

    filteredServices.forEach(srv => {
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

    // 6. Revenue and Expense Categories sums
    const revenuesByCategory: Record<string, number> = {};
    filteredServices.forEach(s => {
      if (s.items && s.items.length > 0) {
        s.items.forEach(item => {
          const catName = item.name || 'Outros';
          revenuesByCategory[catName] = (revenuesByCategory[catName] || 0) + item.value;
        });
      }
    });

    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const catName = e.category || 'Outros';
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + e.value;
    });

    // 7. Personal expenses total and breakdown
    let personalExpensesTotal = 0;
    const personalExpensesByCategory: Record<string, number> = {};

    filteredExpenses.forEach(e => {
      if (e.category) {
        const catName = e.category.trim().toUpperCase();
        const normCatName = catName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchedCat = selectedPersonalExpenseCats.find(sel => {
          const selNorm = sel.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return selNorm === normCatName || sel.trim().toUpperCase() === catName;
        });

        if (matchedCat) {
          personalExpensesTotal += e.value;
          personalExpensesByCategory[matchedCat] = (personalExpensesByCategory[matchedCat] || 0) + e.value;
        }
      }
    });

    return {
      totalRevenues,
      paidRevenues,
      pendingRevenues,
      totalExpenses,
      netProfitRealized,
      netProfitTotal,
      pixRevenues,
      cashRevenues,
      pixExpenses,
      cashExpenses,
      quantitatives: { honorarios, honorariosRevenda, placas, retCrlve, atpv },
      revenuesByCategory,
      expensesByCategory,
      rawServicesCount: filteredServices.length,
      rawExpensesCount: filteredExpenses.length,
      personalExpensesTotal,
      personalExpensesByCategory
    };
  };

  // Compute metrics for both periods
  const metricsA = useMemo(() => computePeriodMetrics(startDateA, endDateA), [startDateA, endDateA, services, expenses, selectedPersonalExpenseCats]);
  const metricsB = useMemo(() => computePeriodMetrics(startDateB, endDateB), [startDateB, endDateB, services, expenses, selectedPersonalExpenseCats]);

  // Helper to calculate percentage variance
  const getVariance = (valA: number, valB: number) => {
    const diff = valA - valB;
    if (valB === 0) {
      return { diff, pct: valA > 0 ? 100 : valA < 0 ? -100 : 0 };
    }
    const pct = (diff / valB) * 100;
    return { diff, pct };
  };

  // List of all category comparisons
  const revenueCategoriesComparison = useMemo(() => {
    const allCats = new Set([...Object.keys(metricsA.revenuesByCategory), ...Object.keys(metricsB.revenuesByCategory)]);
    return Array.from(allCats).map(cat => {
      const valA = metricsA.revenuesByCategory[cat] || 0;
      const valB = metricsB.revenuesByCategory[cat] || 0;
      const { diff, pct } = getVariance(valA, valB);
      return { category: cat, valA, valB, diff, pct };
    }).sort((a, b) => b.valA - a.valA);
  }, [metricsA, metricsB]);

  const expenseCategoriesComparison = useMemo(() => {
    const allCats = new Set([...Object.keys(metricsA.expensesByCategory), ...Object.keys(metricsB.expensesByCategory)]);
    return Array.from(allCats).map(cat => {
      const valA = metricsA.expensesByCategory[cat] || 0;
      const valB = metricsB.expensesByCategory[cat] || 0;
      const { diff, pct } = getVariance(valA, valB);
      return { category: cat, valA, valB, diff, pct };
    }).sort((a, b) => b.valA - a.valA);
  }, [metricsA, metricsB]);

  const personalExpenseCategoriesComparison = useMemo(() => {
    return selectedPersonalExpenseCats.map(cat => {
      const valA = metricsA.personalExpensesByCategory[cat] || 0;
      const valB = metricsB.personalExpensesByCategory[cat] || 0;
      const { diff, pct } = getVariance(valA, valB);
      return { category: cat, valA, valB, diff, pct };
    }).sort((a, b) => b.valA - a.valA);
  }, [metricsA, metricsB, selectedPersonalExpenseCats]);

  // Generate Portuguese descriptive textual analysis
  const textualAnalysis = useMemo(() => {
    const profitVar = getVariance(metricsA.netProfitRealized, metricsB.netProfitRealized);
    const revVar = getVariance(metricsA.paidRevenues, metricsB.paidRevenues);
    const expVar = getVariance(metricsA.totalExpenses, metricsB.totalExpenses);

    // Finding top revenue category growth
    const topRevGrowth = [...revenueCategoriesComparison]
      .filter(c => c.diff > 0)
      .sort((a, b) => b.diff - a.diff)[0];

    const topRevShrink = [...revenueCategoriesComparison]
      .filter(c => c.diff < 0)
      .sort((a, b) => a.diff - b.diff)[0];

    // Finding top expense category increase
    const topExpGrowth = [...expenseCategoriesComparison]
      .filter(c => c.diff > 0)
      .sort((a, b) => b.diff - a.diff)[0];

    let summaryText = "";
    summaryText += `No primeiro período selecionado (${formatDateLabel(startDateA)} até ${formatDateLabel(endDateA)}), o faturamento líquido realizado (entradas pagas) foi de ${formatCurrency(metricsA.paidRevenues)}, enquanto as despesas totalizaram ${formatCurrency(metricsA.totalExpenses)}. Isso resultou em um lucro líquido realizado de ${formatCurrency(metricsA.netProfitRealized)}. `;
    
    summaryText += `Em comparação, no segundo período selecionado (${formatDateLabel(startDateB)} até ${formatDateLabel(endDateB)}), as entradas pagas foram de ${formatCurrency(metricsB.paidRevenues)} e as despesas foram de ${formatCurrency(metricsB.totalExpenses)}, gerando um lucro líquido realizado de ${formatCurrency(metricsB.netProfitRealized)}. `;

    if (profitVar.diff > 0) {
      summaryText += `Dessa forma, o primeiro período obteve um lucro líquido realizado ${formatCurrency(profitVar.diff)} maior (+${profitVar.pct.toFixed(1)}%) em relação ao segundo período analisado. `;
    } else if (profitVar.diff < 0) {
      summaryText += `Dessa forma, o primeiro período obteve um lucro líquido realizado ${formatCurrency(Math.abs(profitVar.diff))} menor (${profitVar.pct.toFixed(1)}%) em relação ao segundo período analisado. `;
    } else {
      summaryText += `Os dois períodos apresentaram lucros líquidos realizados equivalentes. `;
    }

    // Category insights
    if (topRevGrowth || topRevShrink) {
      summaryText += `\n\n**Análise de Categorias de Entrada**: `;
      if (topRevGrowth) {
        summaryText += `Tivemos um aumento relevante na categoria de receita "${topRevGrowth.category}", que gerou ${formatCurrency(topRevGrowth.diff)} a mais no Período A. `;
      }
      if (topRevShrink) {
        summaryText += `Em contrapartida, tivemos um desempenho menor na categoria "${topRevShrink.category}", registrando uma redução de ${formatCurrency(Math.abs(topRevShrink.diff))} no volume financeiro total. `;
      }
    }

    if (topExpGrowth) {
      summaryText += `\n\n**Análise de Gastos/Saídas**: O principal aumento de despesas de um período ao outro ocorreu na categoria "${topExpGrowth.category}", com uma alta de ${formatCurrency(topExpGrowth.diff)} (+${topExpGrowth.pct.toFixed(1)}%). `;
    }

    // Quantitative metrics text
    summaryText += `\n\n**Análise Quantitativa**: `;
    summaryText += `No período de ${formatDateLabel(startDateA)} até ${formatDateLabel(endDateA)}, registramos o lançamento de ${metricsA.quantitatives.honorarios} Honorários (contra ${metricsB.quantitatives.honorarios} no período comparado), ${metricsA.quantitatives.placas} Placas (contra ${metricsB.quantitatives.placas}), ${metricsA.quantitatives.honorariosRevenda} Honorários de Revenda (contra ${metricsB.quantitatives.honorariosRevenda}), ${metricsA.quantitatives.retCrlve} Retiradas de CRLV-E (contra ${metricsB.quantitatives.retCrlve}) e ${metricsA.quantitatives.atpv} ATPV-E (contra ${metricsB.quantitatives.atpv} no período comparado). `;

    // Payment methods
    const pixVar = getVariance(metricsA.pixRevenues, metricsB.pixRevenues);
    summaryText += `Adicionalmente, os recebimentos via PIX foram de ${formatCurrency(metricsA.pixRevenues)} (Período A) contra ${formatCurrency(metricsB.pixRevenues)} (Período B), indicando uma variação de ${pixVar.diff >= 0 ? '+' : ''}${pixVar.pct.toFixed(1)}% nesta modalidade de pagamento.`;

    // Personal expenses insight
    if (selectedPersonalExpenseCats.length > 0) {
      const personalVar = getVariance(metricsA.personalExpensesTotal, metricsB.personalExpensesTotal);
      summaryText += `\n\n**Análise de Gastos Pessoais**: `;
      summaryText += `Os gastos de caráter pessoal nas categorias selecionadas totalizaram ${formatCurrency(metricsA.personalExpensesTotal)} no Período A, comparado com ${formatCurrency(metricsB.personalExpensesTotal)} no Período B. `;
      if (personalVar.diff > 0) {
        summaryText += `Isso representa um aumento de ${formatCurrency(personalVar.diff)} (+${personalVar.pct.toFixed(1)}%) nas despesas pessoais do primeiro período em relação ao segundo. `;
      } else if (personalVar.diff < 0) {
        summaryText += `Isso representa uma redução de ${formatCurrency(Math.abs(personalVar.diff))} (${personalVar.pct.toFixed(1)}%) nas despesas pessoais do primeiro período em relação ao segundo. `;
      } else {
        summaryText += `As despesas pessoais mantiveram-se estáveis e idênticas em ambos os períodos. `;
      }
    }

    return summaryText;
  }, [metricsA, metricsB, revenueCategoriesComparison, expenseCategoriesComparison, startDateA, endDateA, startDateB, endDateB, selectedPersonalExpenseCats]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      
      {/* Date Selectors Row */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Calendar size={18} className="text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Definição dos Períodos para Comparação</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period A */}
          <div className="space-y-4 p-4 bg-[#0F1115] rounded-xl border border-slate-850/60">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
              Período Principal (A)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">De:</label>
                <input
                  type="date"
                  value={startDateA}
                  onChange={(e) => setStartDateA(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Até:</label>
                <input
                  type="date"
                  value={endDateA}
                  onChange={(e) => setEndDateA(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Period B */}
          <div className="space-y-4 p-4 bg-[#0F1115] rounded-xl border border-slate-850/60">
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block">
              Período de Comparação (B)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">De:</label>
                <input
                  type="date"
                  value={startDateB}
                  onChange={(e) => setStartDateB(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Até:</label>
                <input
                  type="date"
                  value={endDateB}
                  onChange={(e) => setEndDateB(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs uppercase rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            <Printer size={14} />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Narrative AI/System Executive Summary Text */}
      <div className="bg-slate-900/50 border-2 border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-emerald-500/10">
          <Sparkles size={120} />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUpIcon size={16} />
            </div>
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Análise Descritiva Comparativa (Demonstrativo Financeiro)
            </h2>
          </div>
          
          <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
            {textualAnalysis}
          </div>
        </div>
      </div>

      {/* Side-by-Side KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Entradas Realizadas (PAGO) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entradas Pagas (Realizado)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight size={16} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-450">Período A:</span>
              <span className="text-lg font-black text-white font-mono">{formatCurrency(metricsA.paidRevenues)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-850 pb-2.5">
              <span className="text-xs text-slate-450">Período B:</span>
              <span className="text-sm font-bold text-slate-400 font-mono">{formatCurrency(metricsB.paidRevenues)}</span>
            </div>
            
            {/* Variance */}
            {(() => {
              const { diff, pct } = getVariance(metricsA.paidRevenues, metricsB.paidRevenues);
              return (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Variação:</span>
                  <span className={`font-bold font-mono flex items-center gap-1 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Saídas Totais (Gasto) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-400"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saídas Registradas</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-450">Período A:</span>
              <span className="text-lg font-black text-white font-mono">{formatCurrency(metricsA.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-850 pb-2.5">
              <span className="text-xs text-slate-450">Período B:</span>
              <span className="text-sm font-bold text-slate-400 font-mono">{formatCurrency(metricsB.totalExpenses)}</span>
            </div>
            
            {/* Variance */}
            {(() => {
              const { diff, pct } = getVariance(metricsA.totalExpenses, metricsB.totalExpenses);
              return (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400">Variação:</span>
                  <span className={`font-bold font-mono flex items-center gap-1 ${diff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diff > 0 ? '+' : ''}{pct.toFixed(1)}%)
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Lucro Líquido & Gastos Pessoais Column */}
        <div className="space-y-6">
          {/* Lucro Líquido */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-400"></div>
            
            {/* Lucro Líquido Realizado Section */}
            <div className="mb-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Lucro Líquido Realizado</span>
                  <span className="text-[9px] text-slate-450 uppercase tracking-wide block">(Apenas Entradas com Status PAGO)</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Coins size={16} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-450">Período A:</span>
                  <span className={`text-base font-black font-mono ${metricsA.netProfitRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(metricsA.netProfitRealized)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-850/60 pb-2">
                  <span className="text-xs text-slate-450">Período B:</span>
                  <span className={`text-xs font-bold font-mono ${metricsB.netProfitRealized >= 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
                    {formatCurrency(metricsB.netProfitRealized)}
                  </span>
                </div>
                
                {/* Variance */}
                {(() => {
                  const { diff, pct } = getVariance(metricsA.netProfitRealized, metricsB.netProfitRealized);
                  return (
                    <div className="flex justify-between items-center text-[11px] pt-0.5">
                      <span className="text-slate-405">Variação Realizada:</span>
                      <span className={`font-bold font-mono flex items-center gap-1 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Separator line */}
            <div className="border-t border-slate-800/80 my-4"></div>

            {/* Lucro Líquido Previsto / Geral Section */}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Lucro Líquido Geral / Previsto</span>
                  <span className="text-[9px] text-slate-450 uppercase tracking-wide block">(Todas as Entradas: Pagas + Pendentes)</span>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Coins size={16} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-450">Período A:</span>
                  <span className={`text-base font-black font-mono ${metricsA.netProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(metricsA.netProfitTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-slate-850/60 pb-2">
                  <span className="text-xs text-slate-450">Período B:</span>
                  <span className={`text-xs font-bold font-mono ${metricsB.netProfitTotal >= 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
                    {formatCurrency(metricsB.netProfitTotal)}
                  </span>
                </div>
                
                {/* Variance */}
                {(() => {
                  const { diff, pct } = getVariance(metricsA.netProfitTotal, metricsB.netProfitTotal);
                  return (
                    <div className="flex justify-between items-center text-[11px] pt-0.5">
                      <span className="text-slate-405">Variação Geral:</span>
                      <span className={`font-bold font-mono flex items-center gap-1 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Gastos Pessoais Comparativo Card */}
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gastos Pessoais Comparativo</span>
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                <User size={16} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-450">Período A:</span>
                <span className="text-lg font-black text-white font-mono">
                  {formatCurrency(metricsA.personalExpensesTotal)}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-slate-850 pb-2.5">
                <span className="text-xs text-slate-450">Período B:</span>
                <span className="text-sm font-bold text-slate-400 font-mono">
                  {formatCurrency(metricsB.personalExpensesTotal)}
                </span>
              </div>
              
              {/* Variance */}
              {(() => {
                const { diff, pct } = getVariance(metricsA.personalExpensesTotal, metricsB.personalExpensesTotal);
                return (
                  <div className="flex justify-between items-center text-xs pt-1 border-b border-slate-850 pb-2.5">
                    <span className="text-slate-400">Variação:</span>
                    <span className={`font-bold font-mono flex items-center gap-1 ${diff <= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                      {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diff > 0 ? '+' : ''}{pct.toFixed(1)}%)
                    </span>
                  </div>
                );
              })()}

              {/* Category-by-category considerations */}
              <div className="space-y-2 pt-1.5 animate-fadeIn">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Considerações por Categoria:</span>
                {personalExpenseCategoriesComparison.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">Nenhuma categoria de gasto pessoal selecionada no painel principal.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 select-none scrollbar-thin">
                    {personalExpenseCategoriesComparison.map(item => {
                      const hasA = item.valA > 0;
                      const hasB = item.valB > 0;
                      if (!hasA && !hasB) return null; // skip empty categories in both periods

                      const diffVal = item.valA - item.valB;
                      const trendColor = diffVal <= 0 ? 'text-emerald-400' : 'text-rose-455';
                      const trendIcon = diffVal > 0 ? '🔺' : diffVal < 0 ? '🔻' : '➖';
                      const trendText = diffVal > 0 ? 'Aumentou' : diffVal < 0 ? 'Diminuiu' : 'Estável';

                      return (
                        <div key={item.category} className="p-2 bg-[#0F1115] rounded-xl border border-slate-850 text-[11px] space-y-1">
                          <div className="flex justify-between font-bold text-slate-200 uppercase tracking-wide">
                            <span className="truncate max-w-[120px]">{item.category}</span>
                            <span className={`${trendColor} flex items-center gap-0.5 text-[10px]`}>
                              {trendText} {trendIcon}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-450 font-medium font-mono">
                            <span>A: {formatCurrency(item.valA)}</span>
                            <span>B: {formatCurrency(item.valB)}</span>
                          </div>
                          {diffVal !== 0 && (
                            <div className={`text-[9px] font-mono font-bold ${trendColor} text-right`}>
                              Var: {diffVal > 0 ? '+' : ''}{formatCurrency(diffVal)} ({diffVal > 0 ? '+' : ''}{item.pct.toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Segmented Payment Methods Comparison Grid */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Coins size={16} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Faturamento Segmentado por Modalidade (PIX vs Dinheiro)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* receipts (Entradas) */}
          <div className="space-y-4 p-4 bg-[#0F1115] rounded-xl border border-slate-850">
            <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">Entradas Confirmadas</h3>
            <div className="space-y-4">
              {/* PIX Entries */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>PIX</span>
                  <span className="text-slate-400 font-mono">
                    A: <span className="text-white font-extrabold">{formatCurrency(metricsA.pixRevenues)}</span> vs B: <span className="font-bold">{formatCurrency(metricsB.pixRevenues)}</span>
                  </span>
                </div>
                {/* Micro visual bars comparison */}
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${metricsA.pixRevenues + metricsB.pixRevenues > 0 ? (metricsA.pixRevenues / (metricsA.pixRevenues + metricsB.pixRevenues)) * 100 : 50}%` }}
                    title="Período A"
                  ></div>
                  <div 
                    className="bg-[#2a303c] h-full transition-all"
                    style={{ width: `${metricsA.pixRevenues + metricsB.pixRevenues > 0 ? (metricsB.pixRevenues / (metricsA.pixRevenues + metricsB.pixRevenues)) * 100 : 50}%` }}
                    title="Período B"
                  ></div>
                </div>
                <div className="text-[10px] text-right font-semibold font-mono text-emerald-400">
                  {(() => {
                    const { diff, pct } = getVariance(metricsA.pixRevenues, metricsB.pixRevenues);
                    return `Variação: ${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>

              {/* CASH Entries */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>DINHEIRO</span>
                  <span className="text-slate-400 font-mono">
                    A: <span className="text-white font-extrabold">{formatCurrency(metricsA.cashRevenues)}</span> vs B: <span className="font-bold">{formatCurrency(metricsB.cashRevenues)}</span>
                  </span>
                </div>
                {/* Micro visual bars comparison */}
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-teal-500 h-full transition-all"
                    style={{ width: `${metricsA.cashRevenues + metricsB.cashRevenues > 0 ? (metricsA.cashRevenues / (metricsA.cashRevenues + metricsB.cashRevenues)) * 100 : 50}%` }}
                    title="Período A"
                  ></div>
                  <div 
                    className="bg-[#2a303c] h-full transition-all"
                    style={{ width: `${metricsA.cashRevenues + metricsB.cashRevenues > 0 ? (metricsB.cashRevenues / (metricsA.cashRevenues + metricsB.cashRevenues)) * 100 : 50}%` }}
                    title="Período B"
                  ></div>
                </div>
                <div className="text-[10px] text-right font-semibold font-mono text-teal-400">
                  {(() => {
                    const { diff, pct } = getVariance(metricsA.cashRevenues, metricsB.cashRevenues);
                    return `Variação: ${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* expenses (Saídas) */}
          <div className="space-y-4 p-4 bg-[#0F1115] rounded-xl border border-slate-850">
            <h3 className="text-xs font-extrabold text-rose-450 uppercase tracking-widest">Saídas Detalhadas</h3>
            <div className="space-y-4">
              {/* PIX Expenses */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>PIX</span>
                  <span className="text-slate-400 font-mono">
                    A: <span className="text-white font-extrabold">{formatCurrency(metricsA.pixExpenses)}</span> vs B: <span className="font-bold">{formatCurrency(metricsB.pixExpenses)}</span>
                  </span>
                </div>
                {/* Micro visual bars comparison */}
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${metricsA.pixExpenses + metricsB.pixExpenses > 0 ? (metricsA.pixExpenses / (metricsA.pixExpenses + metricsB.pixExpenses)) * 100 : 50}%` }}
                    title="Período A"
                  ></div>
                  <div 
                    className="bg-[#2a303c] h-full transition-all"
                    style={{ width: `${metricsA.pixExpenses + metricsB.pixExpenses > 0 ? (metricsB.pixExpenses / (metricsA.pixExpenses + metricsB.pixExpenses)) * 100 : 50}%` }}
                    title="Período B"
                  ></div>
                </div>
                <div className="text-[10px] text-right font-semibold font-mono text-rose-400">
                  {(() => {
                    const { diff, pct } = getVariance(metricsA.pixExpenses, metricsB.pixExpenses);
                    return `Variação: ${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>

              {/* CASH Expenses */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>DINHEIRO</span>
                  <span className="text-slate-400 font-mono">
                    A: <span className="text-white font-extrabold">{formatCurrency(metricsA.cashExpenses)}</span> vs B: <span className="font-bold">{formatCurrency(metricsB.cashExpenses)}</span>
                  </span>
                </div>
                {/* Micro visual bars comparison */}
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-red-400 h-full transition-all"
                    style={{ width: `${metricsA.cashExpenses + metricsB.cashExpenses > 0 ? (metricsA.cashExpenses / (metricsA.cashExpenses + metricsB.cashExpenses)) * 100 : 50}%` }}
                    title="Período A"
                  ></div>
                  <div 
                    className="bg-[#2a303c] h-full transition-all"
                    style={{ width: `${metricsA.cashExpenses + metricsB.cashExpenses > 0 ? (metricsB.cashExpenses / (metricsA.cashExpenses + metricsB.cashExpenses)) * 100 : 50}%` }}
                    title="Período B"
                  ></div>
                </div>
                <div className="text-[10px] text-right font-semibold font-mono text-red-400">
                  {(() => {
                    const { diff, pct } = getVariance(metricsA.cashExpenses, metricsB.cashExpenses);
                    return `Variação: ${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Count metrics Comparison Section */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Layers size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quantitativos de Serviços Realizados</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Honorários', key: 'honorarios', color: 'text-emerald-450', bg: 'bg-emerald-500/10' },
            { label: 'Hon. Revenda', key: 'honorariosRevenda', color: 'text-teal-450', bg: 'bg-teal-500/10' },
            { label: 'Placas', key: 'placas', color: 'text-amber-450', bg: 'bg-amber-500/10' },
            { label: 'CRLV-E', key: 'retCrlve', color: 'text-blue-450', bg: 'bg-blue-500/10' },
            { label: 'ATPV-E', key: 'atpv', color: 'text-indigo-450', bg: 'bg-indigo-500/10' }
          ].map(item => {
            const countA = metricsA.quantitatives[item.key as keyof typeof metricsA.quantitatives] || 0;
            const countB = metricsB.quantitatives[item.key as keyof typeof metricsB.quantitatives] || 0;
            const diff = countA - countB;
            
            return (
              <div key={item.key} className="p-4 bg-[#0F1115] border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{item.label}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-white font-mono">{countA}</span>
                    <span className="text-[10px] text-slate-500 font-mono">vs {countB}</span>
                  </div>
                </div>
                
                <span className={`text-[10px] font-bold font-mono inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${diff >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-955/40 text-rose-455'}`}>
                  {diff >= 0 ? `+${diff}` : diff} {diff >= 0 ? '🔺' : '🔻'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories Detailed Comparison Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Categories Comparison */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Comparativo de Receitas por Item</span>
            <span className="text-[9px] text-slate-450 lowercase tracking-normal">ordenado por valor total no Período A</span>
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 select-none scrollbar-thin">
            {revenueCategoriesComparison.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhuma receita registrada em ambos os períodos.</p>
            ) : (
              revenueCategoriesComparison.map(item => (
                <div key={item.category} className="p-3 bg-[#0F1115] rounded-xl border border-slate-850/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide truncate max-w-[150px]">{item.category}</span>
                    <span className={`text-[10px] font-bold font-mono ${item.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.diff >= 0 ? '+' : ''}{item.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Período A:</span>
                      <span className="text-white font-extrabold">{formatCurrency(item.valA)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Período B:</span>
                      <span className="text-slate-400">{formatCurrency(item.valB)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Categories Comparison */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-rose-455 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Comparativo de Gastos por Categoria</span>
            <span className="text-[9px] text-slate-450 lowercase tracking-normal">ordenado por valor total no Período A</span>
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 select-none scrollbar-thin">
            {expenseCategoriesComparison.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Nenhum gasto registrado em ambos os períodos.</p>
            ) : (
              expenseCategoriesComparison.map(item => (
                <div key={item.category} className="p-3 bg-[#0F1115] rounded-xl border border-slate-850/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide truncate max-w-[150px]">{item.category}</span>
                    <span className={`text-[10px] font-bold font-mono ${item.diff <= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                      {item.diff > 0 ? '+' : ''}{item.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Período A:</span>
                      <span className="text-white font-extrabold">{formatCurrency(item.valA)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Período B:</span>
                      <span className="text-slate-400">{formatCurrency(item.valB)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
