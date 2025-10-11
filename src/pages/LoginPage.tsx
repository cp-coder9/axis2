import { ProductionAuthForm } from '@/components/auth/ProductionAuthForm'
import { UserRole } from '@/types'

export default function LoginPage() {
  const handleRoleRedirect = (role: UserRole) => {
    // This will be handled by the AuthGuard and RoleRouter components
    console.log('User authenticated with role:', role)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ProductionAuthForm onRoleRedirect={handleRoleRedirect} />
      </div>
    </div>
  )
}