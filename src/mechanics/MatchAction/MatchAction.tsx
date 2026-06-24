// MatchAction mechanic — dispatcher. Each level gets a purpose-built editor.

import type { Level } from '@/types'
import { InstallFirstFlowMode } from './modes/InstallFirstFlowMode'
import { MultiRoleMode }        from './modes/MultiRoleMode'
import { ServiceChainMode }     from './modes/ServiceChainMode'
import { VlanPortMode }         from './modes/VlanPortMode'
import { MultiTenantBossMode }  from './modes/MultiTenantBossMode'

interface MatchActionProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

export function MatchAction({ level, onComplete }: MatchActionProps) {
  switch (level.id) {
    case 'C-L01': return <InstallFirstFlowMode level={level} onComplete={onComplete} />
    case 'C-L02': return <MultiRoleMode        level={level} onComplete={onComplete} />
    case 'C-L04': return <ServiceChainMode     level={level} onComplete={onComplete} />
    case 'D-L01': return <VlanPortMode         level={level} onComplete={onComplete} />
    case 'D-L04': return <MultiTenantBossMode  level={level} onComplete={onComplete} />
    default:
      return (
        <div className="noc-card p-6">
          <p className="text-noc-muted text-sm">
            No Match-Action mode wired for level {level.id}.
          </p>
        </div>
      )
  }
}
