import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  CupSoda, 
  ClipboardList, 
  ChefHat, 
  Settings, 
  TrendingUp, 
  RefreshCw, 
  Plus, 
  Minus, 
  Search, 
  Trash2, 
  MapPin, 
  Check, 
  QrCode, 
  CreditCard, 
  DollarSign, 
  Wallet, 
  ShieldCheck, 
  Sparkles,
  Percent,
  Clock,
  Phone,
  User,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Package,
  X,
  FileSpreadsheet,
  Compass,
  ArrowRight,
  Sliders,
  Map,
  ClipboardCheck,
  CheckSquare,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Home
} from 'lucide-react';
import { MenuItem, Order, RestaurantConfig, CartItem, RealtimeStats, KitchenNotification } from './types';
import GeofenceSimulator from './components/GeofenceSimulator';

export default function App() {
  // Dual-role switcher state: 'pelanggan' | 'admin'
  const [userRole, setUserRole] = useState<'pelanggan' | 'admin'>('pelanggan');

  // Sub-tabs inside customer view: 'order' | 'history'
  const [customerTab, setCustomerTab] = useState<'order' | 'history'>('order');

  // Sub-tabs inside admin view: 'analytics' | 'kitchen' | 'geofence' | 'menu'
  const [adminTab, setAdminTab] = useState<'analytics' | 'kitchen' | 'geofence' | 'menu'>('analytics');

  // Customer Filter Category
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'drink' | 'snack'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // App & Restaurant configurations
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig>({
    name: "KedaiKami",
    address: "Kantin ITEBA",
    latitude: -6.1952,
    longitude: 106.8208,
    geofenceRadiusMeters: 100
  });

  // User simulated GPS state
  const [userLat, setUserLat] = useState<number>(-6.19522); // Default is near the restaurant
  const [userLng, setUserLng] = useState<number>(106.82081);
  const [userLocationLabel, setUserLocationLabel] = useState<string>("Meja 03 (Dalam Kedai)");
  const [scannedTableNo, setScannedTableNo] = useState<string | null>("T-03");

  // Server data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<KitchenNotification[]>([]);
  const [stats, setStats] = useState<RealtimeStats>({
    todaySales: 0,
    todayOrdersCount: 0,
    averageTransaction: 0,
    activeOrdersCount: 0
  });

  // User inputs / checkout states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'pickup'>('dine-in');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'ewallet' | 'card' | 'cash'>('qris');
  const [cartItemNotes, setCartItemNotes] = useState<{ [key: string]: string }>({});

  // Loading States and feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successfulOrder, setSuccessfulOrder] = useState<Order | null>(null);
  const [showQRISModal, setShowQRISModal] = useState<boolean>(false);
  const [activeNotificationCount, setActiveNotificationCount] = useState<number>(0);

  // Admin and Inventory controls UI
  const [isAddingMenu, setIsAddingMenu] = useState<boolean>(false);
  const [editMenuItem, setEditMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [editingConfig, setEditingConfig] = useState<RestaurantConfig | null>(null);
  const [isRadarExpanded, setIsRadarExpanded] = useState<boolean>(false);

  // Easter egg / hidden Admin portal lock mechanisms
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [logoClicks, setLogoClicks] = useState<number>(0);

  // Google Maps link encoder string input in Admin panel
  const [gmapsInputText, setGmapsInputText] = useState<string>('');
  const [gmapsParseFeedback, setGmapsParseFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Initialize and Fetch
  useEffect(() => {
    fetchInitialData();
    // Setup automated interval to refresh real-time kitchen & statistics every 4 seconds
    const interval = setInterval(() => {
      refreshRealtimeData();
    }, 4000);

    // Read query params for secret bypass
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('role') === 'admin') {
      setIsAdminUnlocked(true);
      setUserRole('admin');
    }

    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);
    if (nextCount >= 5) {
      setLogoClicks(0);
      setPinInput('');
      setPinError(null);
      setShowPinModal(true);
    }
  };

  // Recalculate badge notification on order updates
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setActiveNotificationCount(unread);
  }, [notifications]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [configRes, menuRes, ordersRes, notificationsRes, statsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/stats')
      ]);

      if (configRes.ok) setRestaurantConfig(await configRes.json());
      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Gagal memuat data dari Express backend server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRealtimeData = async () => {
    try {
      const [menuRes, ordersRes, notificationsRes, statsRes] = await Promise.all([
        fetch('/api/menu'),
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/stats')
      ]);

      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.warn("Koneksi real-time terhambat latar belakang:", err);
    }
  };

  // Helper compute distance
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const userDistance = getDistanceMeters(userLat, userLng, restaurantConfig.latitude, restaurantConfig.longitude);
  const isWithinGeofence = userDistance <= restaurantConfig.geofenceRadiusMeters;

  // Handle Add/Edit Menu item
  const saveMenuItemHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMenuItem) return;

    if (editMenuItem.price === undefined || isNaN(editMenuItem.price)) {
      alert("Harap masukkan harga hidangan yang valid!");
      return;
    }

    if (editMenuItem.stock === undefined || isNaN(editMenuItem.stock)) {
      alert("Harap masukkan jumlah stok/batch hidangan yang valid!");
      return;
    }

    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMenuItem)
      });
      if (response.ok) {
        setIsAddingMenu(false);
        setEditMenuItem(null);
        await refreshRealtimeData();
        alert("Menu berhasil disimpan!");
      } else {
        const errData = await response.json().catch(() => ({}));
        alert("Gagal menyimpan menu: " + (errData.error || response.statusText || "Internal Server Error"));
      }
    } catch (err) {
      alert("Gagal menyimpan menu: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteMenuItemHandler = async (id: string) => {
    if (!confirm("Apakah Anda yakin mau menghapus menu ini dari daftar hidangan restoran?")) return;
    try {
      const response = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await refreshRealtimeData();
        alert("Menu berhasil dihapus!");
      } else {
        const errData = await response.json().catch(() => ({}));
        alert("Gagal menghapus menu: " + (errData.error || response.statusText || "Internal Server Error"));
      }
    } catch (err) {
      alert("Gagal menghapus menu: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Save Restaurant GPS Config
  const saveConfigHandler = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const configToSave = editingConfig || restaurantConfig;

    if (
      isNaN(configToSave.latitude) || 
      isNaN(configToSave.longitude) || 
      isNaN(configToSave.geofenceRadiusMeters)
    ) {
      alert("Harap masukkan koordinat latitude, longitude, dan radius dalam angka yang valid!");
      return;
    }

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      if (response.ok) {
        setRestaurantConfig(configToSave);
        setEditingConfig(null);
        alert("Konfigurasi Titik Lokasi KedaiKami berhasil disimpan!");
      }
    } catch (err) {
      alert("Gagal memperbarui konfigurasi.");
    }
  };

  // Update order status
  const updateOrderStatusHandler = async (orderId: string, status?: Order['status'], paymentStatus?: Order['paymentStatus']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus })
      });
      if (response.ok) {
        await refreshRealtimeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear notify alert list
  const clearNotificationsHandler = async () => {
    try {
      const response = await fetch('/api/notifications', { method: 'DELETE' });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all alert notifications as read
  const markNotificationsAsReadHandler = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      await refreshRealtimeData();
    } catch (err) {
      console.error(err);
    }
  };

  // Shopping Cart calculations & triggers
  const addToCartHandler = (menuItemId: string) => {
    const item = menuItems.find(m => m.id === menuItemId);
    if (!item) return;

    const countInCart = cart.find(c => c.menuItemId === menuItemId)?.quantity || 0;
    if (item.stock <= countInCart) {
      alert(`Mohon maaf! Stok ${item.name} saat ini tersisa ${item.stock} porsi.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId);
      if (existing) {
        return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId, quantity: 1, priceAtOrder: item.price }];
    });
  };

  const updateCartQtyHandler = (menuItemId: string, amount: number) => {
    const item = menuItems.find(m => m.id === menuItemId);
    if (!item) return;

    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId);
      if (!existing) return prev;

      const newQty = existing.quantity + amount;
      if (newQty <= 0) {
        return prev.filter(c => c.menuItemId !== menuItemId);
      }

      if (newQty > item.stock) {
        alert(`Batas maksimal stok (${item.stock} porsi) telah tercapai.`);
        return prev;
      }

      return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: newQty } : c);
    });
  };

  const removeFromCartHandler = (menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
  const tax = Math.round(subtotal * 0.1); // PPN 10%
  const totalBill = subtotal + tax;

  // Checkout submission
  const handleCheckoutHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (cart.length === 0) {
      setSubmitError("Keranjang belanja Anda masih kosong.");
      return;
    }

    if (!customerName.trim()) {
      setSubmitError("Silakan isi Nama Pelanggan terlebih dahulu.");
      return;
    }

    if (!customerPhone.trim()) {
      setSubmitError("Silakan isi Nomor Telepon Pelanggan.");
      return;
    }

    const payload = {
      items: cart.map(c => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        notes: cartItemNotes[c.menuItemId] || ''
      })),
      orderType,
      tableNo: orderType === 'dine-in' ? (scannedTableNo || 'Meja Umum') : undefined,
      paymentMethod,
      customerName,
      customerPhone,
      latitude: userLat,
      longitude: userLng
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || "Gagal membuat pesanan.");
        return;
      }

      // Success
      setSuccessfulOrder(result.order);
      setCart([]);
      setCartItemNotes({});
      
      if (paymentMethod !== 'cash') {
        setShowQRISModal(true);
      } else {
        alert(`Pesanan berhasil dibuat! Silakan bayar tunai di Kasir senilai Rp ${totalBill.toLocaleString('id-ID')}`);
      }
      
      await refreshRealtimeData();
    } catch (err) {
      setSubmitError("Gagal mengirim pesanan ke server. Coba lagi.");
    }
  };

  // Google Maps Link Parser Engine
  const parseGmapsUrlOrCoordinates = (input: string) => {
    setGmapsParseFeedback(null);
    if (!input.trim()) {
      setGmapsParseFeedback({ success: false, msg: "Kolom input kosong. Silakan tempel link/kordinat terlebih dahulu." });
      return;
    }

    // Attempt 1: Raw numbers match "latitude, longitude"
    // e.g: -6.19522, 106.82081 or -6.19522 106.82081
    const rawCoordsRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const matchRaw = input.match(rawCoordsRegex);
    if (matchRaw) {
      const lat = parseFloat(matchRaw[1]);
      const lng = parseFloat(matchRaw[2]);
      applyParsedCoords(lat, lng, "menguraikan kordinat mentah");
      return;
    }

    // Attempt 2: Match URL containing coordinates preceded by '@'
    // e.g. https://www.google.com/maps/@-6.1952000,106.8208000,17z
    const atCoordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchAt = input.match(atCoordsRegex);
    if (matchAt) {
      const lat = parseFloat(matchAt[1]);
      const lng = parseFloat(matchAt[2]);
      applyParsedCoords(lat, lng, "link Google Maps (@-pattern)");
      return;
    }

    // Attempt 3: Match URL containing query query params "q=lat,lng" or "query=lat,lng"
    const queryCoordsRegex = /[?&](q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchQuery = input.match(queryCoordsRegex);
    if (matchQuery) {
      const lat = parseFloat(matchQuery[2]);
      const lng = parseFloat(matchQuery[3]);
      applyParsedCoords(lat, lng, "link Google Maps (query-pattern)");
      return;
    }

    // Attempt 4: Standard DMS format conversion (or general coordinates check inside simple links)
    const generalMapRegex = /search\/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const matchGen = input.match(generalMapRegex);
    if (matchGen) {
      const lat = parseFloat(matchGen[1]);
      const lng = parseFloat(matchGen[2]);
      applyParsedCoords(lat, lng, "link Google Maps Search");
      return;
    }

    // For shortened links maps.app.goo.gl, explain to the user:
    setGmapsParseFeedback({ 
      success: false, 
      msg: "Format tidak didukung. Untuk maps.app.goo.gl rawan terpotong, silakan salin kordinat mentah (contoh: -6.1952, 106.8208) lewat sentuh tahan pin di Google Maps." 
    });
  };

  const applyParsedCoords = (lat: number, lng: number, sourceName: string) => {
    // Validate boundaries
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGmapsParseFeedback({ success: false, msg: `Angka kordinat (${lat}, ${lng}) berada di luar batas bumi.` });
      return;
    }

    if (editingConfig) {
      setEditingConfig(prev => ({
        ...prev!,
        latitude: lat,
        longitude: lng
      }));
    } else {
      setEditingConfig({
        ...restaurantConfig,
        latitude: lat,
        longitude: lng
      });
    }

    setGmapsParseFeedback({ 
      success: true, 
      msg: `Berhasil mengekstrak dari ${sourceName}! Kordinat diubah menjadi Lat: ${lat}, Lng: ${lng}. Silakan klik SIMPAN di bawah.` 
    });
  };

  // Filtered Menu List
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedBestseller = [...menuItems].sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="kedai-kami-app">
      
      {/* Top sticky switcher bar (extremely tidy role selector) */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-emerald-800 shrink-0 shadow-md">
        <div 
          className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent"
          onClick={handleLogoClick}
          title="Klik 5 kali untuk membuka pintu akses admin"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-105 hover:rotate-6 transition-transform select-none border border-emerald-500/25">
            <ChefHat className="w-5.5 h-5.5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 leading-none select-none">
              KedaiKami <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Pintar</span>
            </h1>
            <p className="text-[11px] text-emerald-250 mt-1 font-medium select-none">Validasi Geofencing & Pemesanan Instan</p>
          </div>
        </div>

        {/* Beautiful responsive Switcher button - ONLY visible if admin is authorized */}
        {isAdminUnlocked ? (
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 w-full sm:w-auto">
            <button
              id="role-btn-customer"
              onClick={() => {
                setUserRole('pelanggan');
                setCustomerTab('order');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRole === 'pelanggan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-350 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Tampilan Pelanggan
            </button>
            <button
              id="role-btn-admin"
              onClick={() => {
                setUserRole('admin');
                setAdminTab('analytics');
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userRole === 'admin'
                  ? 'bg-slate-950 text-emerald-400 border border-emerald-500/20 font-black'
                  : 'text-slate-350 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-500" />
              Tampilan Admin
            </button>
            <button
              onClick={() => {
                setIsAdminUnlocked(false);
                setUserRole('pelanggan');
                alert("Panel Admin telah dikunci kembali dengan aman.");
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
              title="Kunci Akses Admin (Lock)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[10.5px] font-bold text-emerald-450 bg-emerald-950/45 px-3.5 py-2 border border-emerald-800/35 rounded-xl select-none leading-none tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Menu Digital Terproteksi • Sandi Aktif
          </div>
        )}
      </div>

      {/* Global alert banner for Errors */}
      {submitError && (
        <div className="bg-red-600 text-white text-center py-3 px-4 font-bold text-xs tracking-wide z-50 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          <span>PROSES GAGAL: {submitError}</span>
          <button onClick={() => setSubmitError(null)} className="ml-4 hover:opacity-85 text-xs underline">[Tutup]</button>
        </div>
      )}

      {/* Workspace split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ======================================================== */}
        {/* TAMPILAN 1: PELANGGAN (CUSTOMER WORKSPACE)               */}
        {/* ======================================================== */}
        {userRole === 'pelanggan' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
            
            {/* Left listings */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              
              {/* Elegant Accent Welcome Card with gradient flair */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg text-white">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                    <Compass className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                      Selamat Datang di {restaurantConfig.name} <span className="text-[9.5px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">Kantin ITEBA</span>
                    </h2>
                    <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                      {restaurantConfig.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2.5 bg-slate-950/40 px-3 py-2 rounded-2xl border border-slate-800/60 shadow-inner">
                    <div className="text-left leading-none">
                      <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Geofence Status</span>
                      <span className="text-[10.5px] font-black text-slate-200 mt-0.5 block">
                        {isWithinGeofence ? '✓ Area Kedai' : '⚠️ Jarak Terlalu Jauh'}
                      </span>
                    </div>
                    <span className={`relative flex h-2.5 w-2.5 mb-0.5`}>
                      {isWithinGeofence && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isWithinGeofence ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    </span>
                  </div>

                  {/* Beautiful Collapsible Toggle Button */}
                  <button
                    id="btn-toggle-radar-gps"
                    onClick={() => setIsRadarExpanded(!isRadarExpanded)}
                    title="Atur Simulasi GPS & Scan Meja"
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isRadarExpanded 
                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-md hover:bg-emerald-450' 
                        : 'bg-slate-850 hover:bg-slate-800 text-white border-slate-750 hover:border-slate-700 hover:shadow-md active:scale-95'
                    }`}
                  >
                    <Compass className={`w-4 h-4 ${isRadarExpanded ? 'animate-spin' : ''} text-emerald-400`} />
                    <span>{isRadarExpanded ? 'Tutup GPS Radar' : 'Simulasi GPS & QR Meja'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Radar & GPS Simulator Section */}
              <div 
                className={`transition-all duration-350 ease-in-out overflow-hidden ${
                  isRadarExpanded 
                    ? 'max-h-[850px] mb-6 opacity-100 transform scale-100' 
                    : 'max-h-0 opacity-0 mb-0 pointer-events-none scale-98 invisible'
                }`}
              >
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-dashed border-emerald-500/30">
                  <div className="flex items-center justify-between mb-3 text-xs border-b border-slate-200/60 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      Simulator Koordinat & Scan QR Meja
                    </span>
                    <button 
                      onClick={() => setIsRadarExpanded(false)} 
                      className="text-slate-500 hover:text-red-650 text-[10.5px] font-extrabold cursor-pointer"
                    >
                      [Sembunyikan]
                    </button>
                  </div>
                  <GeofenceSimulator 
                    config={restaurantConfig} 
                    userLat={userLat} 
                    userLng={userLng} 
                    onLocationChange={(lat, lng, label) => {
                      setUserLat(lat);
                      setUserLng(lng);
                      setUserLocationLabel(label);
                    }}
                    scannedTable={scannedTableNo}
                    onScanTable={(tableNo) => setScannedTableNo(tableNo)}
                  />
                </div>
              </div>

              {/* Locked warning banner */}
              {!isWithinGeofence && orderType === 'dine-in' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-950">Geofencing: Dine-In Makan Sini Terkunci!</h4>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                      Wajib berada di area kedai (maks <span className="font-bold">{restaurantConfig.geofenceRadiusMeters}m</span>) untuk Dine-In guna menjamin kenyamanan operasional dan menghindari order palsu. Jarak Anda sekarang {userDistance.toLocaleString('id-ID')}m. Silakan ubah ke <span className="font-extrabold underline cursor-pointer" onClick={() => setOrderType('pickup')}>Bawa Pulang (Pick-Up)</span> atau gunakan simulator di atas.
                    </p>
                  </div>
                </div>
              )}

              {/* Beautiful Local Promo banner with green highlights */}
              <div className="bg-gradient-to-br from-emerald-905 from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 relative overflow-hidden shadow-xl border border-emerald-500/20">
                <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-teal-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                <div className="absolute right-6 bottom-6 pointer-events-none opacity-15 hidden sm:block">
                  <Utensils className="w-40 h-40 text-emerald-300 transform rotate-12" />
                </div>
                <div className="relative z-10 max-w-xl">
                  <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3" />
                    KULINER DIGITAL MAHASISWA & DOSEN
                  </span>
                  <h2 className="text-xl sm:text-3.5xl font-black tracking-tight mt-4 text-white leading-none">
                    Pesan Praktis di <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Kantin ITEBA</span>
                  </h2>
                  <p className="text-slate-350 text-xs sm:text-sm mt-3 leading-relaxed font-medium">
                    Nikmati kemudahan pesan makanan & minuman langsung dari meja belajar atau kelas Anda. Tanpa antre lama, otomatisasi geofence, dan konfirmasi instan via sistem terpantau dapur.
                  </p>
                  
                  {/* Fun feature tags inside banner */}
                  <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400 font-extrabold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                      ⚡ Bebas Antrean
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-teal-400 font-extrabold bg-teal-500/5 px-2.5 py-1 rounded-lg border border-teal-500/10">
                      📍 Geofence Aman
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-amber-405 text-amber-300 font-extrabold bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                      📱 Bayar Barcode QRIS
                    </div>
                  </div>
                </div>
              </div>

              {/* Beautiful, responsive tab selector & Search bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
                
                {/* Categorization tabs */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                  <button
                    id="btn-category-all"
                    onClick={() => setCategoryFilter('all')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      categoryFilter === 'all' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-600 hover:text-emerald-750 hover:bg-white/60'
                    }`}
                  >
                    🍽️ Semua Menu
                  </button>
                  <button
                    id="btn-category-food"
                    onClick={() => setCategoryFilter('food')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      categoryFilter === 'food' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Makanan Utama
                  </button>
                  <button
                    id="btn-category-drink"
                    onClick={() => setCategoryFilter('drink')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      categoryFilter === 'drink' 
                        ? 'bg-sky-650 bg-sky-600 text-white shadow-md' 
                        : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
                    }`}
                  >
                    <CupSoda className="w-3.5 h-3.5" />
                    Minuman Segar
                  </button>
                  <button
                    id="btn-category-snack"
                    onClick={() => setCategoryFilter('snack')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      categoryFilter === 'snack' 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
                    }`}
                  >
                    🍿 Cemilan Gurih
                  </button>
                </div>

                {/* Search input field */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="menu-search-input"
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Cari makanan & minuman..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid Menu items list view */}
              {filteredMenu.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
                  <p className="text-slate-400 text-xs">Pencarian '{searchQuery}' tidak ditemukan.</p>
                  <button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} className="mt-4 text-xs text-emerald-600 font-bold hover:underline">
                    Reset Filter Pencarian
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" id="menu-items-grid">
                  {filteredMenu.map((item) => {
                    const qtyInCart = cart.find(c => c.menuItemId === item.id)?.quantity || 0;
                    
                    // Categorization label & color mapping
                    let categoryLabel = 'Sajian';
                    let categoryBadgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
                    if (item.category === 'food') {
                      categoryLabel = '🍛 Makanan Utama';
                      categoryBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
                    } else if (item.category === 'drink') {
                      categoryLabel = '🍹 Minuman Segar';
                      categoryBadgeClass = 'bg-sky-50 text-sky-800 border-sky-200/60';
                    } else if (item.category === 'snack') {
                      categoryLabel = '🍿 Cemilan Gurih';
                      categoryBadgeClass = 'bg-amber-50 text-amber-805 text-amber-900 border-amber-200/60';
                    } else if (item.category === 'dessert') {
                      categoryLabel = '🍰 Pencuci Mulut';
                      categoryBadgeClass = 'bg-pink-50 text-pink-805 text-pink-900 border-pink-200/60';
                    }

                    // Stock urgency coloring
                    const isLowStock = item.stock > 0 && item.stock <= 10;
                    
                    return (
                      <div 
                        id={`menu-card-${item.id}`}
                        key={item.id} 
                        className={`bg-white rounded-3xl border transition-all duration-350 overflow-hidden group flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl ${
                          qtyInCart > 0 
                            ? 'ring-3 ring-emerald-600 border-emerald-600 shadow-md transform scale-[1.01]' 
                            : 'border-slate-100 shadow-xs hover:border-emerald-300'
                        }`}
                      >
                        <div className="relative">
                          {/* Rich Image section with zoom effect */}
                          <div className="relative h-44 bg-slate-50 overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=450&q=80";
                              }}
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Tags overlay */}
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                              {item.popular && (
                                <span className="bg-amber-500 text-slate-950 font-black text-[9px] py-1 px-2.5 rounded-full uppercase tracking-wider shadow-md border border-amber-400 flex items-center gap-0.5 animate-pulse">
                                  ★ FAVORIT KEDAI
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${categoryBadgeClass}`}>
                                {categoryLabel}
                              </span>
                            </div>

                            {(!item.isAvailable || item.stock <= 0) && (
                              <div className="absolute inset-0 bg-slate-950/80 text-white text-[11px] font-black flex items-center justify-center uppercase tracking-widest backdrop-blur-xs">
                                🚫 Sold Out / Habis Hari Ini
                              </div>
                            )}
                          </div>

                          {/* Simplified Creative Content Area (NO description as requested) */}
                          <div className="p-4 sm:p-5 space-y-3">
                            <h3 className="font-black text-sm sm:text-base text-slate-800 group-hover:text-emerald-700 transition-colors tracking-tight line-clamp-2 min-h-[2.5rem] leading-tight flex items-start">
                              {item.name}
                            </h3>

                            {/* Innovative stock indicator badge */}
                            <div className="pt-1">
                              {item.stock <= 0 ? (
                                <span className="inline-flex items-center text-[10.5px] bg-red-50 text-red-700 font-extrabold px-3 py-1 rounded-full border border-red-200/50">
                                  ● Stok Habis
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center text-[10.5px] bg-rose-50 text-rose-700 font-extrabold px-3 py-1 rounded-full border border-rose-200/50 animate-pulse">
                                  🔥 Sisa {item.stock} porsi tinggal dikit!
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10.5px] bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-100">
                                  ✨ Tersedia {item.stock} porsi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Premium footer styling */}
                        <div className="p-4 sm:px-5 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                          <div>
                            <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider leading-none">Harga</span>
                            <span className="text-sm sm:text-base font-black text-slate-800">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Instant Order Actions */}
                          {(!item.isAvailable || item.stock <= 0) ? (
                            <button 
                              disabled 
                              className="px-4 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-300/30"
                            >
                              Habis
                            </button>
                          ) : qtyInCart > 0 ? (
                            <div className="flex items-center gap-2 bg-emerald-600 border border-emerald-500 rounded-xl p-0.5 shadow-md shadow-emerald-700/10" id={`quantity-control-${item.id}`}>
                              <button
                                id={`btn-dec-qty-${item.id}`}
                                onClick={() => updateCartQtyHandler(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-white px-2 min-w-[15px] text-center select-none">{qtyInCart}</span>
                              <button
                                id={`btn-inc-qty-${item.id}`}
                                onClick={() => updateCartQtyHandler(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center font-black text-lg transition-all active:scale-95 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-add-to-cart-${item.id}`}
                              onClick={() => addToCartHandler(item.id)}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                            >
                              <span>Pesan Sekarang</span>
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shopping Cart Drawer sidebar on the right */}
            <div id="shopping-cart-sidebar" className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between shrink-0 h-auto lg:h-[calc(100vh-65px)] overflow-hidden">
              
              {/* Cart Header */}
              <div className="p-4 sm:p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    Keranjang Belanja
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {orderType === 'dine-in' ? `Dine-In • Meja ${scannedTableNo || 'Pilih QR'}` : 'Pick-Up • Ambil Sendiri'}
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-1 rounded-full">
                  {cart.reduce((sum, c) => sum + c.quantity, 0)} Porsi
                </span>
              </div>

              {/* Cart rows */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                    <p className="text-[11px] font-bold">Belum ada hidangan yang dipesan.</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[220px]">Pilih beberapa kudapan/minuman segar untuk dinikmati.</p>
                  </div>
                ) : (
                  cart.map((cartItem) => {
                    const menu = menuItems.find(m => m.id === cartItem.menuItemId);
                    if (!menu) return null;
                    return (
                      <div id={`cart-row-${cartItem.menuItemId}`} key={cartItem.menuItemId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                        <div className="flex gap-2.5">
                          <img 
                            src={menu.image} 
                            alt={menu.name} 
                            className="w-10 h-10 object-cover rounded-md bg-slate-200 shrink-0 self-start"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{menu.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-emerald-800 font-bold">
                                Rp {(menu.price * cartItem.quantity).toLocaleString('id-ID')}
                              </span>
                              
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
                                <button
                                  id={`cart-dec-btn-${cartItem.menuItemId}`}
                                  onClick={() => updateCartQtyHandler(cartItem.menuItemId, -1)}
                                  className="w-5 h-5 hover:bg-slate-100 text-slate-600 rounded flex items-center justify-center text-xs font-bold"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold text-slate-800 px-1">{cartItem.quantity}</span>
                                <button
                                  id={`cart-inc-btn-${cartItem.menuItemId}`}
                                  onClick={() => updateCartQtyHandler(cartItem.menuItemId, 1)}
                                  className="w-5 h-5 hover:bg-slate-100 text-slate-600 rounded flex items-center justify-center text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Note & Delete row button */}
                        <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Catatan:</span>
                          <input
                            id={`cart-note-input-${cartItem.menuItemId}`}
                            type="text"
                            placeholder="Pedas, tanpa es, sendok, dll."
                            className="w-full bg-white border border-slate-200 rounded py-0.5 px-2 text-[10px] focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            value={cartItemNotes[cartItem.menuItemId] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCartItemNotes(prev => ({ ...prev, [cartItem.menuItemId]: val }));
                            }}
                          />
                          <button 
                            id={`cart-remove-btn-${cartItem.menuItemId}`}
                            onClick={() => removeFromCartHandler(cartItem.menuItemId)}
                            className="text-slate-400 hover:text-red-650 p-1 shrink-0"
                            title="Hapus menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Checkout billing controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-250">
                <div className="space-y-1.5 mb-3.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN (10%)</span>
                    <span>Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-250 pt-2 text-sm font-black text-slate-900">
                    <span>TOTAL TAGIHAN</span>
                    <span className="text-emerald-700">Rp {totalBill.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleCheckoutHandler} className="space-y-3">
                    
                    {/* Method switch buttons */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-200/50 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setOrderType('dine-in');
                          if(!scannedTableNo) setScannedTableNo('T-03');
                        }}
                        className={`py-1 rounded font-bold text-[10px] text-center transition-all ${
                          orderType === 'dine-in'
                            ? 'bg-white text-emerald-800 shadow-xs'
                            : 'text-slate-600 hover:bg-white/30'
                        }`}
                      >
                        Makan Sini (Dine-In)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderType('pickup');
                          setScannedTableNo(null);
                        }}
                        className={`py-1 rounded font-bold text-[10px] text-center transition-all ${
                          orderType === 'pickup'
                            ? 'bg-white text-emerald-800 shadow-xs'
                            : 'text-slate-600 hover:bg-white/30'
                        }`}
                      >
                        Bawa Pulang (Pick-Up)
                      </button>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-500">Nama Pelanggan / No Meja</label>
                      <input
                        id="customer-name-field"
                        type="text"
                        required
                        placeholder="Ketik Nama Anda..."
                        className="bg-white border border-slate-200 w-full rounded-xl py-1.5 px-3 text-xs mt-1 focus:ring-1 focus:ring-emerald-500"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500">No. Telepon WA</label>
                        <input
                          id="customer-phone-field"
                          type="text"
                          required
                          placeholder="08123xxx"
                          className="bg-white border border-slate-200 w-full rounded-xl py-1.5 px-3 text-xs mt-1 focus:ring-1 focus:ring-emerald-500"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500">Metode Bayar</label>
                        <select
                          id="payment-method-select"
                          value={paymentMethod}
                          onChange={(e: any) => setPaymentMethod(e.target.value)}
                          className="bg-white border border-slate-200 w-full rounded-xl py-1.5 px-3 text-xs mt-1"
                        >
                          <option value="qris">Barcode QRIS</option>
                          <option value="ewallet">E-Wallet</option>
                          <option value="card">Kartu Debit</option>
                          <option value="cash">Bayar Kasir</option>
                        </select>
                      </div>
                    </div>

                    {orderType === 'dine-in' && (
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-150 flex items-center justify-between text-[11px] text-emerald-800">
                        <span>Nomor Meja Dine-In:</span>
                        <span className="font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded">
                          {scannedTableNo || 'Scan QR Dulu'}
                        </span>
                      </div>
                    )}

                    {/* Submit check button */}
                    <button
                      id="btn-confirm-checkout"
                      type="submit"
                      disabled={orderType === 'dine-in' && !isWithinGeofence}
                      className={`w-full py-3 rounded-xl font-bold text-xs shadow-md mt-2 tracking-wide text-center flex items-center justify-center gap-1.5 ${
                        orderType === 'dine-in' && !isWithinGeofence
                          ? 'bg-slate-300 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-100" />
                      <span>Kirim & Bayar Rp {totalBill.toLocaleString('id-ID')}</span>
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 2: ADMIN KEDAI (MERCHANT CONTROL CENTER)        */}
        {/* ======================================================== */}
        {userRole === 'admin' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full lg:h-[calc(100vh-66px)]">
            
            {/* Left Merchant Sidebar / Mini Nav */}
            <aside className="w-full lg:w-64 bg-slate-900 text-slate-250 lg:border-r border-slate-800 flex flex-row lg:flex-col shrink-0 overflow-y-auto lg:h-full">
              
              <div className="hidden lg:block p-5 border-b border-slate-850">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">ADMIN PORTAL</span>
                <strong className="text-white text-xs mt-1 block">Merchant KedaiKami</strong>
              </div>

              {/* Navigation links inside Admin Panel */}
              <nav className="flex flex-row lg:flex-col flex-1 p-2.5 gap-1 w-full overflow-x-auto lg:overflow-x-visible">
                <button
                  id="admin-nav-analytics"
                  onClick={() => setAdminTab('analytics')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap lg:w-full transition-all ${
                    adminTab === 'analytics'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <TrendingUp className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                  <span>Dashboard & Analitik</span>
                </button>

                <button
                  id="admin-nav-kitchen"
                  onClick={() => setAdminTab('kitchen')}
                  className={`flex items-center justify-between gap-1 px-3.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap lg:w-full transition-all ${
                    adminTab === 'kitchen'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                    <span>Layar Pesanan Dapur</span>
                  </div>
                  {activeNotificationCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold px-1.5 animate-pulse">
                      {activeNotificationCount}
                    </span>
                  )}
                </button>

                <button
                  id="admin-nav-geofence"
                  onClick={() => setAdminTab('geofence')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap lg:w-full transition-all ${
                    adminTab === 'geofence'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <MapPin className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                  <span>Lokasi GPS & Geofence</span>
                </button>

                <button
                  id="admin-nav-menu"
                  onClick={() => setAdminTab('menu')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap lg:w-full transition-all ${
                    adminTab === 'menu'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Utensils className="w-4.5 h-4.5 shrink-0 text-emerald-400" />
                  <span>Kelola Menu & Stok</span>
                </button>
              </nav>

              <div className="hidden lg:block mt-auto p-4 border-t border-slate-850">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-755 border-slate-700 text-[11px] text-slate-400">
                  <p className="font-bold text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Sistem Berjalan
                  </p>
                  <p className="mt-1 font-mono text-[9px]">Server: v3.5-Active</p>
                </div>
              </div>

            </aside>

            {/* Right workspace partition */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:h-full">
              
              {/* SUBTAB 1: ANALYTICS & STATS */}
              {adminTab === 'analytics' && (
                <div className="space-y-6">
                  
                  {/* Top Stats Banner */}
                  <div className="bg-emerald-950 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800 shadow-lg">
                    <div>
                      <span className="text-[10px] bg-emerald-800 text-emerald-100 font-extrabold px-2.5 py-0.5 rounded-lg uppercase">Real-time Stats</span>
                      <h2 className="text-lg font-black text-white mt-1.5">Metrik Arus Kas & Pesanan Real-time</h2>
                    </div>
                    <button 
                      onClick={refreshRealtimeData}
                      className="px-3 bg-slate-800 text-slate-205 py-2 hover:bg-slate-700 rounded-lg text-xs font-extrabold flex items-center gap-1.5 self-start text-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 fill-slate-50 text-emerald-400 animate-spin-slow" />
                      Segarkan Metrik
                    </button>
                  </div>

                  {/* Financial cards widget bento */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Omset Hari Ini</span>
                      <strong className="text-base sm:text-lg block mt-1.5 text-slate-900">
                        Rp {stats.todaySales.toLocaleString('id-ID')}
                      </strong>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Total Pengunjung</span>
                      <strong className="text-base sm:text-lg block mt-1.5 text-slate-900">
                        {stats.todayOrdersCount} Bill
                      </strong>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Rataan Keranjang</span>
                      <strong className="text-base sm:text-lg block mt-1.5 text-emerald-800">
                        Rp {Math.round(stats.averageTransaction).toLocaleString('id-ID')}
                      </strong>
                    </div>

                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Antrean Dapur</span>
                      <strong className="text-base sm:text-lg block mt-1.5 text-amber-600 flex items-center gap-1.5">
                        {stats.activeOrdersCount} Tiket
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                      </strong>
                    </div>
                  </div>

                  {/* Bestseller listings and system log */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Bestseller bar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-2">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Analitik Penjualan Produk Terpopuler
                      </h3>

                      <div className="space-y-4">
                        {sortedBestseller.slice(0, 5).map((item, index) => {
                          const totalItemSales = item.salesCount || 0;
                          const highestSales = sortedBestseller[0]?.salesCount || 1;
                          const percentageWidth = Math.round((totalItemSales / highestSales) * 100);

                          return (
                            <div key={item.id} className="text-xs">
                              <div className="flex justify-between font-bold text-slate-800 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">#{index+1}</span>
                                  {item.name}
                                </span>
                                <span className="text-emerald-700 font-extrabold">{totalItemSales} porsi terjual</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentageWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick helper list */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 col-span-1">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
                        Statistik Aliran Geofence
                      </h3>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Validasi silang GPS memitigasi transaksi fiktif atau pemesanan dine-in palsu dari jarak jauh.
                      </p>
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
                          <span>Radius Outlet Aktif:</span>
                          <strong>{restaurantConfig.geofenceRadiusMeters} m</strong>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <span>Jenis Geofencing:</span>
                          <strong className="text-emerald-700 uppercase">Haversine GPS</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 2: KITCHEN INCOMING ORDER PROCESS */}
              {adminTab === 'kitchen' && (
                <div className="space-y-6">
                  
                  {/* Quick Notifications panel */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
                    <div className="flex items-center gap-2 pt-1">
                      <Bell className="w-5 h-5 text-emerald-400 animate-swing" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">Daftar Notifikasi Masuk</h4>
                        <p className="text-[11px] text-slate-400">Koran digital bel bunyi saat pesanan masuk</p>
                      </div>
                    </div>
                    <button 
                      onClick={clearNotificationsHandler}
                      className="text-xs text-rose-400 hover:text-white hover:bg-rose-700 border border-rose-900 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Nyatakan Dibaca & Bersihkan
                    </button>
                  </div>

                  {/* Active Cook tickets */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <ChefHat className="text-emerald-600 w-4.5 h-4.5" />
                      Antrean Cetak Juru Masak ({orders.filter(o => o.status === 'pending' || o.status === 'processing').length} Tiket Aktif)
                    </h3>

                    {orders.filter(o => o.status === 'pending' || o.status === 'processing').length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                        <ChefHat className="w-12 h-12 text-slate-350 mx-auto mb-2" />
                        <p className="text-xs font-bold">Semua pesanan selesai disajikan. Dapur Anda bersih!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orders.filter(o => o.status === 'pending' || o.status === 'processing').map((order) => (
                          <div id={`kitchen-ticket-${order.id}`} key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-emerald-600 transition-colors">
                            <div className={`p-3 flex items-center justify-between ${order.status === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-white'}`}>
                              <div>
                                <span className="font-mono text-xs font-black">ID: {order.id}</span>
                                <span className="ml-2 text-[10px] bg-white/20 text-slate-100 px-1.5 rounded">
                                  {order.orderType === 'dine-in' ? `${order.tableNo}` : 'PICKUP'}
                                </span>
                              </div>
                              <span className="text-[9px] uppercase font-extrabold">
                                {order.orderType}
                              </span>
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="text-xs text-slate-500">
                                Nama: <span className="font-extrabold text-slate-800">{order.customerName}</span> ({order.customerPhone})
                                <p className="text-[10px] text-slate-400 mt-1">Order jam: {new Date(order.timestamp).toLocaleTimeString('id-ID')}</p>
                              </div>
                              <div className="h-px bg-slate-100" />
                              <div className="space-y-2">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded mr-1">
                                      {it.quantity}x
                                    </span>
                                    <span className="font-bold text-slate-850">{it.name}</span>
                                    {it.notes && (
                                      <p className="text-[10px] text-rose-600 bg-rose-50 p-1 rounded italic pl-5 mt-1">
                                        👉 "{it.notes}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="h-px bg-slate-150" />

                              <div className="flex gap-2">
                                {order.status === 'pending' ? (
                                  <button
                                    id={`btn-kitchen-process-${order.id}`}
                                    onClick={() => updateOrderStatusHandler(order.id, 'processing')}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                                  >
                                    Mulai Masak
                                  </button>
                                ) : (
                                  <button
                                    id={`btn-kitchen-complete-${order.id}`}
                                    onClick={() => updateOrderStatusHandler(order.id, 'completed', 'paid')}
                                    className="flex-1 py-2 bg-slate-900 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                                  >
                                    Selesai Saji (Siap)
                                  </button>
                                )}
                                <button
                                  id={`btn-kitchen-cancel-${order.id}`}
                                  onClick={() => updateOrderStatusHandler(order.id, 'cancelled')}
                                  className="px-2 py-2 text-rose-650 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* All orders database simple table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-xs font-black uppercase text-slate-500 mb-3 block">Semua Riwayat Pesanan Pasca Transaksi</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-extrabold">
                            <th className="py-2">Order ID</th>
                            <th className="py-2">Pelanggan</th>
                            <th className="py-2">Tipe</th>
                            <th className="py-2">Total Harga</th>
                            <th className="py-2">Status Masak</th>
                            <th className="py-2">Status Bayar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((ord) => (
                            <tr key={ord.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="py-2.5 font-mono font-bold text-slate-900">{ord.id}</td>
                              <td className="py-2.5 font-bold text-slate-800">{ord.customerName}</td>
                              <td className="py-2.5 uppercase">{ord.orderType}</td>
                              <td className="py-2.5 font-extrabold text-emerald-800">Rp {ord.totalAmount.toLocaleString('id-ID')}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                                  ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  ord.status === 'processing' ? 'bg-purple-150 text-purple-800' :
                                  ord.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {ord.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 3: COORDINATES & GEOFENCING CONFIGURATION */}
              {adminTab === 'geofence' && (
                <div className="space-y-6">
                  
                  {/* Intro card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-5 h-5 text-emerald-700" />
                      Setting Titik Kordinat GPS Outlet KedaiKami
                    </h3>
                    <p className="text-xs text-slate-650 mt-1 pb-2 leading-relaxed">
                      Sistem validasi Dapur menghitung jarak Haversine instan dari geolokasi pembeli ke titik kordinat kedai di bawah ini. Pastikan kordinat akurat agar Dine-in berfungsi dengan baik.
                    </p>
                  </div>

                  {/* Cara Praktis: Google Maps Decoder Box */}
                  <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-800 shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">💡 Cara Pintar: Tempel Link / Kordinat Google Maps</h4>
                        <p className="text-[11px] text-emerald-250 mt-0.5">Sistem akan mengekstrak otomatis angka latitude dan longitude tanpa harus mengetik manual.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        id="input-gmaps-link"
                        rows={2}
                        className="w-full bg-slate-900/90 border border-emerald-800/80 rounded-xl p-3 text-xs text-white placeholder-emerald-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                        placeholder="Tempel link share di sini (contoh: https://www.google.com/maps/place/-6.1952,106.8208 atau https://www.google.com/maps/@-6.1952,106.8208,17z)"
                        value={gmapsInputText}
                        onChange={(e) => setGmapsInputText(e.target.value)}
                      />
                      
                      <button
                        id="btn-extract-gmaps"
                        type="button"
                        onClick={() => parseGmapsUrlOrCoordinates(gmapsInputText)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-[11px] text-white rounded-xl shadow-xs transition-colors"
                      >
                        Dekode & Terapkan Kordinat
                      </button>
                    </div>

                    {/* Feedback badge */}
                    {gmapsParseFeedback && (
                      <div className={`p-3 rounded-xl text-xs font-bold ${gmapsParseFeedback.success ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-500/30' : 'bg-red-900/70 text-red-200 border border-red-500/25'}`}>
                        {gmapsParseFeedback.msg}
                      </div>
                    )}

                    {/* How to copy explanation */}
                    <div className="text-[10px] text-emerald-300 leading-normal p-3 bg-slate-900/40 rounded-xl space-y-1">
                      <p className="font-extrabold text-white uppercase tracking-wider">CARA MENDAPATKAN LINK DI HP / PC:</p>
                      <p>1. Buka aplikasi Google Maps, cari lokasi kedai Anda.</p>
                      <p>2. Sentuh dan tahan peta sampai muncul pin merah ("Dropped Pin").</p>
                      <p>3. Di bagian bawah terdapat kordinat (Lat, Lng) misal "-6.123, 106.456" - silakan salin kordinat/link share-nya dan tempel di kotak atas.</p>
                    </div>
                  </div>

                  {/* Manual input settings */}
                  <form onSubmit={saveConfigHandler} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Input Parameter Geofencing Manual</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">LATITUDE KEDAI</label>
                        <input
                          id="input-config-lat"
                          type="number"
                          step="any"
                          required
                          className="bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-lg w-full font-mono font-bold mt-1"
                          value={
                            editingConfig 
                              ? (isNaN(editingConfig.latitude) ? '' : editingConfig.latitude) 
                              : (isNaN(restaurantConfig.latitude) ? '' : restaurantConfig.latitude)
                          }
                          onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                            if (editingConfig) {
                              setEditingConfig(p => ({ ...p!, latitude: val }));
                            } else {
                              setEditingConfig({ ...restaurantConfig, latitude: val });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">LONGITUDE KEDAI</label>
                        <input
                          id="input-config-lng"
                          type="number"
                          step="any"
                          required
                          className="bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-lg w-full font-mono font-bold mt-1"
                          value={
                            editingConfig 
                              ? (isNaN(editingConfig.longitude) ? '' : editingConfig.longitude) 
                              : (isNaN(restaurantConfig.longitude) ? '' : restaurantConfig.longitude)
                          }
                          onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseFloat(e.target.value);
                            if (editingConfig) {
                              setEditingConfig(p => ({ ...p!, longitude: val }));
                            } else {
                              setEditingConfig({ ...restaurantConfig, longitude: val });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400">RADIUS BATAS GEOFENCE (Meter)</label>
                        <input
                          id="input-config-radius"
                          type="number"
                          required
                          className="bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-lg w-full font-mono font-bold mt-1"
                          value={
                            editingConfig 
                              ? (isNaN(editingConfig.geofenceRadiusMeters) ? '' : editingConfig.geofenceRadiusMeters) 
                              : (isNaN(restaurantConfig.geofenceRadiusMeters) ? '' : restaurantConfig.geofenceRadiusMeters)
                          }
                          onChange={(e) => {
                            const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                            if (editingConfig) {
                              setEditingConfig(p => ({ ...p!, geofenceRadiusMeters: val }));
                            } else {
                              setEditingConfig({ ...restaurantConfig, geofenceRadiusMeters: val });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <span className="block text-[9px] text-slate-400 uppercase font-black">Status Titik Kedai Saat Ini:</span>
                      <strong className="text-slate-800 text-[11px] block mt-1 leading-normal font-mono">
                        Latitude: {restaurantConfig.latitude} • Longitude: {restaurantConfig.longitude} • Radius: {restaurantConfig.geofenceRadiusMeters} meter
                      </strong>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="btn-save-config"
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Simpan Titik Posisi Baru
                      </button>
                      <button
                        id="btn-cancel-config"
                        type="button"
                        onClick={() => {
                          setEditingConfig(null);
                          setGmapsParseFeedback(null);
                          setGmapsInputText('');
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-xs font-bold"
                      >
                        Batal / Reset
                      </button>
                    </div>
                  </form>

                  {/* Preset Locations Buttons (Cara lain yang sangat praktis) */}
                  <div className="bg-white border border-slate-205 border-slate-200 rounded-2xl p-5">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5">💡 Pintasan Lokasi Indonesia (Presets Pintas)</h4>
                    <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed">Pilih salah satu pintasan di bawah untuk memposisikan kedai Anda secara instan ke koordinat pusat keramaian:</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const preset = { lat: -6.2163, lng: 106.8290 }; // Kuningan
                          applyParsedCoords(preset.lat, preset.lng, "Pintasan Kuningan CBD");
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-350 rounded-xl text-left text-xs transition-all"
                      >
                        <span className="font-extrabold block text-slate-800">Kuningan CBD</span>
                        <span className="text-[9px] text-slate-500">-6.2163, 106.8290</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const preset = { lat: -6.1952, lng: 106.8208 }; // Bunderan HI
                          applyParsedCoords(preset.lat, preset.lng, "Pintasan Bundaran HI");
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-350 rounded-xl text-left text-xs transition-all"
                      >
                        <span className="font-extrabold block text-slate-800">Bundaran HI</span>
                        <span className="text-[9px] text-slate-500">-6.1952, 106.8208</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const preset = { lat: -6.9025, lng: 107.6188 }; // Gedung Sate
                          applyParsedCoords(preset.lat, preset.lng, "Pintasan Gedung Sate");
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-350 rounded-xl text-left text-xs transition-all"
                      >
                        <span className="font-extrabold block text-slate-800">Gedung Sate Bdg</span>
                        <span className="text-[9px] text-slate-500">-6.9025, 107.6188</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const preset = { lat: -7.2625, lng: 112.7383 }; // Tp Sby
                          applyParsedCoords(preset.lat, preset.lng, "Pintasan Tunjungan Plaza");
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-350 rounded-xl text-left text-xs transition-all"
                      >
                        <span className="font-extrabold block text-slate-800">Tunjungan Sby</span>
                        <span className="text-[9px] text-slate-500">-7.2625, 112.7383</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* SUBTAB 4: MENU & INVENTORY STOCK MANAGEMENT */}
              {adminTab === 'menu' && (
                <div className="space-y-6">
                  
                  {/* Title Bar and trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Kelola Daftar Menu Hidangan</h3>
                      <p className="text-xs text-slate-500">Edit harga, stok, ketersediaan, atau tambah rilis menu baru.</p>
                    </div>
                    <button
                      id="btn-add-menu-inventory"
                      onClick={() => {
                        setEditMenuItem({
                          name: '',
                          description: '',
                          price: 15000,
                          category: 'food',
                          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
                          stock: 30,
                          isAvailable: true,
                          popular: false
                        });
                        setIsAddingMenu(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Menu Baru
                    </button>
                  </div>

                  {/* Create or Edit dynamic Form Container */}
                  {(isAddingMenu && editMenuItem) && (
                    <form onSubmit={saveMenuItemHandler} className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          {editMenuItem.id ? "Edit Menu Hidangan" : "Formulir Menu Hidangan Baru"}
                        </h4>
                        <button type="button" onClick={() => { setIsAddingMenu(false); setEditMenuItem(null); }} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold">Nama Hidangan</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-slate-800 border border-slate-755 border-slate-700 rounded-lg p-2.5 mt-1 text-white"
                            value={editMenuItem.name || ''}
                            onChange={(e) => setEditMenuItem(p => ({ ...p!, name: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold">Kategori</label>
                            <select
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1 text-white"
                              value={editMenuItem.category || 'food'}
                              onChange={(e: any) => setEditMenuItem(p => ({ ...p!, category: e.target.value }))}
                            >
                              <option value="food">Makanan</option>
                              <option value="drink">Minuman</option>
                              <option value="snack">Cemilan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold">Harga Jual (Rp)</label>
                            <input
                              type="number"
                              required
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1 text-white"
                              value={editMenuItem.price === undefined || isNaN(editMenuItem.price) ? '' : editMenuItem.price}
                              onChange={(e) => setEditMenuItem(p => ({ ...p!, price: e.target.value === '' ? NaN : parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-bold">Foto Hidangan</label>
                          <div className="mt-1 space-y-2">
                            {/* URL Text Input */}
                            <input
                              type="text"
                              placeholder="Masukkan URL foto (Unsplash/Imgur dll...)"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px] h-9"
                              value={editMenuItem.image || ''}
                              onChange={(e) => setEditMenuItem(p => ({ ...p!, image: e.target.value }))}
                            />
                            
                            {/* Physical file selection or Drag area */}
                            <div className="flex items-center gap-3">
                              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-850 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-650 border-slate-600 rounded-lg cursor-pointer text-slate-300 hover:text-white transition-all text-[11px] font-bold h-9">
                                <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Pilih File Gambar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    if (file.size > 2 * 1024 * 1024) {
                                      alert("Ukuran file terlalu besar! Silakan pilih gambar di bawah 2MB.");
                                      return;
                                    }

                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const base64String = reader.result as string;
                                      setEditMenuItem(p => ({ ...p!, image: base64String }));
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>

                              {editMenuItem.image && (
                                <div className="w-10 h-10 border border-slate-700 rounded-lg overflow-hidden shrink-0 bg-slate-800 relative group" title="Pratinjau Foto. Klik silang untuk hapus.">
                                  <img 
                                    src={editMenuItem.image} 
                                    alt="Foto Preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditMenuItem(p => ({ ...p!, image: '' }))}
                                    className="absolute inset-0 bg-red-650/90 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="text-[9.5px] text-slate-400 leading-none block">
                              Mendukung drag/file lokal (JPG, PNG, WEBP) maks 2MB, diolah instan ke Base64.
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-bold">Jumlah Batch Stok</label>
                            <input
                              type="number"
                              required
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1 text-white"
                              value={editMenuItem.stock === undefined || isNaN(editMenuItem.stock) ? '' : editMenuItem.stock}
                              onChange={(e) => setEditMenuItem(p => ({ ...p!, stock: e.target.value === '' ? NaN : parseInt(e.target.value) }))}
                            />
                          </div>
                          
                          <div className="flex items-center gap-4 mt-5">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editMenuItem.isAvailable !== false}
                                onChange={(e) => setEditMenuItem(p => ({ ...p!, isAvailable: e.target.checked }))}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-350">Tampilkan / Jual</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editMenuItem.popular === true}
                                onChange={(e) => setEditMenuItem(p => ({ ...p!, popular: e.target.checked }))}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-350">Favorit</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                          Kunci & Simpan Menu
                        </button>
                        <button type="button" onClick={() => { setIsAddingMenu(false); setEditMenuItem(null); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs">
                          Batal
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Stock table list */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Tabel Log Evaluasi Stok Dan Harga</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase">
                            <th className="p-3">Info Menu</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Harga</th>
                            <th className="p-3">Sisa Stok</th>
                            <th className="p-3 text-center">Status Jual</th>
                            <th className="p-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menuItems.map((menu) => (
                            <tr key={menu.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={menu.image} 
                                    alt={menu.name} 
                                    className="w-8 h-8 object-cover rounded bg-slate-100"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                                    }}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <strong className="block font-bold text-slate-800 text-xs">{menu.name}</strong>
                                    {menu.popular && <span className="text-[8px] uppercase tracking-wider text-amber-600 bg-amber-50 px-1 font-bold">Favorit</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 uppercase text-slate-500 text-[10px] font-bold">{menu.category}</td>
                              <td className="p-3 font-extrabold text-slate-900">Rp {menu.price.toLocaleString('id-ID')}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono text-xs font-bold ${menu.stock <= 5 ? 'text-red-600 font-black' : 'text-slate-800'}`}>
                                    {menu.stock} Porsi
                                  </span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      // Fast increase stock
                                      try {
                                        const response = await fetch('/api/menu', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ ...menu, stock: menu.stock + 10 })
                                        });
                                        if (response.ok) {
                                          await refreshRealtimeData();
                                        } else {
                                          const errData = await response.json().catch(() => ({}));
                                          alert("Gagal memperbarui stok: " + (errData.error || response.statusText));
                                        }
                                      } catch (e: any) {
                                        alert("Koneksi gagal: " + e.message);
                                      }
                                    }}
                                    className="p-0.5 bg-slate-100 rounded hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold"
                                    title="+10 Stok instan"
                                  >
                                    +10
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/menu', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ ...menu, isAvailable: !menu.isAvailable })
                                      });
                                      if (response.ok) {
                                        await refreshRealtimeData();
                                      } else {
                                        const errData = await response.json().catch(() => ({}));
                                        alert("Gagal memperbarui ketersediaan: " + (errData.error || response.statusText));
                                      }
                                    } catch (e: any) {
                                      alert("Koneksi gagal: " + e.message);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${menu.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'}`}
                                >
                                  {menu.isAvailable ? 'Dijual' : 'Sembunyi'}
                                </button>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditMenuItem({ ...menu });
                                      setIsAddingMenu(true);
                                    }}
                                    className="px-2 py-1 bg-slate-900 text-white rounded hover:bg-emerald-650 hover:bg-emerald-600 font-bold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteMenuItemHandler(menu.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-200 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* SUCCESS DIGITAL TRANSACTION MODAL */}
      {showQRISModal && successfulOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowQRISModal(false)}
              className="absolute right-4 top-4 hover:bg-slate-100 p-1.5 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
              ✓
            </span>

            <h3 className="text-base font-black tracking-tight text-slate-900">QRIS Kasir KedaiKami Berhasil Diterbitkan</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Silakan pindai QRIS di bawah ini dengan OVO, GoPay, ShopeePay, DANA, atau aplikasi M-Banking Anda untuk menyelesaikan pembayaran.
            </p>

            <div className="bg-slate-100 pt-5 pb-4 px-5 rounded-2xl border border-slate-200 flex flex-col items-center">
              {/* Fake QRIS Image Container */}
              <div className="bg-white p-3 rounded-xl border border-slate-250/80 shadow-sm relative">
                <QrCode className="w-44 h-44 text-slate-900 animate-pulse" />
                <span className="absolute inset-x-0 bottom-1 bg-amber-500 text-slate-950 px-1 py-0.5 rounded text-[8px] font-black w-24 mx-auto leading-none uppercase shadow-xs">
                  ★ QRIS KEDAIDIGI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">NMID: ID1020304050220</p>
              <div className="text-xs text-slate-750 font-black mt-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-lg border border-emerald-200">
                TOTAL BILL: Rp {totalBill.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-extrabold text-slate-655 tracking-tight uppercase">Detail Transaksi Struk #{successfulOrder.id}</p>
              <p className="mt-1">Pelanggan: <strong className="text-slate-800">{successfulOrder.customerName}</strong></p>
              <p>Staf Dapur telah menerima notifikasi dan sedang memproses hidangan Anda.</p>
            </div>

            <button 
              onClick={() => setShowQRISModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Saya Sudah Menyelesaikan Pembayaran
            </button>
          </div>
        </div>
      )}

      {/* ADMIN SECRET SECURITY GATEWAY MODULE */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" id="admin-security-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowPinModal(false);
                setPinInput('');
                setPinError(null);
              }}
              className="absolute right-4 top-4 hover:bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-red-950/50 text-red-400 border border-red-900/40 rounded-full flex items-center justify-center mb-1">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-black tracking-tight text-white uppercase">Akses Panel Kontrol Kedai</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Gerbang terproteksi. Silakan masukkan PIN Otorisasi Staf / Pemilik untuk membuka tab konfigurasi.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (pinInput === '1234') {
                setIsAdminUnlocked(true);
                setUserRole('admin');
                setAdminTab('analytics');
                setShowPinModal(false);
                setPinInput('');
                setPinError(null);
                alert("✓ Akses Admin terverifikasi! Switcher menu admin sekarang diaktifkan.");
              } else {
                setPinError("PIN Otorisasi salah! Hubungi Supervisor Kedai.");
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PIN Otorisasi (Contoh: 1234)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-white text-xl tracking-widest font-black focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  value={pinInput}
                  onChange={(e) => {
                     setPinInput(e.target.value);
                     if (pinError) setPinError(null);
                  }}
                />
              </div>

              {pinError && (
                <div className="bg-red-950/50 border border-red-900/40 text-red-500 p-2.5 rounded-xl text-[10px] text-center font-bold">
                  {pinError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
                >
                  Otorisasi PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
