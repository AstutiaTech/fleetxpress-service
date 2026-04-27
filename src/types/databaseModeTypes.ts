export type DatabaseMode = 'live' | 'sandbox'

export interface DatabaseModeResponse {
  mode: DatabaseMode
  testDatabaseAvailable: boolean
}

export interface SetDatabaseModeRequest {
  mode: DatabaseMode
}

