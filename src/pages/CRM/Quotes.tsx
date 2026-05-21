import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  Printer, 
  DollarSign, 
  User as UserIcon, 
  ChevronRight, 
  Trash, 
  CheckCircle,
  Eye, 
  Download, 
  X, 
  Loader2,
  Percent,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Quote, Product, Customer } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency, cn } from "../../lib/utils";

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Create / Edit Quote States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Line items state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [quoteItems, setQuoteItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<Quote['status']>("draft");

  // PDF Preview State
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quote | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [quotesData, productsData, customersData] = await Promise.all([
        api.get("/quotes").catch(() => []),
        api.get("/products").catch(() => []),
        api.get("/customers").catch(() => [])
      ]);

      // Seed fallback values if empty
      const resolvedQuotes = quotesData.length > 0 ? quotesData : [
        {
          id: "q1",
          quote_number: 1024,
          customer_id: "c1",
          user_id: "u1",
          total: 10450000,
          tax: 1650000,
          discount: 200000,
          shipping: 50000,
          status: "accepted",
          notes: "Cotización especial para Dr. Felipe - Neumólogo",
          created_at: "2026-05-18T10:00:00Z"
        },
        {
          id: "q2",
          quote_number: 1025,
          customer_id: "c2",
          user_id: "u2",
          total: 5414500,
          tax: 864500,
          discount: 0,
          shipping: 50000,
          status: "sent",
          notes: "CPAP oficial con máscara nasal AirFit N30",
          created_at: "2026-05-19T14:30:00Z"
        }
      ];

      const resolvedProducts = productsData.length > 0 ? productsData : [
        { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno EverFlo 5L', category: 'Oxigenoterapia', brand: 'Philips Respironics', price: 4200000, stock: 12, description: 'Concentrador estacionario de oxígeno médico.', image_url: '', provider: 'Philips', warranty: '1 año', tax_rate: 19 },
        { id: '2', sku: 'CPAP-A11', name: 'CPAP AutoSet AirSense 11', category: 'Sueño', brand: 'ResMed', price: 3800000, stock: 8, description: 'Equipo automático para terapia de Apnea de Sueño.', image_url: '', provider: 'ResMed', warranty: '2 años', tax_rate: 19 },
        { id: '3', sku: 'MASK-N30', name: 'Máscara Nasal AirFit N30i', category: 'Consumibles', brand: 'ResMed', price: 550000, stock: 25, description: 'Máscara con arnés ultra liviana.', image_url: '', provider: 'ResMed', warranty: '3 meses', tax_rate: 19 }
      ];

      const resolvedCustomers = customersData.length > 0 ? customersData : [
        { id: "c1", name: "Fundación Neumológica de Colombia", document_type: "NIT", document_id: "860.034.908-2", phone: "+57 (601) 742-8900", email: "compras@neumologica.org", address: "Calle 163a # 13-60", city: "Bogotá", department: "Bogotá D.C.", status: "active" },
        { id: "c2", name: "IPS Neumored SAS", document_type: "NIT", document_id: "901.442.115-4", phone: "320 890 1212", email: "gerencia@neumored.co", address: "Avenida 4N # 23N-50", city: "Cali", department: "Valle del Cauca", status: "active" }
      ];

      setQuotes(resolvedQuotes);
      setProducts(resolvedProducts);
      setCustomers(resolvedCustomers);
    } catch (err) {
      console.error("Initial load failed, setting standard mocks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setSelectedCustomerId(customers[0]?.id || "");
    setQuoteNotes("");
    setDiscountPercent(0);
    setShippingCost(0);
    setQuoteItems([]);
    setQuoteStatus("draft");
    setIsModalOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setSelectedCustomerId(quote.customer_id);
    setQuoteNotes(quote.notes);
    // Rough reverse computation of discount/shipping if items exist (or default)
    setDiscountPercent(quote.discount > 0 ? 5 : 0);
    setShippingCost(quote.shipping);
    setQuoteStatus(quote.status);
    
    // Simulate current items
    setQuoteItems([
      { product: products[0] || { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno EverFlo 5L', category: 'Oxigenoterapia', brand: 'Philips', price: 4200000, stock: 12, description: '', image_url: '', provider: '', warranty: '', tax_rate: 19 }, quantity: 1 }
    ]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta cotización?")) return;
    try {
      await api.delete(`/quotes/${id}`);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      setQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleAddProductToQuote = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setQuoteItems(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleRemoveProductFromQuote = (productId: string) => {
    setQuoteItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateProductQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setQuoteItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: qty } : item));
  };

  // Calculations
  const subtotal = quoteItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const taxableAmount = subtotal - discountAmount;
  // Colombian IVA is 19%
  const ivaAmount = Math.round(taxableAmount * 0.19);
  const calculatedTotal = taxableAmount + ivaAmount + Number(shippingCost);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      alert("Por favor agregue por lo menos un producto a la cotización.");
      return;
    }

    setIsSaving(true);
    const newQuoteNumber = quotes.length > 0 ? Math.max(...quotes.map(q => q.quote_number)) + 1 : 1001;
    
    const payload = {
      customer_id: selectedCustomerId,
      quote_number: newQuoteNumber,
      total: calculatedTotal,
      tax: ivaAmount,
      discount: discountAmount,
      shipping: Number(shippingCost),
      status: quoteStatus,
      notes: quoteNotes,
      user_id: "", // Filled on server
      created_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        let result;
        try {
          result = await api.put(`/quotes/${editingId}`, payload);
        } catch (e) {
          result = { ...payload, id: editingId };
        }
        setQuotes(prev => prev.map(q => q.id === editingId ? { ...q, ...result } : q));
      } else {
        let result;
        try {
          result = await api.post("/quotes", payload);
        } catch (e) {
          result = { ...payload, id: "local_" + Date.now() };
        }
        setQuotes(prev => [result, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredQuotes = quotes.filter(q => {
    const client = customers.find(c => c.id === q.customer_id);
    return (
      (client && client.name.toLowerCase().includes(search.toLowerCase())) ||
      q.quote_number.toString().includes(search) ||
      (q.notes && q.notes.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cotizaciones e IVA Colombia (19%)</h1>
          <p className="text-slate-500 text-sm">Emite propuestas comerciales parametrizadas por impuestos, garantías y tiempos de entrega.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} /> Crear Cotización
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Emitidas</p>
            <p className="text-xl font-extrabold text-slate-800">{quotes.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Aprobadas (Accepted)</p>
            <p className="text-xl font-extrabold text-slate-800">
              {quotes.filter(q => q.status === 'accepted').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Valor en Propuestas</p>
            <p className="text-xl font-extrabold text-slate-800">
              {formatCurrency(quotes.reduce((acc, q) => acc + (q.total || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número de cotización o clínica..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-sm focus:bg-white focus:border-blue-200 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Quote records list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">N° Cotización</th>
                <th className="px-6 py-4">Cliente / IPS</th>
                <th className="px-6 py-4">Total Neto (con IVA)</th>
                <th className="px-6 py-4">IVA (19%)</th>
                <th className="px-6 py-4">Descuento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha Emisión</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((q) => {
                const client = customers.find(c => c.id === q.customer_id);
                return (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-blue-600">COT-{q.quote_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{client ? client.name : "Varios IPS"}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(q.total)}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{formatCurrency(q.tax)}</td>
                    <td className="px-6 py-4 text-rose-600 font-semibold text-xs">-{formatCurrency(q.discount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                        q.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        q.status === 'sent' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                        q.status === 'draft' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {q.status === 'accepted' ? 'Aceptado' : q.status === 'sent' ? 'Enviado' : q.status === 'draft' ? 'Borrador' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                      {new Date(q.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedQuoteForPreview(q)}
                          title="Visualizar PDF"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(q)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
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

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Generación de Cotización de Alta Pureza</h2>
                  <p className="text-xs text-slate-400 font-bold">Añade productos del catálogo, aplica IVA colombiano legal y asocia el ID del cliente.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveQuote} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destinatario IPS / Paciente</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Administrativo</label>
                    <select
                      value={quoteStatus}
                      onChange={(e) => setQuoteStatus(e.target.value as Quote['status'])}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviado formalmente</option>
                      <option value="accepted">Aceptado-Cerrado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agregar Producto</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddProductToQuote(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      <option value="">-- Escoger del inventario --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected items table summary */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <div className="px-4 py-3 bg-slate-100/60 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Artículos Agregados ({quoteItems.length})</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {quoteItems.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        No hay productos elegidos. Seleccione uno de la lista arriba.
                      </div>
                    ) : (
                      quoteItems.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{item.product.name}</p>
                            <p className="text-xs text-slate-400 mt-1 font-mono uppercase">SKU: {item.product.sku} | IVA 19%</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold">VALOR UNIDAD</p>
                              <p className="text-sm font-bold text-slate-700">{formatCurrency(item.product.price)}</p>
                            </div>
                            <div className="w-20">
                              <p className="text-[10px] text-slate-400 font-bold mb-1">CANTIDAD</p>
                              <input 
                                type="number" 
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateProductQty(item.product.id, Number(e.target.value))}
                                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm text-center font-bold"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold">SUBTOTAL</p>
                              <p className="text-sm font-bold text-slate-800">{formatCurrency(item.product.price * item.quantity)}</p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveProductFromQuote(item.product.id)}
                              className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors self-end sm:self-center"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones Legales e Instrucciones de Pago</label>
                    <textarea 
                      value={quoteNotes}
                      rows={4}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Condiciones de pago, entrega, vigencia de esta oferta técnica..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Totals computation */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 border-b border-slate-200/60 pb-2">Desglose de Facturación</h4>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal bruto:</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        Descuento Comercial:
                        <input 
                          type="number" 
                          min={0}
                          max={90}
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value))}
                          className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-bold"
                        /> %
                      </span>
                      <span className="text-sm text-rose-600 font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 border-t border-slate-100 pt-1">
                      <span>Base Gravable:</span>
                      <span className="font-semibold">{formatCurrency(taxableAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span className="text-blue-600 font-bold">IVA Colombia (19.00%):</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(ivaAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">Envío & Logística (COP):</span>
                      <input 
                        type="number" 
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-right text-xs font-bold"
                      />
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-800">
                      <span>TOTAL GENERAL:</span>
                      <span className="text-slate-900 text-lg">{formatCurrency(calculatedTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200"
                  >
                    Cerrar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 "
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    {editingId ? "Actualizar Cotización" : "Emitir Cotización"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Corporate PDF Preview Modal Section */}
      <AnimatePresence>
        {selectedQuoteForPreview && (() => {
          const client = customers.find(c => c.id === selectedQuoteForPreview.customer_id);
          return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8"
              >
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center print:hidden">
                  <span className="text-xs font-bold text-slate-500 uppercase">Vista de Impresión / PDF Oficial</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      <Printer size={14} /> Imprimir Oferta
                    </button>
                    <button 
                      onClick={() => setSelectedQuoteForPreview(null)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Beautiful corporate bill worksheet layout */}
                <div className="p-12 text-slate-800 font-sans space-y-8 print:p-0" id="print-sheet">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">R</div>
                        <span className="font-extrabold text-xl text-slate-900 tracking-tight">RESPIRA CRM</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">RespiraCRM Colombia S.A.S</p>
                      <p className="text-xs font-medium text-slate-400">NIT: 901.815.223-1</p>
                      <p className="text-xs text-slate-400 font-medium">Bujalance Norte, Bogotá D.C., Colombia</p>
                    </div>

                    <div className="text-right">
                      <h3 className="font-extrabold text-2xl text-blue-600">COTIZACIÓN COMERCIAL</h3>
                      <p className="text-sm font-bold text-slate-700">Ref: COT-{selectedQuoteForPreview.quote_number}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                        SOPORTE DE ALTA PUREZA
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Customer information segment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">COTIZADO PARA:</p>
                      <h4 className="font-bold text-slate-800 text-base mt-1">{client ? client.name : "Cliente IPS de RespiraCRM"}</h4>
                      {client && (
                        <>
                          <p className="text-xs text-slate-500 mt-1 font-mono uppercase">{client.document_type}: {client.document_id}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            {client.address && <>{client.address}, </>} {client.city}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Celular: {client.phone || "N/A"}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATOS FISCALES:</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-bold">Fecha de Emisión:</span> {new Date(selectedQuoteForPreview.created_at).toLocaleDateString('es-CO')}</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-bold">Vence:</span> {new Date(new Date(selectedQuoteForPreview.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO')} (15 días)</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-bold">Asesor:</span> RespiraCRM Executive</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-bold">Moneda:</span> Pesos Colombianos (COP)</p>
                    </div>
                  </div>

                  {/* Invoice details list */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">DESCRIPCIÓN DEL EQUIPO MÉDICO</th>
                        <th className="p-3 text-center">CANTIDAD</th>
                        <th className="p-3 text-right">VALOR UNITARIO</th>
                        <th className="p-3 text-right">IVA (19%)</th>
                        <th className="p-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">Concentrador de Oxígeno EverFlo 5L / CPAP AutoSet System</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Soporte médico respiratorio oficial certificado con garantía de fábrica extendida.</p>
                        </td>
                        <td className="p-3 text-center font-bold">1</td>
                        <td className="p-3 text-right text-slate-600">{formatCurrency(selectedQuoteForPreview.total - selectedQuoteForPreview.tax)}</td>
                        <td className="p-3 text-right text-slate-600">{formatCurrency(selectedQuoteForPreview.tax)}</td>
                        <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(selectedQuoteForPreview.total)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Calculations totalization footer */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="max-w-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">NOTAS LEGALES Y CONDICIONES:</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        {selectedQuoteForPreview.notes || "Garantía de 1 año en equipos mecánicos. Envío a nivel nacional sujeto a tarifas logísticas de transportadora. Vigencia del precio es de 15 días calendario a partir de la fecha de emisión."}
                      </p>
                    </div>
                    <div className="w-64 space-y-2 text-right">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtotal Bruto:</span>
                        <span className="font-semibold">{formatCurrency(selectedQuoteForPreview.total - selectedQuoteForPreview.tax - selectedQuoteForPreview.shipping)}</span>
                      </div>
                      {selectedQuoteForPreview.discount > 0 && (
                        <div className="flex justify-between text-xs text-rose-500">
                          <span>Descuento Aplicado:</span>
                          <span className="font-semibold">-{formatCurrency(selectedQuoteForPreview.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>IVA Colombia (19.00%):</span>
                        <span className="font-semibold">{formatCurrency(selectedQuoteForPreview.tax)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Flete de Despacho:</span>
                        <span className="font-semibold">{formatCurrency(selectedQuoteForPreview.shipping)}</span>
                      </div>
                      <hr className="border-slate-100" />
                      <div className="flex justify-between text-sm font-extrabold text-slate-900">
                        <span>TOTAL GENERAL:</span>
                        <span className="text-base text-blue-600 font-extrabold">{formatCurrency(selectedQuoteForPreview.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8 flex justify-between items-center text-[10px] text-slate-400">
                    <p>Factura electrónica generada por RespiraCRM. Colombia 2026.</p>
                    <p>Página 1 de 1</p>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
