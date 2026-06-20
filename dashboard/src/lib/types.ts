// ============================================================
//  Types métier
// ============================================================

export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'stock_issue'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type Channel = 'whatsapp' | 'web';

export interface Tenant {
  id:               string;
  slug:             string;
  name:             string;
  logo_url:         string | null;
  primary_color:    string;
  whatsapp_number:  string | null;
  phone_number_id:  string | null;
  whatsapp_token:   string | null;
  verify_token:     string | null;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

export interface Product {
  id:                     string;
  tenant_id:              string;
  category_id:            string | null;
  name:                   string;
  description:            string | null;
  price:                  number;
  stock_quantity:         number;
  stock_alert_threshold:  number;
  is_available:           boolean;
  created_at:             string;
  updated_at:             string;
}

export interface Livreur {
  id:         string;
  tenant_id:  string;
  name:       string;
  phone:      string;
  is_active:  boolean;
  created_at: string;
}

export interface Order {
  id:               string;
  tenant_id:        string;
  order_number:     string;
  customer_name:    string;
  customer_phone:   string;
  customer_address: string | null;
  delivery_date:    string | null;
  livreur_id:       string | null;
  channel:          Channel;
  status:           OrderStatus;
  subtotal:         number | null;
  total:            number | null;
  notes:            string | null;
  created_at:       string;
  updated_at:       string;
  order_items?:     OrderItem[];
  livreurs?:        Livreur | null;
}

export interface OrderItem {
  id:             string;
  order_id:       string;
  product_id:     string | null;
  product_name:   string;
  product_price:  number;
  quantity:       number;
  subtotal:       number;
}

export interface UserProfile {
  id:         string;
  user_id:    string;
  tenant_id:  string | null;
  role:       'gerant' | 'admin_saas';
  email:      string;
  created_at: string;
}

export interface LivreurAgenda {
  id:            string;
  livreur_id:    string;
  jour_semaine:  number;
  heure_debut:   string;
  heure_fin:     string;
  actif:         boolean;
  created_at:    string;
}

export interface LivreurConge {
  id:          string;
  livreur_id:  string;
  date_debut:  string;
  date_fin:    string;
  raison:      string | null;
  created_at:  string;
}

export type LivreurDisponibilite = 'disponible' | 'occupe' | 'hors_plage' | 'conge' | 'inactif';

export interface LivreurAvecDispo extends Livreur {
  disponibilite: LivreurDisponibilite;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received:         'Reçue',
  confirmed:        'Confirmée',
  stock_issue:      'Problème stock',
  preparing:        'En préparation',
  out_for_delivery: 'En livraison',
  delivered:        'Livrée',
  cancelled:        'Annulée',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  received:         'bg-blue-100 text-blue-800',
  confirmed:        'bg-green-100 text-green-800',
  stock_issue:      'bg-red-100 text-red-800',
  preparing:        'bg-yellow-100 text-yellow-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered:        'bg-gray-100 text-gray-700',
  cancelled:        'bg-red-50 text-red-500',
};

export const JOURS: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

// ============================================================
//  Type Database Supabase (structure requise par le SDK v2)
// ============================================================

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row:    Tenant;
        Insert: { name: string; slug: string; primary_color?: string; logo_url?: string | null; whatsapp_number?: string | null; phone_number_id?: string | null; whatsapp_token?: string | null; verify_token?: string | null; is_active?: boolean; id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Tenant, 'id'>>;
        Relationships: [];
      };
      livreurs: {
        Row:    Livreur;
        Insert: { tenant_id: string; name: string; phone: string; is_active?: boolean; id?: string; created_at?: string };
        Update: Partial<Omit<Livreur, 'id'>>;
        Relationships: [];
      };
      products: {
        Row:    Product;
        Insert: { tenant_id: string; name: string; price: number; category_id?: string | null; description?: string | null; stock_quantity?: number; stock_alert_threshold?: number; is_available?: boolean; id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Product, 'id'>>;
        Relationships: [];
      };
      orders: {
        Row:    Order;
        Insert: { tenant_id: string; order_number: string; customer_name: string; customer_phone: string; customer_address?: string | null; delivery_date?: string | null; livreur_id?: string | null; channel?: Channel; status?: OrderStatus; subtotal?: number | null; total?: number | null; notes?: string | null; id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Order, 'id' | 'order_items' | 'livreurs'>>;
        Relationships: [];
      };
      order_items: {
        Row:    OrderItem;
        Insert: { order_id: string; product_name: string; product_price: number; quantity: number; subtotal: number; product_id?: string | null; id?: string };
        Update: Partial<Omit<OrderItem, 'id'>>;
        Relationships: [];
      };
      order_status_history: {
        Row:    { id: string; order_id: string; old_status: string | null; new_status: string; changed_by: string; note: string | null; created_at: string };
        Insert: { order_id: string; new_status: string; old_status?: string | null; changed_by?: string; note?: string | null; id?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      user_profiles: {
        Row:    UserProfile;
        Insert: { user_id: string; email: string; role: 'gerant' | 'admin_saas'; tenant_id?: string | null; id?: string; created_at?: string };
        Update: Partial<Omit<UserProfile, 'id'>>;
        Relationships: [];
      };
      livreur_agenda: {
        Row:    LivreurAgenda;
        Insert: { livreur_id: string; jour_semaine: number; heure_debut: string; heure_fin: string; actif?: boolean; id?: string; created_at?: string };
        Update: Partial<Omit<LivreurAgenda, 'id'>>;
        Relationships: [];
      };
      livreur_conges: {
        Row:    LivreurConge;
        Insert: { livreur_id: string; date_debut: string; date_fin: string; raison?: string | null; id?: string; created_at?: string };
        Update: Partial<Omit<LivreurConge, 'id'>>;
        Relationships: [];
      };
      whatsapp_sessions: {
        Row:    { id: string; tenant_id: string; phone: string; state: string; context: Record<string, unknown>; created_at: string; updated_at: string };
        Insert: { tenant_id: string; phone: string; state: string; context?: Record<string, unknown>; id?: string };
        Update: { state?: string; context?: Record<string, unknown> };
        Relationships: [];
      };
    };
    Views: {
      v_livreurs_disponibilite: {
        Row: LivreurAvecDispo;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
