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
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.get("/products");
      setProducts(data);
    } catch (err) {
      console.error(err);
      // Mock data if failed because table might not exist yet
      setProducts([
        { id: '1', sku: 'OX-500', name: 'Concentrador de Oxígeno 5L', category: 'Oxigenoterapia', brand: 'Drive', price: 4500000, stock: 12, description: 'Equipo estacionario de alta pureza.', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400', provider: 'Drive Medical', warranty: '1 año', tax_rate: 19 },
        { id: '2', sku: 'CP-100', name: 'Equipo CPAP Automático', category: 'Apnea', brand: 'ResMed', price: 2800000, stock: 8, description: 'Ajuste de presión automático silencioso.', image_url: 'https://images.unsplash.com/photo-1583088580009-2d977c6ca09a?auto=format&fit=crop&q=80&w=400', provider: 'ResMed LATAM', warranty: '2 años', tax_rate: 19 },
        { id: '3', sku: 'NB-20', name: 'Nebulizador Portátil Mesh', category: 'Nebulización', brand: 'Omron', price: 450000, stock: 25, description: 'Tecnología de malla vibratoria.', image_url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400', provider: 'Omron Salud', warranty: '1 año', tax_rate: 19 },
      ]);
    } finally {
      setLoading(false);
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
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

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
                <div className="aspect-square bg-slate-50 relative overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
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
                     <button className="p-3 bg-white text-slate-800 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Edit size={18} /></button>
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
                       <img src={product.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     </div>
                     <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                   </td>
                   <td className="px-6 py-4 text-slate-500 font-mono text-xs">{product.sku}</td>
                   <td className="px-6 py-4 text-slate-500 text-sm">{product.category}</td>
                   <td className={`px-6 py-4 text-sm font-bold ${product.stock < 5 ? 'text-rose-600' : 'text-slate-600'}`}>{product.stock}</td>
                   <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">{formatCurrency(product.price)}</td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                       <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit size={16} /></button>
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
    </div>
  );
}
