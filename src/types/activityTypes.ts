export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'import' 
  | 'payment' 
  | 'shipment' 
  | 'other'

export interface Activity {
  id: string
  userId?: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  name: string
  description?: string
  activityType: ActivityType
  status: number // 1 = success, 0 = failed
  activityLocation?: string
  createdAt: string | Date
  updatedAt: string | Date
  deletedAt?: string | Date | null
}

export interface ActivityFilters {
  activityType?: ActivityType
  userId?: string
  status?: number
  search?: string
  page?: number
  limit?: number
}

