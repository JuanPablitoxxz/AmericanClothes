import React, { useEffect, useState } from 'react';
import { AuthUser } from '../../types';
import {
  loginUser,
  registerUser,
  requestPasswordRecovery,
  resetUserPassword,
} from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  detectSqlInjection,
  detectXss,
  validatePasswordStrength,
} from '../../lib/security';

export type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthModalProps {
  isOpen: boolean;
  initialView?: AuthView;
  initialEmail?: string;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialView = 'login',
  initialEmail = '',
  onClose,
  onAuthSuccess,
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      if (initialEmail) setEmail(initialEmail);
      setErrorMsg(null);
      setSuccessMsg(null);
      setRecoverySent(false);
      setPassword('');
      setConfirmPassword('');

      if (initialView === 'reset-password' && !initialEmail && supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.email) {
            setEmail(data.user.email);
          }
        });
      }
    }
  }, [isOpen, initialView, initialEmail]);

  if (!isOpen) return null;

  const switchView = (nextView: AuthView) => {
    setView(nextView);
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecoverySent(false);
    setPassword('');
    setConfirmPassword('');
  };

  // Detección preventiva en tiempo real de intentos de inyección SQL o XSS
  const hasRealtimeThreat =
    detectSqlInjection(email) ||
    detectSqlInjection(name) ||
    detectSqlInjection(password) ||
    detectXss(email) ||
    detectXss(name);

  const passwordChecks = validatePasswordStrength(password).checks;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'No fue posible iniciar sesión.');
      } else {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch {
      setErrorMsg('Error inesperado al verificar credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await registerUser({
        name,
        email,
        phone,
        password,
        confirmPassword,
      });

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'No fue posible completar el registro.');
      } else {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch {
      setErrorMsg('Error inesperado al registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await requestPasswordRecovery(email);
      if (!result.success) {
        setErrorMsg(result.error || 'No se pudo procesar la solicitud.');
      } else {
        setRecoverySent(true);
        setSuccessMsg(
          result.message ||
            'Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.'
        );
      }
    } catch {
      setErrorMsg('Error al enviar la solicitud de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await resetUserPassword({
        email,
        newPassword: password,
        confirmPassword,
      });

      if (!result.success) {
        setErrorMsg(result.error || 'No fue posible actualizar la contraseña.');
      } else {
        setSuccessMsg(
          result.message || 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
        );
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          switchView('login');
        }, 1800);
      }
    } catch {
      setErrorMsg('Error inesperado al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F8F6] border border-black/15 max-w-md w-full text-[#1A1A1A] shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Security Banner */}
        <div className="bg-[#1A1A1A] text-[#F9F8F6] px-6 py-2.5 flex items-center justify-between text-[10px] font-label-caps tracking-[2px]">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-emerald-400">verified_user</span>
            CONEXIÓN CIFRADA • ANTI-SQLi ACTIVO
          </span>
          <button
            onClick={onClose}
            className="text-[#F9F8F6]/70 hover:text-[#F9F8F6] transition-colors"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="px-8 pt-6 pb-4 text-center border-b border-black/10">
          <span className="font-label-caps text-[10px] tracking-[3px] text-[#888888] block mb-1 uppercase">
            ACCESO EXCLUSIVO
          </span>
          <h2 className="font-serif-display text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            AMERICAN CLOTHES
          </h2>
        </div>

        {/* Navigation Tabs (for Login / Register) */}
        {(view === 'login' || view === 'register') && (
          <div className="grid grid-cols-2 border-b border-black/10 bg-[#EFECE7]">
            <button
              type="button"
              onClick={() => switchView('login')}
              className={`py-3.5 font-label-caps text-[11px] tracking-[2px] uppercase transition-all ${
                view === 'login'
                  ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold border-b-2 border-[#1A1A1A]'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchView('register')}
              className={`py-3.5 font-label-caps text-[11px] tracking-[2px] uppercase transition-all ${
                view === 'register'
                  ? 'bg-[#F9F8F6] text-[#1A1A1A] font-bold border-b-2 border-[#1A1A1A]'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-5">
          {/* Alerta preventiva de seguridad en tiempo real */}
          {hasRealtimeThreat && (
            <div className="p-3 bg-red-950 text-red-100 border border-red-500 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0">
                gpp_bad
              </span>
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">
                   Escudo Anti-Inyección SQL Activado
                </p>
                <p className="text-[11px] mt-0.5">
                  Se detectaron comandos SQL o scripts no permitidos en la entrada. La solicitud será bloqueada.
                </p>
              </div>
            </div>
          )}

          {/* Mensajes de Error */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-red-600 flex-shrink-0">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mensajes de Éxito */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-emerald-600 flex-shrink-0">
                check_circle
              </span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==============================================================
              1. FORMULARIO DE INICIO DE SESIÓN
             ============================================================== */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1.5 uppercase">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-3 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] uppercase">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot-password')}
                    className="text-[11px] text-[#1A1A1A] underline hover:text-[#555555] font-sans-body"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-10 py-3 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#1A1A1A]"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[3px] hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>

              <div className="pt-3 border-t border-black/10 text-center">
                <p className="text-xs text-[#666666]">
                  ¿Aún no tienes una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="font-bold text-[#1A1A1A] underline hover:text-[#555555]"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ==============================================================
              2. FORMULARIO DE REGISTRO DE CLIENTES
             ============================================================== */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej: Valentina Mendoza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    placeholder="valentina@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    call
                  </span>
                  <input
                    type="tel"
                    maxLength={25}
                    placeholder="Ej: 310 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Contraseña Segura
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={128}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-10 py-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#1A1A1A]"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Indicadores de fortaleza en tiempo real */}
                <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-[#666666]">
                  <span className={passwordChecks.minLength ? 'text-emerald-700 font-semibold' : ''}>
                    {passwordChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                  </span>
                  <span className={passwordChecks.hasUppercase ? 'text-emerald-700 font-semibold' : ''}>
                    {passwordChecks.hasUppercase ? '✓' : '○'} 1 Mayúscula
                  </span>
                  <span className={passwordChecks.hasLowercase ? 'text-emerald-700 font-semibold' : ''}>
                    {passwordChecks.hasLowercase ? '✓' : '○'} 1 Minúscula
                  </span>
                  <span className={passwordChecks.hasNumber ? 'text-emerald-700 font-semibold' : ''}>
                    {passwordChecks.hasNumber ? '✓' : '○'} 1 Número
                  </span>
                </div>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                    verified
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={128}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[3px] hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          {/* ==============================================================
              3. FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA POR CORREO
             ============================================================== */}
          {view === 'forgot-password' && (
            <div className="space-y-4">
              <div>
                <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px] uppercase block mb-1">
                  RECUPERACIÓN DE CUENTA
                </span>
                <h3 className="font-serif-display text-xl text-[#1A1A1A]">
                  Recuperar Contraseña por Correo
                </h3>
                <p className="text-xs text-[#555555] mt-1 leading-relaxed">
                  Ingresa tu dirección de correo electrónico registrada. Te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1.5 uppercase">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-base">
                      forward_to_inbox
                    </span>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#EFECE7] border border-black/15 pl-10 pr-3 py-3 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {loading ? 'Enviando correo...' : 'Enviar Correo de Recuperación'}
                </button>
              </form>

              <div className="pt-2 border-t border-black/10 flex justify-start items-center text-xs">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-[#1A1A1A] hover:underline flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ==============================================================
              4. FORMULARIO DE NUEVA CONTRASEÑA (RESTABLECIMIENTO)
             ============================================================== */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
              <div>
                <span className="font-label-caps text-[10px] text-[#888888] tracking-[2px] uppercase block mb-1">
                  ACTUALIZACIÓN DE CREDENCIALES
                </span>
                <h3 className="font-serif-display text-xl text-[#1A1A1A]">
                  Definir Nueva Contraseña
                </h3>
                <p className="text-xs text-[#555555] mt-1">
                  Establece una nueva contraseña segura para tu cuenta de American Clothes.
                </p>
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Correo Electrónico de la Cuenta
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#EFECE7] border border-black/15 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Nueva Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  placeholder="Mínimo 8 caracteres, mayúscula y número"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#EFECE7] border border-black/15 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#666666] tracking-[2px] block mb-1 uppercase">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#EFECE7] border border-black/15 p-2.5 text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] font-label-caps text-xs font-bold uppercase tracking-[2px] hover:bg-[#333333] transition-colors disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>

              <div className="pt-2 border-t border-black/10 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs text-[#1A1A1A] hover:underline"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
