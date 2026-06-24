// C-L02 One Switch, Four Roles
// The same bare-metal switch is reconfigured by changing its flow table only.
// Player picks the right *role rule set* for each of four scenarios. We score
// per scenario; pass when all four roles answered correctly.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type Role = 'l2' | 'router' | 'firewall' | 'nat'

interface RoleQuestion {
  id:       Role
  prompt:   string
  options:  { text: string; correct: boolean }[]
}

const ALL_OPTIONS: Record<Role, RoleQuestion> = {
  l2: {
    id: 'l2', prompt: 'L2 switch — flood unknowns, learn MAC↔port. Which rule set?',
    options: [
      { text: 'match: eth_dst=*  → flood_all; learn(src_mac→in_port)',                       correct: true  },
      { text: 'match: ip_dst=*   → forward(longest_prefix)',                                  correct: false },
      { text: 'match: tcp_dport=22 → drop ; * → forward',                                     correct: false },
    ],
  },
  router: {
    id: 'router', prompt: 'IP router — longest-prefix match on destination subnet. Which rule set?',
    options: [
      { text: 'match: ip_dst=10.1.0.0/16 → forward(p1) ; ip_dst=10.2.0.0/16 → forward(p2)',   correct: true  },
      { text: 'match: eth_dst=*  → flood_all',                                                correct: false },
      { text: 'match: tcp_dport=80 → set_dst_ip(10.0.0.1)',                                   correct: false },
    ],
  },
  firewall: {
    id: 'firewall', prompt: 'Firewall — block external SSH attempts, allow everything else. Which rule set?',
    options: [
      { text: 'match: in_port=WAN, tcp_dport=22 → drop ; * → forward',                        correct: true  },
      { text: 'match: ip_dst=10.0.0.0/8 → forward(p1)',                                       correct: false },
      { text: 'match: eth_dst=* → flood_all',                                                 correct: false },
    ],
  },
  nat: {
    id: 'nat', prompt: 'NAT — rewrite private→public on egress, reverse on ingress. Which rule set?',
    options: [
      { text: 'match: in_port=LAN, ip_src=10.0.0.0/8 → set_src_ip(PUBLIC), set_src_port(...)', correct: true  },
      { text: 'match: ip_dst=* → forward(longest_prefix)',                                    correct: false },
      { text: 'match: eth_src=* → learn(src_mac→in_port)',                                    correct: false },
    ],
  },
}

const ROLES: Role[] = ['l2', 'router', 'firewall', 'nat']

const HINTS = [
  'The only thing that changes between roles is the match-action rules — the hardware stays put.',
  'Each role keys on a different header layer: L2 = MAC, router = IP prefix, firewall = port + direction, NAT = IP/port rewrite.',
]

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

interface Scenario { questions: { role: Role; shuffledOptions: { text: string; correct: boolean }[] }[] }

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i); [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makeScenario(): Scenario {
  return {
    questions: shuffle(ROLES).map((role) => ({
      role,
      shuffledOptions: shuffle(ALL_OPTIONS[role].options),
    })),
  }
}

export function MultiRoleMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])

  const [answers, setAnswers] = useState<Record<Role, number | null>>({} as Record<Role, number | null>)
  useEffect(() => { setAnswers({} as Record<Role, number | null>) }, [scenario])

  const [hintIdx, setHintIdx] = useState(0)

  const correct = scenario.questions.filter((q) => {
    const a = answers[q.role]
    return a !== null && a !== undefined && q.shuffledOptions[a]?.correct
  }).length
  const passed = correct === scenario.questions.length

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Match-Action · Multi-Role</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">4 roles</Badge>
        <Badge variant="idle">{correct} / 4 correct</Badge>
      </div>

      {scenario.questions.map((q, qi) => {
        const a       = answers[q.role]
        const decided = a !== null && a !== undefined
        return (
          <div key={q.role} className="border border-noc-border rounded p-3 flex flex-col gap-2">
            <p className="text-noc-bright text-sm font-semibold">
              {qi + 1}. {ALL_OPTIONS[q.role].prompt}
            </p>
            {q.shuffledOptions.map((opt, oi) => {
              const picked = a === oi
              const right  = decided && opt.correct
              const wrong  = decided && picked && !opt.correct
              return (
                <button
                  key={oi}
                  onClick={() => setAnswers((p) => ({ ...p, [q.role]: oi }))}
                  className={`text-left text-xs font-mono px-3 py-2 rounded border transition-colors ${
                    right ? 'border-link-up text-link-up'
                    : wrong ? 'border-link-down text-link-down'
                    : picked ? 'border-link-packet text-link-packet'
                    : 'border-noc-border text-noc-text hover:border-noc-text'
                  }`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
        )
      })}

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
