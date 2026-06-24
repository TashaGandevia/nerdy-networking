// AppShell — root layout: sidebar left, top bar + page content right

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar }  from './TopBar'

interface AppShellProps {
  children: ReactNode
}

/**
 * Wraps every page in the NOC dashboard layout:
 * fixed sidebar on the left, top bar + scrollable content area on the right.
 *
 * @param children - The page content rendered in the main area
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-noc-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
