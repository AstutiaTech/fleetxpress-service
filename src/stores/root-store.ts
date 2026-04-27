import { ActivityStore } from "./activity-store"
import { AddressStore } from "./address-store"
import { BackupStore } from "./backup-store"
import { AppStore } from "./app-store"
import { AuthStore } from "./auth-store"
import { DatabaseModeStore } from "./database-mode-store"
import { InvoiceStore } from "./invoice-store"
import { NotificationsStore } from "./notifications-store"
import { PayablesStore } from "./payables-store"
import { PaymentsStore } from "./payments-store"
import { ReceivablesStore } from "./receivables-store"
import { RecipientStore } from "./recipient-store"
import { SettingsStore } from "./settings-store"
import { ShipmentStore } from "./shipment-store"
import { UploadStore } from "./upload-store"
import { UserStore } from "./user-store"
import { makeAutoObservable } from "mobx"

export class RootStore {
  activityStore: ActivityStore
  backupStore: BackupStore
  appStore: AppStore
  authStore: AuthStore
  notificationsStore: NotificationsStore
  settingsStore: SettingsStore
  uploadStore: UploadStore
  shipmentStore: ShipmentStore
  userStore: UserStore
  addressStore: AddressStore
  recipientStore: RecipientStore
  invoiceStore: InvoiceStore
  receivablesStore: ReceivablesStore
  payablesStore: PayablesStore
  paymentsStore: PaymentsStore
  databaseModeStore: DatabaseModeStore
  constructor() {
    this.activityStore = new ActivityStore(this)
    this.backupStore = new BackupStore(this)
    this.appStore = new AppStore(this)
    this.authStore = new AuthStore(this)
    this.notificationsStore = new NotificationsStore(this)
    this.settingsStore = new SettingsStore(this)
    this.uploadStore = new UploadStore(this)
    this.shipmentStore = new ShipmentStore(this)
    this.userStore = new UserStore(this)
    this.addressStore = new AddressStore(this)
    this.recipientStore = new RecipientStore(this)
    this.invoiceStore = new InvoiceStore(this)
    this.receivablesStore = new ReceivablesStore(this)
    this.payablesStore = new PayablesStore(this)
    this.paymentsStore = new PaymentsStore(this)
    this.databaseModeStore = new DatabaseModeStore(this)
    makeAutoObservable(this)
  }

  // Method to hydrate all stores
  async hydrate() {
    await Promise.all([
      this.activityStore.hydrate?.() || Promise.resolve(),
      this.backupStore.hydrate?.() || Promise.resolve(),
      this.appStore.hydrate(),
      this.authStore.hydrate(),
      this.notificationsStore.hydrate(),
      this.settingsStore.hydrate(),
      this.uploadStore.hydrate(),
      this.shipmentStore.hydrate?.() || Promise.resolve(),
      this.userStore.hydrate?.() || Promise.resolve(),
      this.addressStore.hydrate?.() || Promise.resolve(),
      this.recipientStore.hydrate?.() || Promise.resolve(),
      this.invoiceStore.hydrate?.() || Promise.resolve(),
      this.receivablesStore.hydrate?.() || Promise.resolve(),
      this.payablesStore.hydrate?.() || Promise.resolve(),
      this.paymentsStore.hydrate?.() || Promise.resolve(),
      this.databaseModeStore.hydrate?.() || Promise.resolve(),
    ])
  }
}

// Create a singleton instance
export const rootStore = new RootStore()
