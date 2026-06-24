// P4Pipeline mechanic — dispatcher. Per-level builder modes.

import type { Level } from '@/types'
import { ParserMode }       from './modes/ParserMode'
import { LpmTableMode }     from './modes/LpmTableMode'
import { ActionBlockMode }  from './modes/ActionBlockMode'
import { MultiTableMode }   from './modes/MultiTableMode'
import { IntTagMode }       from './modes/IntTagMode'
import { FullPipelineMode } from './modes/FullPipelineMode'

interface Props {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

export function P4Pipeline({ level, onComplete }: Props) {
  switch (level.id) {
    case 'E-L01': return <ParserMode       level={level} onComplete={onComplete} />
    case 'E-L02': return <LpmTableMode     level={level} onComplete={onComplete} />
    case 'E-L03': return <ActionBlockMode  level={level} onComplete={onComplete} />
    case 'E-L04': return <MultiTableMode   level={level} onComplete={onComplete} />
    case 'E-L05': return <IntTagMode       level={level} onComplete={onComplete} />
    case 'E-L06': return <FullPipelineMode level={level} onComplete={onComplete} />
    default:
      return (
        <div className="noc-card p-6">
          <p className="text-noc-muted text-sm">
            No P4 Pipeline mode wired for level {level.id}.
          </p>
        </div>
      )
  }
}
