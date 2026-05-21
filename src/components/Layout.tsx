import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Users, 
  Target, 
  Package, 
  FileText, 
  ShoppingCart, 
  Wrench, 
  LayoutDashboard, 
  LogOut, 
  MessageSquare,
  ShieldAlert,
  User as UserIcon,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface LayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiOverlayOpen, setIsAiOverlayOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { 
      id: "n1", 
      title: "Venta Concretada ✅", 
      message: "La orden ORD-7519 por Ana Parra ha sido entregada y pagada con éxito.", 
      type: "success", 
      read: false, 
      time: "Hace 10 min" 
    },
    { 
      id: "n2", 
      title: "Mantenimiento Urgente 🛠️", 
      message: "Se requiere calibración urgente del equipo EverFlo 5L en la Fundación Neumológica.", 
      type: "info", 
      read: false, 
      time: "Hace 1 hora" 
    },
    { 
      id: "n3", 
      title: "Cotización Rechazada ❌", 
      message: "La cotización enviada por Hospital Vida (ORD-7518) ha sido denegada.", 
      type: "error", 
      read: false, 
      time: "Hace 1 día" 
    },
    { 
      id: "n4", 
      title: "Nuevo Prospecto Leads 👤", 
      message: "Dr. Alejandro Gómez se ha registrado interesado en CPAP AirSense 11.", 
      type: "success", 
      read: true, 
      time: "Hace 2 días" 
    }
  ]);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([{ role: 'bot', text: `Hola ${user.name}, ¿en qué puedo ayudarte hoy? Puedo buscar stock, verificar estados de pedidos o darte un resumen de tus clientes.` }]);
    }
  }, [user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          message: userMsg,
          context: { 
            currentPath: location.pathname,
            userRole: user?.role
          }
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: "Lo siento, tuve un error al procesar tu solicitud. Por favor intenta de nuevo." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "sales", "tech", "client"] },
    { name: "Prospectos", path: "/crm/prospects", icon: Target, roles: ["admin", "manager", "sales"] },
    { name: "Clientes", path: "/crm/customers", icon: Users, roles: ["admin", "manager", "sales", "tech"] },
    { name: "Productos", path: "/crm/products", icon: Package, roles: ["admin", "manager", "sales", "tech", "client"] },
    { name: "Cotizaciones", path: "/crm/quotes", icon: FileText, roles: ["admin", "manager", "sales", "client"] },
    { name: "Ventas", path: "/crm/sales", icon: ShoppingCart, roles: ["admin", "manager", "sales", "client"] },
    { name: "Soporte Técnico", path: "/crm/technical", icon: Wrench, roles: ["admin", "manager", "tech", "client"] },
    { name: "Usuarios", path: "/admin/users", icon: ShieldAlert, roles: ["admin"] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 hidden md:flex"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <TrendingUp size={24} />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-slate-800 text-lg truncate">RespiraCRM</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group ${
                location.pathname.startsWith(item.path)
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon size={20} className={location.pathname.startsWith(item.path) ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
              {isSidebarOpen && <span className="text-sm">{item.name}</span>}
              {!isSidebarOpen && location.pathname.startsWith(item.path) && (
                <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-bottom border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <TrendingUp size={16} />
              </div>
          </div>
          
          <div className="flex-1 flex justify-center max-w-xl hidden md:flex mx-4">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar clientes, productos o folios..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-200 border rounded-full text-sm outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAiOverlayOpen(true)}
              className="p-2 text-slate-500 h-10 w-10 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all relative group"
            >
              <BrainCircuit size={20} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsAiOverlayOpen(false);
                }}
                className="p-2 text-slate-500 h-10 w-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="font-bold text-slate-800 text-sm">Notificaciones ({notifications.filter(n => !n.read).length})</span>
                        {notifications.some(n => !n.read) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(notifications.map(n => ({ ...n, read: true })));
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">No tienes notificaciones.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => {
                                setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                              }}
                              className={`p-4 text-left transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 ${notif.read ? "bg-white opacity-75" : "bg-blue-50/20"}`}
                            >
                              <div className="flex-1">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-xs text-slate-800">{notif.title}</h4>
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                        <button 
                          onClick={() => {
                            setNotifications([]);
                            setIsNotificationsOpen(false);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 py-1"
                        >
                          Limpiar historial
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{user?.role || 'Venta'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>

      {/* AI Bot Overlay */}
      <AnimatePresence>
        {isAiOverlayOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <BrainCircuit size={24} />
                <h2 className="font-bold text-lg">RespiraBot Assistant</h2>
              </div>
              <button onClick={() => setIsAiOverlayOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'bot' 
                      ? "bg-slate-100 text-slate-700 rounded-tl-none mr-auto" 
                      : "bg-indigo-600 text-white rounded-tr-none ml-auto"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-slate-100 p-4 rounded-xl rounded-tl-none mr-auto text-sm text-slate-500 italic max-w-[80%]">
                  RespiraBot está pensando...
                </div>
              )}
            </div>
 
            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  value={inputValue}
                  disabled={isTyping}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isTyping ? "RespiraBot está procesando..." : "Escribe tu consulta..."}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
