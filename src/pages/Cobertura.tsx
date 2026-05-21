import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, ShieldCheck, CheckCircle2, Globe, Phone } from "lucide-react";
import { motion } from "motion/react";

export default function Cobertura() {
  const regions = [
    { 
      name: "Sabana de Bogotá y Cundinamarca", 
      time: "Mismo día - 24 Horas", 
      cities: "Bogotá D.C., Soacha, Chía, Zipaquirá, Facatativá, Fusagasugá.",
      type: "Distribución directa con flota propia"
    },
    { 
      name: "Antioquia y Eje Cafetero", 
      time: "24 - 48 Horas", 
      cities: "Medellín, Bello, Itagüí, Manizales, Pereira, Armenia.",
      type: "Mensajería especializada certificada"
    },
    { 
      name: "Valle del Cauca y Suroccidente", 
      time: "24 - 48 Horas", 
      cities: "Cali, Palmira, Tuluá, Buenaventura, Popayán, Pasto.",
      type: "Envío urgente refrigerado si aplica"
    },
    { 
      name: "Costa Caribe", 
      time: "48 Horas", 
      cities: "Barranquilla, Cartagena, Santa Marta, Valledupar, Montería, Sincelejo.",
      type: "Fulfillment regional"
    },
    { 
      name: "Santanderes y Centro-Oriente", 
      time: "24 - 48 Horas", 
      cities: "Bucaramanga, Floridablanca, Cúcuta, Neiva, Ibagué, Villavicencio.",
      type: "Ruta terrestre nacional exprés"
    },
    { 
      name: "Otras Zonas y Territorios Especiales", 
      time: "48 - 72 Horas", 
      cities: "San Andrés y Providencia, Quibdó, Leticia, Florencia, Yopal.",
      type: "Logística aérea prioritaria"
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans flex flex-col justify-between">
      {/* Upper Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors block text-slate-600">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                CRMedica <span className="text-blue-600">Colombia</span>
              </span>
            </div>
          </div>
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Globe size={14} className="animate-spin-slow" /> Despachos y Logística Nacional
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
            Exportación y Envíos a <span className="text-blue-600">Toda Colombia</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hacemos envíos garantizados desde nuestra sede principal en Bogotá a todos los municipios, IPS, hospitales y pacientes del territorio nacional. Tu salud no espera.
          </p>
        </motion.div>

        {/* Dynamic Map Highlight Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 md:p-12 mb-16 grid md:grid-cols-12 gap-8 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="md:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Seguridad Médica Asegurada en Tránsito</h2>
            <p className="text-slate-600 leading-relaxed">
              Todos los equipos delicados de oxigenoterapia como concentradores, CPAP y BiPAP viajan con un protocolo de empaque hermético de alta resistencia y están asegurados al 100% contra siniestros o mal manejo físico.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <span className="text-sm font-semibold text-slate-700">Garantía INVIMA</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <span className="text-sm font-semibold text-slate-700">Seguimiento Web GPS</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <span className="text-sm font-semibold text-slate-700">Soporte Técnico Local</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <span className="text-sm font-semibold text-slate-700">Instructivo en Español</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-center items-center bg-blue-50/50 rounded-2xl p-6 border border-blue-100 text-center">
            <Truck className="text-blue-600 mb-4 h-12 w-12" />
            <h3 className="font-bold text-slate-800 text-lg mb-1">Aliados Logísticos</h3>
            <p className="text-xs text-slate-500 mb-4 px-2">Alianzas de alta prioridad con las transportadoras número uno del país:</p>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <span>Servientrega</span>
              <span className="text-blue-300">•</span>
              <span>Envía</span>
              <span className="text-blue-300">•</span>
              <span>Coordinadora</span>
              <span className="text-blue-300">•</span>
              <span>Deprisa</span>
            </div>
          </div>
        </div>

        {/* Regions Grid */}
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <MapPin className="text-blue-600" size={24} /> Red Detallada de Tiempos de Entrega
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {regions.map((region, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs transition-all"
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="font-bold text-lg text-slate-800 leading-tight">{region.name}</h3>
                <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                  {region.time}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{region.type}</p>
              <p className="text-slate-600 text-sm leading-relaxed">{region.cities}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact Info Footer/Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-blue-600/20 to-transparent"></div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">¿Tienes dudas sobre los fletes o despachos especiales?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10">
            Nuestro equipo de soporte logístico está listo para asesorarte. Respondemos de inmediato.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
            <a href="https://wa.me/573000000000" target="_blank" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-2 transition-colors">
              <Phone size={18} /> Chat de Soporte Logístico
            </a>
            <Link to="/" className="text-slate-300 hover:text-white text-sm font-semibold underline underline-offset-4 py-2 px-4 transition-colors">
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2024 CRMedica Colombia - Todos los derechos reservados. Sede Central de Logística: Bogotá, D.C.</p>
      </footer>
    </div>
  );
}
