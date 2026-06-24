// MatchAction mechanic — Match-Action / Flow Table
// Visual: editable match-action rule table; test packets evaluated row-by-row.
// Shared engine used by: Modules B (SDN flow rules), C (VLAN/firewall), E (P4 tables).

import { useState } from 'react'
import type { Level } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Rule {
  id:     number
  match:  string
  action: string
}

interface MatchActionProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

/**
 * Stub for the Match-Action mechanic.
 * Will render an editable flow-table where players write match→action rules
 * and validate them against test packets.
 *
 * @param level      - Level config with template, pre-populated rules, and test packets
 * @param onComplete - Callback fired when the player's rule set passes validation
 */
export function MatchAction({ level, onComplete }: MatchActionProps) {
  const [rules, setRules] = useState<Rule[]>([
    { id: 1, match: 'ip_dst=10.0.0.1', action: 'forward(port=1)' },
    { id: 2, match: '*',               action: 'drop' },
  ])

  function addRule() {
    setRules((r) => [...r, { id: Date.now(), match: '', action: '' }])
  }

  function removeRule(id: number) {
    setRules((r) => r.filter((rule) => rule.id !== id))
  }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Mechanic — Match-Action Table</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* Flow table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-noc-border rounded overflow-hidden">
          <thead className="bg-noc-bg">
            <tr>
              <th className="px-3 py-2 text-left text-noc-muted font-medium w-8">#</th>
              <th className="px-3 py-2 text-left text-noc-muted font-medium">Match</th>
              <th className="px-3 py-2 text-left text-noc-muted font-medium">Action</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={rule.id} className="border-t border-noc-border hover:bg-noc-bg/50">
                <td className="px-3 py-2 text-noc-muted font-mono text-xs">{i + 1}</td>
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent font-mono text-xs text-link-packet outline-none placeholder:text-noc-border"
                    value={rule.match}
                    placeholder="ip_dst=10.0.0.0/24"
                    onChange={(e) =>
                      setRules((rs) => rs.map((r) => r.id === rule.id ? { ...r, match: e.target.value } : r))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent font-mono text-xs text-link-up outline-none placeholder:text-noc-border"
                    value={rule.action}
                    placeholder="forward(port=1)"
                    onChange={(e) =>
                      setRules((rs) => rs.map((r) => r.id === rule.id ? { ...r, action: e.target.value } : r))
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-noc-muted hover:text-link-down text-xs"
                    aria-label="Remove rule"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={addRule}>+ Add rule</Button>
        <Badge variant="idle">{rules.length} rule{rules.length !== 1 ? 's' : ''}</Badge>
      </div>

      <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
        🚧 Win condition: {level.winCondition}
      </p>

      <Button size="sm" onClick={() => onComplete(true, 0)}>
        Validate rules [Dev]
      </Button>
    </div>
  )
}
