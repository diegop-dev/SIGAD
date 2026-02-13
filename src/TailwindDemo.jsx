import { useState } from 'react'

function TailwindDemo() {
  const [showAlert, setShowAlert] = useState(true)
  const [counter, setCounter] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Demo de TailwindCSS
          </h1>
          <p className="text-xl text-gray-600">
            Explora diferentes componentes y estilos
          </p>
        </header>

        {/* Alert */}
        {showAlert && (
          <div className="mb-8 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-md flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">¡Bienvenido! Esta es una alerta informativa</span>
            </div>
            <button 
              onClick={() => setShowAlert(false)}
              className="text-blue-700 hover:text-blue-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Botones */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Botones</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              Primary
            </button>
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md">
              Success
            </button>
            <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md">
              Danger
            </button>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md">
              Secondary
            </button>
            <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Outline
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg">
              Gradient
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Card Title</h3>
                <p className="text-gray-600 mb-4">
                  Esta es una descripción de la card con TailwindCSS. Incluye estilos modernos y responsivos.
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Leer más
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-400 to-teal-500"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-gray-800">Con Badge</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    Nuevo
                  </span>
                </div>
                <p className="text-gray-600 mb-4">
                  Card con badge y efectos de hover mejorados.
                </p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Ver detalles
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500"></div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive</h3>
                <p className="text-gray-600 mb-4">
                  Contador: <span className="font-bold text-2xl text-orange-600">{counter}</span>
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCounter(counter + 1)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => setCounter(counter - 1)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    -
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Formulario */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Formulario</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nombre completo
              </label>
              <input 
                type="text" 
                placeholder="Ingresa tu nombre"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input 
                type="email" 
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Mensaje
              </label>
              <textarea 
                rows="4"
                placeholder="Escribe tu mensaje aquí..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Categoría
              </label>
              <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors">
                <option>Selecciona una opción</option>
                <option>Desarrollo</option>
                <option>Diseño</option>
                <option>Marketing</option>
              </select>
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="terms"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="ml-3 text-gray-700">
                Acepto los términos y condiciones
              </label>
            </div>

            <button 
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-semibold"
            >
              Enviar formulario
            </button>
          </form>
        </div>

        {/* Badges y Pills */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Badges y Pills</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
              Blue Badge
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              Green Badge
            </span>
            <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-semibold">
              Red Badge
            </span>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              Yellow Badge
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
              Purple Badge
            </span>
            <span className="px-4 py-2 bg-gray-800 text-white rounded-full font-semibold">
              Dark Badge
            </span>
          </div>
        </div>

        {/* Grid Responsive */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Grid Responsive</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div 
                key={item}
                className="h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md hover:scale-105 transition-transform"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          <p className="text-lg">
            Creado con ❤️ usando <span className="font-bold text-blue-600">TailwindCSS</span>
          </p>
        </footer>

      </div>
    </div>
  )
}

export default TailwindDemo
