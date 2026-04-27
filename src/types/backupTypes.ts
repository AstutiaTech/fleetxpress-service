export interface Backup {
  filename: string
  size: number // in bytes
  createdAt: string | Date
  downloadUrl: string
  filepath?: string // Only in create response
}

export interface CreateBackupResponse {
  status: boolean
  response: string
  data: Backup
}

export interface BackupListResponse {
  status: boolean
  response: string
  data: Backup[]
}

export interface CleanupResponse {
  status: boolean
  response: string
  data: {
    deletedCount: number
    message: string
  }
}

