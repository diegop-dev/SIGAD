import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import unidLogo from '../assets/unid_logo.png';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // 3. Control estricto de caracteres en vivo para el correo
  const handleEmailChange = (e) => {
    // Solo permite letras, números, puntos, guiones medios, guiones bajos y la arroba.
    // Elimina espacios, acentos, y caracteres especiales inválidos al instante.
    let newValue = e.target.value.replace(/[^a-zA-Z0-9._\-@]/g, '');
    
    // Evita teclear múltiples '@'
    if ((newValue.match(/@/g) || []).length > 1) {
      return; 
    }
    
    setEmail(newValue);
  };

  // 3. Control estricto en vivo para la contraseña
  const handlePasswordChange = (e) => {
    // Evita que puedan teclear espacios en blanco dentro de la contraseña
    let newValue = e.target.value.replace(/\s/g, '');
    setPassword(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpieza final y validación de seguridad
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed) {
      toast.error('Por favor, ingresa tu correo institucional.');
      return;
    }

    if (passwordTrimmed.length === 0) {
      toast.error('La contraseña no puede estar vacía.');
      return;
    }

    // Validación de formato estándar de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      toast.error('Verifica que el correo tenga un formato válido.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Iniciando sesión...');

    const result = await login(emailTrimmed, passwordTrimmed);

    if (result.success) {
      toast.success('¡Bienvenido al sistema SIGAD!', { id: toastId });
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Credenciales incorrectas. Inténtalo de nuevo.', { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Mitad izquierda formulario envuelto en contenedor tipo tarjeta limpia */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 z-10 relative">
        
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          
          {/* 1. Header Navy sin texto/icono */}
          <div className="h-10 w-full bg-[#0B1828] shrink-0"></div>

          <div className="p-8 sm:p-12 pt-8 flex-1">
            
            {/* Logotipo pequeño en móvil envuelto en navy */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="bg-[#0B1828] p-3 rounded-2xl shadow-md inline-flex justify-center items-center">
                <img
                  src={unidLogo}
                  alt="UNID"
                  className="h-10 w-20 object-contain"
                />
              </div>
            </div>

            {/* Encabezado centrado */}
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B1828]">
                Iniciar Sesión
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">
                Ingresa tu correo y contraseña para acceder.
              </p>
            </div>

            {/* Formulario */}
            <div className="mt-8">
              <form className="space-y-6" onSubmit={handleSubmit}>

                {/* Correo */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-[#0B1828] mb-2">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="text" 
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      maxLength={100} // Límite de caracteres
                      // Se agrega el pseudo-elemento :-webkit-autofill para quitar el fondo azul
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 focus:bg-white focus:ring-1 focus:ring-[#0B1828] focus:border-[#0B1828] text-sm font-bold text-[#0B1828] transition-all placeholder:text-slate-400 shadow-sm [&:-webkit-autofill]:shadow-[0_0_0_1000px_#F8FAFC_inset] [&:-webkit-autofill]:-webkit-text-fill-color-[#0B1828]"
                      placeholder="ejemplo@red.unid.mx"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-[#0B1828] mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      maxLength={64} // Límite de caracteres
                      // Se limpia también el autocompletado en la contraseña
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 focus:bg-white focus:ring-1 focus:ring-[#0B1828] focus:border-[#0B1828] text-sm font-bold text-[#0B1828] transition-all placeholder:text-slate-400 shadow-sm [&:-webkit-autofill]:shadow-[0_0_0_1000px_#F8FAFC_inset] [&:-webkit-autofill]:-webkit-text-fill-color-[#0B1828]"
                      placeholder="••••••••"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-[#0B1828] transition-colors"
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
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center items-center px-8 py-4 rounded-xl font-black transition-all duration-300 text-base ${
                      isSubmitting
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
                        : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Ingresar al sistema'
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mitad derecha banner corporativo UNID */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-[#0B1828]">

        {/* Contenido central */}
        <div className="flex flex-col items-center text-center space-y-10">

          {/* Logo aumentado en tamaño */}
          <div className="relative flex justify-center items-center h-110 w-110 lg:h-50 lg:w-80 p-4">
            <img
              src={unidLogo}
              alt="UNID"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Línea decorativa puramente blanca */}
          <div className="flex items-center gap-3">
            <div className="h-px w-16 bg-white" />
            <div className="h-1.5 w-10 rounded-full bg-white" />
            <div className="h-px w-16 bg-white" />
          </div>

          {/* Subtítulo del sistema */}
          <div className="space-y-3">
            <p className="text-4xl font-black tracking-widest text-white">
              SIGAD
            </p>
            <p className="text-base font-medium tracking-wide text-slate-300">
              Sistema de Gestión Académica y Docente
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;