import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MenuItem, Order, RestaurantConfig, KitchenNotification } from './src/types.js';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, getDocs, collection, setDoc, deleteDoc, getDocFromServer 
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'restaurant_db.json');

// Default initial state
const defaultRestaurantConfig: RestaurantConfig = {
  name: "KedaiKami",
  address: "Kantin ITEBA",
  latitude: 1.0429537,
  longitude: 103.9505055,
  geofenceRadiusMeters: 50
};

const defaultMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Nasi Goreng Kambing Kebon Sirih',
    description: 'Nasi goreng legendaris dengan rempah pilihan, potongan daging kambing empuk, emping renyah, dan acar segar.',
    price: 35000,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400',
    stock: 25,
    isAvailable: true,
    popular: true,
    salesCount: 42
  },
  {
    id: '2',
    name: 'Sate Ayam Madura Premium',
    description: '10 tusuk sate ayam dada empuk yang dipanggang merata, disiram saus kacang gurih kental khas Madura, bawang goreng, dan lontong.',
    price: 28000,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400',
    stock: 15,
    isAvailable: true,
    popular: true,
    salesCount: 38
  },
  {
    id: '3',
    name: 'Ayam Penyet Sambal Korek',
    description: 'Ayam goreng potongan besar garing dengan baluran bumbu ketumbar, dipenyet dengan sambal korek super pedas yang disiram minyak panas.',
    price: 26000,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    isAvailable: true,
    popular: false,
    salesCount: 15
  },
  {
    id: '9',
    name: 'Bakso Sapi Urat Wonogiri',
    description: 'Bakso urat sapi asli dengan kuah kaldu sumsum gurih berempah, mie kuning, bihun, tahu bakso, taburan seledri dan bawang goreng.',
    price: 24000,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=400',
    stock: 30,
    isAvailable: true,
    popular: false,
    salesCount: 18
  },
  {
    id: '10',
    name: 'Mie Ayam Rica-Rica Spesial',
    description: 'Mie telur kenyal dipadukan dengan tumisan ayam bumbu rica-rica pedas gurih, sawi hijau segar, pangsit basah, dan mangkuk kuah bening.',
    price: 22000,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400',
    stock: 18,
    isAvailable: true,
    popular: false,
    salesCount: 12
  },
  {
    id: '4',
    name: 'Kopi Susu Gula Aren Signature',
    description: 'Double shot espresso robusta lokal creamy dipadukan dengan susu murni premium dan pemanis sirup gula aren organik asli.',
    price: 18000,
    category: 'drink',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    stock: 50,
    isAvailable: true,
    popular: true,
    salesCount: 65
  },
  {
    id: '5',
    name: 'Jus Alpukat Kocok Chocolate',
    description: 'Alpukat mentega matang dikocok kasar, ditambah susu dingin, disiram pinggiran gelas dengan sirup cokelat kental nan manis.',
    price: 22000,
    category: 'drink',
    image: 'https://images.unsplash.com/photo-1483918793747-5adbf82956c4?auto=format&fit=crop&q=80&w=400',
    stock: 30,
    isAvailable: true,
    popular: false,
    salesCount: 22
  },
  {
    id: '6',
    name: 'Es Jeruk Peras Murni',
    description: 'Perasan jeruk Pontianak segar berkualitas dengan tambahan es batu kristal and sedikit sirup pemanis murni.',
    price: 12000,
    category: 'drink',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400',
    stock: 40,
    isAvailable: true,
    popular: false,
    salesCount: 19
  },
  {
    id: '7',
    name: 'Es Teh Selasih Jeruk Nipis',
    description: 'Seduhan teh melati wangi berkelas disajikan dingin dengan jeruk nipis segar yang diperas dan butiran biji selasih berkhasiat.',
    price: 8000,
    category: 'drink',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400',
    stock: 100,
    isAvailable: true,
    popular: true,
    salesCount: 88
  },
  {
    id: '11',
    name: 'Es Kelapa Muda Coco Pandan',
    description: 'Daging kelapa muda serut berpadu dengan air kelapa segar murni, dibumbui es serut dan kucuran sirup coco pandan merah delima.',
    price: 15000,
    category: 'drink',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ec82a897?auto=format&fit=crop&q=80&w=400',
    stock: 25,
    isAvailable: true,
    popular: true,
    salesCount: 31
  },
  {
    id: '8',
    name: 'Pisang Goreng Keju Aren',
    description: 'Pisang tanduk balur tepung renyah dengan toping parutan keju Cheddar melimpah dan disiram sirup gula kelapa manis alami.',
    price: 15000,
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1566813454378-ee2b81df8d79?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    isAvailable: true,
    popular: false,
    salesCount: 14
  },
  {
    id: '12',
    name: 'Tempe Mendoan Anget Banyumas',
    description: 'Tempe lembaran tipis lebar berbalut tepung bumbu ketumbar-daun bawang gurih khas Banyumas, digoreng setengah matang (mendo). Disajikan dengan kecap cabe rawit.',
    price: 12000,
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400',
    stock: 35,
    isAvailable: true,
    popular: true,
    salesCount: 45
  },
  {
    id: '13',
    name: 'Roti Bakar Cokelat Keju',
    description: 'Roti bantal panggang garing mentega susu dengan isian melimpah meses cokelat premium dan parutan keju tebal gurih.',
    price: 16000,
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&q=80&w=400',
    stock: 15,
    isAvailable: true,
    popular: false,
    salesCount: 9
  },
  {
    id: '14',
    name: 'Cireng Rempah Saus Rujak',
    description: 'Camilan aci garing di luar kenyal lembut di dalam berbumbu bawang, disajikan bersama saus rujak gula merah pedas manis mantap.',
    price: 10000,
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400',
    stock: 40,
    isAvailable: true,
    popular: false,
    salesCount: 23
  },
  {
    id: '15',
    name: 'Kentang Goreng Truffle Herb',
    description: 'Kentang potong lurus renyah ditaburi garam laut, minyak aroma premium truffle putih, keju parmesan halus, dan rajangan peterseli segar.',
    price: 18000,
    category: 'snack',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=400',
    stock: 22,
    isAvailable: true,
    popular: true,
    salesCount: 17
  }
];

// Initialize Firebase SDK with safe, robust multi-path config loading
let firebaseAppletConfig: any = {};
const possibleConfigPaths = [
  path.join(process.cwd(), 'firebase-applet-config.json'),
  path.join(process.cwd(), '..', 'firebase-applet-config.json'),
  path.join(__dirname, 'firebase-applet-config.json'),
  path.join(__dirname, '..', 'firebase-applet-config.json'),
  path.join(__dirname, '../..', 'firebase-applet-config.json')
];

for (const configPath of possibleConfigPaths) {
  try {
    if (fs.existsSync(configPath)) {
      firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(`[Firebase Startup] Loaded config successfully from: ${configPath}`);
      break;
    }
  } catch (e) {
    // try next path
  }
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId || "ai-studio-752ca787-a7f9-4a22-82ca-c433ec608c5a"
};

// Output safe, secure credentials check for production debugging/diagnostics
console.log("[Firebase Diagnostics] Connection profile evaluation:", {
  apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING",
  authDomain: firebaseConfig.authDomain ? "PRESENT" : "MISSING",
  projectId: firebaseConfig.projectId ? "PRESENT" : "MISSING",
  storageBucket: firebaseConfig.storageBucket ? "PRESENT" : "MISSING",
  messagingSenderId: firebaseConfig.messagingSenderId ? "PRESENT" : "MISSING",
  appId: firebaseConfig.appId ? "PRESENT" : "MISSING",
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId
});

let firebaseApp: any = null;
let db: any = null;

if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase Initialization] SDK initialized successfully.");
  } catch (err) {
    console.warn("[Firebase Initialization] Failed to initialize Firebase SDK; falling back to local memory-based store:", err);
  }
} else {
  console.log("[Firebase Initialization] Key credentials missing, operating in hybrid memory-offline mode.");
}

// Mandated Error Handlers for Firestore connection stability and audit requirements
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, pathInDoc: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path: pathInDoc
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local In-Memory Fallback and Sync mechanism
let memoConfig: RestaurantConfig = defaultRestaurantConfig;
let memoMenuItems: MenuItem[] = [...defaultMenuItems];
let memoOrders: Order[] = [];
let memoNotifications: KitchenNotification[] = [];

// Load from local json file initially to populate the fallbacks
try {
  if (fs.existsSync(DB_FILE)) {
    const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (fileData.config) memoConfig = fileData.config;
    if (fileData.menuItems && fileData.menuItems.length > 0) memoMenuItems = fileData.menuItems;
    if (fileData.orders) memoOrders = fileData.orders;
    if (fileData.notifications) memoNotifications = fileData.notifications;
    console.log("[JSON Fallback Ready] Pre-loaded database backup file.");
  }
} catch (err) {
  console.warn("Could not pre-populate memory DB cache:", err);
}

// Save helper that is totally safe and doesn't crash on Vercel write-only disk
function saveToLocalDiskSafe() {
  try {
    const backupData = {
      config: memoConfig,
      menuItems: memoMenuItems,
      orders: memoOrders,
      notifications: memoNotifications
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
  } catch (err) {
    // Silently ignore or warn, since Vercel lacks a writeable disk
    console.log("[Local Disk Sync] Read-only / disabled in serverless host:", err);
  }
}

// Perform validation connection test to Firestore
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore adapter successfully connected and online.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Warning: Firestore adapter is currently offline.");
    }
  }
}
testConnection();

// Initial database bootstrapping from DB_FILE or fallback definitions
async function bootstrapDB() {
  if (!db) return;
  try {
    // 1. Config bootstrap
    const configSnap = await getDoc(doc(db, 'config', 'restaurant'));
    if (!configSnap.exists()) {
      let initialConfig = defaultRestaurantConfig;
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          if (fileData.config) initialConfig = fileData.config;
        } catch (_) {}
      }
      await setDoc(doc(db, 'config', 'restaurant'), initialConfig);
      console.log("Bootstrapped default restaurant config on Firestore.");
    }

    // 2. Menu items bootstrap
    const menuSnap = await getDocs(collection(db, 'menuItems'));
    if (menuSnap.empty) {
      let initialMenu = defaultMenuItems;
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
          if (fileData.menuItems && fileData.menuItems.length > 0) initialMenu = fileData.menuItems;
        } catch (_) {}
      }
      for (const item of initialMenu) {
        await setDoc(doc(db, 'menuItems', item.id), item);
      }
      console.log(`Bootstrapped ${initialMenu.length} default menu items on Firestore.`);
    }
  } catch (error) {
    console.error("Failed to bootstrap Firestore database collections:", error);
  }
}
bootstrapDB();

// Async database access helpers in place of loadDB/saveDB with full multi-fallback safety
async function getRestaurantConfigFirestore(): Promise<RestaurantConfig> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'config', 'restaurant'));
      if (snap.exists()) {
        const data = snap.data() as RestaurantConfig;
        memoConfig = data;
        return data;
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] getRestaurantConfigFirestore failed, using local model:", error);
    }
  }
  return memoConfig;
}

async function saveRestaurantConfigFirestore(config: RestaurantConfig): Promise<void> {
  memoConfig = config;
  saveToLocalDiskSafe();
  if (db) {
    try {
      await setDoc(doc(db, 'config', 'restaurant'), config);
    } catch (error) {
      console.warn("[Firestore Fallback Active] saveRestaurantConfigFirestore failed, saved in memory only:", error);
    }
  }
}

async function getMenuItemsFirestore(): Promise<MenuItem[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'menuItems'));
      const items: MenuItem[] = [];
      snap.forEach(docSnap => {
        items.push(docSnap.data() as MenuItem);
      });
      if (items.length > 0) {
        memoMenuItems = items;
        return items;
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] getMenuItemsFirestore failed, using local memory:", error);
    }
  }
  return memoMenuItems;
}

async function saveMenuItemFirestore(item: MenuItem): Promise<void> {
  const existingIdx = memoMenuItems.findIndex(i => i.id === item.id);
  if (existingIdx !== -1) {
    memoMenuItems[existingIdx] = item;
  } else {
    memoMenuItems.push(item);
  }
  saveToLocalDiskSafe();

  if (db) {
    try {
      await setDoc(doc(db, 'menuItems', item.id), item);
    } catch (error) {
      console.warn("[Firestore Fallback Active] saveMenuItemFirestore failed, saved in memory only:", error);
    }
  }
}

async function deleteMenuItemFirestore(id: string): Promise<void> {
  memoMenuItems = memoMenuItems.filter(i => i.id !== id);
  saveToLocalDiskSafe();

  if (db) {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (error) {
      console.warn("[Firestore Fallback Active] deleteMenuItemFirestore failed, deleted from memory only:", error);
    }
  }
}

async function getOrdersFirestore(): Promise<Order[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const orders: Order[] = [];
      snap.forEach(docSnap => {
        orders.push(docSnap.data() as Order);
      });
      if (orders.length > 0) {
        memoOrders = orders;
        return orders;
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] getOrdersFirestore failed, using local memory:", error);
    }
  }
  return memoOrders;
}

async function saveOrderFirestore(order: Order): Promise<void> {
  const existingIdx = memoOrders.findIndex(o => o.id === order.id);
  if (existingIdx !== -1) {
    memoOrders[existingIdx] = order;
  } else {
    memoOrders.push(order);
  }
  saveToLocalDiskSafe();

  if (db) {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (error) {
      console.warn("[Firestore Fallback Active] saveOrderFirestore failed, saved in memory only:", error);
    }
  }
}

async function getNotificationsFirestore(): Promise<KitchenNotification[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const list: KitchenNotification[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as KitchenNotification);
      });
      if (list.length > 0) {
        memoNotifications = list;
        return list;
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] getNotificationsFirestore failed, using local memory:", error);
    }
  }
  return memoNotifications;
}

async function saveNotificationFirestore(notif: KitchenNotification): Promise<void> {
  const existingIdx = memoNotifications.findIndex(n => n.id === notif.id);
  if (existingIdx !== -1) {
    memoNotifications[existingIdx] = notif;
  } else {
    memoNotifications.push(notif);
  }
  saveToLocalDiskSafe();

  if (db) {
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch (error) {
      console.warn("[Firestore Fallback Active] saveNotificationFirestore failed, saved in memory only:", error);
    }
  }
}

async function markNotificationsReadFirestore(): Promise<void> {
  memoNotifications = memoNotifications.map(n => ({ ...n, read: true }));
  saveToLocalDiskSafe();

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (!data.read) {
          await setDoc(doc(db, 'notifications', docSnap.id), { ...data, read: true });
        }
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] markNotificationsReadFirestore failed, updated/saved in memory only:", error);
    }
  }
}

async function clearNotificationsFirestore(): Promise<void> {
  memoNotifications = [];
  saveToLocalDiskSafe();

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'notifications', docSnap.id));
      }
    } catch (error) {
      console.warn("[Firestore Fallback Active] clearNotificationsFirestore failed, cleared from memory only:", error);
    }
  }
}

// Proximity calculation formula
function computeDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export const app = express();
app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // REST API: Get Restaurant Config
  app.get('/api/config', async (req, res) => {
    try {
      const config = await getRestaurantConfigFirestore();
      res.json(config);
    } catch (e) {
      res.status(500).json({ error: 'Failed to access configuration' });
    }
  });

  // REST API: Update Restaurant Config
  app.post('/api/config', async (req, res) => {
    try {
      const current = await getRestaurantConfigFirestore();
      const newConfig = { ...current, ...req.body };
      await saveRestaurantConfigFirestore(newConfig);
      res.json({ success: true, config: newConfig });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // REST API: Get All Menu items
  app.get('/api/menu', async (req, res) => {
    try {
      let menu = await getMenuItemsFirestore();
      if (!menu || menu.length === 0) {
        console.log("Database menu kosong di Firestore. Memicu bootstrapDB otomatis...");
        await bootstrapDB();
        menu = await getMenuItemsFirestore();
      }
      res.json(menu);
    } catch (e: any) {
      console.error("[GET /api/menu Error]:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `Gagal mengambil menu: ${errMsg}` });
    }
  });

  // REST API: Create or Update Menu item
  app.post('/api/menu', async (req, res) => {
    try {
      const menu = await getMenuItemsFirestore();
      const item = req.body;
      
      // Ensure key types match schema validations
      if (item.price !== undefined) item.price = Number(item.price);
      if (item.stock !== undefined) item.stock = Number(item.stock);
      if (item.salesCount !== undefined) item.salesCount = Number(item.salesCount);
      if (item.isAvailable !== undefined) item.isAvailable = Boolean(item.isAvailable);
      if (item.popular !== undefined) item.popular = Boolean(item.popular);
      if (item.description === undefined || item.description === null) {
        item.description = "";
      }

      if (item.id) {
        // update
        const existingItem = menu.find(i => i.id === item.id);
        const merged = existingItem ? { ...existingItem, ...item } : item;
        await saveMenuItemFirestore(merged);
      } else {
        // create new
        item.id = Math.random().toString(36).substr(2, 9);
        item.salesCount = item.salesCount || 0;
        await saveMenuItemFirestore(item);
      }
      
      res.json({ success: true, item });
    } catch (e: any) {
      console.error("[POST /api/menu Error]:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `Gagal menyimpan menu: ${errMsg}` });
    }
  });

  // REST API: Delete Menu item
  app.delete('/api/menu/:id', async (req, res) => {
    try {
      await deleteMenuItemFirestore(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      console.error("[DELETE /api/menu Error]:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: `Gagal menghapus menu: ${errMsg}` });
    }
  });

  // REST API: Get All Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await getOrdersFirestore();
      // Sort descending by timestamp
      const sorted = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(sorted);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load orders' });
    }
  });

  // REST API: POST Create Order (includes transactions logic and bounds validation)
  app.post('/api/orders', async (req, res) => {
    try {
      const config = await getRestaurantConfigFirestore();
      const menu = await getMenuItemsFirestore();
      
      const { 
        items, 
        orderType, 
        tableNo, 
        paymentMethod, 
        customerName, 
        customerPhone,
        latitude, 
        longitude 
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Keranjang belanja kosong.' });
      }

      let calculatedDistance = 0;

      // GEOFENCING LOGIC FOR DINE-IN
      if (orderType === 'dine-in') {
        if (latitude === undefined || longitude === undefined) {
          return res.status(400).json({ 
            error: 'Lokasi Anda tidak terdeteksi. Fitur dine-in memerlukan koordinat GPS/geofencing.' 
          });
        }

        // Compute actual proximity
        calculatedDistance = computeDistance(
          latitude, 
          longitude, 
          config.latitude, 
          config.longitude
        );

        // Verify geofence boundaries
        if (calculatedDistance > config.geofenceRadiusMeters) {
          return res.status(400).json({
            error: `Geofencing Gagal: Anda berada sejauh ${Math.round(calculatedDistance)} meter dari toko. Pemesanan Dine-In hanya diizinkan dalam radius maksimal ${config.geofenceRadiusMeters} meter untuk alasan pemesanan meja fisik. Silakan pilih opsi 'Ambil Sendiri' (Pick-Up) jika berada di luar lokasi.`
          });
        }
      }

      // Process inventories validation and deduction
      let totalAmount = 0;
      const orderItems: Order['items'] = [];

      for (const cartItem of items) {
        const dbItem = menu.find(m => m.id === cartItem.menuItemId);
        if (!dbItem) {
          return res.status(404).json({ error: `Menu dengan ID ${cartItem.menuItemId} tidak ditemukan.` });
        }

        if (!dbItem.isAvailable || dbItem.stock < cartItem.quantity) {
          return res.status(400).json({ 
            error: `Stok tidak mencukupi untuk ${dbItem.name}. Tersisa: ${dbItem.stock} porsi.` 
          });
        }

        // deduct stock
        dbItem.stock -= cartItem.quantity;
        dbItem.salesCount += cartItem.quantity;
        
        // Save the updated stock back to firestore
        await saveMenuItemFirestore(dbItem);
        
        const price = dbItem.price;
        orderItems.push({
          menuItemId: dbItem.id,
          name: dbItem.name,
          price,
          quantity: cartItem.quantity,
          notes: cartItem.notes || ''
        });

        totalAmount += price * cartItem.quantity;
      }

      // Auto-update digital payment state (QRIS / E-wallet / Card are auto 'paid' instantly on checkout simulation)
      const paymentStatus = (paymentMethod === 'cash') ? 'pending' : 'paid';

      const newOrder: Order = {
        id: 'GUSTO-' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 10),
        items: orderItems,
        totalAmount,
        orderType,
        tableNo: orderType === 'dine-in' ? (tableNo || 'Meja Umum') : undefined,
        status: 'pending',
        paymentMethod,
        paymentStatus,
        customerName,
        customerPhone,
        distanceInMeters: orderType === 'dine-in' ? Math.round(calculatedDistance) : undefined,
        timestamp: new Date().toISOString()
      };

      await saveOrderFirestore(newOrder);

      // Create staff notification
      const kitchenNotification: KitchenNotification = {
        id: Math.random().toString(36).substr(2, 9),
        orderId: newOrder.id,
        customerName: newOrder.customerName,
        orderType: newOrder.orderType,
        tableNo: newOrder.tableNo,
        itemsSummary: newOrder.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
        timestamp: new Date().toISOString(),
        read: false
      };

      await saveNotificationFirestore(kitchenNotification);

      res.json({ success: true, order: newOrder });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to create order on server' });
    }
  });

  // REST API: PATCH Update order (status/paymentStatus)
  app.patch('/api/orders/:id', async (req, res) => {
    try {
      const orders = await getOrdersFirestore();
      const id = req.params.id;
      const { status, paymentStatus } = req.body;

      const orderVal = orders.find(o => o.id === id);
      if (!orderVal) {
        return res.status(404).json({ error: 'Order tidak ditemukan' });
      }

      if (status) {
        orderVal.status = status;
      }
      if (paymentStatus) {
        orderVal.paymentStatus = paymentStatus;
      }

      await saveOrderFirestore(orderVal);
      res.json({ success: true, order: orderVal });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // REST API: Get notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      const notifications = await getNotificationsFirestore();
      // Sort descending by timestamp
      const sorted = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(sorted);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // REST API: Reset database / Mark alerts as read
  app.post('/api/notifications/read', async (req, res) => {
    try {
      await markNotificationsReadFirestore();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update notifications read state' });
    }
  });

  // REST API: Clear Notifications
  app.delete('/api/notifications', async (req, res) => {
    try {
      await clearNotificationsFirestore();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to clear notifications' });
    }
  });

  // REST API: Real-time Stats for Admin
  app.get('/api/stats', async (req, res) => {
    try {
      const orders = await getOrdersFirestore();

      // Filter today's orders
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayOrders = orders.filter(o => o.timestamp.substring(0, 10) === todayStr);

      const todaySales = todayOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

      const averageTransaction = todayOrders.length > 0
        ? todaySales / todayOrders.length
        : 0;

      res.json({
        todaySales,
        todayOrdersCount: todayOrders.length,
        averageTransaction,
        activeOrdersCount
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to compile analytics calculations' });
    }
  });

  // Vite development integration
  async function start() {
    if (process.env.VERCEL) {
      // Let Vercel serve static files
    } else if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      // Production static files
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`HTTP Server running on http://localhost:${PORT}`);
      });
    }
  }

  start().catch(err => {
    console.error("Gagal memulai server:", err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  });

  export default app;
