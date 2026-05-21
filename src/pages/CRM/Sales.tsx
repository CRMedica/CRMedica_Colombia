import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  CheckCircle, 
  X, 
  DollarSign, 
  Target, 
  Calendar, 
  Briefcase, 
  Loader2,
  ChevronRight,
  TrendingDown,
  Percent
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Sale, Product, Customer } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency, cn } from "../../lib/utils";

const MONTHLY_SALES_TREND = [
  { name: 'Ene', ventas: 12000000 },
  { name: 'Feb', ventas: 18500000 },
  { name: 'Mar', ventas: 24000000 },
  { name: 'Abr', ventas: 31000000 },
  { name: 'May', ventas: 42000000 },
  { name: 'Jun', ventas: 54000000 },
];

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Creation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Sale>>({
    customer_id: "",
    quote_id: "",
    total: 0,
    status: "confirmed",
    delivery_status: "not_shipped"
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [salesData, customersData] = await Promise.all([
        api.get("/sales").catch(() => []),
        api.get("/customers").catch(() => [])
      ]);

      const resolvedCustomers = customersData.length > 0 ? customersData : [
        { id: "c1", name: "Fundación Neumológica de Colombia", document_type: "NIT", document_id: "860.034.908-2", phone: "+57 (601) 742-8900", email: "", address: "", city: "Bogotá", department: "Bogotá D.C.", status: "active" },
        { id: "c2", name: "IPS Neumored SAS", document_type: "NIT", document_id: "901.442.115-4", phone: "320 890 1212", email: "", address: "", city: "Cali", department: "Valle del Cauca", status: "active" }
      ];

      const resolvedSales = salesData.length > 0 ? salesData : [
        {
          id: "s1",
          customer_id: "c1",
          total: 8400000,
          status: "paid",
          delivery_status: "delivered",
          created_at: "2026-05-10T12:00:00Z",
          quote_id: "q1",
          user_id: "u1"
        },
        {
          id: "s2",
          customer_id: "c2",
          total: 4500000,
          status: "confirmed",
          delivery_status: "shipped",
          created_at: "2026-05-18T15:30:00Z",
          quote_id: "q2",
          user_id: "u2"
        },
        {
          id: "s3",
          customer_id: "c1",
          total: 11400000,
          status: "pending",
          delivery_status: "not_shipped",
          created_at: "2026-05-19T09:00:00Z",
          quote_id: "q3",
          user_id: "u1"
        }
      ];

      setCustomers(resolvedCustomers);
      setSales(resolvedSales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewSale = () => {
    setFormData({
      customer_id: customers[0]?.id || "",
      total: 3500000,
      status: "confirmed",
      delivery_status: "not_shipped"
    });
    setIsModalOpen(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        total: Number(formData.total || 0),
        created_at: new Date().toISOString()
      };

      let result;
      try {
        result = await api.post("/sales", payload);
      } catch (err) {
        result = { ...payload, id: "local_" + Date.now() };
      }
      
      setSales(prev => [result, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error al guardar la venta: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newField: Partial<Sale>) => {
    const original = sales.find(s => s.id === id);
    if (!original) return;

    setSales(prev => prev.map(s => s.id === id ? { ...s, ...newField } : s));
    try {
      await api.put(`/sales/${id}`, { ...original, ...newField });
    } catch (err) {
      console.warn("DB update failed, kept in memory", err);
    }
  };

  const filteredSales = sales.filter(s => {
    const client = customers.find(c => c.id === s.customer_id);
    return (
      (client && client.name.toLowerCase().includes(search.toLowerCase())) ||
      s.total.toString().includes(search)
    );
  });

  const yearTotalRevenue = sales.reduce((acc, current) => acc + (current.status === 'paid' || current.status === 'confirmed' ? current.total : 0), 0);
  const targetCOP = 60000000;
  const targetProgress = Math.min(Math.round((yearTotalRevenue / targetCOP) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard & Indicadores de Ventas</h1>
          <p className="text-slate-500 text-sm">Monitorea cierres, ingresos recurrentes de equipos en arriendo y cumplimiento de metas.</p>
        </div>
        <button 
          onClick={handleAddNewSale}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} /> Registrar Venta Directa
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Ingresos Confirmados</p>
            <p className="text-xl font-extrabold text-slate-800">{formatCurrency(yearTotalRevenue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Target size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase">Meta de Ventas Q2</p>
            <p className="text-lg font-extrabold text-slate-800">{formatCurrency(targetCOP)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Percent size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase">Cumplimiento Meta</p>
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold text-slate-800">{targetProgress}%</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full" style={{ width: `${targetProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Órdenes Pendientes</p>
            <p className="text-xl font-extrabold text-slate-800">
              {sales.filter(s => s.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Crecimiento Ventas COP (Acumulado)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_SALES_TREND}>
                <defs>
                  <linearGradient id="colorSalesVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-4">Distribución por Asesores</h3>
            <div className="space-y-4">
              {[
                { name: "Laura Martínez", volume: "$24,500,000", leads: 12 },
                { name: "Carlos Rojas", volume: "$18,200,000", leads: 8 },
                { name: "Ana Parra", volume: "$12,400,000", leads: 6 },
              ].map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{rep.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{rep.leads} asignaciones</p>
                  </div>
                  <span className="text-xs font-bold text-slate-800 bg-white border px-2 py-1 rounded">
                    {rep.volume}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold italic border-t pt-2 mt-4 text-center">
            Métricas de liquidación del mes en curso.
          </div>
        </div>
      </div>

      {/* Sale actions filter and lists */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 text-sm">Historial General de Ventas Facturadas</h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por cliente/valor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-100 bg-slate-50 rounded-xl text-xs outline-hidden focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase border-b border-slate-100">
                <th className="px-6 py-4">ID / Folio</th>
                <th className="px-6 py-4">Cliente / IPS</th>
                <th className="px-6 py-4">Monto Bruto</th>
                <th className="px-6 py-4">Pago</th>
                <th className="px-6 py-4">Despacho Logística</th>
                <th className="px-6 py-4">Asignado</th>
                <th className="px-6 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSales.map((s, idx) => {
                const client = customers.find(c => c.id === s.customer_id);
                return (
                  <tr key={s.id || idx} className="hover:bg-slate-50/65 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-600">VEN-{(1055 + idx)}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{client ? client.name : "Persona Natural"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ref Folio: {s.id}</p>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{formatCurrency(s.total)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={s.status}
                        onChange={(e) => handleUpdateStatus(s.id, { status: e.target.value as Sale['status'] })}
                        className={cn("text-[10px] uppercase font-bold rounded-full border px-2 py-1 outline-hidden cursor-pointer", 
                          s.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          s.status === 'confirmed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        <option value="pending">Pendiente Pago</option>
                        <option value="confirmed">Confirmado / Giro</option>
                        <option value="paid">Pagado Total</option>
                        <option value="cancelled">Anulado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={s.delivery_status}
                        onChange={(e) => handleUpdateStatus(s.id, { delivery_status: e.target.value as Sale['delivery_status'] })}
                        className={cn("text-[10px] uppercase font-bold rounded-lg border px-2 py-1 outline-hidden cursor-pointer", 
                          s.delivery_status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          s.delivery_status === 'shipped' ? "bg-sky-50 text-sky-600 border-sky-100" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        )}
                      >
                        <option value="not_shipped">No Despachado</option>
                        <option value="shipped">Despachado / Guía</option>
                        <option value="delivered">Entregado IPS</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      Asesor Comercial
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                      {new Date(s.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Registrar Venta Directa</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSale} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente Receptor</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto de Venta General (COP)</label>
                  <input 
                    type="number"
                    value={formData.total}
                    onChange={(e) => setFormData(prev => ({ ...prev, total: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado de Pago</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Sale['status'] }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="paid">Pagado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Despacho</label>
                    <select
                      value={formData.delivery_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_status: e.target.value as Sale['delivery_status'] }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="not_shipped">No Despachado</option>
                      <option value="shipped">Despachado</option>
                      <option value="delivered">Entregado</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    {isSaving ? "Guardando..." : "Registrar Venta"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
