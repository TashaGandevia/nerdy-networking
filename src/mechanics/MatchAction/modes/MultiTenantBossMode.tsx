// D-L04 Overlapping IP Boss
// Three tenants share infrastructure with overlapping IP ranges. Player
// assigns each tenant to a VNI (overlay) and writes per-tenant firewall
// rules. Live test runs cross-tenant + intra-tenant + LB reachability.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface Tenant {
  id:        string
  name:      string
  allowedPort: number    // tenant's TCP port for which traffic is allowed
}

interface Scenario {
  tenants:    Tenant[]
  vniOptions: number[]   // pool of VNIs to pick from (more than #tenants)
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeScenario(): Scenario {
  const tenantNames = ['Acme', 'Globex', 'Initech', 'Hooli']
  const ports       = [80, 443, 8080, 22, 3306]
  const tenants     = tenantNames.slice(0, 3).map((name, i) => ({
    id:          `t-${i + 1}`,
    name,
    allowedPort: ports[rand(0, ports.length - 1)],
  }))
  // Ensure each tenant has a distinct allowed port
  for (let i = 1; i < tenants.length; i++) {
    while (tenants.slice(0, i).some(t => t.allowedPort === tenants[i].allowedPort)) {
      tenants[i].allowedPort = ports[rand(0, ports.length - 1)]
    }
  }
  const vniOptions = [100, 200, 300, 400, 500].sort(() => Math.random() - 0.5).slice(0, 4)
  return { tenants, vniOptions }
}

const HINTS = [
  'Overlapping IPs only work if each tenant lives on its own overlay (VNI). Two tenants on the same VNI become indistinguishable.',
  'Firewall rules apply per-tenant — pick the TCP port the tenant *needs*; block everything else.',
]

interface Config {
  vniByTenant:    Record<string, number>
  fwPortByTenant: Record<string, number | 'all' | 'none'>
}

interface TestResult {
  desc:   string
  passed: boolean
}

function evaluate(scenario: Scenario, cfg: Config): { passed: boolean; results: TestResult[] } {
  const results: TestResult[] = []

  // 1. Each tenant on its own VNI (no collision)
  const vniCounts: Record<number, number> = {}
  for (const t of scenario.tenants) {
    const v = cfg.vniByTenant[t.id]
    if (!v) continue
    vniCounts[v] = (vniCounts[v] ?? 0) + 1
  }
  for (const t of scenario.tenants) {
    const v        = cfg.vniByTenant[t.id]
    const isolated = v !== undefined && (vniCounts[v] ?? 0) === 1
    results.push({
      desc:   `${t.name} isolated from other tenants (own VNI)`,
      passed: isolated,
    })
  }

  // 2. Each tenant can reach its own service on the allowed port
  for (const t of scenario.tenants) {
    const fw = cfg.fwPortByTenant[t.id]
    const ok = fw === 'all' || fw === t.allowedPort
    results.push({
      desc:   `${t.name} traffic on TCP/${t.allowedPort} allowed`,
      passed: ok,
    })
  }

  // 3. No "allow all" — each tenant must lock down to its own port (or close)
  for (const t of scenario.tenants) {
    const fw = cfg.fwPortByTenant[t.id]
    const tight = fw === t.allowedPort
    results.push({
      desc:   `${t.name} firewall blocks non-${t.allowedPort} traffic`,
      passed: tight,
    })
  }

  return { passed: results.every(r => r.passed), results }
}

export function MultiTenantBossMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [cfg, setCfg] = useState<Config>({ vniByTenant: {}, fwPortByTenant: {} })
  useEffect(() => { setCfg({ vniByTenant: {}, fwPortByTenant: {} }) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  const { passed, results } = evaluate(scenario, cfg)
  const fwPortOptions: (number | 'all' | 'none')[] = [80, 443, 8080, 22, 3306, 'all', 'none']

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Match-Action · Multi-Tenant Boss</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">{scenario.tenants.length} tenants</Badge>
        <Badge variant="idle">VNIs available: {scenario.vniOptions.join(', ')}</Badge>
      </div>

      {scenario.tenants.map((t) => (
        <div key={t.id} className="border border-noc-border rounded p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-2">
          <div>
            <p className="text-noc-bright font-semibold">{t.name}</p>
            <p className="text-noc-muted text-xs">Service runs on TCP/{t.allowedPort} · IP range 10.0.0.0/24 (overlaps)</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-mono">
            VNI:
            <select
              value={cfg.vniByTenant[t.id] ?? 0}
              onChange={(e) => setCfg(p => ({ ...p, vniByTenant: { ...p.vniByTenant, [t.id]: parseInt(e.target.value) || 0 } }))}
              className="bg-noc-bg border border-noc-border text-noc-text rounded px-2 py-1"
            >
              <option value={0}>—</option>
              {scenario.vniOptions.map((v) => <option key={v} value={v}>VNI {v}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-mono">
            firewall allow:
            <select
              value={cfg.fwPortByTenant[t.id] ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setCfg(p => ({
                  ...p,
                  fwPortByTenant: {
                    ...p.fwPortByTenant,
                    [t.id]: v === 'all' || v === 'none' ? v : (v === '' ? 'none' : parseInt(v)),
                  },
                }))
              }}
              className="bg-noc-bg border border-noc-border text-noc-text rounded px-2 py-1"
            >
              <option value="">—</option>
              {fwPortOptions.map((p) => <option key={String(p)} value={p}>{typeof p === 'number' ? `TCP/${p}` : p}</option>)}
            </select>
          </label>
        </div>
      ))}

      <div className="border border-noc-border rounded px-3 py-2 max-h-48 overflow-y-auto text-xs space-y-0.5 font-mono">
        {results.map((r, i) => (
          <p key={i} className={r.passed ? 'text-link-up' : 'text-link-down'}>
            {r.passed ? '✓' : '✗'} {r.desc}
          </p>
        ))}
      </div>

      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {HINTS.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={!passed} onClick={() => onComplete(true, hintIdx)}>Finish level</Button>
        {hintIdx < HINTS.length && (
          <Button size="sm" variant="ghost" onClick={() => setHintIdx(n => n + 1)}>
            Hint ({hintIdx + 1}/{HINTS.length})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>New scenario</Button>
      </div>
    </div>
  )
}
