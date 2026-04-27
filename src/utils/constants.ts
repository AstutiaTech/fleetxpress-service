export const DEV_URL = process.env.NEXT_PUBLIC_DEV_URL
export const PROD_URL = process.env.NEXT_PUBLIC_LIVE_URL
export const API_URL = process.env.NODE_ENV === "development" ? DEV_URL : PROD_URL