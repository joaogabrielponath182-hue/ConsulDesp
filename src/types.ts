/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubCategoryType = 'RECEITA' | 'GASTO';
export type CategoryGroup = 'SERVIÇOS' | 'PESSOAIS' | 'OUTROS';

export interface SubCategory {
  id: string;
  name: string;
  defaultValue: number;
  type: SubCategoryType;
  categoryGroup?: CategoryGroup;
  operator?: string;
}

export interface ServiceItem {
  id: string; // Unique within the service setup
  subCategoryId: string;
  name: string;
  value: number;
}

export type PaymentMethod = 'DINHEIRO' | 'PIX';
export type PaymentStatus = 'PAGO' | 'PENDENTE';

export interface Service {
  id: string;
  client: string;
  plate: string;
  description: string;
  paymentMethod: PaymentMethod;
  items: ServiceItem[];
  totalValue: number;
  date: string;
  status: PaymentStatus;
  groupId?: string;
  operator?: string;
}

export type ExpenseCategory = string;

export interface ExpenseItem {
  id: string;
  plate: string;
  value: number;
}

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  value: number;
  date: string;
  plate?: string;
  paymentMethod?: PaymentMethod;
  items?: ExpenseItem[];
  operator?: string;
}

export interface PersonalExpense {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  operator?: string;
}

export interface Client {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  company: string;
  cnpj: string;
  operator?: string;
}

export interface InternalUser {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  username: string;
  password: string;
  duration: '7' | '15' | '30' | 'indeterminado';
  createdAt: string;
  expiresAt: string | null;
  currentSessionId?: string | null;
}

export interface UserSession {
  username: string;
  fullName: string;
  isAdmin: boolean;
  sessionId: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  agency?: string;
  createdAt: string;
  status: 'PENDENTE' | 'CONTATADO' | 'REJEITADO';
}

export interface ProcessMessage {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export type ProcessStage = 
  | 'ENTRADA'            // Coleta de documentos / balcão
  | 'VISTORIA'           // Vistoria realizada / aguardando laudo
  | 'AGUARDANDO_DETRAN'  // Protocolado no Detran
  | 'LIBERADO'           // Liberado pelo Detran (fases finais: taxa/placa/recibo)
  | 'PRONTO_ENTREGA'     // CRLV-e emitido
  | 'CONCLUIDO';         // Entregue ao cliente

export interface DetranProcess {
  id: string;
  serviceId?: string;
  client: string;
  plate: string;
  description: string;
  stage: ProcessStage;

  // Protocolo DETRAN
  protocolNumber?: string;
  protocolDate?: string;

  // Vistoria
  inspectionDone: boolean;
  inspectionDate?: string;

  // Aprovação DETRAN
  detranApproved: boolean;
  detranApprovedDate?: string;

  // Taxa DETRAN
  feePayer: 'ESCRITORIO' | 'CLIENTE';
  feePaid: boolean;
  feePaidDate?: string;
  feeExpenseId?: string;

  // Placa
  requiresPlate: boolean;
  plateOrdered: boolean;
  plateInstalled: boolean;
  plateExpenseId?: string;

  // Recolhimento de Recibo
  requiresReceiptCollection: boolean;
  receiptCollected: boolean;

  // Emissão CRLV-e e Entrega
  crlvIssued: boolean;
  crlvIssuedDate?: string;
  deliveredToClient: boolean;
  deliveredDate?: string;

  // Chat / Recados Internos
  messages: ProcessMessage[];

  // Metadados
  createdAt: string;
  updatedAt: string;
  operator?: string;
  userId?: string;
}

