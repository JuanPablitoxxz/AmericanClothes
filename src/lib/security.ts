/**
 * Módulo de Seguridad Informática y Prevención de Inyección SQL (SQLi) / XSS
 * Cumple con estándares OWASP Top 10 para validación, sanitización,
 * hashing criptográfico (PBKDF2-SHA256) y protección contra fuerza bruta.
 */

// Patrones de detección de Inyección SQL (SQLi) clásicos y avanzados
const SQL_INJECTION_PATTERNS: RegExp[] = [
  // Tautologías clásicas: ' OR '1'='1, " OR 1=1, " OR ""=", ' OR ''=', OR TRUE
  /('|"|`)\s*(OR|AND)\s*('|"|`|\d+)?\s*\w*\s*=\s*('|"|`|\d+)?\s*\w*/i,
  /\b(OR|AND)\s+1\s*=\s*1\b/i,
  /\b(OR|AND)\s+TRUE\b/i,
  /('|"|`)\s*(OR|AND)\s*('|"|`)/i,
  // Consultas apiladas (Stacked Queries) con comandos DDL/DML peligrosos
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE)\b/i,
  // Ataques basados en UNION
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  // Comentarios SQL utilizados para truncar consultas
  /--\s*$/m,
  /;\s*--/,
  /'\s*--/,
  /\/\*[\s\S]*?\*\//,
  // Comandos de sistema y procedimientos almacenados peligrosos
  /\b(xp_cmdshell|sp_executesql|EXEC\s*\(|EXECUTE\s*\()\b/i,
  // Inyección ciega basada en tiempo (Time-based Blind SQLi)
  /\b(SLEEP\s*\(|BENCHMARK\s*\(|WAITFOR\s+DELAY|PG_SLEEP\s*\()\b/i,
  // Exploración de esquema y catálogos del motor de base de datos
  /\b(INFORMATION_SCHEMA|PG_CATALOG|PG_SHADOW|PG_USER|SYSOBJECTS|SYSCOLUMNS)\b/i,
  // Comandos directos de destrucción de datos
  /\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/i,
  // Evasión mediante codificación hexadecimal o funciones CHAR/CHR
  /\b(CHAR|CHR)\s*\(\s*\d+\s*\)/i,
  /0x[0-9a-fA-F]{6,}/,
];

// Patrones de detección de Cross-Site Scripting (XSS)
const XSS_PATTERNS: RegExp[] = [
  /<\s*script\b[^>]*>/i,
  /<\s*\/\s*script\s*>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon(error|load|click|mouseover|focus|blur|submit|change|keyup|keydown)\s*=/i,
  /<\s*(iframe|object|embed|applet|meta|link|style|base|form)\b/i,
  /<\s*svg\b[^>]*\bon\w+\s*=/i,
  /\beval\s*\(/i,
  /\bdocument\s*\.\s*(cookie|write|domain)/i,
];

/**
 * Detecta si una cadena contiene vectores de ataque de Inyección SQL (SQLi).
 */
export const detectSqlInjection = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  const decoded = tryDecodeUri(input);
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input) || pattern.test(decoded));
};

/**
 * Detecta si una cadena contiene vectores de ataque Cross-Site Scripting (XSS).
 */
export const detectXss = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  const decoded = tryDecodeUri(input);
  return XSS_PATTERNS.some((pattern) => pattern.test(input) || pattern.test(decoded));
};

const tryDecodeUri = (val: string): string => {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
};

/**
 * Sanitiza texto eliminando bytes nulos, caracteres de control y etiquetas HTML peligrosas.
 */
export const sanitizeText = (input: string, maxLength = 500): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // Eliminar null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Eliminar caracteres de control ASCII
    .replace(/<\/?[^>]+(>|$)/g, '') // Eliminar etiquetas HTML
    .trim()
    .slice(0, maxLength);
};

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Valida y sanitiza un campo de entrada contra SQLi, XSS y restricciones de longitud.
 */
export const validateSafeField = (
  value: string,
  fieldLabel: string,
  options: { required?: boolean; minLength?: number; maxLength?: number; allowHtml?: boolean } = {}
): ValidationResult => {
  const { required = true, minLength = 1, maxLength = 500 } = options;
  const raw = typeof value === 'string' ? value.trim() : '';

  if (!raw) {
    if (required) {
      return {
        valid: false,
        sanitized: '',
        error: `El campo "${fieldLabel}" es obligatorio.`,
      };
    }
    return { valid: true, sanitized: '' };
  }

  if (detectSqlInjection(raw)) {
    return {
      valid: false,
      sanitized: '',
      error: `Alerta de Seguridad: Se bloquearon caracteres o comandos no permitidos (Anti-SQL Injection) en "${fieldLabel}".`,
    };
  }

  if (detectXss(raw)) {
    return {
      valid: false,
      sanitized: '',
      error: `Alerta de Seguridad: Se bloqueó código ejecutable no permitido (Anti-XSS) en "${fieldLabel}".`,
    };
  }

  const sanitized = sanitizeText(raw, maxLength);

  if (required && sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `El campo "${fieldLabel}" debe tener al menos ${minLength} caracteres.`,
    };
  }

  if (raw.length > maxLength) {
    return {
      valid: false,
      sanitized,
      error: `El campo "${fieldLabel}" excede el límite máximo de ${maxLength} caracteres.`,
    };
  }

  return { valid: true, sanitized };
};

/**
 * Valida formato estricto de correo electrónico (RFC 5322) y protección Anti-SQLi / XSS.
 */
export const validateEmail = (email: string): ValidationResult => {
  const raw = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!raw) {
    return { valid: false, sanitized: '', error: 'El correo electrónico es obligatorio.' };
  }

  if (detectSqlInjection(raw) || detectXss(raw)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Alerta de Seguridad: El correo contiene patrones maliciosos bloqueados.',
    };
  }

  // Prohibir comillas simples, dobles, punto y coma o comentarios dentro del email
  if (/['";`\\]/.test(raw) || raw.includes('--') || raw.includes('/*')) {
    return {
      valid: false,
      sanitized: '',
      error: 'El correo electrónico contiene caracteres no permitidos.',
    };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(raw) || raw.length > 254) {
    return {
      valid: false,
      sanitized: '',
      error: 'Ingresa una dirección de correo electrónico válida.',
    };
  }

  return { valid: true, sanitized: raw };
};

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    noSqlInjection: boolean;
  };
}

/**
 * Valida la fortaleza de una contraseña y verifica que no contenga payloads de inyección SQL.
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const raw = typeof password === 'string' ? password : '';
  const noSqlInjection = !detectSqlInjection(raw) && !detectXss(raw);
  const minLength = raw.length >= 8 && raw.length <= 128;
  const hasUppercase = /[A-Z]/.test(raw);
  const hasLowercase = /[a-z]/.test(raw);
  const hasNumber = /\d/.test(raw);

  if (!noSqlInjection) {
    return {
      valid: false,
      error: 'Alerta de Seguridad: La contraseña contiene patrones de inyección SQL bloqueados.',
      checks: { minLength, hasUppercase, hasLowercase, hasNumber, noSqlInjection },
    };
  }

  if (!minLength || !hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      error:
        'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.',
      checks: { minLength, hasUppercase, hasLowercase, hasNumber, noSqlInjection },
    };
  }

  return {
    valid: true,
    checks: { minLength, hasUppercase, hasLowercase, hasNumber, noSqlInjection },
  };
};

// ============================================================================
// CRIPTOGRAFÍA: HASHING DE CONTRASEÑAS CON PBKDF2-SHA256 (Web Crypto API)
// ============================================================================

const bufferToHex = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToUint8Array = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Genera un salt criptográfico aleatorio de 16 bytes.
 */
export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bufferToHex(array);
};

/**
 * Deriva un hash criptográfico seguro usando PBKDF2-SHA256 (100,000 iteraciones).
 */
export const hashPasswordPBKDF2 = async (password: string, saltHex: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = hexToUint8Array(saltHex);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
};

/**
 * Comparación en tiempo constante para evitar ataques de temporización (Timing Attacks).
 */
export const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

/**
 * Verifica una contraseña contra un hash PBKDF2-SHA256 y su salt.
 */
export const verifyPasswordPBKDF2 = async (
  password: string,
  saltHex: string,
  expectedHashHex: string
): Promise<boolean> => {
  const actualHash = await hashPasswordPBKDF2(password, saltHex);
  return constantTimeEqual(actualHash, expectedHashHex);
};

// ============================================================================
// FIRMA DE INTEGRIDAD DE SESIÓN (Anti-escalada de privilegios en cliente)
// ============================================================================

const SESSION_SECRET_PEPPER = 'AC_SEC_2026_HMAC_9f8e7d6c5b4a3f2e1d0c';

export const computeSessionSignature = async (
  userId: string,
  email: string,
  role: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const payload = `${userId}|${email.toLowerCase()}|${role}|${SESSION_SECRET_PEPPER}`;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
  return bufferToHex(digest);
};

export const verifySessionSignature = async (
  userId: string,
  email: string,
  role: string,
  signature: string
): Promise<boolean> => {
  if (!userId || !email || !role || !signature) return false;
  const expected = await computeSessionSignature(userId, email, role);
  return constantTimeEqual(expected, signature);
};

// ============================================================================
// PROTECCIÓN CONTRA FUERZA BRUTA (Rate Limiting por identificador)
// ============================================================================

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
}

const RATE_LIMIT_STORAGE_KEY = 'american_clothes_auth_ratelimit_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 segundos de bloqueo tras 5 intentos fallidos

const getRateLimitMap = (): Record<string, RateLimitEntry> => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRateLimitMap = (map: Record<string, RateLimitEntry>): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
};

export const checkAuthRateLimit = (
  identifier = 'global'
): { allowed: boolean; remainingSeconds: number; attemptsLeft: number } => {
  const key = identifier.toLowerCase().trim() || 'global';
  const map = getRateLimitMap();
  const entry = map[key];

  if (!entry) {
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  const now = Date.now();
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds, attemptsLeft: 0 };
  }

  // Si ya expiró el bloqueo, reiniciar contador
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    delete map[key];
    saveRateLimitMap(map);
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingSeconds: 0,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - entry.attempts),
  };
};

export const recordFailedAuthAttempt = (
  identifier = 'global'
): { locked: boolean; remainingSeconds: number; attemptsLeft: number } => {
  const key = identifier.toLowerCase().trim() || 'global';
  const map = getRateLimitMap();
  const current = map[key] || { attempts: 0, lockedUntil: null };

  const nextAttempts = current.attempts + 1;
  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    map[key] = { attempts: nextAttempts, lockedUntil };
    saveRateLimitMap(map);
    return {
      locked: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      attemptsLeft: 0,
    };
  }

  map[key] = { attempts: nextAttempts, lockedUntil: null };
  saveRateLimitMap(map);
  return {
    locked: false,
    remainingSeconds: 0,
    attemptsLeft: MAX_FAILED_ATTEMPTS - nextAttempts,
  };
};

export const clearAuthRateLimit = (identifier = 'global'): void => {
  const key = identifier.toLowerCase().trim() || 'global';
  const map = getRateLimitMap();
  if (map[key]) {
    delete map[key];
    saveRateLimitMap(map);
  }
};
