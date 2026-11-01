import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/app/AppLayout'
import { createQueryClient } from '@/app/queryClient'
import {
  AccessRoute,
  OverviewRoute,
  ProjectsRoute,
  RepositoriesRoute,
  SettingsRoute,
} from '@/app/routes'
import AuditPage from '@/features/audit/AuditPage'
import AuthProvider from '@/features/auth/AuthProvider'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import LoginPage from '@/features/auth/LoginPage'
import OrganizationPage from '@/features/auth/OrganizationPage'
import SignupPage from '@/features/auth/SignupPage'
import ToastProvider from '@/shared/ui/ToastProvider'

// A landing é grande e não faz parte do sistema: só carrega quando alguém abre /landing
const LandingPage = lazy(() => import('@/landing/LandingPage'))

export default function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<SignupPage />} />
            <Route path="/organizacao" element={<OrganizationPage />} />
            <Route
              path="/landing"
              element={
                <Suspense fallback={null}>
                  <LandingPage />
                </Suspense>
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<OverviewRoute />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/repositories" element={<RepositoriesRoute />} />
                <Route path="/projects" element={<ProjectsRoute />} />
                <Route path="/access" element={<AccessRoute />} />
                <Route path="/settings" element={<SettingsRoute />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
