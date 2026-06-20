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
  is_active:        boolean;
  created_at:       string;
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
}

export interface Livreur {
  id:         string;
  tenant_id:  string;
  name:       string;
  phone:      string;
  is_active:  boolean;
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

export type LivreurDisponibilite = 'disponible' | 'occupe' | 'hors_plage' | 'conge' | 'inactif';

export interface LivreurAvecDispo extends Livreur {
  disponibilite: LivreurDisponibilite;
}

export interface LivreurAgenda {
  id:            string;
  livreur_id:    string;
  jour_semaine:  number; // 0=Dim 1=Lun 2=Mar 3=Mer 4=Jeu 5=Ven 6=Sam
  heure_debut:   string; // "HH:MM:SS"
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

export const JOURS: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

// Supabase generated types placeholder
export type Database = {
  public: {
    Tables: {
      tenants:         { Row: Tenant };
      products:        { Row: Product };
      livreurs:        { Row: Livreur };
      orders:          { Row: Order };
      order_items:     { Row: OrderItem };
      livreur_agenda:  { Row: LivreurAgenda };
      livreur_conges:  { Row: LivreurConge };
    };
    Views: {
      v_livreurs_disponibilite: { Row: LivreurAvecDispo };
    };
  };
};
