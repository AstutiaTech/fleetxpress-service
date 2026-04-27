export interface DashboardSummary {
  totalRevenue: number;
  totalShipments: number;
  totalCompleted: number;
  totalOngoing: number;
  totalDelivered: number;
  totalCancelled: number;
  totalCustomers: number;
  totalPickupRequests: number;
  totalInvoices: number;
  totalVehicles: number;
  totalDrivers: number;
  totalWarehouses: number;
}

export interface RevenueExpensesData {
  date: string; // YYYY-MM-DD format
  revenue: number;
  expenses: number;
}

export interface ShipmentByMonthData {
  month: string; // Full month name (e.g., "January")
  shipments: number;
}

export interface PaymentData {
  date: string; // YYYY-MM-DD format
  credit: number;
  debit: number;
}

export interface ShipmentByLocationData {
  location: string; // lowercase, hyphenated (e.g., "abuja")
  shipments: number;
  locationName: string; // Display name (e.g., "Abuja")
}

