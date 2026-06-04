export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'drink' | 'snack' | 'dessert';
  image: string;
  stock: number;
  isAvailable: boolean;
  popular: boolean;
  salesCount: number; // for bestseller analytics
}

export interface CartItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }[];
  totalAmount: number;
  orderType: 'dine-in' | 'pickup';
  tableNo?: string; // used if dine-in
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'qris' | 'ewallet' | 'card' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed';
  customerName: string;
  customerPhone: string;
  distanceInMeters?: number; // the distance recorded at order time
  timestamp: string;
}

export interface RestaurantConfig {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // default: 50m
}

export interface RealtimeStats {
  todaySales: number;
  todayOrdersCount: number;
  averageTransaction: number;
  activeOrdersCount: number;
}

export interface KitchenNotification {
  id: string;
  orderId: string;
  customerName: string;
  orderType: 'dine-in' | 'pickup';
  tableNo?: string;
  itemsSummary: string;
  timestamp: string;
  read: boolean;
}
