'use client'

import { useHashRoute } from '@/hooks/use-route'
import { LandingView } from '@/components/views/landing-view'
import { CreateGroupView } from '@/components/views/create-group-view'
import { JoinView, JoinGroupView } from '@/components/views/join-group-view'
import { LoginView } from '@/components/views/login-view'
import { GroupDashboardView } from '@/components/views/group-dashboard-view'
import { AdminLoginView, AdminDashboardView } from '@/components/views/admin-panel'

export default function Home() {
  const [route] = useHashRoute()

  switch (route.name) {
    case 'landing':
      return <LandingView />
    case 'create':
      return <CreateGroupView />
    case 'join':
      return <JoinView />
    case 'join-code':
      return <JoinGroupView code={route.params!.code} />
    case 'login':
      return <LoginView />
    case 'group':
      return <GroupDashboardView code={route.params!.code} />
    case 'admin-login':
      return <AdminLoginView />
    case 'admin':
      return <AdminDashboardView code={route.params!.code} />
    default:
      return <LandingView />
  }
}
