import { Suspense } from "react"
import Navigation from "@/components/navigation"
import ResetPasswordClient from "./ResetPasswordClient"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F9F9] to-[#1F8D9D]/10">
      <Navigation />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-playfair font-bold text-[#1B1B1B] mb-2">Reset Password</h2>
            <p className="text-gray-600">Enter your new password</p>
          </div>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ResetPasswordClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
