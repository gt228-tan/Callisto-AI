import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { GlobalSearch } from './GlobalSearch'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-bg-primary">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  )
}
