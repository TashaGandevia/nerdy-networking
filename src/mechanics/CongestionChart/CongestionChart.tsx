// CongestionChart mechanic — dispatcher.
// Picks the right interaction mode for each Module A level based on level.id
// (we key off the level ID rather than the setup.mode string so each level
// can have a purpose-built UI with its own win condition).

import type { Level } from '@/types'
import { PredictMode }      from './modes/PredictMode'
import { DiagnoseMode }     from './modes/DiagnoseMode'
import { OneOverSqrtPMode } from './modes/OneOverSqrtPMode'
import { LongFatPipeMode }  from './modes/LongFatPipeMode'
import { FairnessMode }     from './modes/FairnessMode'
import { DCTCPBossMode }    from './modes/DCTCPBossMode'

interface CongestionChartProps {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

export function CongestionChart({ level, onComplete }: CongestionChartProps) {
  switch (level.id) {
    case 'A-L01': return <PredictMode      level={level} onComplete={onComplete} />
    case 'A-L02': return <DiagnoseMode     level={level} onComplete={onComplete} />
    case 'A-L03': return <OneOverSqrtPMode level={level} onComplete={onComplete} />
    case 'A-L04': return <LongFatPipeMode  level={level} onComplete={onComplete} />
    case 'A-L05': return <FairnessMode     level={level} onComplete={onComplete} />
    case 'A-L06': return <DCTCPBossMode    level={level} onComplete={onComplete} />
    default:
      return (
        <div className="noc-card p-6">
          <p className="text-noc-muted text-sm">
            No Congestion Chart mode wired up for level {level.id}.
          </p>
        </div>
      )
  }
}
