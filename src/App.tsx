import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ReceiptText, 
  Wallet, 
  Settings, 
  Plus, 
  Minus, 
  Trash2, 
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  UtensilsCrossed,
  Tag,
  Menu as MenuIcon,
  X,
  Edit2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, SaleItem, DashboardData, Expense, ExpenseCategory } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-primary-container text-on-primary-container font-semibold' 
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`}
  >
    <Icon size={22} />
    <span className="hidden md:block">{label}</span>
  </button>
);

const MobileNavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${
      active ? 'text-primary' : 'text-on-surface-variant'
    }`}
  >
    <Icon size={20} className={active ? 'scale-110' : ''} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

interface ProductCardProps {
  product: Product;
  onAdd: (p: Product) => void;
  key?: React.Key;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => (
  <motion.div 
    whileTap={{ scale: 0.98 }}
    onClick={() => product.is_available && onAdd(product)}
    className={`card-m3 cursor-pointer flex flex-col justify-between h-full ${!product.is_available ? 'opacity-50 grayscale' : ''}`}
  >
    <div>
      <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{product.category}</div>
      <div className="text-lg font-bold leading-tight mb-2">{product.name}</div>
    </div>
    <div className="text-xl font-mono font-bold text-on-surface">
      {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
    </div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'sales' | 'dashboard' | 'expenses' | 'menu'>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [paymentMode, setPaymentMode] = useState<'ORANGE_MONEY' | 'CASH' | 'WAVE' | 'MOOV_MONEY' | 'SANKMONEY'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [newExpense, setNewExpense] = useState<Expense>({
    description: '',
    amount: 0,
    category: 'Autres'
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: 'Plats',
    is_available: 1
  });

  useEffect(() => {
    fetchProducts();
    fetchDashboard();
    fetchExpenses();
    fetchCategories();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchDashboard = async () => {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    setDashboard(data);
  };

  const fetchExpenses = async () => {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    setExpenses(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/expense-categories');
    const data = await res.json();
    setExpenseCategories(data);
    if (data.length > 0 && !newExpense.category) {
      setNewExpense(prev => ({ ...prev, category: data[0].name }));
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    });
    if (res.ok) {
      setNewExpense({ description: '', amount: 0, category: expenseCategories[0]?.name || 'Autres' });
      setShowExpenseForm(false);
      fetchExpenses();
      fetchDashboard();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const res = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    });
    if (res.ok) {
      setNewCategoryName('');
      setShowCategoryForm(false);
      fetchCategories();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    if (res.ok) {
      setNewProduct({ name: '', price: 0, category: 'Plats', is_available: 1 });
      setEditingProduct(null);
      setShowProductForm(false);
      fetchProducts();
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      is_available: product.is_available
    });
    setShowProductForm(true);
  };

  const toggleProductAvailability = async (product: Product) => {
    const updated = { ...product, is_available: product.is_available ? 0 : 1 };
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) fetchProducts();
  };

  const handleBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          alert('Restauration réussie !');
          window.location.reload();
        } else {
          const error = await res.json();
          alert('Erreur lors de la restauration: ' + error.error);
        }
      } catch (err) {
        alert('Fichier invalide');
      }
    };
    reader.readAsText(file);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        quantity: 1, 
        unit_price: product.price,
        name: product.name 
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0), 
  [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    const saleId = `SALE-${Date.now()}`;
    const saleData = {
      id: saleId,
      total_amount: totalAmount,
      payment_mode: paymentMode,
      items: cart
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (res.ok) {
        alert(`Vente réussie ! ID: ${saleId}\nImpression du ticket en cours...`);
        setCart([]);
        setShowCartMobile(false);
        fetchDashboard();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-surface-variant flex-col p-4 gap-2">
        <div className="flex items-center gap-3 px-4 py-6 mb-4">
          <div className="bg-primary text-on-primary p-2 rounded-xl">
            <ShoppingCart size={24} />
          </div>
          <h1 className="text-xl font-bold">RestoPOS</h1>
        </div>
        
        <SidebarItem 
          icon={ShoppingCart} 
          label="Ventes" 
          active={activeTab === 'sales'} 
          onClick={() => setActiveTab('sales')} 
        />
        <SidebarItem 
          icon={UtensilsCrossed} 
          label="Menu" 
          active={activeTab === 'menu'} 
          onClick={() => setActiveTab('menu')} 
        />
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Bilan" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <SidebarItem 
          icon={ReceiptText} 
          label="Charges" 
          active={activeTab === 'expenses'} 
          onClick={() => setActiveTab('expenses')} 
        />
        
        <div className="mt-auto space-y-2">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-all"
            >
              <Smartphone size={22} />
              <span className="hidden md:block">Installer l'App</span>
            </button>
          )}
          <SidebarItem icon={Settings} label="Sauvegarde" onClick={handleBackup} />
          <div className="px-4 py-2">
            <label className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-on-surface-variant hover:bg-surface-variant/50 cursor-pointer">
              <TrendingUp size={22} className="rotate-180" />
              <span className="hidden md:block">Restaurer</span>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-surface-variant bg-white">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-on-primary p-1.5 rounded-lg">
              <ShoppingCart size={18} />
            </div>
            <span className="font-bold">RestoPOS</span>
          </div>
          {activeTab === 'sales' && (
            <button 
              onClick={() => setShowCartMobile(true)}
              className="relative p-2 text-primary"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'sales' && (
            <div className="flex h-full overflow-hidden">
              {/* Products Grid */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold">Menu</h2>
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['Tous', 'Plats', 'Boissons', 'Desserts'].map(cat => (
                      <button key={cat} className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-variant/50 text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {products.filter(p => p.is_available).map(product => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </div>

              {/* Desktop Cart */}
              <div className="hidden md:flex w-full max-w-md border-l border-surface-variant bg-white flex-col shadow-2xl">
                <CartContent 
                  cart={cart} 
                  paymentMode={paymentMode} 
                  setPaymentMode={setPaymentMode} 
                  totalAmount={totalAmount} 
                  handleCheckout={handleCheckout} 
                  isProcessing={isProcessing}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              </div>

              {/* Mobile Cart Modal */}
              <AnimatePresence>
                {showCartMobile && (
                  <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-white md:hidden flex flex-col"
                  >
                    <div className="p-4 border-b border-surface-variant flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <ReceiptText size={20} />
                        Votre Panier
                      </h2>
                      <button onClick={() => setShowCartMobile(false)} className="p-2 rounded-full hover:bg-surface-variant">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <CartContent 
                        cart={cart} 
                        paymentMode={paymentMode} 
                        setPaymentMode={setPaymentMode} 
                        totalAmount={totalAmount} 
                        handleCheckout={handleCheckout} 
                        isProcessing={isProcessing}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="p-4 md:p-8 space-y-8 overflow-y-auto h-full">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl md:text-3xl font-bold">Gestion du Menu</h2>
                <button 
                  onClick={() => setShowProductForm(true)}
                  className="btn-primary-m3 flex items-center gap-2 py-2 px-4"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Ajouter un Produit</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>

              {showProductForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-m3 bg-white shadow-lg"
                >
                  <h3 className="font-bold mb-4 text-primary">
                    {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
                  </h3>
                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nom du produit</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Ex: Burger"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Prix (XOF)</label>
                      <input 
                        required
                        type="number" 
                        value={newProduct.price || ''}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Catégorie</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="Plats">Plats</option>
                        <option value="Boissons">Boissons</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 btn-primary-m3">
                        {editingProduct ? 'Mettre à jour' : 'Enregistrer'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProduct(null);
                          setNewProduct({ name: '', price: 0, category: 'Plats', is_available: 1 });
                        }} 
                        className="px-4 py-3 rounded-full bg-surface-variant text-on-surface-variant font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className={`card-m3 bg-white flex flex-col justify-between ${!product.is_available ? 'border-dashed opacity-70' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-primary uppercase">{product.category}</div>
                        <div className="text-lg font-bold">{product.name}</div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => startEditing(product)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg"
                          title="Modifier le prix/nom"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => toggleProductAvailability(product)}
                          className={`p-2 rounded-lg transition-colors ${product.is_available ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'}`}
                          title={product.is_available ? "Marquer comme épuisé" : "Marquer comme disponible"}
                        >
                          {product.is_available ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xl font-mono font-bold">
                        {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {product.is_available ? 'DISPONIBLE' : 'ÉPUISÉ'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && dashboard && (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto h-full">
              <h2 className="text-2xl md:text-3xl font-bold">Bilan Dynamique</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="card-m3 bg-emerald-50 border-emerald-100 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <div className="text-emerald-900/60 font-medium uppercase tracking-wider text-xs">Chiffre d'Affaires</div>
                  <div className="text-2xl md:text-4xl font-mono font-black text-emerald-900 mt-1">
                    {dashboard.ca.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </div>
                </div>

                <div className="card-m3 bg-rose-50 border-rose-100 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-500 text-white rounded-2xl">
                      <TrendingDown size={24} />
                    </div>
                  </div>
                  <div className="text-rose-900/60 font-medium uppercase tracking-wider text-xs">Charges Totales</div>
                  <div className="text-2xl md:text-4xl font-mono font-black text-rose-900 mt-1">
                    {dashboard.charges.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </div>
                </div>

                <div className="card-m3 bg-primary-container border-primary/10 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary text-white rounded-2xl">
                      <Wallet size={24} />
                    </div>
                  </div>
                  <div className="text-primary/60 font-medium uppercase tracking-wider text-xs">Bénéfice Net</div>
                  <div className="text-2xl md:text-4xl font-mono font-black text-primary mt-1">
                    {dashboard.profit.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="card-m3 bg-white">
                  <h3 className="text-xl font-bold mb-6">Ventes Récentes</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl hover:bg-surface-variant/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm">
                            #{i}
                          </div>
                          <div>
                            <div className="font-bold text-sm md:text-base">Vente #{1024 + i}</div>
                            <div className="text-[10px] md:text-sm text-on-surface-variant">Il y a {i * 15} min • Espèces</div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-sm md:text-lg">25 000 F CFA</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-m3 bg-white">
                  <h3 className="text-xl font-bold mb-6">Répartition des Ventes</h3>
                  <div className="space-y-6">
                    {[
                      { name: 'Plats', value: 65, color: 'bg-primary' },
                      { name: 'Boissons', value: 25, color: 'bg-secondary' },
                      { name: 'Desserts', value: 10, color: 'bg-emerald-500' }
                    ].map(cat => (
                      <div key={cat.name}>
                        <div className="flex justify-between mb-2 font-medium text-sm">
                          <span>{cat.name}</span>
                          <span>{cat.value}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-surface-variant rounded-full overflow-hidden">
                          <div className={`h-full ${cat.color}`} style={{ width: `${cat.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-bold">Gestion des Charges</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowCategoryForm(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5"
                  >
                    <Tag size={18} />
                    Types
                  </button>
                  <button 
                    onClick={() => setShowExpenseForm(true)}
                    className="flex-1 sm:flex-none btn-primary-m3 flex items-center justify-center gap-2 py-2 px-4"
                  >
                    <Plus size={20} />
                    Charge
                  </button>
                </div>
              </div>

              {showCategoryForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-m3 bg-white shadow-lg border-primary/20"
                >
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-primary" />
                    Nouveau type de charge
                  </h3>
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input 
                      required
                      type="text" 
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Ex: Internet, Maintenance..."
                    />
                    <button type="submit" className="btn-primary-m3 px-4">Ajouter</button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} className="p-3 text-on-surface-variant"><X size={20} /></button>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {expenseCategories.map(cat => (
                      <span key={cat.id} className="px-3 py-1 rounded-full bg-surface-variant text-xs font-medium">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {showExpenseForm && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-m3 bg-white shadow-lg"
                >
                  <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Description</label>
                      <input 
                        required
                        type="text" 
                        value={newExpense.description}
                        onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Ex: Facture Eau"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Montant (XOF)</label>
                      <input 
                        required
                        type="number" 
                        step="1"
                        value={newExpense.amount || ''}
                        onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Catégorie</label>
                      <select 
                        value={newExpense.category}
                        onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}
                        className="w-full p-3 rounded-xl border border-surface-variant focus:ring-2 focus:ring-primary outline-none"
                      >
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 btn-primary-m3">Ajouter</button>
                      <button type="button" onClick={() => setShowExpenseForm(false)} className="px-4 py-3 rounded-full bg-surface-variant text-on-surface-variant font-medium">Annuler</button>
                    </div>
                  </form>
                </motion.div>
              )}

              <div className="card-m3 bg-white overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="border-b border-surface-variant text-on-surface-variant uppercase text-[10px] md:text-xs tracking-widest font-bold">
                      <th className="pb-4 px-4">Description</th>
                      <th className="pb-4 px-4">Catégorie</th>
                      <th className="pb-4 px-4">Date</th>
                      <th className="pb-4 px-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/50">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-on-surface-variant opacity-50 italic">
                          Aucune charge enregistrée
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-surface-variant/10 transition-colors">
                          <td className="py-4 px-4 font-medium text-sm md:text-base">{exp.description}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 rounded-full bg-surface-variant text-[10px] md:text-xs font-bold">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-on-surface-variant text-[10px] md:text-sm">
                            {exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-rose-600 text-sm md:text-base">
                            -{exp.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-variant flex items-center justify-around z-40 px-2">
          <MobileNavItem 
            icon={ShoppingCart} 
            label="Ventes" 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <MobileNavItem 
            icon={UtensilsCrossed} 
            label="Menu" 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')} 
          />
          <MobileNavItem 
            icon={LayoutDashboard} 
            label="Bilan" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <MobileNavItem 
            icon={ReceiptText} 
            label="Charges" 
            active={activeTab === 'expenses'} 
            onClick={() => setActiveTab('expenses')} 
          />
          <MobileNavItem 
            icon={Settings} 
            label="Sauv." 
            onClick={handleBackup} 
          />
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-primary font-bold"
            >
              <Smartphone size={20} />
              <span className="text-[10px]">Installer</span>
            </button>
          )}
          <div className="flex flex-col items-center justify-center gap-1 flex-1 py-2">
            <label className="flex flex-col items-center justify-center gap-1 cursor-pointer text-on-surface-variant">
              <TrendingUp size={20} className="rotate-180" />
              <span className="text-[10px] font-medium">Rest.</span>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </nav>
      </main>
    </div>
  );
}

// --- Sub-components ---

function CartContent({ 
  cart, 
  paymentMode, 
  setPaymentMode, 
  totalAmount, 
  handleCheckout, 
  isProcessing,
  updateQuantity,
  removeFromCart
}: any) {
  return (
    <>
      <div className="p-6 border-b border-surface-variant hidden md:block">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ReceiptText size={20} />
          Commande en cours
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <AnimatePresence>
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-50 py-12">
              <ShoppingCart size={48} className="mb-4" />
              <p>Le panier est vide</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <motion.div 
                key={item.product_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface-variant/20"
              >
                <div className="flex-1">
                  <div className="font-bold text-sm md:text-base">{item.name}</div>
                  <div className="text-xs md:text-sm text-on-surface-variant">
                    {item.unit_price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 rounded-lg hover:bg-surface-variant">
                    <Minus size={16} />
                  </button>
                  <span className="font-mono font-bold w-6 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 rounded-lg hover:bg-surface-variant">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => removeFromCart(item.product_id)} className="p-1 text-rose-500 hover:bg-rose-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 md:p-6 bg-surface-variant/10 border-t border-surface-variant space-y-6">
        <div className="space-y-3">
          <div className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mode de paiement</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <PaymentButton 
              active={paymentMode === 'CASH'} 
              onClick={() => setPaymentMode('CASH')} 
              icon={Banknote} 
              label="Espèces" 
            />
            <PaymentButton 
              active={paymentMode === 'ORANGE_MONEY'} 
              onClick={() => setPaymentMode('ORANGE_MONEY')} 
              icon={Smartphone} 
              label="Orange Money" 
            />
            <PaymentButton 
              active={paymentMode === 'WAVE'} 
              onClick={() => setPaymentMode('WAVE')} 
              icon={Smartphone} 
              label="Wave" 
            />
            <PaymentButton 
              active={paymentMode === 'MOOV_MONEY'} 
              onClick={() => setPaymentMode('MOOV_MONEY')} 
              icon={Smartphone} 
              label="Moov Money" 
            />
            <PaymentButton 
              active={paymentMode === 'SANKMONEY'} 
              onClick={() => setPaymentMode('SANKMONEY')} 
              icon={Smartphone} 
              label="Sank Money" 
            />
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-on-surface-variant font-medium text-sm md:text-base">Total à payer</div>
          <div className="text-2xl md:text-3xl font-mono font-black text-primary">
            {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
          </div>
        </div>

        <button 
          disabled={cart.length === 0 || isProcessing}
          onClick={handleCheckout}
          className="w-full btn-primary-m3 flex items-center justify-center gap-3 py-3 md:py-4 text-base md:text-lg"
        >
          {isProcessing ? 'Traitement...' : (
            <>
              <Printer size={22} />
              Encaisser & Imprimer
            </>
          )}
        </button>
      </div>
    </>
  );
}

function PaymentButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-xl border transition-all ${
        active 
          ? 'bg-primary-container border-primary text-on-primary-container' 
          : 'border-surface-variant text-on-surface-variant hover:bg-white'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
