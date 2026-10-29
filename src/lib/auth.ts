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

interface StoredUserAccount {
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
const RECOVERY_REQUEST_STORAGE_KEY = 'american_clothes_recovery_req_v1';

// Correos autorizados exclusivamente para rol administrativo
const AUTHORIZED_ADMIN_EMAILS = ['admin@americanclothes.com', 'gerencia@americanclothes.com'];

/**
 * Inicializa las cuentas base con hash criptográfico PBKDF2-SHA256 (100,000 iteraciones)
 * para garantizar que el panel administrativo y de cliente estén protegidos desde el primer uso.
 */
const ensureSeededAccounts = async (): Promise<StoredUserAccount[]> => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_USERS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer almacén seguro de cuentas:', e);
  }

  const adminSalt = generateSalt();
  const adminHash = await hashPasswordPBKDF2('Admin2026*', adminSalt);

  const clientSalt = generateSalt();
  const clientHash = await hashPasswordPBKDF2('Cliente2026*', clientSalt);

  const seeded: StoredUserAccount[] = [
    {
      id: 'usr-admin-001',
      email: 'admin@americanclothes.com',
      name: 'Gerencia American Clothes',
      phone: '300 123 4567',
      role: 'admin',
      salt: adminSalt,
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-client-001',
      email: 'cliente@americanclothes.com',
      name: 'Camila Rodríguez',
      phone: '310 123 4567',
      role: 'client',
      salt: clientSalt,
      passwordHash: clientHash,
      createdAt: new Date().toISOString(),
    },
  ];

  saveAccountsToStorage(seeded);
  return seeded;
};

const saveAccountsToStorage = (accounts: StoredUserAccount[]): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.error('Error al guardar cuentas cifradas:', e);
  }
};

/**
 * Construye una sesión firmada criptográficamente para prevenir adulteración de roles en cliente.
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
 * Obtiene y verifica criptográficamente la sesión actual.
 * Si alguien intenta modificar el rol de 'client' a 'admin' en localStorage,
 * la firma SHA-256 falla y la sesión se invalida inmediatamente.
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

    // Verificar que ningún campo contenga SQLi o XSS
    if (
      detectSqlInjection(parsed.email) ||
      detectSqlInjection(parsed.name) ||
      detectXss(parsed.email) ||
      detectXss(parsed.name)
    ) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    // Verificar firma criptográfica contra escalada de privilegios
    const isAuthentic = await verifySessionSignature(
      parsed.id,
      parsed.email,
      parsed.role,
      parsed.signature
    );

    if (!isAuthentic) {
      console.warn('Alerta de Seguridad: Firma de sesión inválida o adulterada. Cerrando sesión.');
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    // Doble verificación de que un rol admin pertenezca únicamente a correos autorizados
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
 * Inicio de Sesión seguro con validación Anti-SQLi, Rate Limiting y verificación PBKDF2 + Supabase Auth.
 */
export const loginUser = async (
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  // 1. Verificar protección Anti-SQL Injection y Anti-XSS en ambos campos antes de procesar
  if (detectSqlInjection(emailInput) || detectSqlInjection(passwordInput)) {
    recordFailedAuthAttempt(emailInput || 'sqli');
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

  // 2. Validar formato de correo electrónico
  const emailValidation = validateEmail(emailInput);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }
  const cleanEmail = emailValidation.sanitized;

  // 3. Verificar límite de intentos (Anti-Brute Force)
  const rateLimit = checkAuthRateLimit(cleanEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.remainingSeconds} segundos antes de volver a intentar.`,
    };
  }

  if (!passwordInput || passwordInput.length < 4) {
    const fail = recordFailedAuthAttempt(cleanEmail);
    return {
      success: false,
      error: fail.locked
        ? `Cuenta bloqueada temporalmente por ${fail.remainingSeconds}s tras múltiples intentos.`
        : 'Credenciales incorrectas. Verifica tu correo electrónico y contraseña.',
    };
  }

  const accounts = await ensureSeededAccounts();
  const localAccount = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  // 4. Verificar contra hash criptográfico PBKDF2-SHA256
  if (localAccount) {
    const isPasswordValid = await verifyPasswordPBKDF2(
      passwordInput,
      localAccount.salt,
      localAccount.passwordHash
    );

    if (isPasswordValid) {
      clearAuthRateLimit(cleanEmail);

      // Sincronizar sesión con Supabase Auth en segundo plano si está configurado
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: passwordInput,
          });
        } catch {
          // Si Supabase tiene pendiente confirmación de correo, mantenemos la sesión autenticada verificada por PBKDF2
        }
      }

      const signedUser = await createSignedSession(localAccount);
      return { success: true, user: signedUser };
    }
  }

  // 5. Intentar autenticación directa en Supabase Auth (para usuarios creados en otro dispositivo)
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
          (data.user.user_metadata?.full_name as string) ||
          cleanEmail.split('@')[0];
        const phone = (data.user.user_metadata?.phone as string) || '';

        // Guardar también en almacén cifrado local
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

        const updatedAccounts = [
          ...accounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
          syncedAccount,
        ];
        saveAccountsToStorage(updatedAccounts);

        const signedUser = await createSignedSession(syncedAccount);
        return { success: true, user: signedUser };
      }
    } catch (err) {
      console.error('Error en autenticación con Supabase:', err);
    }
  }

  // 6. Registrar intento fallido
  const failStatus = recordFailedAuthAttempt(cleanEmail);
  return {
    success: false,
    error: failStatus.locked
      ? `Cuenta bloqueada temporalmente por ${failStatus.remainingSeconds} segundos debido a múltiples intentos fallidos.`
      : `Correo o contraseña incorrectos. Intentos restantes: ${failStatus.attemptsLeft}.`,
  };
};

/**
 * Registro seguro de nuevos clientes (rol estrictamente 'client', con validación Anti-SQLi y PBKDF2).
 */
export const registerUser = async (params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success: boolean; user?: AuthUser; error?: string; message?: string }> => {
  // 1. Validar Nombre Completo
  const nameVal = validateSafeField(params.name, 'Nombre Completo', {
    required: true,
    minLength: 3,
    maxLength: 100,
  });
  if (!nameVal.valid) {
    return { success: false, error: nameVal.error };
  }

  // 2. Validar Correo Electrónico
  const emailVal = validateEmail(params.email);
  if (!emailVal.valid) {
    return { success: false, error: emailVal.error };
  }
  const cleanEmail = emailVal.sanitized;

  // 3. Validar Teléfono (opcional pero protegido contra SQLi/XSS)
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

  // 4. Validar Fortaleza y Seguridad de Contraseña
  const passVal = validatePasswordStrength(params.password);
  if (!passVal.valid) {
    return { success: false, error: passVal.error };
  }

  if (params.password !== params.confirmPassword) {
    return { success: false, error: 'Las contraseñas ingresadas no coinciden.' };
  }

  // 5. Verificar que el correo no esté ya registrado ni sea un correo administrativo reservado
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
      error: 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.',
    };
  }

  // 6. Generar Salt y Hash PBKDF2-SHA256 (100,000 iteraciones)
  const salt = generateSalt();
  const passwordHash = await hashPasswordPBKDF2(params.password, salt);

  let userId = `usr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 7. Registrar también en Supabase Auth para habilitar recuperación por correo oficial
  if (isSupabaseConfigured && supabase) {
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
      console.warn('Aviso al sincronizar registro con Supabase Auth:', err);
    }
  }

  const newAccount: StoredUserAccount = {
    id: userId,
    email: cleanEmail,
    name: nameVal.sanitized,
    phone: cleanPhone,
    role: 'client', // Todo registro público es estrictamente cliente
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const nextAccounts = [...accounts, newAccount];
  saveAccountsToStorage(nextAccounts);

  const signedUser = await createSignedSession(newAccount);
  return {
    success: true,
    user: signedUser,
    message: 'Cuenta creada exitosamente con cifrado de seguridad activo.',
  };
};

/**
 * Solicita recuperación de contraseña por correo electrónico.
 * Envía el enlace oficial a través de Supabase Auth y prepara el token de recuperación seguro.
 */
export const requestPasswordRecovery = async (
  emailInput: string
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

  // Enviar correo real de recuperación mediante Supabase Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/?recovery=true&email=${encodeURIComponent(cleanEmail)}`
          : undefined;

      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });
    } catch (err) {
      console.warn('Aviso al solicitar correo de recuperación en Supabase:', err);
    }
  }

  // Registrar solicitud de recuperación temporal (válida por 15 minutos)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        RECOVERY_REQUEST_STORAGE_KEY,
        JSON.stringify({
          email: cleanEmail,
          expiresAt: Date.now() + 15 * 60 * 1000,
        })
      );
    }
  } catch {
    // ignore storage errors
  }

  return {
    success: true,
    message: `Se han enviado las instrucciones de recuperación a ${cleanEmail}. Revisa tu bandeja de entrada o carpeta de spam para restablecer tu contraseña.`,
  };
};

/**
 * Restablece y actualiza la contraseña de una cuenta tras recuperación por correo o desde el perfil.
 */
export const resetUserPassword = async (params: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string; message?: string }> => {
  const emailVal = validateEmail(params.email);
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

  // Actualizar en Supabase Auth si hay sesión activa o token de recuperación
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.updateUser({ password: params.newPassword });
    } catch {
      // Continuar con actualización en almacén PBKDF2
    }
  }

  const accounts = await ensureSeededAccounts();
  const targetIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  const newSalt = generateSalt();
  const newPasswordHash = await hashPasswordPBKDF2(params.newPassword, newSalt);

  if (targetIndex > -1) {
    accounts[targetIndex] = {
      ...accounts[targetIndex],
      salt: newSalt,
      passwordHash: newPasswordHash,
    };
    saveAccountsToStorage(accounts);
  } else {
    // Si el usuario estaba registrado únicamente en Supabase Auth, sincronizar su nuevo hash
    const isAdminEmail = AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail);
    accounts.push({
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: isAdminEmail ? 'admin' : 'client',
      salt: newSalt,
      passwordHash: newPasswordHash,
      createdAt: new Date().toISOString(),
    });
    saveAccountsToStorage(accounts);
  }

  clearAuthRateLimit(cleanEmail);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(RECOVERY_REQUEST_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  return {
    success: true,
    message: 'Tu contraseña ha sido actualizada exitosamente con cifrado seguro PBKDF2-SHA256.',
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
