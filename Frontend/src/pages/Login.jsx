import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
      
      {/* Mitad izquierda: Formulario de acceso */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              ¡Ingresa tu correo institucional y contraseña para iniciar sesión!
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Campo de correo institucional */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
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
                    className="focus:ring-blue-900 focus:border-blue-900 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border transition-colors"
                    placeholder="ejemplo@unid.edu.mx"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Campo de contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
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
                    className="focus:ring-blue-900 focus:border-blue-900 block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg py-3 border transition-colors"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white ${
                    isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2'
                  } transition-all duration-200`}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al sistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mitad derecha: Banner corporativo azul marino */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-950 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Círculos decorativos sutiles en el fondo usando gradientes de Tailwind */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-800 blur-3xl"></div>
          <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-blue-900 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-6xl font-black text-white tracking-widest">
            SIGAD
          </h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
          <p className="text-xl text-blue-200 font-medium tracking-wide max-w-md mx-auto">
            Sistema de Gestión Académica y Docente
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
