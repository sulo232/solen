import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default async function DashboardRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'salon_owner') {
    redirect(`/${locale}/account`)
  }

  return (
    <DashboardLayout
      locale={locale}
      userDisplayName={profile.display_name ?? user.email ?? ''}
      userAvatarUrl={profile.avatar_url ?? null}
    >
      {children}
    </DashboardLayout>
  )
}
