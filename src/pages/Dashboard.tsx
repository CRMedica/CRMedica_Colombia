import { 
  TrendingUp, 
  Users, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Calendar
} from "lucide-react";
import { 
  XAxis,
  YAxis,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { User } from "../types";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const data = [
  { name: 'Ene', ventas: 4000, prospectos: 2400 },
  { name: 'Feb', ventas: 3000, prospectos: 1398 },
  { name: 'Mar', ventas: 2000, prospectos: 9800 },
  { name: 'Abr', ventas: 2780, prospectos: 3908 },
  { name: 'May', ventas: 1890, prospectos: 4800 },
  { name: 'Jun', ventas: 2390, prospectos: 3800 },
];

export default function Dashboard({ user }: { user: User }) {
  const kpis = [
    { name: "Ventas Mensuales", value: "$12,450,000", change: "+12.5%", positive: true, icon: TrendingUp, color: "blue" },
    { name: "Prospectos Nuevos", value: "48", change: "+4.2%", positive: true, icon: Target, color: "indigo" },
    { name: "Clientes Activos", value: "254", change: "-1.1%", positive: false, icon: Users, color: "emerald" },
    { name: "Órdenes de Servicio", value: "12", change: "+3", positive: true, icon: Package, color: "amber" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Bienvenido, {user.name}. Aquí está el resumen comercial de hoy.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:bg-${kpi.color}-600 group-hover:text-white transition-colors`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${kpi.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{kpi.name}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-800">Crecimiento de Ventas (COP)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-200 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Prospectos</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="prospectos" stroke="#e2e8f0" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Próximos Seguimientos</h3>
          <div className="space-y-6 flex-1">
            {[
              { company: "Clínica Respirar Bogotá", product: "Concentradores (x5)", date: "Hoy, 2:00 PM", status: "priority" },
              { company: "IPS Salud Integral", product: "Mantenimiento BiPAP", date: "Mañana, 10:00 AM", status: "normal" },
              { company: "Hospital Vida Norte", product: "Insumos Varios", date: "Lunes, 9:00 AM", status: "normal" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'priority' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{item.company}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.product}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-tighter">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
            + Ver Calendario Completo
          </button>
        </div>
      </div>

      {/* Recents Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Recientes Órdenes de Venta</h3>
          <Link to="/crm/sales" className="text-sm font-bold text-blue-600 hover:underline">Ver todas las ventas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">N° Orden</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Vendedor</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "ORD-7521", client: "Clínica Respirar", seller: "Laura Martínez", total: "$4,200,000", status: "Confirmado", date: "15 May, 2024" },
                { id: "ORD-7520", client: "Fundación Salud", seller: "Carlos Rojas", total: "$1,850,000", status: "Pendiente", date: "14 May, 2024" },
                { id: "ORD-7519", client: "IPS Integral", seller: "Ana Parra", total: "$920,000", status: "Entregado", date: "14 May, 2024" },
                { id: "ORD-7518", client: "Hospital Vida", seller: "Admin", total: "$12,000,000", status: "Cancelado", date: "12 May, 2024" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-8 py-5 font-bold text-slate-700 text-sm">{row.id}</td>
                  <td className="px-8 py-5 text-slate-600 text-sm">{row.client}</td>
                  <td className="px-8 py-5 text-slate-500 text-sm">{row.seller}</td>
                  <td className="px-8 py-5 font-bold text-slate-800 text-sm">{row.total}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      row.status === 'Confirmado' ? 'bg-blue-100 text-blue-600' :
                      row.status === 'Pendiente' ? 'bg-amber-100 text-amber-600' :
                      row.status === 'Entregado' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
