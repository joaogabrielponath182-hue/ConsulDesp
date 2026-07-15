/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  fetchLeads, 
  saveLead, 
  deleteLead 
} from '../lib/db';
import { Lead } from '../types';
import { 
  MessageSquare, 
  Mail, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Phone,
  Building2
} from 'lucide-react';

export default function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'CONTATADO' | 'REJEITADO'>('TODOS');
  const [refreshing, setRefreshing] = useState(false);

  const loadLeadsData = async () => {
    setLoading(true);
    try {
      const fetched = await fetchLeads();
      setLeads(fetched);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadsData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fetched = await fetchLeads();
      setLeads(fetched);
    } catch (err) {
      console.error('Error refreshing leads:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: 'PENDENTE' | 'CONTATADO' | 'REJEITADO') => {
    try {
      const updated: Lead = {
        ...lead,
        status: newStatus
      };
      await saveLead(updated);
      setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
    } catch (err) {
      alert('Erro ao atualizar status do lead.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Deseja realmente excluir este lead de contato?')) return;
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      alert('Erro ao excluir o lead.');
    }
  };

  // Filter and Search Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.agency || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = leads.length;
  const pendingCount = leads.filter(l => l.status === 'PENDENTE').length;
  const contactedCount = leads.filter(l => l.status === 'CONTATADO').length;
  const rejectedCount = leads.filter(l => l.status === 'REJEITADO').length;

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Leads e Contatos do Site</h2>
          <p className="text-xs text-slate-400">
            Gerencie as solicitações de demonstração e testes de 14 dias enviadas a partir da página inicial.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#161B22] border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-[#161B22] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Recebidos</span>
            <span className="text-xl font-black text-white">{loading ? '...' : totalCount}</span>
          </div>
        </div>

        {/* Pending Leads */}
        <div className="bg-[#161B22] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock size={18} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Não Atendidos</span>
            <span className="text-xl font-black text-amber-400">{loading ? '...' : pendingCount}</span>
          </div>
        </div>

        {/* Contacted Leads */}
        <div className="bg-[#161B22] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Em Atendimento</span>
            <span className="text-xl font-black text-emerald-400">{loading ? '...' : contactedCount}</span>
          </div>
        </div>

        {/* Rejected Leads */}
        <div className="bg-[#161B22] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descartados</span>
            <span className="text-xl font-black text-rose-400">{loading ? '...' : rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters & Table Card */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Filter Controls Header */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="Buscar por nome, email, ddd..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-850 hover:border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-hidden transition-all text-white placeholder:text-slate-600"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex bg-[#0F1115] p-1 rounded-xl border border-slate-850 self-stretch md:self-auto shrink-0 overflow-x-auto">
            {(['TODOS', 'PENDENTE', 'CONTATADO', 'REJEITADO'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`py-1.5 px-3.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === f 
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-inner' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'TODOS' ? 'Todos' : f === 'PENDENTE' ? 'Pendentes' : f === 'CONTATADO' ? 'Atendidos' : 'Descartados'}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table Container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Buscando leads na nuvem...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              Nenhum lead encontrado com os filtros selecionados.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F1115]/50 border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest select-none">
                  <th className="py-3.5 px-4">Lead</th>
                  <th className="py-3.5 px-4">Escritório</th>
                  <th className="py-3.5 px-4">Contatos</th>
                  <th className="py-3.5 px-4">Cadastro</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações de Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLeads.map((lead) => {
                  const whatsappMsg = `Olá ${lead.name}, aqui é o João Gabriel do ConsulDesp Financeiro! Vi que você solicitou uma demonstração de 14 dias no nosso site. Vamos liberar sua conta de teste?`;
                  const whatsappUrl = `https://api.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}&text=${encodeURIComponent(whatsappMsg)}`;
                  
                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/10 text-xs transition-colors">
                      {/* Lead Identity */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm sm:text-xs">{lead.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.id}</div>
                      </td>

                      {/* Agency Office */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {lead.agency ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Building2 size={13} className="text-slate-500 shrink-0" />
                            <span>{lead.agency}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Não informado</span>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="text-slate-200 font-medium font-mono">{lead.phone}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Mail size={11} className="text-slate-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      </td>

                      {/* Date Registered */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(lead.createdAt)}
                      </td>

                      {/* Lead Status */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block text-left group">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors ${
                            lead.status === 'PENDENTE' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : lead.status === 'CONTATADO' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              lead.status === 'PENDENTE' ? 'bg-amber-400' : lead.status === 'CONTATADO' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} />
                            <span>{lead.status === 'PENDENTE' ? 'Pendente' : lead.status === 'CONTATADO' ? 'Atendido' : 'Descartado'}</span>
                            <ChevronDown size={10} className="opacity-60 ml-0.5" />
                          </span>

                          {/* Quick Switch Dropdown on Hover/Click */}
                          <div className="absolute left-0 mt-1 hidden group-hover:block hover:block bg-[#0F1115] border border-slate-800 rounded-xl py-1.5 shadow-xl z-50 min-w-[120px]">
                            <button
                              onClick={() => handleStatusChange(lead, 'PENDENTE')}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-slate-800 transition-colors"
                            >
                              Pendente
                            </button>
                            <button
                              onClick={() => handleStatusChange(lead, 'CONTATADO')}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-slate-800 transition-colors"
                            >
                              Atendido
                            </button>
                            <button
                              onClick={() => handleStatusChange(lead, 'REJEITADO')}
                              className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              Descartar
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Interactive Direct Communication Triggers */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct WhatsApp Conversation */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (lead.status === 'PENDENTE') {
                                handleStatusChange(lead, 'CONTATADO');
                              }
                            }}
                            title="Conversar via WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                          >
                            <MessageSquare size={14} />
                          </a>

                          {/* Direct Email Composition */}
                          <a
                            href={`mailto:${lead.email}?subject=Acesso%20Demonstrativo%20ConsulDesp&body=Olá%20${lead.name},%20sou%20o%20João%20Gabriel%20do%20ConsulDesp%20Financeiro!`}
                            onClick={() => {
                              if (lead.status === 'PENDENTE') {
                                handleStatusChange(lead, 'CONTATADO');
                              }
                            }}
                            title="Compor E-mail de Demonstração"
                            className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Mail size={14} />
                          </a>

                          {/* Delete Lead */}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Excluir Lead"
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
