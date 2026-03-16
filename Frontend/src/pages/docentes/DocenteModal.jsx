import { X, User, Briefcase, MapPin, GraduationCap, ShieldCheck } from 'lucide-react';

export const DocenteModal = ({ docente, onClose }) => {
  if (!docente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Expediente del Docente</h3>
              <p className="text-sm text-slate-500 font-medium">Matrícula: {docente.matricula_empleado}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Datos Personales */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Datos Personales
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Nombre Completo</span>
                <span className="font-bold text-slate-900">{docente.nombres} {docente.apellido_paterno} {docente.apellido_materno}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Correo Institucional</span>
                <span className="font-bold text-slate-900">{docente.institutional_email}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">RFC</span>
                <span className="font-bold text-slate-900 uppercase">{docente.rfc}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">CURP</span>
                <span className="font-bold text-slate-900 uppercase">{docente.curp}</span>
              </div>
            </div>
          </div>

          {/* Datos Académicos y Laborales */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Perfil Académico
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Grado Máximo</span>
                <span className="font-bold text-slate-900">{docente.nivel_academico}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Academia Asignada</span>
                <span className="font-bold text-slate-900">{docente.nombre_academia || 'Sin asignar'}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Fecha de Ingreso</span>
                <span className="font-bold text-slate-900">{new Date(docente.antiguedad_fecha).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Estatus</span>
                <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase rounded-md ${docente.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {docente.estatus}
                </span>
              </div>
              
              {/* Nuevo bloque para Motivo de Baja condicional */}
              {docente.estatus === 'BAJA' && (
                <div className="sm:col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                  <span className="block text-red-800 font-bold mb-1">Motivo de la Baja</span>
                  <span className="text-red-900 italic">{docente.motivo_baja || 'Motivo no registrado en el sistema.'}</span>
                </div>
              )}

            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Contacto y Domicilio
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
               <div className="mb-3">
                <span className="block text-slate-500 mb-1">Celular</span>
                <span className="font-bold text-slate-900">{docente.celular}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Domicilio Registrado</span>
                <span className="font-bold text-slate-900">{docente.domicilio}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};