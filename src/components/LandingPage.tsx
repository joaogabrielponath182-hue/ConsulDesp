import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Coins, 
  Users, 
  TrendingUp, 
  Database, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  MessageSquare, 
  ChevronDown, 
  Lock, 
  ChevronRight,
  Sparkles,
  DollarSign,
  Briefcase,
  Layers,
  FileCheck2,
  Calendar,
  Check,
  Mail,
  Phone,
  ArrowUp
} from 'lucide-react';
import SystemLogo from './SystemLogo';
import { saveLead } from '../lib/db';
import { Lead } from '../types';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToTestDrive: () => void;
}

export default function LandingPage({ onGoToLogin, onGoToTestDrive }: LandingPageProps) {
  // Lead Form State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadAgency, setLeadAgency] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone) return;

    setLeadLoading(true);
    try {
      const newLead: Lead = {
        id: 'lead-' + Math.random().toString(36).substring(2, 11),
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        agency: leadAgency || '',
        createdAt: new Date().toISOString(),
        status: 'PENDENTE'
      };

      // Save to Cloud Firestore
      await saveLead(newLead);
    } catch (err) {
      console.error("Erro ao salvar lead no Firestore:", err);
    } finally {
      setLeadLoading(false);
      setLeadSubmitted(true);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "O que é o ConsulDesp Financeiro?",
      a: "É uma plataforma de inteligência e controle financeiro projetada exclusivamente para escritórios de despachantes documentalistas. Diferente de sistemas genéricos de fluxo de caixa, o ConsulDesp entende a dinâmica onde você recebe o valor do cliente (Entrada), paga as taxas ou custos de repasse (Saída de Custo) e retém seu honorário de serviço, demonstrando seu lucro líquido real por lançamento."
    },
    {
      q: "Como funciona o controle de Entradas e Saídas coincidentes?",
      a: "Ao cadastrar uma categoria de receita, se ela possuir um custo correspondente que você recebe e depois realiza o repasse (por exemplo: TAXA DETRAN, PLACA, VISTORIA, etc.), basta criar uma subcategoria com o exato mesmo nome tanto na aba de entrada quanto na aba de saída. Com isso, o painel geral consolidará essas informações de forma inteligente e automática, exibindo com precisão matemática o lucro líquido real que você ganha em cada tipo de serviço ou taxa cobrada."
    },
    {
      q: "Como funciona o acesso ao sistema por escritório?",
      a: "Cada escritório de despachante possui uma licença e um sistema totalmente independente e exclusivo. O sistema é voltado para pequenos escritórios."
    },
    {
      q: "Como faço o controle financeiro do meu escritório utilizando a plataforma?",
      a: "O controle financeiro é realizado de forma muito simples e organizada: todas as receitas que você recebe são lançadas especificando o nome do cliente, a descrição do serviço e a placa do veículo correspondente. Ao registrar a placa, você detalha separadamente os valores relativos ao HONORÁRIO e aos custos de repasse (como TAXAS, VISTORIAS, etc.). Você define se o recebimento foi via PIX ou DINHEIRO, e se o status é PAGO ou PENDENTE, podendo também registrar ou verificar facilmente novos veículos vinculados àquele mesmo cliente. Para os pagamentos de repasse e gastos em geral (registro de saídas), basta informar a descrição, a placa correspondente, a categoria e a forma de pagamento utilizada."
    },
    {
      q: "Como o controle financeiro é garantido?",
      a: "Para garantir o controle financeiro absoluto, você deve realizar a contagem física do dinheiro em caixa ao final de cada expediente e conferir se o valor bate exatamente com a informação de caixa físico (DINHEIRO) exibida em SALDO LÍQUIDO GERAL no PAINEL PRINCIPAL. Da mesma forma, verifique se o saldo acumulado das suas contas bancárias confere exatamente com o saldo de PIX demonstrado no sistema. Se houver divergências, revise os lançamentos do dia para identificar o que foi esquecido de anotar. Pequenas diferenças residuais em dinheiro físico podem ser desconsideradas."
    },
    {
      q: "Deu uma grande diferença e não lembro do que é ou fiquei alguns dias sem anotar, o que fazer?",
      a: "Neste caso, você deve realizar um lançamento de ajuste (entrada ou saída) de correção para conciliar os saldos. Você pode cadastrar uma subcategoria específica chamada 'ERRO CAIXA' (tanto para entradas quanto para saídas) e realizar o lançamento do valor correspondente a fim de acertar o seu caixa operacional com o saldo físico real."
    },
    {
      q: "Eu uso mais de uma conta bancária, como fazer os lançamentos?",
      a: "O ConsulDesp Financeiro foi projetado para simplificar a gestão focando nas modalidades operacionais de recebimento e pagamento (DINHEIRO e PIX). Caso o seu escritório opere com mais de uma conta bancária, você deve somar o saldo ativo de todas as contas e conferir se a soma confere com a informação consolidada constante na modalidade PIX em SALDO LÍQUIDO GERAL no PAINEL PRINCIPAL."
    },
    {
      q: "E quanto às tarifas e taxas bancárias?",
      a: "Essas despesas devem ser devidamente registradas no fluxo do sistema. Recomendamos criar uma categoria de saída específica chamada 'Tarifas Bancárias' e lançar todas as tarifas cobradas pela instituição financeira. Isso garante que o saldo de suas contas bancárias permaneça sempre em perfeita concordância com a informação de PIX demonstrada em SALDO LÍQUIDO GERAL."
    },
    {
      q: "Como é feita a segurança dos dados e o backup?",
      a: "Trabalhamos com o modelo híbrido inteligente: sincronização automática em nuvem de forma transparente, nativa e sem custos adicionais (sem necessidade de logins extras ou sistemas terceiros), além da segurança do Backup Offline Automático. Todos os dias, às 16:35, o sistema também realiza o auto-backup local gravando e substituindo o arquivo JSON local de forma transparente, garantindo máxima integridade dos dados."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-x-hidden">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-[#0F1115]/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SystemLogo size={24} className="border-none rounded" />
            <span className="text-sm font-black font-mono tracking-wider text-white">CONSULDESP</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
              SaaS Financeiro
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Funcionalidades</a>
            <a href="#simulador" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Simulador</a>
            <a href="#precos" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Planos</a>
            <a href="#perguntas" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Dúvidas</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 rounded-xl bg-[#161B22] hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 active:scale-[0.98]"
              id="btn-area-restrita"
            >
              <Lock size={12} className="text-emerald-400" />
              <span>Área Restrita</span>
            </button>

            <a
              href="#demonstracao"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/10"
            >
              Falar com Consultor
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-bounce">
            <Sparkles size={11} />
            <span>Exclusivo para Despachantes Documentalistas</span>
          </div>

          {/* Title */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight font-sans">
              O controle financeiro do seu <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                escritório de despachante
              </span> em um só lugar.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Diga adeus às planilhas confusas. Gerencie repasses ao Detran, separe honorários e garanta que cada entrada do cliente pague exatamente a taxa de custo correspondente — maximizando seus lucros diários.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={onGoToTestDrive}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-xl shadow-emerald-600/15 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Experimentar Grátis</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#161B22] hover:bg-slate-850 border-2 border-slate-800 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Shield size={14} className="text-emerald-400" />
              <span>Área Restrita do Sistema</span>
            </button>
          </div>

          {/* Mockup Dashboard Preview */}
          <div className="pt-12 md:pt-16 max-w-5xl mx-auto">
            <div className="relative p-3 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xs">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-3xl opacity-30 pointer-events-none blur-md"></div>
              
              <div className="bg-[#0F1115] border border-slate-800 rounded-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9] flex flex-col">
                {/* Header Mockup */}
                <div className="h-10 border-b border-slate-850 bg-[#161B22]/80 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                    <span className="text-[10px] text-slate-500 font-mono ml-4">consuldesp-painel-financeiro/dashboard</span>
                  </div>
                  <div className="w-20 h-4 bg-slate-900/50 rounded border border-slate-850"></div>
                </div>

                {/* Dashboard Body Mockup */}
                <div className="flex-1 p-4 grid grid-cols-12 gap-3 text-left overflow-hidden">
                  {/* Sidebar Mock */}
                  <div className="col-span-3 border-r border-slate-850/80 pr-2 space-y-2 hidden md:block select-none">
                    <div className="h-5 bg-emerald-950/20 rounded border border-emerald-900/40 w-11/12"></div>
                    <div className="h-4 bg-slate-900/60 rounded w-9/12 mt-4"></div>
                    <div className="h-4 bg-slate-900/60 rounded w-10/12"></div>
                    <div className="h-4 bg-slate-900/60 rounded w-8/12"></div>
                    <div className="h-4 bg-slate-900/60 rounded w-9/12"></div>
                    <div className="h-4 bg-slate-900/60 rounded w-7/12"></div>
                  </div>

                  {/* Main Area Mock */}
                  <div className="col-span-12 md:col-span-9 space-y-4">
                    {/* Stat Cards Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#161B22]/60 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Total Recebido (Entradas)</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono block mt-1">R$ 54.380,00</span>
                      </div>
                      <div className="bg-[#161B22]/60 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Total Pago (Repasses)</span>
                        <span className="text-xs sm:text-sm font-black text-rose-400 font-mono block mt-1">R$ 41.250,00</span>
                      </div>
                      <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-xl">
                        <span className="text-[8px] font-bold text-emerald-400 uppercase block">Lucro Líquido Real</span>
                        <span className="text-xs sm:text-sm font-black text-white font-mono block mt-1">R$ 13.130,00</span>
                      </div>
                    </div>

                    {/* Table / List Mockup */}
                    <div className="bg-[#161B22]/30 border border-slate-850 rounded-xl p-3 space-y-2.5 overflow-hidden">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Últimos Serviços Realizados</span>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">100% CONCILIADO</span>
                      </div>

                      {/* Launch row 1 */}
                      <div className="flex justify-between items-center text-[10px] bg-[#0F1115]/40 p-2 rounded-lg border border-slate-850">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-white">Carlos Alberto Silva</p>
                          <p className="text-slate-500 text-[8px] font-mono">PLACA MERCOSUL - FIAT TORO (ABC1D23)</p>
                        </div>
                        <div className="text-right space-y-0.5 font-mono">
                          <p className="text-emerald-400 font-black">+ R$ 430,00</p>
                          <p className="text-slate-500 text-[8px]">Pago • PIX</p>
                        </div>
                      </div>

                      {/* Launch row 2 */}
                      <div className="flex justify-between items-center text-[10px] bg-[#0F1115]/40 p-2 rounded-lg border border-slate-850">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-white">Mariana Santos Oliveira</p>
                          <p className="text-slate-500 text-[8px] font-mono">TRANSFERENCIA - HONDA CIVIC (FGH-3450)</p>
                        </div>
                        <div className="text-right space-y-0.5 font-mono">
                          <p className="text-emerald-400 font-black">+ R$ 530,00</p>
                          <p className="text-slate-500 text-[8px]">Pago • DINHEIRO</p>
                        </div>
                      </div>

                      {/* Launch row 3 */}
                      <div className="flex justify-between items-center text-[10px] bg-[#0F1115]/40 p-2 rounded-lg border border-slate-850">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-white">Roberto de Souza Lima</p>
                          <p className="text-slate-500 text-[8px] font-mono">IPVA / LICENCIAMENTO - CHEVROLET ONIX (JKU8K29)</p>
                        </div>
                        <div className="text-right space-y-0.5 font-mono">
                          <p className="text-emerald-400 font-black">+ R$ 1.820,00</p>
                          <p className="text-slate-500 text-[8px]">Pago • PIX</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Benefits & Key Features Grid */}
      <section id="funcionalidades" className="py-20 bg-[#161B22]/30 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
              Funcionalidades do Sistema
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
              Controle absoluto projetado de despachante para despachante
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Cada tela foi desenhada em conjunto com escritórios reais para otimizar os fluxos diários de documentação, placas e repasses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Benefit 1 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Coins size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Controle de Repasses Coincidentes
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerencie as Entradas de clientes casadas com as devidas Saídas de custo. Acompanhe o saldo real de cada serviço, sabendo exatamente onde você lucra mais e onde as margens são menores, garantindo conciliação total de caixa.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Gestão Prática de Custos
              </span>
            </div>

            {/* Benefit 2 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Acesso e Gestão Centralizada
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistema focado e otimizado para pequenos escritórios. O gestor ou responsável pelo financeiro possui o controle absoluto, centralizando lançamentos e organizando o caixa de forma rápida e segura.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Foco no Gestor Financeiro
              </span>
            </div>

            {/* Benefit 3 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Subcategorias Customizáveis
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Crie subcategorias personalizadas de entrada e saída que melhor se adequam à realidade do seu escritório, separando custos de taxas governamentais dos seus honorários de serviço de forma prática.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Adaptação à Sua Realidade
              </span>
            </div>

            {/* Benefit 4 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Banco de Dados Exclusivo
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sua base de dados segura e integrada em nuvem, garantindo acesso exclusivo às transações para as máquinas autorizadas do seu escritório físico, com total privacidade e isolamento de dados.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Isolamento e Segurança Total
              </span>
            </div>

            {/* Benefit 5 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Download size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Auto-Backup em Nuvem e Local
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contamos com um serviço de backup em nuvem automático e integrado. Ele funciona de forma silenciosa e transparente: os dados são salvos e sincronizados de maneira segura na nuvem sem que o usuário precise fazer logins extras ou contratar sistemas terceiros para esse fim — é tudo 100% nativo e sem custos adicionais. 
                  <span className="block mt-2">Além disso, todos os dias, pontualmente às 16:35, o sistema realiza de forma automatizada a regravação e atualização silenciosa do seu arquivo de backup local físico para garantir dupla proteção aos seus dados.</span>
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Segurança Nativa Sem Custos
              </span>
            </div>

            {/* Benefit 6 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileCheck2 size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Auditoria de Caixa e Relatórios
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Saiba exatamente qual o balanço líquido do escritório. Gire relatórios mensais ou por filtros de data que mostram separadamente receitas de taxas, honorários diretos e gastos corporativos internos.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Análise de Lucro Realizado
              </span>
            </div>

            {/* Benefit 7 */}
            <div className="bg-[#161B22] border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Relatório Comparativo de Períodos
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare o faturamento, as despesas, o lucro líquido e os quantitativos de serviços entre dois períodos personalizados. Obtenha insights descritivos automáticos indicando exatamente as variações e os itens que impulsionaram o caixa.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 pt-4 border-t border-slate-800 mt-4">
                <CheckCircle2 size={12} />
                Inteligência Analítica Ativa
              </span>
            </div>

          </div>
        </div>
      </section>



      {/* Pricing Plans Section */}
      <section id="precos" className="py-20 bg-[#161B22]/30 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
              Planos e Assinaturas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
              O Investimento que se paga no primeiro dia
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Escolha a licença ideal para o seu escritório. Todos os planos dão acesso ilimitado a 100% dos recursos do sistema, sem qualquer limite de funções.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Plan 1 */}
            <div className="bg-[#161B22] border border-slate-800 p-8 rounded-2xl space-y-6 hover:border-slate-700 transition-all text-left relative flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Plano Mensal</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Ideal para experimentar o sistema com baixo investimento mensal e cancelamento a qualquer momento.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-slate-400 text-xs font-bold font-mono">R$</span>
                  <span className="text-3xl font-black text-white font-mono">35</span>
                  <span className="text-slate-500 text-xs font-medium">/mês</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Acesso Completo ao Sistema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Lançamentos e Fluxo Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Controle de Repasses e Honorários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sincronização Segura em Nuvem</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sistema de Backup em JSON</span>
                  </li>
                </ul>
              </div>

              <a
                href="#demonstracao"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all text-center block cursor-pointer border border-slate-700 mt-8 active:scale-[0.98]"
              >
                Começar Agora
              </a>
            </div>

            {/* Plan 2: Best Value */}
            <div className="bg-[#161B22] border-2 border-emerald-500/40 p-8 rounded-2xl space-y-6 hover:border-emerald-500/60 transition-all text-left relative flex flex-col justify-between shadow-xl shadow-emerald-950/20">
              
              {/* Highlight Badge */}
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-600 border border-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                RECOMENDADO
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Plano Anual</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Economia garantida com faturamento anual único, equivalente a apenas R$ 21 por mês.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-slate-400 text-xs font-bold font-mono">R$</span>
                  <span className="text-4xl font-black text-white font-mono">250</span>
                  <span className="text-slate-500 text-xs font-medium">/ano</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-400">Acesso Completo ao Sistema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Lançamentos e Fluxo Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Controle de Repasses e Honorários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sincronização Segura em Nuvem</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sistema de Backup em JSON</span>
                  </li>
                </ul>
              </div>

              <a
                href="#demonstracao"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all text-center block cursor-pointer shadow-lg shadow-emerald-600/10 mt-8 active:scale-[0.98]"
              >
                Garantir Plano Anual
              </a>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#161B22] border border-slate-800 p-8 rounded-2xl space-y-6 hover:border-slate-700 transition-all text-left relative flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Assinatura Definitiva</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Pagamento único para acesso vitalício e sem qualquer tipo de mensalidade futura.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-slate-400 text-xs font-bold font-mono">R$</span>
                  <span className="text-3xl font-black text-white font-mono">550</span>
                  <span className="text-slate-500 text-xs font-medium">/único</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Acesso Completo ao Sistema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Lançamentos e Fluxo Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Controle de Repasses e Honorários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sincronização Segura em Nuvem</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Sistema de Backup em JSON</span>
                  </li>
                </ul>
              </div>

              <a
                href="#demonstracao"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider transition-all text-center block cursor-pointer border border-slate-700 mt-8 active:scale-[0.98]"
              >
                Garantir Licença Definitiva
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="perguntas" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
              Dúvidas Frequentes
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
              Perguntas e Respostas
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Tem alguma dúvida sobre como a plataforma funciona ou se ela se encaixa nas regras do seu escritório?
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div 
                key={index} 
                className="bg-[#161B22] border border-slate-800 rounded-xl overflow-hidden transition-all text-left"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-slate-200 hover:text-white transition-colors cursor-pointer text-sm font-bold uppercase tracking-wide"
                >
                  <span className="pr-4">{item.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-500 transition-transform duration-200 shrink-0 ${openFaq === index ? 'rotate-180 text-emerald-400' : ''}`} 
                  />
                </button>

                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-850/60 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Lead Capture Form Section */}
      <section id="demonstracao" className="py-20 bg-[#161B22]/50 border-t border-slate-800/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 text-center space-y-8 relative overflow-hidden">
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
                <MessageSquare size={22} className="animate-pulse" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Solicite uma Demonstração Personalizada
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Preencha o formulário abaixo e um de nossos engenheiros financeiros entrará em contato via WhatsApp para liberar um teste gratuito de 14 dias sem compromisso.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!leadSubmitted ? (
                <motion.form
                  key="lead-form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleLeadSubmit}
                  className="space-y-4 max-w-lg mx-auto text-left"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Seu Nome
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Silva"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-600"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        E-mail Corporativo
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: carlos@despachante.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone / Whatsapp */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        WhatsApp (DDD)
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 99999-9999"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-600"
                      />
                    </div>

                    {/* Agency Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nome do Escritório (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Despachante União"
                        value={leadAgency}
                        onChange={(e) => setLeadAgency(e.target.value)}
                        className="w-full bg-[#161B22] border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99] pt-6 shadow-xl shadow-emerald-600/10"
                  >
                    {leadLoading ? (
                      <span>Gerando Acesso Demonstrativo...</span>
                    ) : (
                      <>
                        <span>Solicitar Teste Gratuito</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="lead-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl max-w-lg mx-auto space-y-6 text-center"
                >
                  <div className="mx-auto w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-white uppercase tracking-wider">Solicitação Enviada com Sucesso!</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sua solicitação de teste gratuito de 14 dias foi registrada com sucesso no banco de dados em nuvem do ConsulDesp!
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      A solicitação foi enviada diretamente para análise de cadastro dentro do painel do sistema. Aguarde a liberação do seu acesso!
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/50">
                    <button
                      onClick={() => {
                        setLeadName('');
                        setLeadEmail('');
                        setLeadPhone('');
                        setLeadAgency('');
                        setLeadSubmitted(false);
                      }}
                      className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer underline decoration-dotted"
                    >
                      Enviar Outra Solicitação
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#0F1115] border-t border-slate-800/85 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left select-none">
          <div className="space-y-3 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <SystemLogo size={20} className="border-none rounded" />
              <span className="text-xs font-black font-mono tracking-wider text-slate-200">CONSULDESP</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
              ConsulDesp Financeiro S.A. Plataforma inteligente de automação de faturamento, conciliação e fluxo de caixa de repasses fiscais exclusivamente voltado para a rotina de despachantes estaduais.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider">Links Rápidos</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#simulador" className="hover:text-white transition-colors">Calculadora Margem</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Planos Profissionais</a></li>
              <li><button onClick={onGoToLogin} className="hover:text-white transition-colors cursor-pointer">Login Sistema</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-300 tracking-wider">Conformidade</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><span className="text-slate-500">Termos de Uso</span></li>
              <li><span className="text-slate-500">Política de Privacidade LGPD</span></li>
              <li><span className="text-slate-500">Backup Portátil de Dados</span></li>
              <li><span className="text-slate-500">Auditoria por Lançamento</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-850/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono">
            &copy; {new Date().getFullYear()} ConsulDesp Financeiro. Todos os direitos reservados.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-slate-700/60 shadow-sm active:scale-95"
            id="back-to-top-btn"
            title="Voltar ao início da página"
          >
            <ArrowUp size={12} className="text-slate-400" />
            <span>Voltar ao início</span>
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Servidor Cloud Run Ativo</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
