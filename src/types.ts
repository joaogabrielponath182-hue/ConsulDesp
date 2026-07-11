/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubCategoryType = 'RECEITA' | 'GASTO';

export interface SubCategory {
  id: string;
  name: string;
  defaultValue: number;
  type: SubCategoryType;
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

