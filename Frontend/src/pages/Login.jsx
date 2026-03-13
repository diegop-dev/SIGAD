import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import sigadLogo from '../assets/sigad_logo.jpeg'; // Ajusta la ruta según tu proyecto

// ─── Paleta UNID ────────────────────────────────────────────────────────────
// Navy principal : #0C2240
// Navy medio     : #163659
// Dorado/Ámbar   : #F0A020
// Dorado hover   : #E8920A
// Texto oscuro   : #0C2240
// ─────────────────────────────────────────────────────────────────────────────

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Verificando credenciales...');

    const result = await login(email, password);

    if (result.success) {
      toast.success('Acceso autorizado. Bienvenido a SIGAD.', { id: toastId });
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Credenciales inválidas.', { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Mitad izquierda: Formulario ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">

          {/* Logotipo pequeño en móvil (sólo visible cuando el panel derecho está oculto) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img
              src={sigadLogo}
              alt="SIGAD"
              className="h-16 w-16 rounded-xl object-cover shadow-md"
            />
          </div>

          {/* Encabezado */}
          <div>
            <h2 className="text-4xl font-black tracking-tight" style={{ color: '#0C2240' }}>
              Iniciar Sesión
            </h2>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              ¡Ingresa tu correo institucional y contraseña para continuar!
            </p>
          </div>

          {/* Separador decorativo dorado */}
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 w-10 rounded-full" style={{ backgroundColor: '#F0A020' }} />
            <div className="h-1 w-4 rounded-full bg-slate-200" />
          </div>

          {/* Formulario */}
          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Correo */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold"
                  style={{ color: '#0C2240' }}
                >
                  Correo institucional
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      '--tw-ring-color': '#0C2240',
                      borderColor: 'rgb(203 213 225)',
                    }}
                    className="block w-full pl-10 sm:text-sm rounded-lg py-3 border
                               focus:outline-none focus:ring-2 focus:ring-[#0C2240] focus:border-[#0C2240]
                               transition-colors"
                    placeholder="ejemplo@unid.edu.mx"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold"
                  style={{ color: '#0C2240' }}
                >
                  Contraseña
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 sm:text-sm rounded-lg py-3 border border-slate-300
                               focus:outline-none focus:ring-2 focus:ring-[#0C2240] focus:border-[#0C2240]
                               transition-colors"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400
                               hover:text-[#0C2240] focus:outline-none transition-colors cursor-pointer"
                    tabIndex="-1"
                  >
                    {showPassword
                      ? <EyeOff className="h-5 w-5" aria-hidden="true" />
                      : <Eye    className="h-5 w-5" aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting ? '#F7C46A' : '#F0A020',
                    color: '#0C2240',
                  }}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent
                              rounded-lg shadow-sm text-sm font-bold transition-all duration-200
                              ${isSubmitting
                                ? 'cursor-not-allowed'
                                : 'hover:brightness-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2'
                              }`}
                  onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#E8920A'; }}
                  onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#F0A020'; }}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* ── Mitad derecha: Banner corporativo UNID ──────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0C2240' }}
      >

        {/* Efectos de fondo sutiles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Resplandor ámbar inferior izquierdo */}
          <div
            className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: '#F0A020', opacity: 0.12 }}
          />
          {/* Resplandor azul medio superior derecho */}
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: '#163659', opacity: 0.6 }}
          />
          {/* Patrón de puntos decorativo */}
          <svg
            className="absolute bottom-0 right-0 opacity-5"
            width="320" height="320"
            viewBox="0 0 320 320"
          >
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={col * 40 + 20}
                  cy={row * 40 + 20}
                  r="3"
                  fill="white"
                />
              ))
            )}
          </svg>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">

          {/* Logo SIGAD */}
          <div className="relative">
            {/* Halo dorado detrás del logo */}
            <div
              className="absolute inset-0 rounded-2xl blur-2xl scale-110"
              style={{ backgroundColor: '#F0A020', opacity: 0.25 }}
            />
            <img
              src={sigadLogo}
              alt="SIGAD"
              className="relative h-36 w-36 rounded-2xl object-cover shadow-2xl border-2"
              style={{ borderColor: 'rgba(240,160,32,0.35)' }}
            />
          </div>

          {/* Línea decorativa dorada */}
          <div className="flex items-center gap-3">
            <div className="h-px w-12" style={{ backgroundColor: 'rgba(240,160,32,0.4)' }} />
            <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: '#F0A020' }} />
            <div className="h-px w-12" style={{ backgroundColor: 'rgba(240,160,32,0.4)' }} />
          </div>

          {/* Subtítulo del sistema */}
          <div className="space-y-1">
            <p
              className="text-xl font-semibold tracking-widest uppercase"
              style={{ color: '#F0A020' }}
            >
              SIGAD
            </p>
            <p className="text-sm font-medium tracking-wide" style={{ color: 'rgba(186,210,240,0.75)' }}>
              Sistema de Gestión Académica y Docente
            </p>
          </div>

          {/* Insignia institucional */}
          <div
            className="mt-2 px-5 py-2 rounded-full text-xs font-semibold tracking-widest uppercase border"
            style={{
              color: 'rgba(186,210,240,0.6)',
              borderColor: 'rgba(186,210,240,0.15)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          >
            Universidad Interamericana para el Desarrollo
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;