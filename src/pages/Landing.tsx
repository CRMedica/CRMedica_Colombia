import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Truck, 
  Stethoscope, 
  HeartPulse, 
  MapPin, 
  ArrowRight,
  ChevronRight,
  Activity,
  Award,
  Globe,
  Settings,
  Phone
} from "lucide-react";
import { motion } from "motion/react";

export default function Landing() {
  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">CRMedica <span className="text-blue-600">Colombia</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#products" className="hover:text-blue-600 transition-colors">Productos</a>
            <a href="#services" className="hover:text-blue-600 transition-colors">Servicios</a>
            <a href="#coverage" className="hover:text-blue-600 transition-colors">Cobertura</a>
            <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
              Ingreso CRM
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-50 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Award size={14} /> Líderes en Equipamiento Respiratorio
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-6">
              Aire puro para <br /><span className="text-blue-600 italic font-serif">cada paciente</span> de Colombia
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
              Distribución nacional de concentradores de oxígeno, CPAP, BiPAP y servicios técnicos especializados desde Bogotá para todo el país.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#products" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                Ver Catálogo <ArrowRight size={20} />
              </a>
              <a href="https://wa.me/573000000000" target="_blank" className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                <Phone size={20} /> Contactar Asesor
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-blue-100 rounded-3xl overflow-hidden shadow-2xl relative border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200" 
                alt="Medical Respiratory Device" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
            </div>
            {/* Floating stats card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-xs"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-bold text-slate-800">Garantía Certificada</span>
              </div>
              <p className="text-xs text-slate-500">Todos nuestros equipos cuentan con registro INVIMA y soporte técnico local.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold mb-2">1,500+</p>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Equipos Entregados</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-2">32</p>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Departamentos</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-2">24/7</p>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Soporte Vital</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-2">Bogotá</p>
            <p className="text-slate-400 text-sm uppercase tracking-widest">Sede Principal</p>
          </div>
        </div>
      </section>

      {/* Products Highlights */}
      <section id="products" className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Dispositivos Médicos Especializados</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Ofrecemos las marcas más confiables del mercado con disponibilidad inmediata y envío seguro.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Concentradores de Oxígeno", icon: Activity, desc: "Sistemas estacionarios y portátiles de flujo continuo y pulsado." },
            { name: "Equipos CPAP / BiPAP", icon: HeartPulse, desc: "Tratamiento de vanguardia para la apnea del sueño y soporte ventilatorio." },
            { name: "Nebulizadores", icon: Stethoscope, desc: "Equipos ultrasónicos y de compresor para terapia respiratoria eficiente." }
          ].map((prod, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 bg-white border border-slate-100 rounded-3xl hover:shadow-2xl transition-all group"
            >
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <prod.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">{prod.name}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{prod.desc}</p>
              <button className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                Más Detalles <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services and Coverage */}
      <section className="bg-slate-50 py-32">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-8 leading-tight">Cobertura en todo el territorio Colombiano</h2>
            <div className="space-y-6">
              {[
                { title: "Envíos Seguros", desc: "Logística especializada para el transporte de material médico delicado.", icon: Truck },
                { title: "Mantenimiento Técnico", desc: "Técnicos certificados para calibración y reparación en Bogotá y regiones.", icon: Settings },
                { title: "Presencia Regional", desc: "Operamos desde Bogotá con red de distribución en Medellín, Cali, Barranquilla y más.", icon: MapPin }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl skew-y-2">
              <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000" alt="Medellin Colombia" className="w-full h-[500px] object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-blue-600/10"></div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Activity size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">CRMedica Colombia</span>
              </div>
              <p className="text-slate-500 max-w-sm mb-6">Proporcionando aire y vida a través de la mejor tecnología médica disponible en el mercado colombiano.</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"><Globe size={18} /></div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"><Phone size={18} /></div>
              </div>
          </div>
          <div>
            <h4 className="font-bold mb-6">Compañía</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link to="/legal/privacy" className="hover:text-blue-600">Privacidad</Link></li>
              <li><Link to="/legal/terms" className="hover:text-blue-600">Términos</Link></li>
              <li><Link to="/legal/shipping" className="hover:text-blue-600">Envíos</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Sede Bogotá</h4>
            <p className="text-slate-500 text-sm mb-2">Calle 100 # 15-20, Edificio Salud</p>
            <p className="text-slate-500 text-sm mb-2">PBX: (601) 123 4567</p>
            <p className="text-slate-500 text-sm">info@respiracrm.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-100 flex flex-col md:row justify-between items-center gap-4 text-xs text-slate-400 uppercase tracking-widest">
           <p>© 2024 CRMedica Colombia - Todos los derechos reservados.</p>
           <p>Impulsado por Tecnología Médica de Vanguardia</p>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a 
        href="https://wa.me/573000000000" 
        target="_blank" 
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
      >
        <Phone size={32} />
      </a>
    </div>
  );
}
