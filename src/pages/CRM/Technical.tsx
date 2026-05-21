import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  ShieldAlert, 
  FileCheck2, 
  PenTool, 
  Upload, 
  CheckCircle, 
  X, 
  Edit, 
  Trash2,
  Lock,
  User as UserIcon,
  Image as ImageIcon,
  Loader2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ServiceOrder, Customer, Product } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency, cn } from "../../lib/utils";

const ORDER_TYPES = [
  { value: "preventive", label: "Mantenimiento Preventivo", color: "text-blue-600 bg-blue-50 border-blue-100" },
  { value: "corrective", label: "Correctivo de Urgencia", color: "text-rose-600 bg-rose-50 border-rose-100" },
  { value: "installation", label: "Instalación y Calibración", color: "text-indigo-600 bg-indigo-50 border-indigo-100" }
];

export default function TechnicalSupport() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<ServiceOrder>>({
    customer_id: "",
    product_id: "",
    type: "preventive",
    status: "open",
    diagnosis: "",
    evidence_urls: [],
    signature_url: ""
  });

  // Digital Signature Pad state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  
  // File upload state
  const [uploadedEvidences, setUploadedEvidences] = useState<string[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        api.get("/service_orders").catch(() => []),
        api.get("/customers").catch(() => []),
        api.get("/products").catch(() => [])
      ]);

      const resolvedCustomers = customersData.length > 0 ? customersData : [
        { id: "c1", name: "Fundación Neumológica de Colombia", document_type: "NIT", document_id: "860.034.908-2", phone: "+57 (601) 742-8900", email: "", address: "", city: "Bogotá", department: "Bogotá D.C.", status: "active" },
        { id: "c2", name: "IPS Neumored SAS", document_type: "NIT", document_id: "901.442.115-4", phone: "320 890 1212", email: "", address: "", city: "Cali", department: "Valle del Cauca", status: "active" }
      ];

      const resolvedProducts = productsData.length > 0 ? productsData : [
        { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno EverFlo 5L', category: 'Oxigenoterapia', brand: 'Philips', price: 4200000, stock: 12, description: '', image_url: '', provider: '', warranty: '1 año', tax_rate: 19 },
        { id: '2', sku: 'CPAP-A11', name: 'CPAP AutoSet AirSense 11', category: 'Sueño', brand: 'ResMed', price: 3800000, stock: 8, description: '', image_url: '', provider: '', warranty: '2 años', tax_rate: 19 }
      ];

      const resolvedOrders = ordersData.length > 0 ? ordersData : [
        {
          id: "so1",
          customer_id: "c1",
          product_id: "1",
          technical_id: "u1",
          type: "preventive",
          status: "in_progress",
          diagnosis: "Cambio de filtros HEPA de alta eficiencia y verificación de pureza de oxígeno. Flujo estable a 5L.",
          evidence_urls: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=150"],
          signature_url: ""
        },
        {
          id: "so2",
          customer_id: "c2",
          product_id: "2",
          technical_id: "u3",
          type: "corrective",
          status: "completed",
          diagnosis: "Error de calibración en la tarjeta controladora de presión. Se resetea firmware y se entrega funcionando.",
          evidence_urls: [],
          signature_url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=100"
        }
      ];

      setCustomers(resolvedCustomers);
      setProducts(resolvedProducts);
      setOrders(resolvedOrders);
    } catch (err) {
      console.error("Initial support data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Canvas Hand-drawing helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#1e3a8a"; // Dark blue signature ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
    setFormData(prev => ({ ...prev, signature_url: "" }));
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFormData(prev => ({ ...prev, signature_url: dataUrl }));
    setSignatureSaved(true);
  };

  // Multer file upload trigger
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: uploadFormData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUploadedEvidences(prev => [...prev, data.url]);
    } catch (err) {
      // Fallback base64 simulator if offline
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedEvidences(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddNewOrder = () => {
    setEditingId(null);
    setFormData({
      customer_id: customers[0]?.id || "",
      product_id: products[0]?.id || "",
      type: "preventive",
      status: "open",
      diagnosis: "",
      evidence_urls: [],
      signature_url: ""
    });
    setUploadedEvidences([]);
    setSignatureSaved(false);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setEditingId(order.id);
    setFormData(order);
    setUploadedEvidences(order.evidence_urls || []);
    setSignatureSaved(!!order.signature_url);
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        evidence_urls: uploadedEvidences,
      };

      if (editingId) {
        let result;
        try {
          result = await api.put(`/service_orders/${editingId}`, payload);
        } catch (err) {
          result = { ...payload, id: editingId };
        }
        setOrders(prev => prev.map(o => o.id === editingId ? { ...o, ...result } : o));
      } else {
        let result;
        try {
          result = await api.post("/service_orders", payload);
        } catch (err) {
          result = { ...payload, id: "local_" + Date.now() };
        }
        setOrders(prev => [result, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error al registrar orden técnica: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const client = customers.find(c => c.id === o.customer_id);
    return (
      (client && client.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.diagnosis && o.diagnosis.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Órdenes de Servicio & Soporte Biométrico</h1>
          <p className="text-slate-500 text-sm">Registra calibraciones, cargas de evidencias fotográficas corporativas y firmas táctiles de pacientes.</p>
        </div>
        <button 
          onClick={handleAddNewOrder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} /> Nueva Orden Técnica
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">En Curso</p>
            <p className="text-xl font-extrabold text-slate-800">
              {orders.filter(o => o.status === 'in_progress' || o.status === 'open').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileCheck2 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Completados</p>
            <p className="text-xl font-extrabold text-slate-800">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Urgencias</p>
            <p className="text-xl font-extrabold text-slate-800">
              {orders.filter(o => o.type === 'corrective').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <PenTool size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Firmadas IPS</p>
            <p className="text-xl font-extrabold text-slate-800">
              {orders.filter(o => o.signature_url).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and list */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por IPS / Clínica o diagnóstico técnico..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-sm focus:bg-white focus:border-blue-200 outline-hidden transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Ficha Técnica</th>
                <th className="px-6 py-4">Cliente / IPS</th>
                <th className="px-6 py-4">Tipo Mantenimiento</th>
                <th className="px-6 py-4">Evidencia & Firma</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Diagnóstico Preliminar</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.map((o, idx) => {
                const client = customers.find(c => c.id === o.customer_id);
                const prod = products.find(p => p.id === o.product_id);
                const orderType = ORDER_TYPES.find(t => t.value === o.type);
                
                return (
                  <tr key={o.id || idx} className="hover:bg-slate-50 text-slate-700 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-600">OTS-{1220 + idx}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 leading-none">{client ? client.name : "Paciente Domiciliario"}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">{prod ? prod.name : "Equipo Desconocido"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border", orderType?.color)}>
                        {orderType?.label || "Mantenimiento"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {o.evidence_urls && o.evidence_urls.length > 0 ? (
                          <div className="flex -space-x-2" title="Imágenes anexadas">
                            {o.evidence_urls.map((u, ui) => (
                              <img key={ui} src={u} className="w-6 h-6 rounded-full border border-white bg-slate-200 object-cover" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10pt] font-semibold text-slate-400">Sin fotos</span>
                        )}
                        {o.signature_url ? (
                          <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-bold">FIRMADO</span>
                        ) : (
                          <span className="text-xs text-slate-400 uppercase font-bold">Pendiente Firma</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-widest ${
                        o.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        o.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {o.status === 'completed' ? 'Completado' : o.status === 'in_progress' ? 'En taller' : 'Abierto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-xs font-semibold text-slate-500">{o.diagnosis || "Sin diagnóstico asentado todavía."}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditOrder(o)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD/Diag Pad drawing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Orden de Soporte Técnico Biomédica</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente Solicitante / IPS</label>
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equipo Médico Asociado</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Intervención</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ServiceOrder['type'] }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="preventive">Mantenimiento Preventivo</option>
                      <option value="corrective">Correctivo de Urgencia</option>
                      <option value="installation">Instalación y Calibración</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado de Orden Técnica</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ServiceOrder['status'] }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="open">Abierto (Recibido)</option>
                      <option value="in_progress">En Taller (En diagnóstico)</option>
                      <option value="completed">Completado y Firmado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargar Evidencias Biomédicas (Fotos)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer flex-1">
                        <Upload size={14} /> {isUploadingFile ? "Subiendo..." : "Subir Foto Evidencia"}
                        <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Evidences lists */}
                {uploadedEvidences.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex-wrap">
                    {uploadedEvidences.map((url, i) => (
                      <div key={i} className="relative group w-12 h-12 rounded-lg border overflow-hidden">
                        <img src={url} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setUploadedEvidences(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Diagnóstico de Soporte Técnico Computado</label>
                  <textarea 
                    value={formData.diagnosis || ""}
                    rows={3}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Registra mediciones de presión, oxígeno, pureza dócilmente..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Draw Canvas digital Signature Pad */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                      <PenTool size={14} /> Firma Digital Obligatoria del Técnico / IPS Solicitante
                    </span>
                    <button 
                      type="button" 
                      onClick={clearCanvas}
                      className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-md"
                    >
                      Limpiar Panel
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <canvas 
                      ref={canvasRef}
                      width={400}
                      height={120}
                      className="bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-crosshair max-w-full"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button 
                        type="button"
                        onClick={saveCanvasSignature}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Establecer Firma
                      </button>
                      {signatureSaved && (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> Firma Registrada Con Exito
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.signature_url && (
                    <div className="mt-4 border-t border-slate-200 pt-3 flex gap-4 items-center">
                      <span className="text-[10px] font-bold text-slate-400">Previsualización de firma activa:</span>
                      <img src={formData.signature_url} className="h-10 border border-slate-200 rounded-lg bg-white" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
                  >
                    {isSaving ? "Guardando..." : "Asentar Orden"}
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
