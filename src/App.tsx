/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Services from './components/Services';
import SubCategories from './components/SubCategories';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import ReportsComparative from './components/ReportsComparative';
import Clients from './components/Clients';
import SystemLogo from './components/SystemLogo';

import { SubCategory, Service, Expense, ExpenseCategory, PersonalExpense, Client, InternalUser, UserSession } from './types';
import { 
  DEFAULT_SUBCATEGORIES, 
  DEFAULT_SERVICES, 
  DEFAULT_EXPENSES,
  getDefaultsForUser
} from './mockData';
import { Menu, X, Coins, Bell, AlertTriangle, Users, Sun, Moon, LogOut, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase core & auth configuration
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  fetchUserData, 
  syncLocalDataToFirestore,
  saveService, 
  deleteService, 
  saveExpense, 
  deleteExpense, 
  saveSubCategory, 
  deleteSubCategory,
  savePersonalExpense,
  deletePersonalExpense,
  saveClient,
  deleteClient,
  fetchInternalUsers,
  saveInternalUser,
  deleteInternalUser,
  fetchSingleInternalUser,
  cleanAndDeduplicateSubcategories
} from './lib/db';
import AuthModal from './components/AuthModal';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import LandingPage from './components/LandingPage';
import TestDrivePage from './components/TestDrivePage';

export default function App() {
  const [authView, setAuthView] = useState<'landing' | 'login' | 'test-drive'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/login' || hash === '#login') {
        return 'login';
      }
      if (path === '/experimentar' || path === '/test-drive' || hash === '#test-drive') {
        return 'test-drive';
      }
    }
    return 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/login' || hash === '#login') {
        setAuthView('login');
      } else if (path === '/experimentar' || path === '/test-drive' || hash === '#test-drive') {
        setAuthView('test-drive');
      } else {
        setAuthView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [prefilledUser, setPrefilledUser] = useState('');
  const [prefilledPass, setPrefilledPass] = useState('');

  const handleGoToLogin = () => {
    window.history.pushState({}, '', '/login');
    setAuthView('login');
    setPrefilledUser('');
    setPrefilledPass('');
  };

  const handleGoToLanding = () => {
    window.history.pushState({}, '', '/');
    setAuthView('landing');
  };

  const handleGoToTestDrive = () => {
    window.history.pushState({}, '', '/experimentar');
    setAuthView('test-drive');
  };

  const handleGoToLoginPrefilled = (user: string, pass: string) => {
    setPrefilledUser(user);
    setPrefilledPass(pass);
    window.history.pushState({}, '', '/login');
    setAuthView('login');
  };

  const handleAutoLogin = async (user: string, pass: string) => {
    const cleanUsername = user.trim().toLowerCase();
    setIsCloudLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Ensure the user 'user' with pass 'teste' is in our list
    let matchedUser = internalUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!matchedUser) {
      // Create and inject it
      const demoUser: InternalUser = {
        id: 'user-demo-default',
        fullName: 'Usuário de Teste (Demonstração)',
        cpf: '000.000.000-00',
        phone: '(11) 99999-9999',
        username: 'user',
        password: 'teste',
        duration: 'indeterminado',
        createdAt: new Date().toISOString(),
        expiresAt: null,
        currentSessionId: null
      };
      setInternalUsers(prev => {
        const updated = [...prev, demoUser];
        localStorage.setItem('dep_internal_users', JSON.stringify(updated));
        return updated;
      });
      matchedUser = demoUser;
    }

    if (matchedUser) {
      const sessionId = `sess-${matchedUser.username}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      await handleUpdateUserSession(matchedUser.id, sessionId);

      const session = {
        username: matchedUser.username,
        fullName: matchedUser.fullName,
        isAdmin: false,
        sessionId
      };

      setCurrentSession(session);
      localStorage.setItem('dep_current_session', JSON.stringify(session));
      setIsConcurrentAlertOpen(false);
      setWelcomeUser(session.fullName);
      handleFetchAndSyncOnLogin(session);
      setTimeout(() => {
        setWelcomeUser(null);
      }, 6000);
    }
    setIsCloudLoading(false);
  };

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('dep_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dep_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // States
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Firebase auth & syncing states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [isBackupReminderOpen, setIsBackupReminderOpen] = useState(false);
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>('all');

  // Payment date modal states for toggling service status from PENDENTE to PAGO
  const [pendingStatusToggleId, setPendingStatusToggleId] = useState<string | null>(null);
  const [togglePaymentDate, setTogglePaymentDate] = useState<string>('');

  // Auto-Backup state variables
  const [autoBackupFileName, setAutoBackupFileName] = useState<string | null>(() => {
    return localStorage.getItem('dep_auto_backup_file_name');
  });
  const [lastAutoBackupDate, setLastAutoBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('dep_last_auto_backup_date');
  });
  const [isSuggestAutoBackupOpen, setIsSuggestAutoBackupOpen] = useState(false);
  const [autoBackupStatusToast, setAutoBackupStatusToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(() => {
    const stored = localStorage.getItem('dep_cloud_connected');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dep_cloud_connected', String(isCloudConnected));
  }, [isCloudConnected]);

  // Force pull the latest data from the Firebase cloud for a logged-in user
  const handleFetchAndSyncOnLogin = async (session: UserSession) => {
    if (!isCloudConnected) return;
    setIsCloudLoading(true);
    try {
      const dbUserId = session.username;
      const cloudData = await fetchUserData(dbUserId, session.isAdmin);
      setServices(cloudData.services);
      setExpenses(cloudData.expenses);

      // Make sure the operator has their correct default subcategories initialized
      const defaults = getDefaultsForUser(dbUserId);
      const userSubs = [...cloudData.subCategories];

      for (const defSub of defaults) {
        // Find existing subcategory by name and type
        const foundIndex = userSubs.findIndex(sub => 
          sub.name.trim().toUpperCase() === defSub.name && 
          (sub.type || 'RECEITA') === defSub.type
        );
        if (foundIndex === -1) {
          const newSub: SubCategory = {
            id: `${dbUserId}_${defSub.id}`,
            name: defSub.name,
            defaultValue: defSub.defaultValue,
            type: defSub.type,
            operator: dbUserId
          };
          userSubs.push(newSub);
          // Save to Firestore in background
          try {
            await saveSubCategory(dbUserId, newSub);
          } catch (e) {
            console.error("Erro ao inicializar subcategoria no Firestore:", e);
          }
        } else {
          // If the default value has changed, update it for the existing user too
          const found = userSubs[foundIndex];
          if (found.defaultValue !== defSub.defaultValue) {
            found.defaultValue = defSub.defaultValue;
            try {
              await saveSubCategory(dbUserId, found);
            } catch (e) {
              console.error("Erro ao atualizar subcategoria no Firestore:", e);
            }
          }
        }
      }

      const cleanedSubs = cleanAndDeduplicateSubcategories(userSubs);
      setSubCategories(cleanedSubs);
      setPersonalExpenses(cloudData.personalExpenses || []);
      setClients(cloudData.clients || []);

      localStorage.setItem('dep_services', JSON.stringify(cloudData.services));
      localStorage.setItem('dep_expenses', JSON.stringify(cloudData.expenses));
      localStorage.setItem('dep_subcategories', JSON.stringify(cleanedSubs));
      localStorage.setItem('dep_personal_expenses', JSON.stringify(cloudData.personalExpenses || []));
      localStorage.setItem('dep_clients', JSON.stringify(cloudData.clients || []));
      console.log(`Dados para ${dbUserId} sincronizados com sucesso da nuvem!`);
    } catch (err) {
      console.error("Erro ao puxar dados da nuvem para o usuário:", err);
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Internal custom user session states
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [isConcurrentAlertOpen, setIsConcurrentAlertOpen] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);

  // Derived filtered state for data isolation per operator/session
  const filteredServices = React.useMemo(() => {
    if (!currentSession) return [];
    return services.filter(s => {
      if (currentSession.username === 'joao.desp') {
        return s.operator === 'joao.desp' || !s.operator || s.operator === 'admin';
      }
      return s.operator === currentSession.username;
    });
  }, [services, currentSession]);

  const filteredExpenses = React.useMemo(() => {
    if (!currentSession) return [];
    return expenses.filter(e => {
      if (currentSession.username === 'joao.desp') {
        return e.operator === 'joao.desp' || !e.operator || e.operator === 'admin';
      }
      return e.operator === currentSession.username;
    });
  }, [expenses, currentSession]);

  const filteredPersonalExpenses = React.useMemo(() => {
    if (!currentSession) return [];
    return personalExpenses.filter(pe => {
      if (currentSession.username === 'joao.desp') {
        return pe.operator === 'joao.desp' || !pe.operator || pe.operator === 'admin';
      }
      return pe.operator === currentSession.username;
    });
  }, [personalExpenses, currentSession]);

  const filteredClients = React.useMemo(() => {
    if (!currentSession) return [];
    return clients.filter(c => {
      if (currentSession.username === 'joao.desp') {
        return c.operator === 'joao.desp' || !c.operator || c.operator === 'admin';
      }
      return c.operator === currentSession.username;
    });
  }, [clients, currentSession]);

  const filteredSubCategories = React.useMemo(() => {
    if (!currentSession) return subCategories;
    
    return subCategories.filter(sub => {
      if (currentSession.username === 'joao.desp') {
        return sub.operator === 'joao.desp' || !sub.operator || sub.operator === 'admin';
      }
      return sub.operator === currentSession.username;
    });
  }, [subCategories, currentSession]);

  // Initialize and load from standard LocalStorage on initial load
  useEffect(() => {
    const storedSubs = localStorage.getItem('dep_subcategories');
    const storedServices = localStorage.getItem('dep_services');
    const storedExpenses = localStorage.getItem('dep_expenses');
    const storedPersonalExpenses = localStorage.getItem('dep_personal_expenses');
    const storedClients = localStorage.getItem('dep_clients');

    if (storedSubs) {
      const parsed = JSON.parse(storedSubs);
      const cleaned = cleanAndDeduplicateSubcategories(parsed);
      setSubCategories(cleaned);
      localStorage.setItem('dep_subcategories', JSON.stringify(cleaned));
    } else {
      const cleaned = cleanAndDeduplicateSubcategories(DEFAULT_SUBCATEGORIES);
      setSubCategories(cleaned);
      localStorage.setItem('dep_subcategories', JSON.stringify(cleaned));
    }

    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      setServices(DEFAULT_SERVICES);
      localStorage.setItem('dep_services', JSON.stringify(DEFAULT_SERVICES));
    }

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    } else {
      setExpenses(DEFAULT_EXPENSES);
      localStorage.setItem('dep_expenses', JSON.stringify(DEFAULT_EXPENSES));
    }

    if (storedPersonalExpenses) {
      setPersonalExpenses(JSON.parse(storedPersonalExpenses));
    } else {
      setPersonalExpenses([]);
      localStorage.setItem('dep_personal_expenses', JSON.stringify([]));
    }

    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      setClients([]);
      localStorage.setItem('dep_clients', JSON.stringify([]));
    }

    // Load custom session & user list
    const storedSession = localStorage.getItem('dep_current_session');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setCurrentSession(parsedSession);
      // Automatically pull latest data from the administrator's cloud on startup
      setTimeout(() => {
        handleFetchAndSyncOnLogin(parsedSession);
      }, 50);
    }

    const storedInternalUsers = localStorage.getItem('dep_internal_users');
    if (storedInternalUsers) {
      setInternalUsers(JSON.parse(storedInternalUsers));
    }
  }, []);

  // Listen to Auth State changes to track administrator auth if needed
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Ensure default subcategories exist for the current session (even offline)
  useEffect(() => {
    if (!currentSession) return;
    const dbUserId = currentSession.username;
    const defaults = getDefaultsForUser(dbUserId);

    setSubCategories(prev => {
      let hasChanges = false;
      const userSubs = [...prev];

      defaults.forEach(defSub => {
        const foundIndex = userSubs.findIndex(sub => 
          sub.name.trim().toUpperCase() === defSub.name && 
          (sub.type || 'RECEITA') === defSub.type &&
          (sub.operator === dbUserId || sub.id.startsWith(`${dbUserId}_`))
        );
        if (foundIndex === -1) {
          const newSub: SubCategory = {
            id: `${dbUserId}_${defSub.id}`,
            name: defSub.name,
            defaultValue: defSub.defaultValue,
            type: defSub.type,
            operator: dbUserId
          };
          userSubs.push(newSub);
          hasChanges = true;

          if (isCloudConnected) {
            saveSubCategory(dbUserId, newSub).catch(err => console.error(err));
          }
        } else {
          const found = userSubs[foundIndex];
          if (found.defaultValue !== defSub.defaultValue) {
            found.defaultValue = defSub.defaultValue;
            hasChanges = true;

            if (isCloudConnected) {
              saveSubCategory(dbUserId, found).catch(err => console.error(err));
            }
          }
        }
      });

      if (hasChanges) {
        const cleaned = cleanAndDeduplicateSubcategories(userSubs);
        localStorage.setItem('dep_subcategories', JSON.stringify(cleaned));
        return cleaned;
      }
      return prev;
    });
  }, [currentSession, isCloudConnected]);

  // Fetch the registered user list on startup/login when cloud is active to sync operators list
  useEffect(() => {
    const syncSessionData = async () => {
      if (!isCloudConnected) {
        return;
      }

      try {
        const fetchedUsers = await fetchInternalUsers();
        if (fetchedUsers && fetchedUsers.length > 0) {
          setInternalUsers(fetchedUsers);
          localStorage.setItem('dep_internal_users', JSON.stringify(fetchedUsers));
        }
      } catch (err) {
        console.error("Erro ao carregar usuários cadastrados da nuvem no início:", err);
      }
    };

    syncSessionData();
  }, [isCloudConnected]);


  // Carrega o handle do arquivo de auto-backup do IndexedDB na inicialização
  useEffect(() => {
    const loadBackupHandle = async () => {
      try {
        const { getFileHandle } = await import('./lib/indexedDbBackup');
        const handle = await getFileHandle('autoBackupFile');
        if (handle) {
          console.log("Auto-backup file handle loaded on startup:", handle.name);
          setAutoBackupFileName(handle.name);
          localStorage.setItem('dep_auto_backup_file_name', handle.name);
        } else {
          if (autoBackupFileName) {
            setAutoBackupFileName(null);
            localStorage.removeItem('dep_auto_backup_file_name');
          }
        }
      } catch (err) {
        console.error("Erro ao carregar handle do auto-backup:", err);
      }
    };
    loadBackupHandle();
  }, []);

  // Agendador de Auto-Backup às 16:35 todos os dias
  useEffect(() => {
    const checkAndTriggerBackup = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Alvo: exatamente 16:35
      if (hours === 16 && minutes === 35) {
        const todayStr = now.toISOString().split('T')[0]; // Ex: 2026-07-14
        const lastBackupDate = localStorage.getItem('dep_last_auto_backup_date');

        if (lastBackupDate !== todayStr) {
          console.log("Iniciando Auto-Backup diário agendado das 16:35!");
          await runAutoBackupNow(todayStr);
        }
      }
    };

    // Executa verificação a cada 30 segundos
    const intervalId = setInterval(checkAndTriggerBackup, 30000);
    checkAndTriggerBackup();

    return () => clearInterval(intervalId);
  }, [services, expenses, subCategories, clients, internalUsers, personalExpenses]);

  const runAutoBackupNow = async (todayStr: string) => {
    try {
      const { getFileHandle } = await import('./lib/indexedDbBackup');
      const handle = await getFileHandle('autoBackupFile');
      
      const payload = {
        services,
        expenses,
        subCategories,
        clients,
        internalUsers,
        personalExpenses,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(payload, null, 2);

      // Tenta gravar diretamente no arquivo físico se houver handle cadastrado
      if (handle) {
        try {
          const anyHandle = handle as any;
          const permission = await anyHandle.queryPermission({ mode: 'readwrite' });
          if (permission !== 'granted') {
            const request = await anyHandle.requestPermission({ mode: 'readwrite' });
            if (request !== 'granted') {
              throw new Error('Permissão de gravação negada');
            }
          }

          const writable = await handle.createWritable();
          await writable.write(jsonStr);
          await writable.close();

          localStorage.setItem('dep_last_auto_backup_date', todayStr);
          setLastAutoBackupDate(todayStr);
          showBackupToast('success', `Auto-Backup diário realizado com sucesso no arquivo "${handle.name}"!`);
          return;
        } catch (fileError) {
          console.warn("Falha ao gravar no handle do arquivo, usando download automático:", fileError);
        }
      }

      // Fallback: Download automático transparente em formato JSON
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      const filename = `consuldesp_autobackup_${todayStr}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', filename);
      linkElement.click();

      localStorage.setItem('dep_last_auto_backup_date', todayStr);
      setLastAutoBackupDate(todayStr);
      showBackupToast('success', 'Auto-Backup diário gerado e baixado automaticamente com sucesso!');
    } catch (err) {
      console.error("Erro no Auto-Backup:", err);
      showBackupToast('error', 'Ocorreu um erro ao realizar o Auto-Backup diário.');
    }
  };

  const showBackupToast = (type: 'success' | 'error' | 'info', message: string) => {
    setAutoBackupStatusToast({ show: true, type, message });
    setTimeout(() => {
      setAutoBackupStatusToast(null);
    }, 8000);
  };

  const handleConfigureAutoBackup = async () => {
    const anyWindow = window as any;
    if (!anyWindow.showSaveFilePicker) {
      alert("Seu navegador não possui suporte ao File System Access API para salvar arquivos silenciosamente. Mas não se preocupe: o ConsulDesp fará o download inteligente automático às 16:35 todos os dias!");
      const defaultName = 'consuldesp_backup_automatico.json';
      localStorage.setItem('dep_auto_backup_file_name', defaultName);
      setAutoBackupFileName(defaultName);
      showBackupToast('info', 'Auto-Backup agendado por download às 16:35 ativado!');
      return;
    }

    try {
      const options = {
        suggestedName: autoBackupFileName || 'consuldesp_backup_automatico.json',
        types: [{
          description: 'Arquivos JSON de Backup',
          accept: {
            'application/json': ['.json'],
          },
        }],
      };
      const handle = await anyWindow.showSaveFilePicker(options);
      if (handle) {
        const { storeFileHandle } = await import('./lib/indexedDbBackup');
        await storeFileHandle('autoBackupFile', handle);
        localStorage.setItem('dep_auto_backup_file_name', handle.name);
        setAutoBackupFileName(handle.name);
        showBackupToast('success', `Auto-Backup diário ativado e pareado com: ${handle.name}`);
        
        // Executa uma gravação de teste imediata
        const todayStr = new Date().toISOString().split('T')[0];
        await runAutoBackupNow(todayStr);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Erro ao selecionar arquivo de auto backup:", err);
        alert("Erro ao configurar arquivo de backup: " + err.message);
      }
    }
  };

  const handleDisableAutoBackup = async () => {
    try {
      const { removeFileHandle } = await import('./lib/indexedDbBackup');
      await removeFileHandle('autoBackupFile');
      localStorage.removeItem('dep_auto_backup_file_name');
      setAutoBackupFileName(null);
      showBackupToast('info', 'Auto-Backup diário desativado.');
    } catch (err) {
      console.error("Erro ao desativar auto backup:", err);
    }
  };


  // Sync handoff function for AuthModal manual triggers (e.g. fresh register)
  const handleSyncLocalData = async () => {
    setIsCloudLoading(true);
    try {
      // 1. Send all local registered users to Firestore so they are safely backed up in the cloud
      const storedInternalUsers = localStorage.getItem('dep_internal_users');
      if (storedInternalUsers) {
        const parsedUsers = JSON.parse(storedInternalUsers) as InternalUser[];
        for (const u of parsedUsers) {
          // Use 'joao.desp' (admin context) or current session to associate users
          await saveInternalUser(currentSession?.username || 'joao.desp', u);
        }
      }

      // 2. If a session is active, upload their current data (services, expenses, subcategories, etc.)
      if (currentSession) {
        const dbUserId = currentSession.username;
        const storedSubs = localStorage.getItem('dep_subcategories');
        const storedServices = localStorage.getItem('dep_services');
        const storedExpenses = localStorage.getItem('dep_expenses');
        const storedPersonalExpenses = localStorage.getItem('dep_personal_expenses');
        const storedClients = localStorage.getItem('dep_clients');

        const currentSubs = cleanAndDeduplicateSubcategories(storedSubs ? JSON.parse(storedSubs) : DEFAULT_SUBCATEGORIES);
        const currentSrvs = storedServices ? JSON.parse(storedServices) : DEFAULT_SERVICES;
        const currentExps = storedExpenses ? JSON.parse(storedExpenses) : DEFAULT_EXPENSES;
        const currentPes = storedPersonalExpenses ? JSON.parse(storedPersonalExpenses) : [];
        const currentClients = storedClients ? JSON.parse(storedClients) : [];

        await syncLocalDataToFirestore(dbUserId, {
          services: currentSrvs,
          expenses: currentExps,
          subCategories: currentSubs,
          personalExpenses: currentPes,
          clients: currentClients
        });

        localStorage.setItem('dep_subcategories', JSON.stringify(currentSubs));

        setServices(currentSrvs);
        setExpenses(currentExps);
        setSubCategories(currentSubs);
        setPersonalExpenses(currentPes);
        setClients(currentClients);
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados locais com a nuvem:", err);
      throw err;
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Force pull the latest data from the Firebase cloud to the local state
  const handleForceRefreshCloud = async () => {
    setIsCloudLoading(true);
    try {
      // 1. Always fetch and update the registered users list from Firestore
      const fetchedUsers = await fetchInternalUsers();
      if (fetchedUsers && fetchedUsers.length > 0) {
        setInternalUsers(fetchedUsers);
        localStorage.setItem('dep_internal_users', JSON.stringify(fetchedUsers));
      }

      // 2. Fetch business data if logged in
      if (currentSession) {
        const dbUserId = currentSession.username;
        const cloudData = await fetchUserData(dbUserId, currentSession.isAdmin);
        setServices(cloudData.services);
        setExpenses(cloudData.expenses);
        const cleanedSubs = cleanAndDeduplicateSubcategories(cloudData.subCategories);
        setSubCategories(cleanedSubs);
        setPersonalExpenses(cloudData.personalExpenses || []);
        setClients(cloudData.clients || []);

        localStorage.setItem('dep_services', JSON.stringify(cloudData.services));
        localStorage.setItem('dep_expenses', JSON.stringify(cloudData.expenses));
        localStorage.setItem('dep_subcategories', JSON.stringify(cleanedSubs));
        localStorage.setItem('dep_personal_expenses', JSON.stringify(cloudData.personalExpenses || []));
        localStorage.setItem('dep_clients', JSON.stringify(cloudData.clients || []));
      }
    } catch (err) {
      console.error("Erro ao forçar atualização da nuvem:", err);
      throw err;
    } finally {
      setIsCloudLoading(false);
    }
  };

  // Sign out handoff callback - resets lists back to the local browser state
  const handleSignOutComplete = () => {
    const storedSubs = localStorage.getItem('dep_subcategories');
    const storedServices = localStorage.getItem('dep_services');
    const storedExpenses = localStorage.getItem('dep_expenses');
    const storedPersonalExpenses = localStorage.getItem('dep_personal_expenses');
    const storedClients = localStorage.getItem('dep_clients');
    
    setSubCategories(storedSubs ? JSON.parse(storedSubs) : DEFAULT_SUBCATEGORIES);
    setServices(storedServices ? JSON.parse(storedServices) : DEFAULT_SERVICES);
    setExpenses(storedExpenses ? JSON.parse(storedExpenses) : DEFAULT_EXPENSES);
    setPersonalExpenses(storedPersonalExpenses ? JSON.parse(storedPersonalExpenses) : []);
    setClients(storedClients ? JSON.parse(storedClients) : []);
  };

  // Save states helper wrappers
  const handleAddSubCategory = async (name: string, defaultValue: number, type: 'RECEITA' | 'GASTO' = 'RECEITA') => {
    let normalizedName = name.trim().toUpperCase();
    if (['HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS', 'HONORARIO'].includes(normalizedName)) {
      normalizedName = 'HONORARIO';
    } else if (['PLACA', 'PLACAS'].includes(normalizedName)) {
      normalizedName = 'PLACA';
    } else if (['SERVIÇOS', 'SERVICOS'].includes(normalizedName)) {
      normalizedName = 'SERVIÇOS';
    }

    const newSub: SubCategory = {
      id: `sub-${Date.now()}`,
      name: normalizedName,
      defaultValue,
      type,
      operator: currentSession?.username || 'admin'
    };
    const updated = cleanAndDeduplicateSubcategories([...subCategories, newSub]);
    setSubCategories(updated);
    localStorage.setItem('dep_subcategories', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await saveSubCategory(currentSession.username, newSub);
      } catch (err) {
        console.error("Erro ao salvar subcategoria na nuvem:", err);
      }
    }
    return newSub;
  };

  const handleRemoveSubCategory = async (id: string) => {
    const subToRem = subCategories.find(sub => sub.id === id);
    let isFixed = false;
    if (subToRem) {
      const name = subToRem.name.trim().toUpperCase();
      const type = subToRem.type || 'RECEITA';
      if (type === 'RECEITA') {
        isFixed = ['PLACA', 'HONORARIO', 'RET. CRLV-E', 'ATPV-E', 'HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS'].includes(name);
      } else if (type === 'GASTO') {
        isFixed = ['PLACA'].includes(name);
      }
    }
    if (isFixed) {
      console.warn("Remoção de subcategoria fixa bloqueada pelo sistema.");
      return;
    }

    const updated = subCategories.filter(sub => sub.id !== id);
    setSubCategories(updated);
    localStorage.setItem('dep_subcategories', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await deleteSubCategory(id);
      } catch (err) {
        console.error("Erro ao deletar subcategoria na nuvem:", err);
      }
    }
  };

  const handleUpdateSubCategory = async (id: string, name: string, defaultValue: number) => {
    let normalizedName = name.trim().toUpperCase();
    if (['HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS', 'HONORARIO'].includes(normalizedName)) {
      normalizedName = 'HONORARIO';
    } else if (['PLACA', 'PLACAS'].includes(normalizedName)) {
      normalizedName = 'PLACA';
    } else if (['SERVIÇOS', 'SERVICOS'].includes(normalizedName)) {
      normalizedName = 'SERVIÇOS';
    }

    const updated = subCategories.map(sub => {
      if (sub.id === id) {
        const isFixed = ['HONORÁRIO', 'HONORARIOS', 'HONORÁRIOS', 'HONORARIO', 'PLACA', 'RET. CRLV-E', 'ATPV-E'].includes(sub.name.trim().toUpperCase());
        return {
          ...sub,
          name: isFixed ? sub.name : normalizedName,
          defaultValue
        };
      }
      return sub;
    });
    const cleaned = cleanAndDeduplicateSubcategories(updated);
    setSubCategories(cleaned);
    localStorage.setItem('dep_subcategories', JSON.stringify(cleaned));

    if (currentSession && isCloudConnected) {
      try {
        const found = cleaned.find(sub => sub.id === id);
        if (found) {
          await saveSubCategory(currentSession.username, found);
        }
      } catch (err) {
        console.error("Erro ao atualizar subcategoria na nuvem:", err);
      }
    }
  };

  const handleAddService = async (newSrv: Omit<Service, 'id' | 'totalValue'>) => {
    const total = newSrv.items.reduce((sum, item) => sum + item.value, 0);
    const service: Service = {
      ...newSrv,
      id: `srv-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      totalValue: total,
      operator: currentSession?.username || 'admin'
    };
    
    setServices(prev => {
      const updated = [service, ...prev];
      localStorage.setItem('dep_services', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        await saveService(currentSession.username, service);
      } catch (err) {
        console.error("Erro ao salvar serviço na nuvem:", err);
      }
    }
  };

  const handleRemoveService = async (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    setServices(prev => {
      const updated = prev.filter(srv => !ids.includes(srv.id));
      localStorage.setItem('dep_services', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        for (const singleId of ids) {
          await deleteService(singleId);
        }
      } catch (err) {
        console.error("Erro ao deletar serviço na nuvem:", err);
      }
    }
  };

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleToggleServiceStatus = async (id: string) => {
    const srv = services.find(s => s.id === id);
    if (!srv) return;

    if (srv.status === 'PENDENTE') {
      // Pergunta a data de pagamento
      setPendingStatusToggleId(id);
      setTogglePaymentDate(getLocalDateString());
    } else {
      // Reverte para pendente sem precisar perguntar data
      await executeToggleServiceStatus(id, srv.date);
    }
  };

  const executeToggleServiceStatus = async (id: string, customDate?: string) => {
    let updatedService: Service | null = null;
    setServices(prev => {
      const updated = prev.map(srv => {
        if (srv.id === id) {
          const next = {
            ...srv,
            status: (srv.status === 'PAGO' ? 'PENDENTE' : 'PAGO') as 'PAGO' | 'PENDENTE',
            ...(customDate ? { date: customDate } : {})
          };
          updatedService = next;
          return next;
        }
        return srv;
      });
      localStorage.setItem('dep_services', JSON.stringify(updated));
      return updated;
    });

    setTimeout(async () => {
      if (currentSession && updatedService && isCloudConnected) {
        try {
          await saveService(currentSession.username, updatedService);
        } catch (err) {
          console.error("Erro ao alterar status na nuvem:", err);
        }
      }
    }, 50);
  };

  const handleAddExpense = async (description: string, category: ExpenseCategory, value: number, date: string, plate?: string, paymentMethod?: 'DINHEIRO' | 'PIX', items?: any[], id?: string) => {
    const expense: Expense = {
      id: id || `exp-${Date.now()}`,
      description,
      category,
      value,
      date,
      plate,
      paymentMethod,
      items,
      operator: currentSession?.username || 'admin'
    };
    const updated = [expense, ...expenses];
    setExpenses(updated);
    localStorage.setItem('dep_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await saveExpense(currentSession.username, expense);
      } catch (err) {
        console.error("Erro ao salvar gasto na nuvem:", err);
      }
    }
  };

  const handleEditService = async (updatedService: Service) => {
    setServices(prev => {
      const updated = prev.map(s => {
        if (s.id === updatedService.id) {
          return {
            ...s,
            ...updatedService
          };
        }
        return s;
      });
      localStorage.setItem('dep_services', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        const existingSrv = services.find(s => s.id === updatedService.id);
        const mergedService = existingSrv 
          ? { ...existingSrv, ...updatedService }
          : updatedService;
        await saveService(currentSession.username, mergedService);
      } catch (err) {
        console.error("Erro ao editar serviço na nuvem:", err);
      }
    }
  };

  const handleEditExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    localStorage.setItem('dep_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await saveExpense(currentSession.username, updatedExpense);
      } catch (err) {
        console.error("Erro ao editar gasto na nuvem:", err);
      }
    }
  };

  const handleRemoveExpense = async (id: string) => {
    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    localStorage.setItem('dep_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.error("Erro ao deletar gasto na nuvem:", err);
      }
    }
  };

  const handleAddPersonalExpense = async (peData: Omit<PersonalExpense, 'id'>) => {
    const pe: PersonalExpense = {
      ...peData,
      id: `pe-${Date.now()}`,
      operator: currentSession?.username || 'admin'
    };
    const updated = [pe, ...personalExpenses];
    setPersonalExpenses(updated);
    localStorage.setItem('dep_personal_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await savePersonalExpense(currentSession.username, pe);
      } catch (err) {
        console.error("Erro ao salvar gasto pessoal na nuvem:", err);
      }
    }
  };

  const handleEditPersonalExpense = async (updatedPe: PersonalExpense) => {
    const updated = personalExpenses.map(p => p.id === updatedPe.id ? updatedPe : p);
    setPersonalExpenses(updated);
    localStorage.setItem('dep_personal_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await savePersonalExpense(currentSession.username, updatedPe);
      } catch (err) {
        console.error("Erro ao editar gasto pessoal na nuvem:", err);
      }
    }
  };

  const handleRemovePersonalExpense = async (id: string) => {
    const updated = personalExpenses.filter(p => p.id !== id);
    setPersonalExpenses(updated);
    localStorage.setItem('dep_personal_expenses', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await deletePersonalExpense(id);
      } catch (err) {
        console.error("Erro ao deletar gasto pessoal na nuvem:", err);
      }
    }
  };

  const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
    const client: Client = {
      ...clientData,
      id: `cli-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      operator: currentSession?.username || 'admin'
    };

    setClients(prev => {
      const updated = [...prev, client].sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem('dep_clients', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        await saveClient(currentSession.username, client);
      } catch (err) {
        console.error("Erro ao salvar cliente na nuvem:", err);
      }
    }
    return client;
  };

  const handleRemoveClient = async (id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('dep_clients', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        await deleteClient(id);
      } catch (err) {
        console.error("Erro ao deletar cliente na nuvem:", err);
      }
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c).sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem('dep_clients', JSON.stringify(updated));
      return updated;
    });

    if (currentSession && isCloudConnected) {
      try {
        await saveClient(currentSession.username, updatedClient);
      } catch (err) {
        console.error("Erro ao atualizar cliente na nuvem:", err);
      }
    }
  };

  const handleImportBackup = async (parsedData: { 
    services: Service[]; 
    expenses: Expense[]; 
    subCategories: SubCategory[];
    clients?: Client[];
    internalUsers?: InternalUser[];
    personalExpenses?: PersonalExpense[];
  }) => {
    setServices(parsedData.services);
    setExpenses(parsedData.expenses);
    setSubCategories(parsedData.subCategories);

    localStorage.setItem('dep_services', JSON.stringify(parsedData.services));
    localStorage.setItem('dep_expenses', JSON.stringify(parsedData.expenses));
    localStorage.setItem('dep_subcategories', JSON.stringify(parsedData.subCategories));

    if (parsedData.clients) {
      setClients(parsedData.clients);
      localStorage.setItem('dep_clients', JSON.stringify(parsedData.clients));
    }
    if (parsedData.internalUsers) {
      setInternalUsers(parsedData.internalUsers);
      localStorage.setItem('dep_internal_users', JSON.stringify(parsedData.internalUsers));
    }
    if (parsedData.personalExpenses) {
      setPersonalExpenses(parsedData.personalExpenses);
      localStorage.setItem('dep_personal_expenses', JSON.stringify(parsedData.personalExpenses));
    }

    if (currentSession && isCloudConnected) {
      try {
        await syncLocalDataToFirestore(currentSession.username, parsedData);
        if (parsedData.internalUsers) {
          for (const u of parsedData.internalUsers) {
            await saveInternalUser(currentSession.username, u);
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar backup importado na nuvem:", err);
      }
    }

    // Se o auto-backup não estiver configurado, sugere a ativação após carregar a importação
    if (!localStorage.getItem('dep_auto_backup_file_name')) {
      setTimeout(() => {
        setIsSuggestAutoBackupOpen(true);
      }, 800);
    }
  };

  // Concurrent session checking effect - Optimized to run only on critical actions and fetch single document
  useEffect(() => {
    if (!currentSession) return;

    const checkSession = async () => {
      // ONLY check sessions if there is an active cloud connection (isCloudConnected)
      if (!isCloudConnected) {
        return;
      }

      // Optimization 2: Find target user ID from local state to fetch only their single document (1 read instead of 500)
      const localMatched = internalUsers.find(
        (u) => u.username.toLowerCase() === currentSession.username.toLowerCase()
      );
      const targetUserId = localMatched ? localMatched.id : (currentSession.username === 'joao.desp' ? 'joao.desp' : null);

      if (!targetUserId) {
        return;
      }

      try {
        const matchedUser = await fetchSingleInternalUser(targetUserId);
        if (matchedUser && matchedUser.currentSessionId && matchedUser.currentSessionId !== currentSession.sessionId) {
          // Disconnect!
          setCurrentSession(null);
          localStorage.removeItem('dep_current_session');
          setIsConcurrentAlertOpen(true);
          setCurrentTab('dashboard');
        }
      } catch (err) {
        console.error("Erro ao verificar sessão do usuário:", err);
      }
    };

    // Run on tab switch/window focus
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener('focus', handleFocus);

    // Initial check (runs on mount, tab switches because currentTab is in dependencies, or focus)
    checkSession();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentSession, isCloudConnected, currentTab, internalUsers]);

  const handleRegisterUser = async (userData: Omit<InternalUser, 'id' | 'createdAt' | 'expiresAt'>) => {
    const createdAt = new Date().toISOString();
    let expiresAt: string | null = null;
    
    if (userData.duration !== 'indeterminado') {
      const days = parseInt(userData.duration, 10);
      const exp = new Date();
      exp.setDate(exp.getDate() + days);
      expiresAt = exp.toISOString();
    }

    const newUser: InternalUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      createdAt,
      expiresAt,
      currentSessionId: null
    };

    const updated = [...internalUsers, newUser];
    setInternalUsers(updated);
    localStorage.setItem('dep_internal_users', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await saveInternalUser(currentSession.username, newUser);
      } catch (err) {
        console.error("Erro ao salvar usuário na nuvem:", err);
      }
    }
  };

  const handleRevokeUser = async (id: string) => {
    const updated = internalUsers.filter(u => u.id !== id);
    setInternalUsers(updated);
    localStorage.setItem('dep_internal_users', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await deleteInternalUser(id);
      } catch (err) {
        console.error("Erro ao deletar usuário na nuvem:", err);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: InternalUser) => {
    const updated = internalUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setInternalUsers(updated);
    localStorage.setItem('dep_internal_users', JSON.stringify(updated));

    if (currentSession && isCloudConnected) {
      try {
        await saveInternalUser(currentSession.username, updatedUser);
      } catch (err) {
        console.error("Erro ao atualizar usuário na nuvem:", err);
      }
    }
  };

  const handleUpdateUserSession = async (userId: string, sessionId: string) => {
    let targetUser: InternalUser | null = null;
    const prevUsers = [...internalUsers];
    let found = false;

    const updated = prevUsers.map((u) => {
      if (u.id === userId || (userId === 'joao.desp' && u.username === 'joao.desp')) {
        found = true;
        const updatedUser = { ...u, currentSessionId: sessionId };
        targetUser = updatedUser;
        return updatedUser;
      }
      return u;
    });

    if (!found && userId === 'joao.desp') {
      const virtualJoao: InternalUser = {
        id: 'joao.desp',
        fullName: 'João Gabriel',
        cpf: '---',
        phone: '---',
        username: 'joao.desp',
        password: '',
        duration: 'indeterminado',
        createdAt: new Date().toISOString(),
        expiresAt: null,
        currentSessionId: sessionId
      };
      updated.push(virtualJoao);
      targetUser = virtualJoao;
    }

    setInternalUsers(updated);
    localStorage.setItem('dep_internal_users', JSON.stringify(updated));

    // Save directly to Firestore if connected
    if (targetUser && isCloudConnected) {
      try {
        const opName = currentSession ? currentSession.username : ((targetUser as InternalUser).username || 'admin');
        await saveInternalUser(opName, targetUser);
      } catch (err) {
        console.error("Erro ao atualizar sessão do usuário na nuvem:", err);
      }
    }
  };

  const handleLogoutInternalSession = () => {
    if (currentSession) {
      const username = currentSession.username;
      const matched = internalUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (matched) {
        const updatedUser = { ...matched, currentSessionId: null };
        setInternalUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentSession && isCloudConnected) {
          saveInternalUser(currentSession.username, updatedUser).catch(err => console.error(err));
        }
      }
    }

    setCurrentSession(null);
    localStorage.removeItem('dep_current_session');
    setCurrentTab('dashboard');
  };

  // Switch tab and close drawer helper
  const handleNavigate = (tab: string, initialStatus?: string) => {
    setCurrentTab(tab);
    setIsMobileSidebarOpen(false);
    if (initialStatus) {
      setInitialStatusFilter(initialStatus);
    } else {
      setInitialStatusFilter('all');
    }
  };

  if (!currentSession) {
    if (authView === 'landing') {
      return <LandingPage onGoToLogin={handleGoToLogin} onGoToTestDrive={handleGoToTestDrive} />;
    }

    if (authView === 'test-drive') {
      return (
        <TestDrivePage
          onBackToLanding={handleGoToLanding}
          onGoToLoginPrefilled={handleGoToLoginPrefilled}
          onAutoLogin={handleAutoLogin}
        />
      );
    }

    return (
      <>
        <LoginScreen
          onLoginSuccess={(session) => {
            setCurrentSession(session);
            localStorage.setItem('dep_current_session', JSON.stringify(session));
            setIsConcurrentAlertOpen(false);
            setWelcomeUser(session.fullName);
            // Fetch and sync data right after login
            handleFetchAndSyncOnLogin(session);
            setTimeout(() => {
              setWelcomeUser(null);
            }, 6000);
          }}
          onBackToLanding={handleGoToLanding}
          internalUsers={internalUsers}
          onUpdateUserSession={handleUpdateUserSession}
          onImportBackup={handleImportBackup}
          isCloudConnected={isCloudConnected}
          onToggleCloudConnected={setIsCloudConnected}
          onPullCloudData={handleForceRefreshCloud}
          onPushCloudData={handleSyncLocalData}
          isCloudLoading={isCloudLoading}
          initialUsername={prefilledUser}
          initialPassword={prefilledPass}
        />
        
        {/* Cloud Authentication & Coordination Panel overlay */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onSyncLocalData={handleSyncLocalData}
          onForceRefreshCloud={handleForceRefreshCloud}
          isSyncing={isCloudLoading}
          onSignOutComplete={handleSignOutComplete}
          isAdmin={currentSession?.isAdmin || false}
        />

        {/* Concurrent session blocked modal */}
        <AnimatePresence>
          {isConcurrentAlertOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#161B22] border-2 border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 text-center space-y-4"
              >
                <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Acesso Simultâneo Bloqueado
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sua conta foi desconectada porque ela foi acessada a partir de outro navegador ou dispositivo.
                  </p>
                  <p className="text-[11px] text-slate-500 bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                    💡 <strong>Segurança Avançada:</strong> O compartilhamento de senhas ("lending login") é monitorado pelo sistema para garantir a integridade dos relatórios diários de caixa.
                  </p>
                </div>
                <button
                  onClick={() => setIsConcurrentAlertOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs uppercase cursor-pointer transition-all"
                >
                  Entendi
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F1115] text-slate-100 overflow-hidden font-sans">
      {/* Floating Welcome Notification */}
      <AnimatePresence>
        {welcomeUser && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#161B22]/95 border-2 border-emerald-500/30 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-sm sm:max-w-md w-full backdrop-blur-md"
          >
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Users size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acesso Liberado</h4>
              <p className="text-xs text-white mt-0.5 leading-snug">
                Seja bem vindo novamente, <span className="font-bold text-emerald-400">{welcomeUser}</span>!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sidebar - Desktop Layout */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          services={filteredServices}
          expenses={filteredExpenses}
          subCategories={filteredSubCategories}
          clients={filteredClients}
          internalUsers={internalUsers}
          personalExpenses={filteredPersonalExpenses}
          onImportData={handleImportBackup}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isCloudLoading={isCloudLoading}
          currentSession={currentSession}
          onLogoutInternalSession={handleLogoutInternalSession}
          isCloudConnected={isCloudConnected}
          autoBackupFileName={autoBackupFileName}
          onConfigureAutoBackup={handleConfigureAutoBackup}
          onDisableAutoBackup={handleDisableAutoBackup}
        />
      </div>

      {/* Mobile Drawer Slide Panel overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div 
            onClick={() => setIsMobileSidebarOpen(false)} 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>
          <div className="relative flex w-full max-w-xs flex-col bg-zinc-950 animate-slideRight">
            <div className="absolute right-3.5 top-3.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              <button onClick={() => setIsMobileSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <Sidebar
              currentTab={currentTab}
              onNavigate={handleNavigate}
              services={filteredServices}
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
              clients={filteredClients}
              internalUsers={internalUsers}
              personalExpenses={filteredPersonalExpenses}
              onImportData={handleImportBackup}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              isCloudLoading={isCloudLoading}
              currentSession={currentSession}
              onLogoutInternalSession={handleLogoutInternalSession}
              isCloudConnected={isCloudConnected}
              autoBackupFileName={autoBackupFileName}
              onConfigureAutoBackup={handleConfigureAutoBackup}
              onDisableAutoBackup={handleDisableAutoBackup}
            />
          </div>
        </div>
      )}

      {/* Main viewport area panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Unified Top Header Bar */}
        <header className="h-14 bg-[#161B22] border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1 px-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <SystemLogo size={22} className="animate-pulse border-none rounded" />
              <span className="text-xs font-black font-mono tracking-wider text-slate-200 hidden sm:inline">CONSULDESP FINANCEIRO</span>
              <span className="text-xs font-bold text-slate-400 lg:inline hidden">/</span>
              {/* Tab indicator */}
              <span className="text-[10px] sm:text-xs font-black uppercase bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-900/50">
                {currentTab === 'dashboard' ? 'Painel Geral' :
                 currentTab === 'services' ? 'Serviços' :
                 currentTab === 'expenses' ? 'Registro de Gastos' :
                 currentTab === 'subcategories' ? 'Subcategorias' :
                 currentTab === 'clients' ? 'Clientes' :
                 currentTab === 'reports-general' ? 'Relatório Geral' :
                 currentTab === 'reports-services' ? 'Relatório de Serviços' :
                 currentTab === 'reports-expenses' ? 'Relatório de Saídas' :
                 currentTab === 'reports-comparative' ? 'Relatório Comparativo' :
                 currentTab === 'usermanagement' ? 'Usuários' :
                 currentTab.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active User Name */}
            {currentSession && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1115] border border-slate-800 text-slate-300 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="max-w-[100px] md:max-w-[150px] truncate">{currentSession.fullName}</span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-[#0F1115] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              title={theme === 'dark' ? 'Mudar para Modo Claro (Verde Água)' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden md:inline text-[10px]">Claro</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-400" />
                  <span className="hidden md:inline text-[10px]">Escuro</span>
                </>
              )}
            </button>

            {/* Logout/Disconnect Button */}
            <button
              onClick={handleLogoutInternalSession}
              className="p-2 px-3 rounded-xl bg-[#0F1115] hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900 text-slate-300 hover:text-rose-400 cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              title="Sair da Sessão (Log Out)"
            >
              <LogOut size={14} />
              <span className="hidden md:inline text-[10px]">Sair</span>
            </button>
          </div>
        </header>

        {/* Scrollable primary router layout view */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">

          {currentTab === 'dashboard' && (
            <Dashboard
              services={filteredServices}
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
              onNavigate={handleNavigate}
              onOpenNewServiceModal={() => handleNavigate('services')}
              onOpenNewExpenseModal={() => handleNavigate('expenses')}
              currentSession={currentSession}
            />
          )}

          {currentTab.startsWith('reports') && (
            <div className="mb-6 border-b border-slate-800 pb-4 select-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
                    {currentTab === 'reports-general' && 'Relatório Geral (Consolidado)'}
                    {currentTab === 'reports-services' && 'Relatório de Serviços Lançados'}
                    {currentTab === 'reports-expenses' && 'Relatório de Saídas / Despesas'}
                    {currentTab === 'reports-comparative' && 'Relatório Comparativo de Períodos'}
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {currentTab === 'reports-general' && 'Confira o demonstrativo do balanço de caixa do seu despachante.'}
                    {currentTab === 'reports-services' && 'Visualize o arquivo completo dos serviços prestados e das subtaxas.'}
                    {currentTab === 'reports-expenses' && 'Acompanhe as saídas detalhadas de gastos e despesas.'}
                    {currentTab === 'reports-comparative' && 'Compare o faturamento, as saídas e os quantitativos entre dois períodos distintos.'}
                  </p>
                </div>
              </div>
 
              {/* Sub tabs pills */}
              <div className="flex flex-wrap bg-[#161B22] p-1.5 rounded-xl border border-slate-850 gap-1.5 w-full sm:w-max">
                <button
                  onClick={() => setCurrentTab('reports-general')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentTab === 'reports-general'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Relatório Geral
                </button>
                <button
                  onClick={() => setCurrentTab('reports-services')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentTab === 'reports-services'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Relatório de Serviços
                </button>
                <button
                  onClick={() => setCurrentTab('reports-expenses')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentTab === 'reports-expenses'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Relatório de Saídas
                </button>
                <button
                  onClick={() => setCurrentTab('reports-comparative')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentTab === 'reports-comparative'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  Relatório Comparativo
                </button>
              </div>
            </div>
          )}

          <div className={currentTab === 'services' ? '' : 'hidden'}>
            <Services
              services={filteredServices}
              subCategories={filteredSubCategories}
              clients={filteredClients}
              onAddSubCategory={handleAddSubCategory}
              onAddService={handleAddService}
              onRemoveService={handleRemoveService}
              onToggleServiceStatus={handleToggleServiceStatus}
              onEditService={handleEditService}
              viewMode="form"
            />
          </div>

          <div className={currentTab === 'reports-services' ? '' : 'hidden'}>
            <Services
              services={filteredServices}
              subCategories={filteredSubCategories}
              clients={filteredClients}
              onAddSubCategory={handleAddSubCategory}
              onAddService={handleAddService}
              onRemoveService={handleRemoveService}
              onToggleServiceStatus={handleToggleServiceStatus}
              onEditService={handleEditService}
              viewMode="list"
              initialStatusFilter={initialStatusFilter}
              onRedirectToForm={() => setCurrentTab('services')}
            />
          </div>

          {currentTab === 'clients' && (
            <Clients
              clients={filteredClients}
              onAddClient={handleAddClient}
              onRemoveClient={handleRemoveClient}
              onUpdateClient={handleUpdateClient}
            />
          )}

          {currentTab === 'subcategories' && (
            <SubCategories
              subCategories={filteredSubCategories}
              onAddSubCategory={handleAddSubCategory}
              onRemoveSubCategory={handleRemoveSubCategory}
              onEditSubCategory={handleUpdateSubCategory}
            />
          )}

          <div className={currentTab === 'expenses' ? '' : 'hidden'}>
            <Expenses
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
              onAddSubCategory={handleAddSubCategory}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
              onEditExpense={handleEditExpense}
              viewMode="form"
            />
          </div>

          <div className={currentTab === 'reports-expenses' ? '' : 'hidden'}>
            <Expenses
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
              onAddSubCategory={handleAddSubCategory}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
              onEditExpense={handleEditExpense}
              viewMode="list"
              onRedirectToForm={() => setCurrentTab('expenses')}
            />
          </div>

          {currentTab === 'reports-general' && (
            <Reports
              services={filteredServices}
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
            />
          )}

          {currentTab === 'reports-comparative' && (
            <ReportsComparative
              services={filteredServices}
              expenses={filteredExpenses}
              subCategories={filteredSubCategories}
            />
          )}

          {currentTab === 'usermanagement' && currentSession?.isAdmin && (
            <UserManagement
              users={internalUsers}
              onAddUser={handleRegisterUser}
              onRemoveUser={handleRevokeUser}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </main>
      </div>

      {/* Cloud Authentication & Coordination Panel overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSyncLocalData={handleSyncLocalData}
        onForceRefreshCloud={handleForceRefreshCloud}
        isSyncing={isCloudLoading}
        onSignOutComplete={handleSignOutComplete}
        isAdmin={currentSession?.isAdmin || false}
      />

      {/* Auto-Backup Suggestion Modal after first Import */}
      <AnimatePresence>
        {isSuggestAutoBackupOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161B22] border-2 border-emerald-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <Bell size={24} className="animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                    Backup Importado com Sucesso!
                  </span>
                  <h3 className="text-sm font-black text-white leading-relaxed uppercase tracking-wide">
                    Ativar Auto-Backup Inteligente?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deseja configurar este local para que o sistema salve e substitua seus dados automaticamente todos os dias às 16:35, de forma 100% silenciosa?
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsSuggestAutoBackupOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Não, obrigado
                  </button>
                  <button
                    onClick={async () => {
                      setIsSuggestAutoBackupOpen(false);
                      await handleConfigureAutoBackup();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-emerald-650/20 active:scale-[0.98]"
                  >
                    Sim, Ativar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification for Auto-Backup Status */}
      <AnimatePresence>
        {autoBackupStatusToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm sm:max-w-md w-full border backdrop-blur-md ${
              autoBackupStatusToast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
                : autoBackupStatusToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg text-white shrink-0 ${
              autoBackupStatusToast.type === 'success' 
                ? 'bg-emerald-600' 
                : autoBackupStatusToast.type === 'error'
                ? 'bg-rose-600'
                : 'bg-slate-600'
            }`}>
              <Coins size={14} className="animate-pulse" />
            </div>
            <p className="text-xs font-semibold flex-1 leading-snug">
              {autoBackupStatusToast.message}
            </p>
            <button 
              onClick={() => setAutoBackupStatusToast(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Date Selection Modal */}
      <AnimatePresence>
        {pendingStatusToggleId !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161B22] border-2 border-emerald-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
              
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <Calendar size={24} />
                </div>
                
                <div className="space-y-1 text-center">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                    Confirmar Recebimento
                  </span>
                  <h3 className="text-sm font-black text-white leading-relaxed uppercase tracking-wide">
                    Selecionar Data de Pagamento
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Escolha a data em que este pagamento foi realmente efetuado para fins de contabilização no fluxo de caixa.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="toggle-pay-date" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    id="toggle-pay-date"
                    value={togglePaymentDate}
                    onChange={(e) => setTogglePaymentDate(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-850 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setPendingStatusToggleId(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const id = pendingStatusToggleId;
                      setPendingStatusToggleId(null);
                      await executeToggleServiceStatus(id, togglePaymentDate);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-emerald-650/20 active:scale-[0.98]"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

