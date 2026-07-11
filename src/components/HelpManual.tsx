/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Coins, 
  Download, 
  Upload, 
  DollarSign, 
  TrendingUp, 
  Check, 
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function HelpManual() {
  const [activeTab, setActiveTab] = useState<'intro' | 'subcategories' | 'services' | 'expenses' | 'backup'>('intro');

  const tabs = [
    { id: 'intro', name: '1. Introdução', icon: BookOpen, desc: 'Visão geral do ConsulDesp Financeiro' },
    { id: 'subcategories', name: '2. Passo Inicial (Subcategorias)', icon: Layers, desc: 'Subcategorias e termos fixos' },
    { id: 'services', name: '3. Lançamentos e Caixa', icon: FileText, desc: 'Controle processual e receitas' },
    { id: 'expenses', name: '4. Registro de Gastos', icon: DollarSign, desc: 'Despesas e saídas de caixa' },
    { id: 'backup', name: '5. Backup & Segurança', icon: Activity, desc: 'Salvar dados e exportações' }
  ] as const;

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Header Banner */}
      <div className="relative bg-[#161B22] border border-slate-850 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                Central de Ajuda
              </span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
              Manual do Despachante
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Guia oficial para utilização do sistema financeiro. Aprenda a configurar seu caixa, registrar receitas, controlar processos e manter seus dados seguros.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#0F1115] border border-slate-850 p-3 rounded-xl">
            <HelpCircle size={24} className="text-emerald-400 animate-pulse shrink-0" />
            <div className="leading-tight">
              <span className="text-[10px] text-slate-500 block">Dúvidas rápidas?</span>
              <span className="text-xs font-bold text-white">Consulte os tópicos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#161B22] border border-slate-850 rounded-2xl p-3 space-y-1">
            <span className="text-[9px] font-extrabold text-slate-500 px-3 uppercase tracking-widest block mb-2 mt-1">
              Sumário de Navegação
            </span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex flex-col items-start text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600/10 text-emerald-400 border-emerald-600/30 shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs tracking-wide">
                    <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                    <span>{tab.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 pl-6 font-medium leading-none block">
                    {tab.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ajuda em Vídeo Card */}
          <div className="bg-gradient-to-br from-emerald-950/25 to-slate-900 border border-emerald-500/15 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="space-y-1.5 relative z-10">
              <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                Tutoriais
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ajuda em Vídeo</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Assista a tutoriais práticos no Google Drive para dominar a utilização de todas as ferramentas do sistema ConsulDesp Financeiro.
              </p>
            </div>
            <a
              href="https://drive.google.com/drive/folders/1izvu7ehWsFSSb6R8-V9wfxWSqEhqIXLm"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/15 cursor-pointer active:scale-95"
            >
              <span>Assistir Vídeos</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-3 bg-[#161B22] border border-slate-850 rounded-2xl p-6 sm:p-8 min-h-[450px]">
          {/* Tab 1: INTRO */}
          {activeTab === 'intro' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                  1. O que é o ConsulDesp Financeiro?
                </h2>
                <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  O ConsulDesp Financeiro é uma plataforma financeira especializada de alta performance desenvolvida exclusivamente para <strong>despachantes</strong>. O principal objetivo do sistema é conceder total <strong>autonomia</strong> sobre a saúde financeira do seu escritório, permitindo monitorar de forma centralizada seus ganhos, seus gastos e quantitativo de processos concluídos no mês.
                </p>
              </div>

              {/* Bento Box of Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    💰
                  </div>
                  <h3 className="text-xs font-bold text-white">Controle de Ganhos</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Registre todas as receitas de taxas e honorários para ter visibilidade de seu faturamento real.
                  </p>
                </div>

                <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                    💸
                  </div>
                  <h3 className="text-xs font-bold text-white">Gestão de Saídas</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Monitore custos fixos e variáveis, divididos por subcategorias para evitar perdas ou vazamento de caixa.
                  </p>
                </div>

                <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                    📈
                  </div>
                  <h3 className="text-xs font-bold text-white">Saldos Unificados</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Painel inteligente com gráficos em tempo real e consolidação de saldos que coincidem.
                  </p>
                </div>
              </div>

              {/* Informative block about design philosophy */}
              <div className="bg-[#0F1115] border-l-4 border-emerald-500 p-4 rounded-r-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Coins size={14} />
                  <span>Foco total na Atividade do Despachante</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Diferente de sistemas ERP genéricos, as nomenclaturas, o fluxo de caixa, as subcategorias e as estatísticas foram otimizados especificamente para a rotina de despachos de veículos e documentos.
                </p>
              </div>

              {/* Visual mini-preview container */}
              <div className="border border-slate-850 rounded-xl p-4 bg-[#0F1115]/50 flex flex-col gap-3">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Acesso rápido aos menus do despachante</span>
                <div className="flex flex-wrap gap-2">
                  {['Painel Geral', 'Serviços (Receitas)', 'Registro de Gastos', 'Subcategorias', 'Cadastro de Clientes', 'Relatórios'].map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-[#161B22] border border-slate-850 text-[10px] font-bold text-slate-300">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: SUBCATEGORIES (CRITICAL FIRST STEP) */}
          {activeTab === 'subcategories' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                    ATENÇÃO OBRIGATÓRIA
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                  2. O Passo Inicial: Cadastro de Subcategorias
                </h2>
                <div className="h-0.5 w-12 bg-amber-500 rounded-full"></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  Antes de começar a registrar qualquer serviço (receita) ou gasto (despesa), <strong>você deve, obrigatoriamente, cadastrar as Subcategorias</strong>. Elas formam o alicerce financeiro do sistema. Sem as subcategorias devidamente registradas, as telas de lançamentos não permitirão categorizar as receitas e despesas corretamente.
                </p>
              </div>

              {/* Alert Card about fixed subcategories */}
              <div className="bg-[#0F1115] border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400">
                  <AlertTriangle size={16} className="animate-pulse shrink-0" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide">Subcategorias Fixas (Atenção Crucial!)</h3>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para viabilizar o cálculo quantitativo processual e unificar o balanço consolidado de caixa, o sistema possui <strong>nomes de subcategorias fixos e altamente importantes</strong>. Certifique-se de cadastrar exatamente estes termos para que o sistema consiga mapear e automatizar os saldos de processos:
                </p>
                
                {/* Specific fixed names list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  {[
                    { name: 'HONORÁRIO', badge: 'Receita' },
                    { name: 'PLACA', badge: 'Taxa / Gasto' },
                    { name: 'RET. CRLV-E', badge: 'Taxa / Gasto' },
                    { name: 'ATPV-E', badge: 'Taxa / Gasto' }
                  ].map((fixed) => (
                    <div key={fixed.name} className="bg-[#161B22] border border-slate-800 p-2.5 rounded-lg text-center space-y-1">
                      <span className="text-xs font-mono font-bold text-emerald-400 block tracking-tight">{fixed.name}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase leading-none block">{fixed.badge}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed font-sans bg-[#161B22]/50 p-2.5 rounded border border-slate-800 mt-2">
                  💡 <strong>Por que esses nomes são importantes?</strong> O sistema usa esses termos fixos e coincidentes nas subcategorias de Entrada (Serviços) e Saída (Gastos) para calcular o saldo líquido de cada item no <strong>Painel Principal</strong>, além de determinar os quantitativos de processos executados.
                </div>
              </div>

              {/* Miniature CSS Mockup: Subcategory Screen representation */}
              <div className="border border-slate-850 rounded-xl overflow-hidden">
                <div className="bg-[#0F1115] px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-500">MOCKUP DA TELA DE SUBCATEGORIAS</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                </div>
                <div className="p-4 bg-[#161B22]/40 space-y-3">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-[#0F1115] border border-slate-850 text-[10px] font-bold text-emerald-400 font-mono">HONORÁRIO [Entrada]</span>
                    <span className="px-2 py-1 rounded bg-[#0F1115] border border-slate-850 text-[10px] font-bold text-rose-400 font-mono font-sans">PLACA [Saída]</span>
                    <span className="px-2 py-1 rounded bg-[#0F1115] border border-slate-850 text-[10px] font-bold text-rose-400 font-mono">RET. CRLV-E [Saída]</span>
                  </div>
                  <div className="text-[10px] text-amber-500 flex items-center gap-1.5 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                    <Info size={11} />
                    <span>Importante: Não edite ou remova estes nomes fixos após utilizá-los em transações!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: SERVICES (PROCESS CONTROL) */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                  3. Lançamento de Serviços e Controle de Caixa
                </h2>
                <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  No menu <strong>Serviços (Receitas)</strong>, você registra todas as entradas de capital decorrentes da prestação de assessoria em despacho. 
                </p>
              </div>

              {/* Explicit clarification on process control */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={15} />
                  <span>Como funciona o Controle Processual?</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para garantir a simplicidade e a agilidade na rotina diária do escritório, o sistema <strong>NÃO realiza o controle do andamento interno dos processos</strong> (como etapas em órgãos de trânsito ou pendências físicas de documentos).
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#0F1115] p-3 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-extrabold text-emerald-400 block mb-1">QUANTITATIVO</span>
                    <span className="text-xs text-white">Saberemos com exatidão apenas <strong>quantos processos</strong> foram concluídos e faturados no período mensal.</span>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-extrabold text-emerald-400 block mb-1">PAGAMENTO</span>
                    <span className="text-xs text-white">Visualização de se o processo está com status <strong>PAGO</strong> ou <strong>PENDENTE</strong> de recebimento.</span>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-extrabold text-emerald-400 block mb-1">MEIO DE ENTRADA</span>
                    <span className="text-xs text-white">Vinculação direta à <strong>forma de pagamento</strong> (Pix, Dinheiro, Cartão, Boleto, etc.).</span>
                  </div>
                </div>
              </div>

              {/* Step list for registering services */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Como cadastrar um serviço passo a passo:</h3>
                <ul className="text-xs text-slate-400 space-y-2 pl-4 list-decimal leading-relaxed">
                  <li>Selecione o <strong>Cliente</strong> pré-cadastrado na lista suspensa (ou insira um novo rapidamente).</li>
                  <li>Atribua a <strong>Subcategoria de Entrada</strong> correspondente ao despacho realizado.</li>
                  <li>Insira o <strong>Valor do Serviço</strong> (por exemplo, o valor cobrado do cliente).</li>
                  <li>Selecione a <strong>Data de Emissão</strong> e a <strong>Forma de Pagamento</strong> acordada.</li>
                  <li>Defina o status de pagamento: <strong>Pago</strong> (entrada direta no caixa) ou <strong>Pendente</strong> (aguardando quitação).</li>
                </ul>
              </div>

              {/* Miniature visual design block representing services list */}
              <div className="border border-slate-850 rounded-xl overflow-hidden bg-[#0F1115]">
                <div className="p-3 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">MOCKUP DA LISTAGEM DE RECEITAS</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Total: R$ 1.250,00</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center bg-[#161B22] p-2 rounded border border-slate-800 text-[10px]">
                    <div className="leading-tight">
                      <span className="text-white font-bold block">RELAÇÃO DE TAXAS (PLACA MERC)</span>
                      <span className="text-[9px] text-slate-500 font-mono">Subcategoria: PLACA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">R$ 250,00</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">PAGO</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-[#161B22] p-2 rounded border border-slate-800 text-[10px]">
                    <div className="leading-tight">
                      <span className="text-white font-bold block">HONORÁRIO - TRANSFERÊNCIA</span>
                      <span className="text-[9px] text-slate-500 font-mono">Subcategoria: HONORÁRIO</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-500 font-bold block">R$ 350,00</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans">PENDENTE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                  4. Registro de Gastos e Despesas
                </h2>
                <div className="h-0.5 w-12 bg-rose-500 rounded-full"></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  A tela de <strong>Registro de Gastos</strong> serve para que você faça o lançamento minucioso de qualquer saída financeira do seu escritório de despachos. Controlar rigorosamente as saídas garante que você visualize o lucro real líquido no fim do mês.
                </p>
              </div>

              {/* Categorization tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest block">
                    Gastos de Custos de Processos
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    São taxas pagas em benefício do processo do cliente, como compras de placas de veículos ou taxas de cartório. Devem usar as subcategorias fixas como <strong>PLACA</strong>, <strong>RET. CRLV-E</strong>, ou <strong>ATPV-E</strong> para que o painel mostre o saldo residual real.
                  </p>
                </div>

                <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest block">
                    Gastos Fixos de Operação
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Custos relacionados à manutenção da infraestrutura do seu escritório de despachos, tais como água, luz, internet, aluguel, salários de funcionários ou papelaria.
                  </p>
                </div>
              </div>

              {/* Visual mini chart explanation */}
              <div className="bg-[#0F1115] border border-slate-850 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Equilíbrio do Caixa do Despachante</span>
                  <span className="text-emerald-400">Ativo</span>
                </div>
                <div className="flex h-3.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="bg-emerald-500 h-full w-[65%]" title="Receitas"></div>
                  <div className="bg-rose-500 h-full w-[35%]" title="Despesas"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Receitas de Serviços</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Custos e Gastos Gerais</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: BACKUPS */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-white uppercase tracking-wide">
                  5. Backup e Segurança dos Seus Dados
                </h2>
                <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  Os dados financeiros do seu escritório são extremamente valiosos. Por isso, o ConsulDesp Financeiro possui múltiplos mecanismos integrados para que você nunca perca suas informações financeiras e dados de lançamentos.
                </p>
              </div>

              {/* Methods detailed */}
              <div className="space-y-4">
                <div className="flex gap-4 items-start bg-[#0F1115] border border-slate-850 p-4 rounded-xl">
                  <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                    <Download size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Exportar Backup Manual (Arquivo JSON)</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Clique no botão <strong>"Exportar"</strong> na barra lateral a qualquer momento para baixar um arquivo <code className="text-emerald-400 font-mono font-bold">.json</code> contendo todo o banco de dados local. Salve este arquivo em um local seguro (pen drive, e-mail, nuvem pessoal).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-[#0F1115] border border-slate-850 p-4 rounded-xl">
                  <div className="p-2 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-lg shrink-0">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Importar Backup</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Se você trocar de computador, basta clicar em <strong>"Importar"</strong> e fazer o upload do arquivo <code className="text-emerald-400 font-mono font-bold">.json</code> gerado anteriormente para restaurar todas as receitas, despesas e subcategorias instantaneamente.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-[#0F1115] border border-slate-850 p-4 rounded-xl">
                  <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
                    <Coins size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Sincronização em Nuvem (Firebase)</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ao ativar e efetuar login na Sincronização na Nuvem na parte inferior do menu lateral, seus dados são armazenados de forma persistente e segura no banco de dados do Firestore.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informative message on daily prompt */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl flex items-center gap-3">
                <Info size={16} className="text-amber-500 shrink-0" />
                <div className="text-[10px] text-slate-400 leading-normal">
                  📌 <strong>Aviso de Rotina Diária:</strong> Para garantir total proteção contra exclusões acidentais, o sistema exibirá uma janela de aviso convidando você a realizar um backup diário sempre que tentar fechar o sistema no fim do dia (especialmente após as 16h).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer support notice */}
      <div className="bg-[#161B22] border border-slate-850 rounded-2xl p-4 text-center">
        <p className="text-[10px] text-slate-400">
          Suporte ConsulDesp Financeiro © {new Date().getFullYear()} - Sistema exclusivo para controle de ganhos, gastos e autonomia de escritórios de despachantes.
        </p>
      </div>
    </div>
  );
}
