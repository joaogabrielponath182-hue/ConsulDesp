/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  query, 
  where,
  writeBatch 
} from 'firebase/firestore';
import { Service, Expense, SubCategory, PersonalExpense, Client, InternalUser, Lead } from '../types';


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection references
const SERVICES_COLL = 'services';
const EXPENSES_COLL = 'expenses';
const SUBCATEGORIES_COLL = 'subcategories';
const PERSONAL_EXPENSES_COLL = 'personal_expenses';
const CLIENTS_COLL = 'clients';
const LEADS_COLL = 'leads';

/**
 * Removes all properties with value of `undefined` recursively to prevent Firestore errors
 */
function cleanObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          newObj[key] = cleanObject(val);
        }
      }
    }
    return newObj as T;
  }
  return obj;
}

/**
 * Fetch all services, expenses, and subcategories for a given user from Firestore
 */
export async function fetchUserData(userId: string, isAdmin: boolean = false) {
  try {
    const isDemo = userId.toLowerCase() === 'user' || userId === 'user-demo-default' || userId === 'user-demo';
    const userIds = isDemo ? ['user', 'user-demo-default', 'user-demo'] : [userId];

    const servicesQuery = query(collection(db, SERVICES_COLL), where('userId', 'in', userIds));
    const expensesQuery = query(collection(db, EXPENSES_COLL), where('userId', 'in', userIds));
    const subCategoriesQuery = query(collection(db, SUBCATEGORIES_COLL), where('userId', 'in', userIds));
    const personalExpensesQuery = query(collection(db, PERSONAL_EXPENSES_COLL), where('userId', 'in', userIds));
    const clientsQuery = query(collection(db, CLIENTS_COLL), where('userId', 'in', userIds));

    const [servicesSnap, expensesSnap, subCatsSnap, personalExpensesSnap, clientsSnap] = await Promise.all([
      getDocs(servicesQuery),
      getDocs(expensesQuery),
      getDocs(subCategoriesQuery),
      getDocs(personalExpensesQuery),
      getDocs(clientsQuery)
    ]);

    const totalReads = servicesSnap.size + expensesSnap.size + subCatsSnap.size + personalExpensesSnap.size + clientsSnap.size;
    trackFirestoreOp('read', totalReads);

    const services: Service[] = [];
    servicesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      services.push({
        id: docSnap.id,
        client: data.client || '',
        plate: data.plate || '',
        description: data.description || '',
        paymentMethod: data.paymentMethod || 'DINHEIRO',
        items: data.items || [],
        totalValue: data.totalValue || 0,
        date: data.date || '',
        status: data.status || 'PENDENTE',
        groupId: data.groupId,
        operator: data.operator
      });
    });

    const expenses: Expense[] = [];
    expensesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      expenses.push({
        id: docSnap.id,
        description: data.description || '',
        category: data.category || '',
        value: data.value || 0,
        date: data.date || '',
        plate: data.plate,
        paymentMethod: data.paymentMethod,
        items: data.items,
        operator: data.operator
      });
    });

    const subCategories: SubCategory[] = [];
    subCatsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      subCategories.push({
        id: docSnap.id,
        name: data.name || '',
        defaultValue: data.defaultValue || 0,
        type: data.type || 'RECEITA',
        operator: data.operator || data.userId || userId
      });
    });

    const personalExpenses: PersonalExpense[] = [];
    personalExpensesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      personalExpenses.push({
        id: docSnap.id,
        description: data.description || '',
        value: data.value || 0,
        date: data.date || '',
        category: data.category || '',
        paymentMethod: data.paymentMethod || 'DINHEIRO',
        operator: data.operator
      });
    });

    const clients: Client[] = [];
    clientsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      clients.push({
        id: docSnap.id,
        name: data.name || '',
        cpf: data.cpf || '',
        phone: data.phone || '',
        company: data.company || '',
        cnpj: data.cnpj || '',
        operator: data.operator
      });
    });

    // Sort appropriately (most recent objects first)
    services.sort((a, b) => b.id.localeCompare(a.id));
    expenses.sort((a, b) => b.id.localeCompare(a.id));
    personalExpenses.sort((a, b) => b.id.localeCompare(a.id));
    clients.sort((a, b) => a.name.localeCompare(b.name));

    return { services, expenses, subCategories, personalExpenses, clients };
  } catch (err) {
    console.error("Error fetching Firestore user data: ", err);
    handleFirestoreError(err, OperationType.GET, SERVICES_COLL);
    throw err;
  }
}

/**
 * Sync (upload) existing local storage data to Firestore for a newly logged in user
 */
export async function syncLocalDataToFirestore(
  userId: string, 
  data: { services: Service[]; expenses: Expense[]; subCategories: SubCategory[]; personalExpenses?: PersonalExpense[]; clients?: Client[] }
) {
  try {
    let batch = writeBatch(db);
    let count = 0;

    const commitIfNeeded = async () => {
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    };

    // Add subcategories
    if (data.subCategories) {
      for (const sub of data.subCategories) {
        if (!sub || !sub.id) continue;
        const docRef = doc(db, SUBCATEGORIES_COLL, sub.id);
        batch.set(docRef, cleanObject({
          ...sub,
          userId
        }));
        await commitIfNeeded();
      }
    }

    // Add services
    if (data.services) {
      for (const srv of data.services) {
        if (!srv || !srv.id) continue;
        const docRef = doc(db, SERVICES_COLL, srv.id);
        batch.set(docRef, cleanObject({
          ...srv,
          userId
        }));
        await commitIfNeeded();
      }
    }

    // Add expenses
    if (data.expenses) {
      for (const exp of data.expenses) {
        if (!exp || !exp.id) continue;
        const docRef = doc(db, EXPENSES_COLL, exp.id);
        batch.set(docRef, cleanObject({
          ...exp,
          userId
        }));
        await commitIfNeeded();
      }
    }

    // Add personal expenses if present
    if (data.personalExpenses) {
      for (const pe of data.personalExpenses) {
        if (!pe || !pe.id) continue;
        const docRef = doc(db, PERSONAL_EXPENSES_COLL, pe.id);
        batch.set(docRef, cleanObject({
          ...pe,
          userId
        }));
        await commitIfNeeded();
      }
    }

    // Add clients if present
    if (data.clients) {
      for (const cli of data.clients) {
        if (!cli || !cli.id) continue;
        const docRef = doc(db, CLIENTS_COLL, cli.id);
        batch.set(docRef, cleanObject({
          ...cli,
          userId
        }));
        await commitIfNeeded();
      }
    }

    // Commit any remaining operations
    if (count > 0) {
      await batch.commit();
    }

    // Track total writes synchronized
    let totalWrites = 0;
    if (data.subCategories) totalWrites += data.subCategories.length;
    if (data.services) totalWrites += data.services.length;
    if (data.expenses) totalWrites += data.expenses.length;
    if (data.personalExpenses) totalWrites += data.personalExpenses.length;
    if (data.clients) totalWrites += data.clients.length;
    if (totalWrites > 0) {
      trackFirestoreOp('write', totalWrites);
    }
  } catch (err) {
    console.error("Error uploading local data to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, 'sync_local_data');
    throw err;
  }
}

/**
 * Save/Update a single PersonalExpense doc
 */
export async function savePersonalExpense(userId: string, personalExpense: PersonalExpense) {
  try {
    const docRef = doc(db, PERSONAL_EXPENSES_COLL, personalExpense.id);
    await setDoc(docRef, cleanObject({
      ...personalExpense,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving personal expense to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${PERSONAL_EXPENSES_COLL}/${personalExpense.id}`);
    throw err;
  }
}

/**
 * Delete a PersonalExpense doc
 */
export async function deletePersonalExpense(personalExpenseId: string) {
  try {
    const docRef = doc(db, PERSONAL_EXPENSES_COLL, personalExpenseId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting personal expense from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${PERSONAL_EXPENSES_COLL}/${personalExpenseId}`);
    throw err;
  }
}

/**
 * Save/Update a single Service doc
 */
export async function saveService(userId: string, service: Service) {
  try {
    const docRef = doc(db, SERVICES_COLL, service.id);
    await setDoc(docRef, cleanObject({
      ...service,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving service to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${SERVICES_COLL}/${service.id}`);
    throw err;
  }
}

/**
 * Delete a Service doc
 */
export async function deleteService(serviceId: string) {
  try {
    const docRef = doc(db, SERVICES_COLL, serviceId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting service from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${SERVICES_COLL}/${serviceId}`);
    throw err;
  }
}

/**
 * Save/Update a single Expense doc
 */
export async function saveExpense(userId: string, expense: Expense) {
  try {
    const docRef = doc(db, EXPENSES_COLL, expense.id);
    await setDoc(docRef, cleanObject({
      ...expense,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving expense to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${EXPENSES_COLL}/${expense.id}`);
    throw err;
  }
}

/**
 * Delete an Expense doc
 */
export async function deleteExpense(expenseId: string) {
  try {
    const docRef = doc(db, EXPENSES_COLL, expenseId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting expense from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${EXPENSES_COLL}/${expenseId}`);
    throw err;
  }
}

/**
 * Save/Update a single SubCategory doc
 */
export async function saveSubCategory(userId: string, subCategory: SubCategory) {
  try {
    const docRef = doc(db, SUBCATEGORIES_COLL, subCategory.id);
    await setDoc(docRef, cleanObject({
      ...subCategory,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving subcategory to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${SUBCATEGORIES_COLL}/${subCategory.id}`);
    throw err;
  }
}

/**
 * Delete a SubCategory doc
 */
export async function deleteSubCategory(subCategoryId: string) {
  try {
    const docRef = doc(db, SUBCATEGORIES_COLL, subCategoryId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting subcategory from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${SUBCATEGORIES_COLL}/${subCategoryId}`);
    throw err;
  }
}

const BACKUPS_COLL = 'backups';

/**
 * Saves an automatic backup to Firestore for the user and rotates to keep only the 10 most recent
 */
export async function saveBackupToFirestore(
  userId: string,
  backupData: { date: string; timestamp: number; services: Service[]; expenses: Expense[]; subCategories: SubCategory[] }
) {
  try {
    const backupId = `backup_${userId}_${backupData.date}`;
    const docRef = doc(db, BACKUPS_COLL, backupId);
    await setDoc(docRef, cleanObject({
      ...backupData,
      id: backupId,
      userId
    }));
    trackFirestoreOp('write', 1);

    // Rotate and keep only 10 most recent
    const backupsQuery = query(collection(db, BACKUPS_COLL), where('userId', '==', userId));
    const querySnapshot = await getDocs(backupsQuery);
    trackFirestoreOp('read', querySnapshot.size);
    const existing: { id: string; timestamp: number }[] = [];
    querySnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      existing.push({ id: docSnap.id, timestamp: d.timestamp || 0 });
    });

    if (existing.length > 10) {
      existing.sort((a, b) => a.timestamp - b.timestamp); // oldest first
      const toDeleteCount = existing.length - 10;
      for (let i = 0; i < toDeleteCount; i++) {
        await deleteDoc(doc(db, BACKUPS_COLL, existing[i].id));
      }
      trackFirestoreOp('delete', toDeleteCount);
    }
  } catch (err) {
    console.error("Error saving automatic backup to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, BACKUPS_COLL);
    throw err;
  }
}

/**
 * Fetches all backups stored in Firestore for a user
 */
export async function fetchBackupsFromFirestore(userId: string) {
  try {
    const isDemo = userId.toLowerCase() === 'user' || userId === 'user-demo-default' || userId === 'user-demo';
    const userIds = isDemo ? ['user', 'user-demo-default', 'user-demo'] : [userId];
    const backupsQuery = query(collection(db, BACKUPS_COLL), where('userId', 'in', userIds));
    const querySnapshot = await getDocs(backupsQuery);
    trackFirestoreOp('read', querySnapshot.size);
    const backups: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      backups.push({
        id: docSnap.id,
        date: data.date,
        timestamp: data.timestamp,
        services: data.services || [],
        expenses: data.expenses || [],
        subCategories: data.subCategories || []
      });
    });
    backups.sort((a, b) => b.timestamp - a.timestamp); // newest first
    return backups;
  } catch (err) {
    console.error("Error fetching backups from Firestore: ", err);
    handleFirestoreError(err, OperationType.GET, BACKUPS_COLL);
    throw err;
  }
}

/**
 * Save/Update a single Client doc
 */
export async function saveClient(userId: string, client: Client) {
  try {
    const docRef = doc(db, CLIENTS_COLL, client.id);
    await setDoc(docRef, cleanObject({
      ...client,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving client to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${CLIENTS_COLL}/${client.id}`);
    throw err;
  }
}

/**
 * Delete a single Client doc
 */
export async function deleteClient(clientId: string) {
  try {
    const docRef = doc(db, CLIENTS_COLL, clientId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting client from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${CLIENTS_COLL}/${clientId}`);
    throw err;
  }
}

const INTERNAL_USERS_COLL = 'internal_users';

/**
 * Save/Update an InternalUser doc
 */
export async function saveInternalUser(userId: string, user: InternalUser) {
  try {
    const docRef = doc(db, INTERNAL_USERS_COLL, user.id);
    await setDoc(docRef, cleanObject({
      ...user,
      userId
    }));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving internal user: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${INTERNAL_USERS_COLL}/${user.id}`);
    throw err;
  }
}

/**
 * Delete an InternalUser doc
 */
export async function deleteInternalUser(internalUserId: string) {
  try {
    const docRef = doc(db, INTERNAL_USERS_COLL, internalUserId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting internal user: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${INTERNAL_USERS_COLL}/${internalUserId}`);
    throw err;
  }
}

/**
 * Fetch all internal users under a user/office from Firestore
 */
export async function fetchInternalUsers(userId?: string): Promise<InternalUser[]> {
  try {
    const usersQuery = userId 
      ? query(collection(db, INTERNAL_USERS_COLL), where('userId', '==', userId))
      : collection(db, INTERNAL_USERS_COLL);
    const snap = await getDocs(usersQuery);
    trackFirestoreOp('read', snap.size);
    const users: InternalUser[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        id: docSnap.id,
        fullName: data.fullName || '',
        cpf: data.cpf || '',
        phone: data.phone || '',
        username: data.username || '',
        password: data.password || '',
        duration: data.duration || 'indeterminado',
        createdAt: data.createdAt || '',
        expiresAt: data.expiresAt || null,
        currentSessionId: data.currentSessionId || null
      });
    });
    return users;
  } catch (err) {
    console.error("Error fetching internal users from Firestore: ", err);
    handleFirestoreError(err, OperationType.GET, INTERNAL_USERS_COLL);
    throw err;
  }
}

/**
 * Fetch a single internal user by ID from Firestore
 */
export async function fetchSingleInternalUser(userId: string): Promise<InternalUser | null> {
  try {
    const docRef = doc(db, INTERNAL_USERS_COLL, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    trackFirestoreOp('read', 1);
    return {
      id: docSnap.id,
      fullName: data.fullName || '',
      cpf: data.cpf || '',
      phone: data.phone || '',
      username: data.username || '',
      password: data.password || '',
      duration: data.duration || 'indeterminado',
      createdAt: data.createdAt || '',
      expiresAt: data.expiresAt || null,
      currentSessionId: data.currentSessionId || null
    };
  } catch (err) {
    console.error("Error fetching single internal user from Firestore: ", err);
    handleFirestoreError(err, OperationType.GET, `${INTERNAL_USERS_COLL}/${userId}`);
    throw err;
  }
}

/**
 * Track an operation performed on Firestore in localStorage (to avoid database reads/writes for tracking).
 */
export function trackFirestoreOp(type: 'read' | 'write' | 'delete', count: number = 1) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDate = localStorage.getItem('dep_usage_date');
    if (lastDate !== today) {
      localStorage.setItem('dep_usage_date', today);
      localStorage.setItem('dep_usage_reads', '0');
      localStorage.setItem('dep_usage_writes', '0');
      localStorage.setItem('dep_usage_deletes', '0');
    }

    const currentKey = `dep_usage_${type}s`;
    const currentValue = parseInt(localStorage.getItem(currentKey) || '0', 10);
    localStorage.setItem(currentKey, String(currentValue + count));
  } catch (err) {
    console.error("Error tracking firestore operation: ", err);
  }
}

/**
 * Calculates estimated active data size currently saved in local storage keys (representing synced data).
 */
export function getEstimatedFirestoreStorage(): { sizeInBytes: number; formatted: string; percentage: number } {
  try {
    let totalBytes = 0;
    const keys = [
      'dep_services',
      'dep_expenses',
      'dep_subcategories',
      'dep_personal_expenses',
      'dep_clients',
      'dep_internal_users'
    ];
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        totalBytes += val.length;
      }
    });

    // Estimate overhead + backups
    const estimatedWithOverhead = Math.round(totalBytes * 1.5);
    const mb = estimatedWithOverhead / (1024 * 1024);
    const limitMb = 1024; // 1 GB (1024 MB) free tier limit
    const percentage = (mb / limitMb) * 100;

    let formatted = '';
    if (estimatedWithOverhead < 1024) {
      formatted = `${estimatedWithOverhead} B`;
    } else if (estimatedWithOverhead < 1024 * 1024) {
      formatted = `${(estimatedWithOverhead / 1024).toFixed(2)} KB`;
    } else {
      formatted = `${mb.toFixed(2)} MB`;
    }

    return {
      sizeInBytes: estimatedWithOverhead,
      formatted,
      percentage: Math.min(percentage, 100)
    };
  } catch (err) {
    console.error("Error calculating estimated storage:", err);
    return { sizeInBytes: 0, formatted: '0 KB', percentage: 0 };
  }
}

export interface UsageMetrics {
  reads: number;
  writes: number;
  deletes: number;
  storage: {
    sizeInBytes: number;
    formatted: string;
    percentage: number;
  };
  date: string;
}

/**
 * Returns current usage metrics based on free tracking
 */
export function getFirestoreUsageMetrics(): UsageMetrics {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('dep_usage_date');
    if (lastDate !== today) {
      localStorage.setItem('dep_usage_date', today);
      localStorage.setItem('dep_usage_reads', '0');
      localStorage.setItem('dep_usage_writes', '0');
      localStorage.setItem('dep_usage_deletes', '0');
    }

    const reads = parseInt(localStorage.getItem('dep_usage_reads') || '0', 10);
    const writes = parseInt(localStorage.getItem('dep_usage_writes') || '0', 10);
    const deletes = parseInt(localStorage.getItem('dep_usage_deletes') || '0', 10);
    const storage = getEstimatedFirestoreStorage();

    return {
      reads,
      writes,
      deletes,
      storage,
      date: today
    };
  } catch (err) {
    console.error("Error loading usage metrics:", err);
    return {
      reads: 0,
      writes: 0,
      deletes: 0,
      storage: { sizeInBytes: 0, formatted: '0 KB', percentage: 0 },
      date: new Date().toISOString().split('T')[0]
    };
  }
}

/**
 * Deduplicate and normalize subcategory names.
 * - Converts "HONORÁRIO", "HONORARIOS", "HONORÁRIOS" -> "HONORARIO"
 * - Keeps only one entry for each combination of name and type (RECEITA or GASTO)
 * - Prefers keeping subcategories that have fixed IDs (starting with 'sub-fixed')
 */
export function cleanAndDeduplicateSubcategories(list: SubCategory[]): SubCategory[] {
  if (!Array.isArray(list)) return [];
  
  const seen = new Set<string>();
  const cleaned: SubCategory[] = [];

  const normalizedList = list.map(sub => {
    if (!sub) return null;
    let name = (sub.name || '').trim().toUpperCase();
    
    // Normalize Honorários variants
    if (['HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS', 'HONORARIO'].includes(name)) {
      name = 'HONORARIO';
    } else if (['HONORÁRIO REVENDA', 'HONORARIO REVENDA', 'HONORÁRIOS REVENDA', 'HONORARIOS REVENDA'].includes(name)) {
      name = 'HONORARIO REVENDA';
    } else if (['SERVIÇOS', 'SERVICOS'].includes(name)) {
      name = 'SERVIÇOS';
    } else if (['PLACA', 'PLACAS'].includes(name)) {
      name = 'PLACA';
    }

    return {
      ...sub,
      name
    };
  }).filter((s): s is SubCategory => s !== null);

  // Sort so that fixed subcategories (sub-fixed-*) come first
  // This ensures that when we deduplicate, we retain the fixed subcategory with its fixed ID
  normalizedList.sort((a, b) => {
    const aFixed = (a.id || '').startsWith('sub-fixed') ? 1 : 0;
    const bFixed = (b.id || '').startsWith('sub-fixed') ? 1 : 0;
    return bFixed - aFixed; // fixed subcategories first
  });

  normalizedList.forEach(sub => {
    const type = sub.type || 'RECEITA';
    const op = (sub.operator || 'admin').toLowerCase();
    const key = `${sub.name}_${type}_${op}`;

    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(sub);
    } else {
      const index = cleaned.findIndex(c => c.name === sub.name && (c.type || 'RECEITA') === type && (c.operator || 'admin').toLowerCase() === op);
      if (index !== -1 && cleaned[index].defaultValue === 0 && sub.defaultValue > 0) {
        cleaned[index].defaultValue = sub.defaultValue;
      }
    }
  });

  return cleaned;
}

/**
 * Save/Update a single Lead doc
 */
export async function saveLead(lead: Lead) {
  try {
    const docRef = doc(db, LEADS_COLL, lead.id);
    await setDoc(docRef, cleanObject(lead));
    trackFirestoreOp('write', 1);
  } catch (err) {
    console.error("Error saving lead to Firestore: ", err);
    handleFirestoreError(err, OperationType.WRITE, `${LEADS_COLL}/${lead.id}`);
    throw err;
  }
}

/**
 * Delete a single Lead doc
 */
export async function deleteLead(leadId: string) {
  try {
    const docRef = doc(db, LEADS_COLL, leadId);
    await deleteDoc(docRef);
    trackFirestoreOp('delete', 1);
  } catch (err) {
    console.error("Error deleting lead from Firestore: ", err);
    handleFirestoreError(err, OperationType.DELETE, `${LEADS_COLL}/${leadId}`);
    throw err;
  }
}

/**
 * Fetch all Leads sorted by date (newest first)
 */
export async function fetchLeads() {
  try {
    const leadsQuery = query(collection(db, LEADS_COLL));
    const snap = await getDocs(leadsQuery);
    trackFirestoreOp('read', snap.size);
    
    const leads: Lead[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      leads.push({
        id: docSnap.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        agency: data.agency || '',
        createdAt: data.createdAt || '',
        status: data.status || 'PENDENTE'
      });
    });
    
    // Sort in memory by createdAt descending
    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return leads;
  } catch (err) {
    console.error("Error fetching leads from Firestore: ", err);
    handleFirestoreError(err, OperationType.GET, LEADS_COLL);
    throw err;
  }
}



