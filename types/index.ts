export type Profile = {
  id: string
  full_name: string
  role: 'student' | 'admin'
  school_credit: number
  class: string | null
  avatar_url: string | null
  created_at: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: 'food' | 'drink' | 'snack' | 'other'
  is_available: boolean
  preparation_time_min: number
  created_at: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

export type Order = {
  id: string
  user_id: string
  status: OrderStatus
  payment_method: 'card' | 'school_credit'
  total_amount: number
  pickup_code: string | null
  estimated_ready_at: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export type Notification = {
  id: string
  user_id: string
  order_id: string | null
  message: string
  is_read: boolean
  created_at: string
}

export type OrderWithItems = Order & {
  order_items: (OrderItem & { products: Product })[]
  profiles?: Profile
}

export type CartItem = {
  product: Product
  quantity: number
}

// Supabase Database type (full format required by @supabase/supabase-js v2)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
        Relationships: []
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id'> & { id?: string }
        Update: Partial<Omit<OrderItem, 'id'>>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      deduct_school_credit: {
        Args: { p_user_id: string; p_amount: number }
        Returns: boolean
      }
      add_school_credit: {
        Args: { p_user_id: string; p_amount: number }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
