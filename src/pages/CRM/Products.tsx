import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Package, 
  Boxes,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  TrendingUp,
  X,
  Loader2,
  DollarSign,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency, cn } from "../../lib/utils";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: "",
    name: "",
    category: "",
    brand: "",
    price: 0,
    stock: 0,
    tax_rate: 19,
    description: "",
    provider: "",
    warranty: "1 año",
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400"
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get("/products");
      setProducts(data);
    } catch (err) {
      console.error(err);
      // Mock data updated with better placeholders
      setProducts([
        { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno 5L', category: 'Oxigenoterapia', brand: 'Drive', price: 4500000, stock: 12, description: 'Equipo estacionario de alta pureza.', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400', provider: 'Drive Medical', warranty: '1 año', tax_rate: 19 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      sku: "",
      name: "",
      category: "",
      brand: "",
      price: 0,
      stock: 0,
      tax_rate: 19,
      description: "",
      provider: "",
      warranty: "1 año",
      image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Create a clean object for the API
      const payload = {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        description: formData.description,
        price: Number(formData.price),
        tax_rate: Number(formData.tax_rate),
        stock: Number(formData.stock),
        provider: formData.provider,
        warranty: formData.warranty,
        image_url: formData.image_url
      };
      
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      await fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error al guardar el producto. Por favor verifica los datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Productos</h1>
          <p className="text-slate-500 text-sm">Gestiona el inventario de equipos médicos y consumibles.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats, Filters, etc. */}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o categoría..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-hidden cursor-pointer hover:bg-white transition-colors">
             <option>Todas las Categorías</option>
             <option>Oxigenoterapia</option>
             <option>Apnea</option>
             <option>Nebulización</option>
          </select>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
             <button onClick={() => setView('grid')} className={`p-2 transition-colors ${view === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400'}`}><Boxes size={18} /></button>
             <button onClick={() => setView('list')} className={`p-2 transition-colors ${view === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400'}`}><MoreVertical size={18} /></button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Productos", val: products.length, icon: Package, color: "blue" },
          { label: "Stock Bajo", val: products.filter(p => p.stock < 5).length, icon: AlertTriangle, color: "rose" },
          { label: "Categorías", val: [...new Set(products.map(p => p.category))].length, icon: Filter, color: "indigo" },
          { label: "Valor Inventario", val: formatCurrency(products.reduce((acc, p) => acc + (p.price * p.stock), 0)), icon: TrendingUp, color: "emerald" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shrink-0`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">{stat.label}</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all flex flex-col"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm">
                    {product.sku}
                  </div>
                  {product.stock < 5 && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                      STOCK BAJO
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button 
                       onClick={() => handleEdit(product)}
                       className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                     >
                       <Edit size={18} />
                     </button>
                     <button className="p-3 bg-white text-slate-800 rounded-full hover:bg-slate-200 transition-all shadow-lg"><Maximize2 size={18} /></button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{product.category}</p>
                  <h3 className="font-bold text-slate-800 mt-1 line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Precio Unitario</p>
                      <p className="font-bold text-slate-900">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Stock</p>
                      <p className={`font-bold ${product.stock < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{product.stock}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* List View placeholder integration later */}
      {view === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead>
               <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                 <th className="px-6 py-4">Producto</th>
                 <th className="px-6 py-4">SKU</th>
                 <th className="px-6 py-4">Categoría</th>
                 <th className="px-6 py-4">Stock</th>
                 <th className="px-6 py-4 text-right">Precio</th>
                 <th className="px-6 py-4">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filtered.map(product => (
                 <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                       <img 
                          src={product.image_url} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400";
                          }}
                        />
                     </div>
                     <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                   </td>
                   <td className="px-6 py-4 text-slate-500 font-mono text-xs">{product.sku}</td>
                   <td className="px-6 py-4 text-slate-500 text-sm">{product.category}</td>
                   <td className={`px-6 py-4 text-sm font-bold ${product.stock < 5 ? 'text-rose-600' : 'text-slate-600'}`}>{product.stock}</td>
                   <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">{formatCurrency(product.price)}</td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleEdit(product)}
                         className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                       <button className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination View */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-slate-500">Mostrando {filtered.length} de {products.length} productos registrados</p>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30" disabled><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-1">
             <button className="w-8 h-8 flex items-center justify-center font-bold text-xs bg-blue-600 text-white rounded-lg">1</button>
          </div>
          <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30" disabled><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {editingId ? "Editar Producto" : "Registrar Nuevo Producto"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {editingId ? "Actualiza los detalles técnicos y comerciales del equipo." : "Ingresa los detalles técnicos y comerciales del equipo."}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Nombre del Producto</label>
                       <input 
                         type="text" 
                         required
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="Ej: Concentrador de Oxígeno 5L"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">SKU / Referencia</label>
                         <input 
                           type="text" 
                           required
                           value={formData.sku}
                           onChange={(e) => setFormData({...formData, sku: e.target.value})}
                           placeholder="OX-500"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">Marca</label>
                         <input 
                           type="text" 
                           required
                           value={formData.brand}
                           onChange={(e) => setFormData({...formData, brand: e.target.value})}
                           placeholder="Drive Medical"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Categoría</label>
                       <select 
                         required
                         value={formData.category}
                         onChange={(e) => setFormData({...formData, category: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden appearance-none"
                       >
                         <option value="">Selecciona una categoría</option>
                         <option value="Oxigenoterapia">Oxigenoterapia</option>
                         <option value="Apnea">Apnea</option>
                         <option value="Nebulización">Nebulización</option>
                         <option value="Insumos">Insumos</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Descripción</label>
                       <textarea 
                         rows={4}
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         placeholder="Detalles adicionales del equipo..."
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                       />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">Precio Unitario (COP)</label>
                         <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              type="number" 
                              required
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">Impuesto (%)</label>
                         <input 
                           type="number" 
                           value={formData.tax_rate}
                           onChange={(e) => setFormData({...formData, tax_rate: Number(e.target.value)})}
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">Stock Inicial</label>
                         <input 
                           type="number" 
                           required
                           value={formData.stock}
                           onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 ml-1">Garantía</label>
                         <input 
                           type="text" 
                           value={formData.warranty}
                           onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                           placeholder="Ej: 1 año"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                         />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Proveedor / Fabricante</label>
                       <input 
                         type="text" 
                         value={formData.provider}
                         onChange={(e) => setFormData({...formData, provider: e.target.value})}
                         placeholder="Drive Medical Colombia"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">URL de Imagen</label>
                       <div className="flex gap-4 items-start">
                         <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                           <img 
                             src={formData.image_url} 
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400";
                             }}
                           />
                         </div>
                         <div className="flex-1">
                           <input 
                             type="url" 
                             value={formData.image_url}
                             onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden text-xs text-blue-600 mb-2"
                             placeholder="https://..."
                           />
                           <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-[10px] text-blue-600 font-medium">
                             <Info size={14} />
                             Pega una URL válida. Se mostrará el producto en el catálogo.
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex items-center justify-end gap-4 p-6 bg-slate-50 -mx-8 -mb-8">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : (editingId ? "Actualizar Producto" : "Guardar Producto")}
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
