export const authEndpoint = "/auth"
export const authSendUserTokenEmail = `${authEndpoint}/request_auth_token`
export const authVerifyUserToken = `${authEndpoint}/passwordless`
export const authLogout = `${authEndpoint}/logout`

export const settingsEndpoint = "/settings"
export const generalSettingsEndpoint = `${settingsEndpoint}/general`
export const shippingPackagingEndpoint = `${settingsEndpoint}/packages`
export const shippingSettingsEndpoint = `${settingsEndpoint}/shipping`
// Route endpoints (simplified routes - only id and title)
export const insideCityShippingRoutesEndpoint = `${shippingSettingsEndpoint}/inside-city`
export const outsideCityShippingRoutesEndpoint = `${shippingSettingsEndpoint}/outside-city`
export const updateInsideCity = (id: number) => `${insideCityShippingRoutesEndpoint}/${id}`
export const updateOutsideCity = (id: number) => `${outsideCityShippingRoutesEndpoint}/${id}`
// Legacy aliases for backward compatibility
export const shippingInsideCityEndpoint = insideCityShippingRoutesEndpoint
export const shippingOutsideCityEndpoint = outsideCityShippingRoutesEndpoint
export const shippingCostingsEndpoint = `${settingsEndpoint}/costings`
export const updateCosting = (id: number) => `${shippingCostingsEndpoint}/${id}`
export const updatePackage = (id: number) => `${shippingPackagingEndpoint}/${id}`

export const uploadEndpoint = "/uploads"
export const uploadFileEndpoint = `${uploadEndpoint}/single`
export const uploadMultipleFilesEndpoint = `${uploadEndpoint}/multiple`

export const shipmentsEndpoint = "/shipments"
export const disabledShipmentsEndpoint = `${shipmentsEndpoint}/deleted`
export const getShipmentById = (id: string) => `${shipmentsEndpoint}/${id}` 
export const getShipmentParcels = (shipmentId: string) => `${shipmentsEndpoint}/${shipmentId}/parcels`
export const getShipmentCosting = (shipmentId: string) => `${shipmentsEndpoint}/${shipmentId}/costing`
export const updateShipment = (id: string) => `${shipmentsEndpoint}/${id}`
export const deleteShipment = (id: string) => `${shipmentsEndpoint}/${id}`
export const updateParcel = (parcelId: string) => `${shipmentsEndpoint}/parcels/${parcelId}`
export const trackShipmentByCode = (trackingCode: string) => `${shipmentsEndpoint}/track/${trackingCode}`
export const getTrackingHistory = (shipmentId: string) => `${shipmentsEndpoint}/${shipmentId}/tracking-history`
export const updateShipmentStatus = (shipmentId: string) => `${shipmentsEndpoint}/${shipmentId}/status`
export const assignShipmentToDriver = (id: string, driverId: string) => `${shipmentsEndpoint}/${id}/assign?driverId=${driverId}`
export const unassignShipmentFromDriver = (id: string) => `${shipmentsEndpoint}/${id}/unassign`

export const invoicesEndpoint = "/invoices"
export const getInvoiceById = (id: string) => `${invoicesEndpoint}/${id}`

export const geoSettingsEndpoint = `${settingsEndpoint}/geo`
export const geoCountriesEndpoint = `${geoSettingsEndpoint}/countries`
export const updateCountry = (id: number) => `${geoCountriesEndpoint}/${id}`
export const geoStatesEndpoint = `${geoSettingsEndpoint}/states`
export const updateState = (id: number) => `${geoStatesEndpoint}/${id}`
export const geoCitiesEndpoint = `${geoSettingsEndpoint}/cities`
export const updateCity = (id: number) => `${geoCitiesEndpoint}/${id}`
export const geoLgasEndpoint = `${geoSettingsEndpoint}/lgas`
export const updateLGA = (id: number) => `${geoLgasEndpoint}/${id}`
export const smsSettingsEndpoint = `${settingsEndpoint}/sms`
export const notificationSettingsEndpoint = `${settingsEndpoint}/notifications`
export const paymentSettingsEndpoint = `${settingsEndpoint}/payments`
export const getPaymentSettingsById = (id: number) => `${paymentSettingsEndpoint}/${id}`
export const updatePaymentSettings = (id: number) => `${paymentSettingsEndpoint}/${id}`
export const deletePaymentSettings = (id: number) => `${paymentSettingsEndpoint}/${id}`
export const emailSettingsEndpoint = `${settingsEndpoint}/emails`
export const currencySettingsEndpoint = `${settingsEndpoint}/currencies`
export const databaseModeEndpoint = `${settingsEndpoint}/database-mode`
export const emailNotificationPreferencesEndpoint = `${settingsEndpoint}/email-notification-preferences`

export const warehousesEndpoint = "/warehouse"
export const warehouseTypesEndpoint = `${warehousesEndpoint}/types`
export const updateWarehouseType = (id: string) => `${warehouseTypesEndpoint}/${id}`
export const updateWarehouse = (id: string) => `${warehousesEndpoint}/${id}`

export const courierEndpoint = "/courier"
export const vehicleTypesEndpoint = `${courierEndpoint}/vehicle-types`
export const updateVehicleType = (id: string) => `${vehicleTypesEndpoint}/${id}`
export const driversEndpoint = `${courierEndpoint}/drivers`
export const updateDriver = (id: string) => `${driversEndpoint}/${id}`
export const vehiclesEndpoint = `${courierEndpoint}/vehicles`
export const updateVehicle = (id: string) => `${vehiclesEndpoint}/${id}`

export const customersEndpoint = "/users/customers"
export const staffEndpoint = "/users/admins"

// Address endpoints
export const addressesEndpoint = "/addresses"
export const getAddressById = (id: string) => `${addressesEndpoint}/${id}`
export const getUserAddresses = (userId: string) => `/users/${userId}/addresses`
export const addUserAddress = (userId: string) => `/users/${userId}/addresses`

// Recipient endpoints
export const recipientsEndpoint = "/recipients"
export const getRecipientById = (id: string) => `${recipientsEndpoint}/${id}`

// Financials endpoints
export const financialsEndpoint = "/financials"
export const receivablesEndpoint = `${financialsEndpoint}/receivables`
export const getReceivableById = (id: string) => `${receivablesEndpoint}/${id}`
export const updateReceivable = (id: string) => `${receivablesEndpoint}/${id}`
export const deleteReceivable = (id: string) => `${receivablesEndpoint}/${id}`
export const getEligibleShipments = (customerId: string) => `${receivablesEndpoint}/eligible-shipments/${customerId}`
export const createBatchInvoice = () => `${receivablesEndpoint}/batch-invoice`
export const getInvoiceShipments = (invoiceId: string) => `${receivablesEndpoint}/${invoiceId}/shipments`

export const payablesEndpoint = `${financialsEndpoint}/payables`
export const getPayableById = (id: string) => `${payablesEndpoint}/${id}`
export const updatePayable = (id: string) => `${payablesEndpoint}/${id}`
export const deletePayable = (id: string) => `${payablesEndpoint}/${id}`

export const paymentsEndpoint = `${financialsEndpoint}/payments`
export const getPaymentById = (id: string) => `${paymentsEndpoint}/${id}`
export const updatePaymentStatus = (id: string) => `${paymentsEndpoint}/${id}/status`
export const initializePaystackPaymentEndpoint = `${paymentsEndpoint}/initialize-paystack`
export const createPaystackPaymentLinkEndpoint = (shipmentId: string) => `/paystack/shipments/${shipmentId}/payment-link`

export const ledgerEndpoint = `${financialsEndpoint}/ledger`
export const getLedgerEntryById = (id: string) => `${ledgerEndpoint}/${id}`
export const reverseLedgerEntry = (id: string) => `${ledgerEndpoint}/${id}/reverse`
export const getAccountBalance = (id: string) => `${ledgerEndpoint}/account/${id}/balance`

export const chartOfAccountsEndpoint = `${financialsEndpoint}/chart-of-accounts`
export const getAccountById = (id: string) => `${chartOfAccountsEndpoint}/${id}`
export const updateAccount = (id: string) => `${chartOfAccountsEndpoint}/${id}`
export const deleteAccount = (id: string) => `${chartOfAccountsEndpoint}/${id}`
export const getAccountsByType = (type: string) => `${chartOfAccountsEndpoint}/type/${type}`
export const getAccountsByCategory = (category: string) => `${chartOfAccountsEndpoint}/category/${category}`
export const getAccountByCode = (code: string) => `${chartOfAccountsEndpoint}/code/${code}`

export const reportsEndpoint = `${financialsEndpoint}/reports`
export const trialBalanceReportEndpoint = `${reportsEndpoint}/trial-balance`
export const balanceSheetReportEndpoint = `${reportsEndpoint}/balance-sheet`
export const profitLossReportEndpoint = `${reportsEndpoint}/profit-loss`
export const receivableAgingReportEndpoint = `${reportsEndpoint}/receivable-aging`
export const payableAgingReportEndpoint = `${reportsEndpoint}/payable-aging`

// Customer shipment endpoint
export const customerShipmentEndpoint = `${shipmentsEndpoint}/customer`

// Quick quote endpoint
export const quickQuoteEndpoint = `${shipmentsEndpoint}/quick-quote`

// Dashboard endpoints
export const dashboardEndpoint = "/dashboard"
export const dashboardSummaryEndpoint = `${dashboardEndpoint}/summary`
export const dashboardRevenueExpensesEndpoint = `${dashboardEndpoint}/revenue-expenses`
export const dashboardShipmentsByMonthEndpoint = `${dashboardEndpoint}/shipments-by-month`
export const dashboardPaymentsEndpoint = `${dashboardEndpoint}/payments`
export const dashboardShipmentsByLocationEndpoint = `${dashboardEndpoint}/shipments-by-location`

// Weight-based pricing endpoints
export const weightBasedPricesEndpoint = `${settingsEndpoint}/weight-based-prices`
export const getWeightBasedPriceById = (id: number) => `${weightBasedPricesEndpoint}/${id}`
export const updateWeightBasedPrice = (id: number) => `${weightBasedPricesEndpoint}/${id}`
export const deleteWeightBasedPrice = (id: number) => `${weightBasedPricesEndpoint}/${id}`
export const bulkCreateWeightBasedPricesEndpoint = `${weightBasedPricesEndpoint}/bulk`
export const calculateShippingPriceEndpoint = `${settingsEndpoint}/calculate-shipping-price`

// Pricing import endpoint
export const importPricingEndpoint = `${settingsEndpoint}/import-pricing`

// Activity endpoints
export const activitiesEndpoint = "/activity"
export const getActivityById = (id: string) => `${activitiesEndpoint}/${id}`

// Backup endpoints
export const backupEndpoint = "/backup"
export const backupListEndpoint = `${backupEndpoint}/list`
export const downloadBackupEndpoint = (filename: string) => `${backupEndpoint}/download/${filename}`
export const cleanupBackupsEndpoint = `${backupEndpoint}/cleanup`