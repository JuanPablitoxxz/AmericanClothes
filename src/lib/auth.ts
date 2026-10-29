import { AuthUser, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  computeSessionSignature,
  detectSqlInjection,
  detectXss,
  generateSalt,
  hashPasswordPBKDF2,
  recordFailedAuthAttempt,
  validateEmail,
  validatePasswordStrength,
  validateSafeField,
  verifyPasswordPBKDF2,
  verifySessionSignature,
} from './security';

export interface StoredUserAccount {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const AUTH_USERS_STORAGE_KEY = 'american_clothes_secure_accounts_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'american_clothes_active_session_v1';
const SYS_USER_PREFIX = '__SYS_USER__:';

// Correos autorizados exclusivamente para rol administrativo
const AUTHORIZED_ADMIN_EMAILS = ['admin@americanclothes.com', 'gerencia@americanclothes.com'];

const saveAccountsToLocalCache = (accounts: StoredUserAccount[]): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch {
    // ignore storage errors
  }
};

const getAccountsFromLocalCache = (): StoredUserAccount[] => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Registra cada evento de inicio de sesión en la tabla public.login_logs de Supabase.
 */
const recordLoginEventInSupabase = async (params: {
  userId?: string;
  email: string;
  name?: string;
  role?: string;
  status: 'EXITOSO' | 'FALLIDO' | 'BLOQUEADO_SQLI';
}): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 250) : 'Node/Server';
    await supabase.from('login_logs').insert({
      user_id: params.userId || null,
      email: params.email.toLowerCase().trim(),
      name: params.name || null,
      role: params.role || null,
      status: params.status,
      user_agent: userAgent,
    });
  } catch {
    // Si la tabla login_logs aún no ha sido creada en el SQL Editor, no interrumpir el flujo
  }
};

/**
 * Guarda o actualiza una cuenta cifrada (PBKDF2-SHA256) directamente en Supabase PostgreSQL.
 */
const upsertSupabaseAccount = async (account: StoredUserAccount): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;

  const cleanEmail = account.email.toLowerCase().trim();

  // 1. Intentar tabla dedicada public.app_users si existe en Supabase
  const { error: appUsersErr } = await supabase.from('app_users').upsert(
    {
      id: account.id,
      email: cleanEmail,
      name: account.name,
      phone: account.phone || null,
      role: account.role,
      salt: account.salt,
      password_hash: account.passwordHash,
      created_at: account.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (!appUsersErr) return;

  // 2. Respaldo automático en Supabase PostgreSQL si aún no se ha ejecutado CREATE TABLE app_users
  const recordId = `${SYS_USER_PREFIX}${cleanEmail}`;
  await supabase.from('orders').upsert({
    id: recordId,
    customer_name: account.name,
    email: cleanEmail,
    total: 0,
    status: 'ENTREGADO',
    shipping_address: JSON.stringify({
      ...account,
      email: cleanEmail,
    }),
  });
};

/**
 * Obtiene todas las cuentas registradas directamente desde Supabase PostgreSQL.
 */
const fetchSupabaseAccounts = async (): Promise<StoredUserAccount[] | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  // 1. Leer desde public.app_users si la tabla ya fue creada en Supabase
  const { data: appUsersData, error: appUsersErr } = await supabase
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (!appUsersErr && Array.isArray(appUsersData)) {
    return appUsersData.map((row: any) => ({
      id: String(row.id),
      email: String(row.email).toLowerCase(),
      name: String(row.name),
      phone: row.phone ? String(row.phone) : undefined,
      role: (row.role === 'admin' ? 'admin' : 'client') as UserRole,
      salt: String(row.salt),
      passwordHash: String(row.password_hash),
      createdAt: String(row.created_at || new Date().toISOString()),
    }));
  }

  // 2. Leer registros cifrados de usuarios desde Supabase PostgreSQL
  const { data, error } = await supabase
    .from('orders')
    .select('id, email, customer_name, shipping_address, created_at')
    .like('id', `${SYS_USER_PREFIX}%`);

  if (error || !Array.isArray(data)) {
    return null;
  }

  const parsedAccounts: StoredUserAccount[] = [];
  for (const row of data) {
    if (!row.shipping_address) continue;
    try {
      const parsed = JSON.parse(row.shipping_address) as StoredUserAccount;
      if (parsed && parsed.email && parsed.salt && parsed.passwordHash) {
        parsedAccounts.push({
          id: parsed.id || row.id,
          email: parsed.email.toLowerCase(),
          name: parsed.name || row.customer_name,
          phone: parsed.phone,
          role:
            parsed.role === 'admin' &&
            AUTHORIZED_ADMIN_EMAILS.includes(parsed.email.toLowerCase())
              ? 'admin'
              : 'client',
          salt: parsed.salt,
          passwordHash: parsed.passwordHash,
          createdAt: parsed.createdAt || row.created_at,
        });
      }
    } catch {
      // ignore malformed record
    }
  }

  return parsedAccounts;
};

/**
 * Inicializa y sincroniza las cuentas base con hash criptográfico PBKDF2-SHA256 (100,000 iteraciones)
 * directamente en Supabase PostgreSQL.
 */
export const ensureSeededAccounts = async (): Promise<StoredUserAccount[]> => {
  const cloudAccounts = await fetchSupabaseAccounts();

  if (cloudAccounts && cloudAccounts.length > 0) {
    const hasAdmin = cloudAccounts.some(
      (a) => a.email.toLowerCase() === 'admin@americanclothes.com'
    );
    if (!hasAdmin) {
      const adminSalt = generateSalt();
      const adminHash = await hashPasswordPBKDF2('Admin2026*', adminSalt);
      const adminAcc: StoredUserAccount = {
        id: '2bdc3d6d-3716-4d13-9b0a-2d05a8c7a7db',
        email: 'admin@americanclothes.com',
        name: 'Gerencia American Clothes',
        phone: '300 123 4567',
        role: 'admin',
        salt: adminSalt,
        passwordHash: adminHash,
        createdAt: new Date().toISOString(),
      };
      await upsertSupabaseAccount(adminAcc);
      cloudAccounts.push(adminAcc);
    }
    saveAccountsToLocalCache(cloudAccounts);
    return cloudAccounts;
  }

  const cached = getAccountsFromLocalCache();
  if (cached.length > 0) {
    await Promise.allSettled(cached.map((acc) => upsertSupabaseAccount(acc)));
    return cached;
  }

  const adminSalt = generateSalt();
  const adminHash = await hashPasswordPBKDF2('Admin2026*', adminSalt);

  const seeded: StoredUserAccount[] = [
    {
      id: '2bdc3d6d-3716-4d13-9b0a-2d05a8c7a7db',
      email: 'admin@americanclothes.com',
      name: 'Gerencia American Clothes',
      phone: '300 123 4567',
      role: 'admin',
      salt: adminSalt,
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
    },
  ];

  await Promise.allSettled(seeded.map((acc) => upsertSupabaseAccount(acc)));
  saveAccountsToLocalCache(seeded);
  return seeded;
};

/**
 * Construye una sesión firmada criptográficamente para prevenir adulteración de roles.
 */
const createSignedSession = async (account: {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}): Promise<AuthUser> => {
  const signature = await computeSessionSignature(account.id, account.email, account.role);
  const sessionUser: AuthUser = {
    id: account.id,
    email: account.email.toLowerCase(),
    name: account.name,
    phone: account.phone,
    role: account.role,
    createdAt: account.createdAt,
    signature,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    }
  } catch (e) {
    console.error('Error al guardar sesión activa:', e);
  }

  return sessionUser;
};

/**
 * Obtiene y verifica criptográficamente la sesión actual contra Supabase y la firma HMAC/SHA-256.
 */
export const getVerifiedCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    await ensureSeededAccounts();
    if (typeof localStorage === 'undefined') return null;

    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || !parsed.id || !parsed.email || !parsed.role || !parsed.signature) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    if (
      detectSqlInjection(parsed.email) ||
      detectSqlInjection(parsed.name) ||
      detectXss(parsed.email) ||
      detectXss(parsed.name)
    ) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    const isAuthentic = await verifySessionSignature(
      parsed.id,
      parsed.email,
      parsed.role,
      parsed.signature
    );

    if (!isAuthentic) {
      console.warn('Alerta de Seguridad: Firma de sesión inválida o adulterada.');
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    if (
      parsed.role === 'admin' &&
      !AUTHORIZED_ADMIN_EMAILS.includes(parsed.email.toLowerCase().trim())
    ) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

/**
 * Inicio de Sesión 100% vinculado a Supabase (PostgreSQL + Supabase Auth + Auditoría login_logs).
 */
export const loginUser = async (
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  if (detectSqlInjection(emailInput) || detectSqlInjection(passwordInput)) {
    recordFailedAuthAttempt(emailInput || 'sqli');
    await recordLoginEventInSupabase({
      email: emailInput || 'sqli_attempt',
      status: 'BLOQUEADO_SQLI',
    });
    return {
      success: false,
      error:
        'Alerta de Seguridad: Se detectó y bloqueó un intento de Inyección SQL (SQLi). El evento ha sido registrado.',
    };
  }

  if (detectXss(emailInput) || detectXss(passwordInput)) {
    recordFailedAuthAttempt(emailInput || 'xss');
    return {
      success: false,
      error: 'Alerta de Seguridad: Se detectaron scripts o etiquetas no permitidas (Anti-XSS).',
    };
  }

  const emailValidation = validateEmail(emailInput);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }
  const cleanEmail = emailValidation.sanitized;

  const rateLimit = checkAuthRateLimit(cleanEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.remainingSeconds} segundos antes de volver a intentar.`,
    };
  }

  if (!passwordInput || passwordInput.length < 4) {
    const fail = recordFailedAuthAttempt(cleanEmail);
    await recordLoginEventInSupabase({ email: cleanEmail, status: 'FALLIDO' });
    return {
      success: false,
      error: fail.locked
        ? `Cuenta bloqueada temporalmente por ${fail.remainingSeconds}s tras múltiples intentos.`
        : 'Credenciales incorrectas. Verifica tu correo electrónico y contraseña.',
    };
  }

  const accounts = await ensureSeededAccounts();
  const cloudAccount = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (cloudAccount) {
    const isPasswordValid = await verifyPasswordPBKDF2(
      passwordInput,
      cloudAccount.salt,
      cloudAccount.passwordHash
    );

    if (isPasswordValid) {
      clearAuthRateLimit(cleanEmail);
      await recordLoginEventInSupabase({
        userId: cloudAccount.id,
        email: cleanEmail,
        name: cloudAccount.name,
        role: cloudAccount.role,
        status: 'EXITOSO',
      });

      const signedUser = await createSignedSession(cloudAccount);
      return { success: true, user: signedUser };
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passwordInput,
      });

      if (!error && data.user) {
        clearAuthRateLimit(cleanEmail);
        const isAdminEmail = AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail);
        const role: UserRole = isAdminEmail ? 'admin' : 'client';
        const fullName =
          (data.user.user_metadata?.full_name as string) || cleanEmail.split('@')[0];
        const phone = (data.user.user_metadata?.phone as string) || '';

        const salt = generateSalt();
        const passwordHash = await hashPasswordPBKDF2(passwordInput, salt);
        const syncedAccount: StoredUserAccount = {
          id: data.user.id,
          email: cleanEmail,
          name: fullName,
          phone,
          role,
          salt,
          passwordHash,
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        await upsertSupabaseAccount(syncedAccount);
        await recordLoginEventInSupabase({
          userId: syncedAccount.id,
          email: cleanEmail,
          name: syncedAccount.name,
          role: syncedAccount.role,
          status: 'EXITOSO',
        });

        const updatedAccounts = [
          ...accounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
          syncedAccount,
        ];
        saveAccountsToLocalCache(updatedAccounts);

        const signedUser = await createSignedSession(syncedAccount);
        return { success: true, user: signedUser };
      }
    } catch (err) {
      console.error('Error en autenticación con Supabase:', err);
    }
  }

  const failStatus = recordFailedAuthAttempt(cleanEmail);
  await recordLoginEventInSupabase({ email: cleanEmail, status: 'FALLIDO' });
  return {
    success: false,
    error: failStatus.locked
      ? `Cuenta bloqueada temporalmente por ${failStatus.remainingSeconds} segundos debido a múltiples intentos fallidos.`
      : `Correo o contraseña incorrectos. Intentos restantes: ${failStatus.attemptsLeft}.`,
  };
};

/**
 * Registro 100% persistido en Supabase PostgreSQL y Supabase Auth.
 */
export const registerUser = async (params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  skipSupabaseAuthEmail?: boolean;
}): Promise<{ success: boolean; user?: AuthUser; error?: string; message?: string }> => {
  const nameVal = validateSafeField(params.name, 'Nombre Completo', {
    required: true,
    minLength: 3,
    maxLength: 100,
  });
  if (!nameVal.valid) {
    return { success: false, error: nameVal.error };
  }

  const emailVal = validateEmail(params.email);
  if (!emailVal.valid) {
    return { success: false, error: emailVal.error };
  }
  const cleanEmail = emailVal.sanitized;

  let cleanPhone = '';
  if (params.phone && params.phone.trim()) {
    const phoneVal = validateSafeField(params.phone, 'Teléfono', {
      required: false,
      minLength: 7,
      maxLength: 25,
    });
    if (!phoneVal.valid) {
      return { success: false, error: phoneVal.error };
    }
    cleanPhone = phoneVal.sanitized;
  }

  const passVal = validatePasswordStrength(params.password);
  if (!passVal.valid) {
    return { success: false, error: passVal.error };
  }

  if (params.password !== params.confirmPassword) {
    return { success: false, error: 'Las contraseñas ingresadas no coinciden.' };
  }

  if (AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
    return {
      success: false,
      error: 'Este correo electrónico está reservado para administración del sistema.',
    };
  }

  const accounts = await ensureSeededAccounts();
  if (accounts.some((acc) => acc.email.toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: 'Ya existe una cuenta registrada con este correo electrónico en Supabase. Por favor inicia sesión.',
    };
  }

  const salt = generateSalt();
  const passwordHash = await hashPasswordPBKDF2(params.password, salt);
  let userId = `usr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (isSupabaseConfigured && supabase && !params.skipSupabaseAuthEmail) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            full_name: nameVal.sanitized,
            phone: cleanPhone,
            role: 'client',
          },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (!error && data.user?.id) {
        userId = data.user.id;
      }
    } catch (err) {
      console.warn('Aviso al registrar en Supabase Auth:', err);
    }
  }

  const newAccount: StoredUserAccount = {
    id: userId,
    email: cleanEmail,
    name: nameVal.sanitized,
    phone: cleanPhone,
    role: 'client',
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await upsertSupabaseAccount(newAccount);
  await recordLoginEventInSupabase({
    userId: newAccount.id,
    email: cleanEmail,
    name: newAccount.name,
    role: newAccount.role,
    status: 'EXITOSO',
  });

  const nextAccounts = [...accounts, newAccount];
  saveAccountsToLocalCache(nextAccounts);

  const signedUser = await createSignedSession(newAccount);
  return {
    success: true,
    user: signedUser,
    message: 'Cuenta creada y sincronizada en Supabase con cifrado PBKDF2-SHA256.',
  };
};

/**
 * Solicita recuperación de contraseña por correo electrónico verificando la cuenta en Supabase
 * y manejando errores reales de envío de Supabase Auth.
 */
export const requestPasswordRecovery = async (
  emailInput: string,
  options?: { dryRun?: boolean }
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> => {
  const emailVal = validateEmail(emailInput);
  if (!emailVal.valid) {
    return { success: false, error: emailVal.error };
  }
  const cleanEmail = emailVal.sanitized;

  const rateLimit = checkAuthRateLimit(`recovery_${cleanEmail}`);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Por seguridad, espera ${rateLimit.remainingSeconds} segundos antes de solicitar otro correo de recuperación.`,
    };
  }

  // Verificar que el correo esté registrado en nuestra base de datos de Supabase
  const accounts = await ensureSeededAccounts();
  const existingAccount = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (!existingAccount) {
    return {
      success: false,
      error: 'No encontramos ninguna cuenta registrada con este correo electrónico.',
    };
  }

  if (options?.dryRun) {
    return {
      success: true,
      message: `Validación de recuperación verificada para ${cleanEmail}.`,
    };
  }

  if (isSupabaseConfigured && supabase) {
    const redirectUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    // Si la cuenta se creó cuando el servidor SMTP de Supabase estaba en rate-limit (id empieza por usr-),
    // asegurarnos de registrarla primero en auth.users antes de pedir resetPasswordForEmail
    if (existingAccount.id.startsWith('usr-')) {
      try {
        const tempPass = `Ac#${existingAccount.salt.slice(0, 10)}9*`;
        const { data: signUpData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: tempPass,
          options: {
            data: {
              full_name: existingAccount.name,
              phone: existingAccount.phone || '',
              role: existingAccount.role,
            },
            emailRedirectTo: redirectUrl,
          },
        });
        if (signUpData?.user?.id) {
          existingAccount.id = signUpData.user.id;
          await upsertSupabaseAccount(existingAccount);
        }
      } catch {
        // continuar a resetPasswordForEmail
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      if (
        error.status === 429 ||
        (error as any).code === 'over_email_send_rate_limit' ||
        error.message.toLowerCase().includes('rate limit')
      ) {
        return {
          success: false,
          error:
            'El servidor de correo gratuito de Supabase alcanzó su límite (máximo 2 correos por hora). Por favor espera unos minutos para volver a enviar o amplía el límite en tu panel de Supabase (Authentication > Rate Limits).',
        };
      }

      return {
        success: false,
        error: `No fue posible enviar el correo de recuperación desde Supabase: ${error.message}`,
      };
    }
  }

  return {
    success: true,
    message: `Hemos enviado un enlace de recuperación a ${cleanEmail}. Haz clic en el enlace dentro de tu correo para definir tu nueva contraseña.`,
  };
};

/**
 * Restablece y sincroniza la nueva contraseña en Supabase PostgreSQL y Supabase Auth.
 */
export const resetUserPassword = async (params: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string; message?: string }> => {
  let targetEmail = params.email;

  // Si viene de sesión de recuperación de Supabase Auth y el campo email está vacío, obtenerlo de la sesión
  if (!targetEmail && isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        targetEmail = data.user.email;
      }
    } catch {}
  }

  const emailVal = validateEmail(targetEmail);
  if (!emailVal.valid) {
    return { success: false, error: emailVal.error };
  }
  const cleanEmail = emailVal.sanitized;

  const passVal = validatePasswordStrength(params.newPassword);
  if (!passVal.valid) {
    return { success: false, error: passVal.error };
  }

  if (params.newPassword !== params.confirmPassword) {
    return { success: false, error: 'Las contraseñas nuevas no coinciden.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.updateUser({ password: params.newPassword });
    } catch {
      // Continuar con actualización en Supabase PostgreSQL
    }
  }

  const accounts = await ensureSeededAccounts();
  const targetIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  const newSalt = generateSalt();
  const newPasswordHash = await hashPasswordPBKDF2(params.newPassword, newSalt);

  let updatedAccount: StoredUserAccount;

  if (targetIndex > -1) {
    updatedAccount = {
      ...accounts[targetIndex],
      salt: newSalt,
      passwordHash: newPasswordHash,
    };
    accounts[targetIndex] = updatedAccount;
  } else {
    const isAdminEmail = AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail);
    updatedAccount = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: isAdminEmail ? 'admin' : 'client',
      salt: newSalt,
      passwordHash: newPasswordHash,
      createdAt: new Date().toISOString(),
    };
    accounts.push(updatedAccount);
  }

  await upsertSupabaseAccount(updatedAccount);
  saveAccountsToLocalCache(accounts);
  clearAuthRateLimit(cleanEmail);

  return {
    success: true,
    message: 'Contraseña actualizada y sincronizada en Supabase. Ya puedes iniciar sesión.',
  };
};

/**
 * Cierra la sesión actual de forma segura en el cliente y en Supabase Auth.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
  }
};

/**
 * Obtiene la lista completa de usuarios registrados directamente desde Supabase.
 */
export const getAllRegisteredAccounts = async (): Promise<StoredUserAccount[]> => {
  return await ensureSeededAccounts();
};

/**
 * Permite al Administrador cambiar la contraseña de cualquier usuario o la suya propia,
 * recalculando el hash PBKDF2-SHA256 y sincronizándolo en Supabase.
 */
export const adminChangePassword = async (
  targetEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const cleanEmail = targetEmail.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, error: 'Correo de usuario no válido.' };
  }

  const passVal = validatePasswordStrength(newPassword);
  if (!passVal.valid) {
    return { success: false, error: passVal.error };
  }

  const accounts = await ensureSeededAccounts();
  const targetIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  if (targetIndex === -1) {
    return { success: false, error: 'No se encontró el usuario en la base de datos.' };
  }

  const newSalt = generateSalt();
  const newPasswordHash = await hashPasswordPBKDF2(newPassword, newSalt);

  const updatedAccount: StoredUserAccount = {
    ...accounts[targetIndex],
    salt: newSalt,
    passwordHash: newPasswordHash,
  };

  accounts[targetIndex] = updatedAccount;

  // Actualizar en Supabase PostgreSQL
  await upsertSupabaseAccount(updatedAccount);
  saveAccountsToLocalCache(accounts);
  clearAuthRateLimit(cleanEmail);

  // Si la cuenta tiene sesión activa en Supabase Auth y es el usuario actual, actualizar también
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email?.toLowerCase() === cleanEmail) {
        await supabase.auth.updateUser({ password: newPassword });
      }
    } catch {
      // Ignorar fallo secundario en Auth client si no coincide la sesión
    }
  }

  return {
    success: true,
    message: `La contraseña de "${updatedAccount.name}" (${cleanEmail}) ha sido actualizada exitosamente.`,
  };
};

/**
 * Permite al Administrador cambiar el rol de un usuario (admin / client).
 */
export const adminUpdateUserRole = async (
  targetEmail: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const cleanEmail = targetEmail.toLowerCase().trim();
  const accounts = await ensureSeededAccounts();
  const targetIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  if (targetIndex === -1) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  if (cleanEmail === 'admin@americanclothes.com' && newRole !== 'admin') {
    return { success: false, error: 'No es posible quitar el rol de administrador a la cuenta principal.' };
  }

  accounts[targetIndex].role = newRole;
  await upsertSupabaseAccount(accounts[targetIndex]);
  saveAccountsToLocalCache(accounts);

  return {
    success: true,
    message: `Rol de "${accounts[targetIndex].name}" cambiado a ${newRole.toUpperCase()}.`,
  };
};

/**
 * Permite al Administrador eliminar un usuario registrado.
 */
export const adminDeleteAccount = async (
  targetEmail: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const cleanEmail = targetEmail.toLowerCase().trim();

  if (cleanEmail === 'admin@americanclothes.com') {
    return { success: false, error: 'No se puede eliminar la cuenta principal de administración.' };
  }

  const accounts = await ensureSeededAccounts();
  const targetAccount = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!targetAccount) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  // 1. Eliminar de public.app_users
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('app_users').delete().eq('email', cleanEmail);
    } catch {}

    // 2. Eliminar del registro fallback en orders
    try {
      await supabase.from('orders').delete().eq('id', `${SYS_USER_PREFIX}${cleanEmail}`);
    } catch {}
  }

  const nextAccounts = accounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
  saveAccountsToLocalCache(nextAccounts);

  return {
    success: true,
    message: `Usuario ${cleanEmail} eliminado correctamente de la base de datos.`,
  };
};
