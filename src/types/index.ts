// types/index.ts

export type UserRole = 'admin' | 'employee'

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  pin: string          // 4-digit PIN for login
  active: boolean
  addedAt: string
}

export type ProductCategory = 'Console' | 'Game' | 'Accessory' | 'Controller' | 'Other'
export type ProductPlatform = 'PlayStation' | 'Xbox' | 'Nintendo' | 'PC' | 'Retro' | 'Other'
export type ProductCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor'
export type ProductType = 'new' | 'secondhand' | 'repair'

export interface NewProduct {
  id: string
  qrCode: string
  qr_code?: string
  type: 'new'
  name: string
  category: ProductCategory
  platform: ProductPlatform
  price: number
  mfgDate: string
  mfg_date?: string
  description: string
  imageUrl?: string
  image_url?: string
  inStock: boolean
  in_stock?: boolean | string
  addedBy: string        // employee name
  added_by?: string
  addedAt: string
  added_at?: string
  soldAt?: string
  sold_at?: string
  soldBy?: string
  sold_by?: string
}

export interface SecondHandProduct {
  id: string
  qrCode: string
  qr_code?: string
  type: 'secondhand'
  name: string
  category: ProductCategory
  platform: ProductPlatform
  sellingPrice: number           // price we sell at
  selling_price?: number
  buyingPrice: number            // price we bought at
  buying_price?: number
  originalPrice?: number         // original MRP when new
  original_price?: number
  purchaseDate: string           // when we bought it
  purchase_date?: string
  condition: ProductCondition
  knownIssues: string
  known_issues?: string
  description: string
  imageUrl?: string
  image_url?: string
  receiptImageUrl?: string       // photo of original bill
  receipt_image_url?: string
  // Seller info
  sellerName: string
  seller_name?: string
  sellerPhone: string
  seller_phone?: string
  sellerAddress?: string
  seller_address?: string
  // Internal
  processedBy: string            // employee name
  processed_by?: string
  addedBy: string
  added_by?: string
  addedAt: string
  added_at?: string
  inStock: boolean
  in_stock?: boolean | string
  soldAt?: string
  sold_at?: string
  soldBy?: string
  sold_by?: string
}

export type RepairStatus = 'pending' | 'started' | 'finished' | 'delivered' | 'cancelled'

export interface RepairJob {
  id: string
  qrCode: string
  qr_code?: string
  type: 'repair'
  // Product info
  productName: string
  product_name?: string
  platform: ProductPlatform
  // Problem
  problemDescription: string
  problem_description?: string
  // Owner info
  ownerName: string
  owner_name?: string
  ownerPhone: string
  owner_phone?: string
  ownerAddress?: string
  owner_address?: string
  // Dates
  receivedDate: string
  received_date?: string
  estimatedDelivery?: string
  estimated_delivery?: string
  deliveredDate?: string
  delivered_date?: string
  // Costs
  estimateCost: number
  estimate_cost?: number
  actualCost?: number
  actual_cost?: number
  // Status
  status: RepairStatus
  statusHistory: { status: RepairStatus; note: string; updatedBy: string; updatedAt: string }[]
  status_history?: string
  // Internal
  assignedTo?: string       // employee name
  assigned_to?: string
  receivedBy: string        // employee who took it in
  received_by?: string
  notes?: string
  imageUrl?: string         // photo of the product
  image_url?: string
  added_at?: string
}

export type InventoryItem = NewProduct | SecondHandProduct | RepairJob

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assigned_to?: string
  assignedBy: string       // admin name
  assigned_by?: string
  dueDate?: string
  due_date?: string
  status: 'pending' | 'done'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  created_at?: string
  completedAt?: string
  completed_at?: string
}

export interface Session {
  userId: string
  name: string
  role: UserRole
  token: string
}
