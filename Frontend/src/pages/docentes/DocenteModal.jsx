import { X, User, Briefcase, MapPin, GraduationCap, ShieldCheck } from 'lucide-react';

export const DocenteModal = ({ docente, onClose }) => {
  if (!docente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header oscuro estilo SIGAD */}
        <div className="flex justify-between items-center px-6 py-5 border-b bg-[#0B1828]">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-white/90" />
            <div>
              <h2 className="text-xl font-black text-white">Expediente del Docente</h2>
              <p className="text-sm font-medium text-white/60">Matrícula: {docente.matricula_empleado}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8">
          
          {/* Datos Personales */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center border-b border-slate-100 pb-2">
              Datos Personales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Nombre Completo</p>
                <p className="text-base font-black text-[#0B1828] bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  {docente.nombres} {docente.apellido_paterno} {docente.apellido_materno}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Correo Institucional</p>
                <p className="text-base font-black text-[#0B1828] bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  {docente.institutional_email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">RFC</p>
                <p className="text-base font-black text-[#0B1828] uppercase">
                  {docente.rfc}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">CURP</p>
                <p className="text-base font-black text-[#0B1828] uppercase">
                  {docente.curp}
                </p>
              </div>
            </div>
          </div>

          {/* Datos Académicos y Laborales */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center border-b border-slate-100 pb-2">
              Perfil Académico
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Grado Máximo</p>
                <p className="text-base font-black text-[#0B1828]">
                  {docente.nivel_academico}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Academia Asignada</p>
                <p className="text-base font-black text-[#0B1828]">
                  {docente.nombre_academia || 'Sin asignar'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Fecha de Ingreso</p>
                <p className="text-base font-black text-[#0B1828]">
                  {new Date(docente.antiguedad_fecha).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-2">Estatus en el sistema</p>
                <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  docente.estatus === 'ACTIVO' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {docente.estatus}
                </span>
              </div>
              
              {/* Bloque para Motivo de Baja */}
              {docente.estatus === 'BAJA' && (
                <div className="sm:col-span-2 bg-red-50 p-4 rounded-xl border border-red-100 mt-2">
                  <p className="text-xs text-red-800 font-bold mb-1 uppercase tracking-wider">Motivo de la Baja</p>
                  <p className="text-sm text-red-900 font-medium">
                    {docente.motivo_baja || 'Motivo no registrado en el sistema.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center border-b border-slate-100 pb-2">
              Contacto y Domicilio
            </h4>
            <div className="grid grid-cols-1 gap-6">
               <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Celular / Teléfono</p>
                <p className="text-base font-black text-[#0B1828]">
                  {docente.celular}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">Domicilio Registrado</p>
                <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 leading-relaxed">
                  {docente.domicilio}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95"
          >
            Cerrar expediente
          </button>
        </div>

      </div>
    </div>
  );
};