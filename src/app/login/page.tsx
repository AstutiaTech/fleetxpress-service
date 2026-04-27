"use client"

import { Mail, User } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { OTPInput } from "@/components/otp-input"
import { Switch } from "@/components/ui/switch"
import { buildImageUrl } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

export default observer(function LoginPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { authStore, settingsStore } = useStore()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Load settings on mount if not already loaded
  useEffect(() => {
    if (!settingsStore.generalSettings && !settingsStore.isLoading) {
      settingsStore.fetchGeneralSettings()
    }
  }, [settingsStore])

  // Reset image error when logo changes
  useEffect(() => {
    setImageError(false)
  }, [settingsStore.logo])

  // Redirect if already authenticated - but let auth guard handle navigation after login
  useEffect(() => {
    // Only auto-redirect if we're on login page and authenticated
    // This prevents conflicts with auth guard
    if (authStore.isAuthenticated && pathname === "/login") {
      // const redirectPath = authStore.redirectAfterLogin || "/dashboard"
      // // Use replace to avoid adding to history and prevent loops
      // router.replace(redirectPath)
      // // Clear the redirect path after using it
      // if (authStore.redirectAfterLogin) {
      //   authStore.setRedirectAfterLogin("/dashboard")
      // }
      window.location.replace("/dashboard")
    }
  }, [authStore.isAuthenticated, pathname, router])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) return

    setIsLoading(true)
    const result = await authStore.requestOTP(email)
    setIsLoading(false)

    if (result.success) {
      setStep("otp")
      setOtp(result.token || "")
      setResendCountdown(30)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 4) return

    setIsLoading(true)
    const result = await authStore.verifyOTP(otp, rememberMe)
    setIsLoading(false)

    if (result.success) {
      // Let auth guard handle the redirect to avoid race conditions
      // The redirect will happen automatically via the auth guard after state updates
      // Small delay to ensure state is persisted
      setTimeout(() => {
        // router.replace(authStore.redirectAfterLogin || "/dashboard")
        window.location.replace("/dashboard")
      }, 100)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return

    setIsLoading(true)
    const result = await authStore.requestOTP(email)
    setIsLoading(false)

    if (result.success) {
      setOtp("")
      setResendCountdown(30)
    }
  }

  const handleChangeEmail = () => {
    setStep("email")
    setOtp("")
    authStore.resetOTPFlow()
  }

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log("Google login clicked")
  }

  const handleRoleClick = (role: string) => {
    const roleEmails: Record<string, string> = {
      "Super admin": "3fsuperjohn@mailinator.com",
      "Admin": "3fjohn@mailinator.com",
      "Manager": "manager@mailinator.com",
      "Agent": "agent@mailinator.com",
      "Driver": "driver@mailinator.com",
      "Customer": "3fcustomer@mailinator.com",
    }

    const email = roleEmails[role]
    if (email) {
      setEmail(email)
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white py-4">
      {/* Left Section: Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-6">
        <div className="w-full md:w-2/3 lg:w-4/5 xl:w-1/2 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative h-14 w-14 rounded-lg flex items-center justify-center shadow-lg bg-white">
              {!imageError && settingsStore.logo ? (
                <Image
                  src={buildImageUrl(settingsStore.logo)}
                  alt="Logo"
                  width={56}
                  height={56}
                  className="object-contain p-2"
                  priority
                  onError={() => {
                    setImageError(true)
                  }}
                  unoptimized={buildImageUrl(settingsStore.logo).startsWith("http")}
                />
              ) : (
                <Image
                  src="/images/icon-512x512.png"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="object-contain p-2"
                  priority
                  onError={() => {
                    // If fallback also fails, show nothing
                    setImageError(true)
                  }}
                />
              )}
            </div>
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Welcome Message */}
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  WELCOME BACK! 👋
                </h1>
                <p className="text-sm leading-relaxed text-gray-600">
                  We&apos;re glad to see you again. Log in to access your account and carry out your business.
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  leftIcon={<Mail className="h-4 w-4 text-gray-400 group-focus:text-primary transition-colors" />}
                  className="h-12 border-gray-300 focus:border-primary focus:ring-primary group pl-8 text-black"
                />
              </div>

              {/* Demo purposes only */}
              {process.env.NODE_ENV === "development" && (
                <div className="w-full flex-row flex-wrap gap-2">
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Super admin")}>
                    <User className="h-4 w-4" />
                    Super admin
                  </Button>
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Admin")}>
                    Admin
                  </Button>
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Manager")}>
                    Manager
                  </Button>
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Agent")}>
                    Agent
                  </Button>
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Driver")}>
                    Driver
                  </Button>
                  <Button variant="outline" type="button" onClick={() => handleRoleClick("Customer")}>
                    Customer
                  </Button>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=unchecked]:border-black data-[state=unchecked]:bg-black"
                    thumbClassName="data-[state=checked]:bg-white data-[state=unchecked]:border-primary"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-lg"
              >
                {isLoading ? "Sending..." : "Log In"}
              </Button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600">
                Just want to track a shipment?
                <button
                  type="button"
                  onClick={() => router.push("/shipment-tracking")}
                  className="font-medium text-primary hover:text-primary/90 hover:underline"
                >
                  &nbsp;Track Shipment
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              {/* Welcome Message */}
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  WELCOME BACK! 👋
                </h1>
                <p className="text-sm leading-relaxed text-gray-600">
                  We sent a verification code to{" "}
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <OTPInput
                  length={4}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                  className="justify-center"
                />
              </div>

              {/* Change Email & Resend */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  className="text-sm text-primary hover:text-primary/90 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Resend code"}
                </button>
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 4}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-lg"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Section: Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-l-3xl shadow-2xl shadow-black/45">
        <div className="absolute inset-0 bg-linear-to-br from-orange-400 via-orange-500 to-red-600">
          {/* Placeholder for background image - you can replace this with your actual image */}
          <div className="absolute inset-0 bg-[url('/images/haulage_bg.jpg')] bg-cover bg-center opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20"></div>
        </div>
        {/* You can add the actual logistics image here */}
        <div className="relative h-full w-full flex items-center justify-center">
          <div className="text-center text-white p-12 space-y-4">
            <h2 className="text-4xl font-bold">{settingsStore.applicationName}</h2>
            <p className="text-xl opacity-90">
              {settingsStore.about}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
