import { useMemo, useState } from 'react'
import type { Level } from '@/types'

interface Props {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

type MissionId =
  | 'why-sdn'
  | 'planes'
  | 'flow-rule'
  | 'generalized-forwarding'
  | 'controller-event'
  | 'stack'
  | 'admin'
  | 'growth'
  | 'packet-dissection'
  | 'topology-graph'
  | 'routing-explorer'
  | 'flow-optimizer'
  | 'network-os'
  | 'packet-race'

interface MissionCopy {
  short: string
  objective: string
  hint: string
  correct: string
  concept: string
}

const MISSIONS: Record<MissionId, MissionCopy> = {
  'why-sdn': {
    short: 'Why SDN?',
    objective: 'Convert this distributed network into an SDN architecture.',
    hint: 'Separate decision-making from packet forwarding. The switches can become simpler when one component has a network-wide view.',
    correct: 'Move routing decisions to a logically centralized controller; keep packet forwarding in the switches.',
    concept: 'SDN separates the control plane from the data plane. A controller computes policy with a network-wide view, while switches execute installed rules.',
  },
  planes: {
    short: 'Control vs Data',
    objective: 'Assign every component to its correct plane.',
    hint: 'Ask whether the component decides what should happen, or performs forwarding on real packets.',
    correct: 'Control: Controller, Network OS, Control Apps. Data: Flow Table, Switch, Packets.',
    concept: 'The control plane computes and distributes decisions. The data plane handles packets at line rate by applying flow-table entries.',
  },
  'flow-rule': {
    short: 'Build a Flow Rule',
    objective: 'Send packets for 51.6.0.8 out switch port 6.',
    hint: 'The destination identifies where the packet is going. Match that header, then choose the requested egress port.',
    correct: 'Match: Destination IP = 51.6.0.8. Action: Forward to Port 6.',
    concept: 'A flow entry combines a match with an action. The first matching rule tells the switch how to handle the packet.',
  },
  'generalized-forwarding': {
    short: 'Generalized Forwarding',
    objective: 'Block SSH traffic without blocking other TCP applications.',
    hint: 'SSH has a well-known TCP destination port. A firewall rule should match that field precisely.',
    correct: 'Match: TCP Destination Port = 22. Action: Drop.',
    concept: 'Generalized forwarding can match across L2, L3, and L4 headers, then forward, drop, modify, or send packets to the controller.',
  },
  'controller-event': {
    short: 'Controller Event',
    objective: 'A core link failed. Choose the component that restores connectivity.',
    hint: 'The switches report the event, but the component with the network-wide topology computes replacement paths.',
    correct: 'The SDN Controller recalculates the path and pushes new flow rules to affected switches.',
    concept: 'A switch reports a port-status event. The controller recomputes affected paths, sends flow modifications, and the data plane resumes forwarding.',
  },
  stack: {
    short: 'Build the SDN Stack',
    objective: 'Order the architecture from business intent down to physical endpoints.',
    hint: 'Applications sit above the controller. Switches sit below it. Northbound faces apps; southbound faces switches.',
    correct: 'Control Apps → Northbound API → Network OS → Southbound API → Switches → Hosts.',
    concept: 'Northbound APIs expose controller services to applications. Southbound APIs such as OpenFlow let the controller program switches.',
  },
  admin: {
    short: 'Network Administrator',
    objective: 'Protect the payroll service and keep it reachable after a link failure.',
    hint: 'Use the application port for the policy, then let the component with a global topology view handle recovery.',
    correct: 'Forward TCP destination port 443 to Port 4, and have the controller recompute and install the backup path.',
    concept: 'Real SDN applications combine policy and event response: precise match-action rules enforce intent, while the controller adapts those rules when topology changes.',
  },
  growth: {
    short: 'NovaNet Growth Crisis',
    objective: 'Scale the network until manual operations hit their limit.',
    hint: 'Growth is not just a device count. Add the middleboxes and routing equipment a production service needs.',
    correct: 'Add at least six network functions and observe the configuration effort grow faster than the network.',
    concept: 'Forwarding itself is tractable; coordinating policy across many independently configured boxes is the scaling problem SDN addresses.',
  },
  'packet-dissection': {
    short: 'Packet Dissection',
    objective: 'Rebuild the encapsulated packet from outer frame to application data.',
    hint: 'A frame carries a network-layer packet, which carries a transport segment, which carries application data.',
    correct: 'Ethernet → IP → TCP → Payload.',
    concept: 'Each protocol layer adds a header. Generalized forwarding exposes fields from several layers to one programmable match-action pipeline.',
  },
  'topology-graph': {
    short: 'Build the Logical Graph',
    objective: 'Connect the controller to Host A and Host B through the switch graph.',
    hint: 'Endpoints attach to edge switches, switches connect to each other, and the controller needs a control relationship with the network.',
    correct: 'Host A—SW1, SW1—SW2, SW2—Host B, and Controller—SW2.',
    concept: 'The network operating system maintains a graph abstraction of nodes and links. Applications compute paths and policy against that graph.',
  },
  'routing-explorer': {
    short: 'Routing Explorer',
    objective: 'Choose the lowest-latency route that avoids failed links.',
    hint: 'A nominally short route is useless when one of its links is down. Compare both health and total latency.',
    correct: 'Blue path: 14 ms, 8 Gbps, all links healthy.',
    concept: 'A controller can optimize against global metrics such as latency, capacity, policy, and failures—not only distributed shortest-path cost.',
  },
  'flow-optimizer': {
    short: 'Flow Rule Optimizer',
    objective: 'Replace four host rules with one equivalent wildcard entry.',
    hint: 'The four destinations share the same first three octets and the same action.',
    correct: '10.0.1.* → Forward Port 3.',
    concept: 'Wildcards and masks compress equivalent entries, conserving scarce TCAM while preserving forwarding behavior.',
  },
  'network-os': {
    short: 'Network OS Dashboard',
    objective: 'Enable secure, load-balanced, shortest-path service for NovaNet.',
    hint: 'The request names three separate jobs: path computation, access control, and backend distribution.',
    correct: 'Enable Routing, Firewall, and Load Balancer.',
    concept: 'A network operating system provides shared topology, state, and programming services so independent control applications can compose network behavior.',
  },
  'packet-race': {
    short: 'Datacenter Packet Race',
    objective: 'Predict all three outcomes before replaying the programmed network.',
    hint: 'Match the most specific policy first: SSH is forbidden, payroll HTTPS has a dedicated port, and DNS is redirected.',
    correct: 'SSH → Drop; HTTPS → Payroll / Port 4; DNS → Resolver / Port 6.',
    concept: 'Priority resolves overlapping rules. A packet follows the highest-priority matching entry, making table order and specificity part of network correctness.',
  },
}

const PLANE_COMPONENTS = ['Controller', 'Network OS', 'Control Apps', 'Flow Table', 'Switch', 'Packets'] as const
type PlaneComponent = typeof PLANE_COMPONENTS[number]
type Plane = 'control' | 'data'

const EXPECTED_PLANE: Record<PlaneComponent, Plane> = {
  Controller: 'control',
  'Network OS': 'control',
  'Control Apps': 'control',
  'Flow Table': 'data',
  Switch: 'data',
  Packets: 'data',
}

const CORRECT_STACK = ['Control Apps', 'Northbound API', 'Network OS', 'Southbound API', 'Switches', 'Hosts']
const CORRECT_LAYERS = ['Ethernet', 'IP', 'TCP', 'Payload']
const REQUIRED_LINKS = ['Host A—SW1', 'SW1—SW2', 'SW2—Host B', 'Controller—SW2']
const TOTAL_MISSIONS = 14

function choiceClass(selected: boolean) {
  return `w-full rounded-lg border px-3 py-3 text-left text-sm transition-colors ${selected
    ? 'border-link-packet bg-link-packet/15 text-noc-bright'
    : 'border-noc-border bg-noc-bg/50 text-noc-text hover:border-noc-muted'}`
}

export function SDNSimulator({ level, onComplete }: Props) {
  const mission = (level.setup.mission ?? 'why-sdn') as MissionId
  const copy = MISSIONS[mission]
  const missionNumber = Number(level.id.split('L')[1]) || 1
  const rank = missionNumber >= 14 ? 'Principal Network Engineer'
    : missionNumber >= 13 ? 'Datacenter Engineer'
    : missionNumber >= 11 ? 'Network Architect'
    : missionNumber >= 8 ? 'Controller Administrator'
    : missionNumber >= 5 ? 'SDN Engineer'
    : missionNumber >= 3 ? 'Junior Network Engineer'
    : 'Intern'

  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<'first' | 'second' | null>(null)
  const [showConcept, setShowConcept] = useState(false)
  const [solved, setSolved] = useState(false)
  const [choice, setChoice] = useState('')
  const [planeAssignments, setPlaneAssignments] = useState<Partial<Record<PlaneComponent, Plane>>>({})
  const [heldComponent, setHeldComponent] = useState<PlaneComponent | null>(null)
  const [matchField, setMatchField] = useState('')
  const [matchValue, setMatchValue] = useState('')
  const [action, setAction] = useState('')
  const [outPort, setOutPort] = useState('')
  const [stack, setStack] = useState(['Switches', 'Control Apps', 'Hosts', 'Network OS', 'Southbound API', 'Northbound API'])
  const [adminRecovery, setAdminRecovery] = useState('')
  const [growthDevices, setGrowthDevices] = useState<string[]>([])
  const [layerStack, setLayerStack] = useState(['Payload', 'Ethernet', 'TCP', 'IP'])
  const [topologyLinks, setTopologyLinks] = useState<string[]>([])
  const [enabledApps, setEnabledApps] = useState<string[]>([])
  const [raceAnswers, setRaceAnswers] = useState<Record<string, string>>({})

  const flowRows = useMemo(() => {
    if (mission === 'generalized-forwarding') return [['TCP dst = 80', 'Forward: 3', '31'], ['TCP dst = 22', '—', '0']]
    if (mission === 'admin') return [['IP dst = payroll', 'Forward: 4', '28'], ['Backup path', 'Standby', '0']]
    return [['IP dst = 10.0.1.10', 'Forward: 2', '32'], ['IP dst = 10.0.2.2', 'Forward: 3', '21']]
  }, [mission])

  function submit(correct: boolean) {
    if (correct) {
      setSolved(true)
      setShowConcept(true)
      return
    }
    if (attempts === 0) {
      setAttempts(1)
      setFeedback('first')
    } else {
      setAttempts(2)
      setFeedback('second')
    }
  }

  function assignPlane(plane: Plane) {
    if (!heldComponent) return
    setPlaneAssignments((current) => ({ ...current, [heldComponent]: plane }))
    setHeldComponent(null)
  }

  function moveStack(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= stack.length) return
    setStack((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function moveLayer(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= layerStack.length) return
    setLayerStack((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function toggleValue(value: string, values: string[], setValues: (next: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  function checkMission() {
    if (mission === 'why-sdn') submit(choice === 'centralized')
    if (mission === 'planes') {
      submit(PLANE_COMPONENTS.every((component) => planeAssignments[component] === EXPECTED_PLANE[component]))
    }
    if (mission === 'flow-rule') {
      submit(matchField === 'ip_dst' && matchValue.trim() === '51.6.0.8' && action === 'forward' && outPort === '6')
    }
    if (mission === 'generalized-forwarding') {
      submit(matchField === 'tcp_dst' && matchValue.trim() === '22' && action === 'drop')
    }
    if (mission === 'controller-event') submit(choice === 'controller')
    if (mission === 'stack') submit(stack.every((item, index) => item === CORRECT_STACK[index]))
    if (mission === 'admin') {
      submit(matchField === 'tcp_dst' && matchValue.trim() === '443' && action === 'forward' && outPort === '4' && adminRecovery === 'controller')
    }
    if (mission === 'growth') submit(growthDevices.length >= 6)
    if (mission === 'packet-dissection') submit(layerStack.every((item, index) => item === CORRECT_LAYERS[index]))
    if (mission === 'topology-graph') submit(REQUIRED_LINKS.every((link) => topologyLinks.includes(link)))
    if (mission === 'routing-explorer') submit(choice === 'blue')
    if (mission === 'flow-optimizer') submit(choice === '10.0.1.*')
    if (mission === 'network-os') submit(['Routing', 'Firewall', 'Load Balancer'].every((app) => enabledApps.includes(app)))
    if (mission === 'packet-race') submit(raceAnswers.ssh === 'drop' && raceAnswers.https === 'port4' && raceAnswers.dns === 'port6')
  }

  function continueAfterReveal() {
    setFeedback(null)
    setSolved(true)
    setShowConcept(true)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-noc-border bg-noc-surface shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-noc-border bg-gradient-to-r from-[#111c2b] to-noc-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-link-packet/40 bg-link-packet/10 text-lg">⌁</div>
          <div>
            <p className="text-sm font-bold tracking-wide text-noc-bright">SDN CONTROLLER LAB</p>
            <p className="text-[10px] text-noc-muted">Become the Network Controller</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-noc-muted">Mission</p>
          <p className="text-sm font-semibold text-link-congested">{copy.objective}</p>
          <p className="mt-0.5 text-[10px] text-module-c">NovaNet rank · {rank}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded bg-link-packet/15 px-2 py-1 font-mono text-link-packet">{missionNumber} / {TOTAL_MISSIONS}</span>
          <span className="text-noc-text">XP <b className="text-link-congested">{420 - attempts * 60}</b></span>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-lg border border-noc-border bg-noc-bg/45 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-noc-muted">Live network</p>
              <div className="flex gap-3 text-[10px] text-noc-muted">
                <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-link-up" />Link up</span>
                <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-link-packet" />Packet</span>
                {mission === 'controller-event' && <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-link-down" />Failed</span>}
              </div>
            </div>
            <NetworkScene failedLink={mission === 'controller-event' || mission === 'admin'} solved={solved} />
          </section>

          <section className="overflow-hidden rounded-lg border border-noc-border">
            <div className="flex items-center justify-between border-b border-noc-border bg-noc-bg/60 px-3 py-2">
              <p className="text-xs font-semibold text-noc-bright">Flow Table <span className="font-normal text-noc-muted">(SW2)</span></p>
              <span className={`text-[10px] ${solved ? 'text-link-up' : 'text-noc-muted'}`}>{solved ? '● POLICY ACTIVE' : '○ WAITING FOR POLICY'}</span>
            </div>
            <div className="grid grid-cols-[1.4fr_1fr_auto] bg-noc-border/40 text-[10px] font-semibold uppercase tracking-wider text-noc-muted">
              <span className="px-3 py-2">Match</span><span className="px-3 py-2">Action</span><span className="px-3 py-2">Packets</span>
            </div>
            {flowRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.4fr_1fr_auto] border-t border-noc-border/70 text-xs text-noc-text">
                {row.map((cell) => <span key={cell} className="px-3 py-2 font-mono">{cell}</span>)}
              </div>
            ))}
          </section>
        </div>

        <section className="flex min-h-[420px] flex-col rounded-lg border border-noc-border bg-noc-bg/35">
          <div className="border-b border-noc-border px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-module-c">Mission {missionNumber}</p>
            <h2 className="mt-1 text-lg font-semibold text-noc-bright">{copy.short}</h2>
            <p className="mt-1 text-xs leading-relaxed text-noc-muted">{level.intent}</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <MissionChallenge
              mission={mission}
              choice={choice}
              setChoice={setChoice}
              planeAssignments={planeAssignments}
              heldComponent={heldComponent}
              setHeldComponent={setHeldComponent}
              assignPlane={assignPlane}
              matchField={matchField}
              setMatchField={setMatchField}
              matchValue={matchValue}
              setMatchValue={setMatchValue}
              action={action}
              setAction={setAction}
              outPort={outPort}
              setOutPort={setOutPort}
              stack={stack}
              moveStack={moveStack}
              adminRecovery={adminRecovery}
              setAdminRecovery={setAdminRecovery}
              growthDevices={growthDevices}
              addGrowthDevice={(device) => setGrowthDevices((current) => [...current, `${device}-${current.length}`])}
              layerStack={layerStack}
              moveLayer={moveLayer}
              topologyLinks={topologyLinks}
              toggleTopologyLink={(link) => toggleValue(link, topologyLinks, setTopologyLinks)}
              enabledApps={enabledApps}
              toggleApp={(app) => toggleValue(app, enabledApps, setEnabledApps)}
              raceAnswers={raceAnswers}
              setRaceAnswer={(packet, result) => setRaceAnswers((current) => ({ ...current, [packet]: result }))}
            />
            <button
              onClick={checkMission}
              className="mt-auto rounded-lg bg-link-up px-4 py-3 text-sm font-bold text-[#07130a] transition-colors hover:bg-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-up"
            >
              {mission === 'flow-rule' || mission === 'generalized-forwarding' || mission === 'admin' ? 'Install & Test Rule' : 'Submit Answer'}
            </button>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 border-t border-noc-border bg-noc-bg/40 px-4 py-3">
        <span className="text-[10px] uppercase tracking-widest text-noc-muted">Module progress</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-noc-border">
          <div className="h-full rounded-full bg-module-c transition-all" style={{ width: `${(missionNumber / TOTAL_MISSIONS) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-module-c">{Math.round((missionNumber / TOTAL_MISSIONS) * 100)}%</span>
      </div>

      {feedback && (
        <FeedbackModal
          kind={feedback}
          copy={copy}
          onRetry={() => setFeedback(null)}
          onContinue={continueAfterReveal}
        />
      )}

      {showConcept && (
        <ConceptModal
          title={copy.short}
          concept={copy.concept}
          onDone={() => {
            setShowConcept(false)
            onComplete(true, attempts)
          }}
        />
      )}
    </div>
  )
}

interface ChallengeProps {
  mission: MissionId
  choice: string
  setChoice: (value: string) => void
  planeAssignments: Partial<Record<PlaneComponent, Plane>>
  heldComponent: PlaneComponent | null
  setHeldComponent: (value: PlaneComponent | null) => void
  assignPlane: (plane: Plane) => void
  matchField: string
  setMatchField: (value: string) => void
  matchValue: string
  setMatchValue: (value: string) => void
  action: string
  setAction: (value: string) => void
  outPort: string
  setOutPort: (value: string) => void
  stack: string[]
  moveStack: (index: number, direction: -1 | 1) => void
  adminRecovery: string
  setAdminRecovery: (value: string) => void
  growthDevices: string[]
  addGrowthDevice: (device: string) => void
  layerStack: string[]
  moveLayer: (index: number, direction: -1 | 1) => void
  topologyLinks: string[]
  toggleTopologyLink: (link: string) => void
  enabledApps: string[]
  toggleApp: (app: string) => void
  raceAnswers: Record<string, string>
  setRaceAnswer: (packet: string, result: string) => void
}

function MissionChallenge(props: ChallengeProps) {
  if (props.mission === 'growth') {
    const complexity = Math.min(100, props.growthDevices.length * 17)
    return (
      <>
        <div className="rounded-lg border border-noc-border bg-noc-surface/70 p-3">
          <div className="mb-2 flex justify-between text-xs"><span className="text-noc-muted">Manual configuration load</span><b className={complexity >= 90 ? 'text-link-down' : 'text-link-congested'}>{complexity}%</b></div>
          <div className="h-2 overflow-hidden rounded-full bg-noc-border"><div className={`h-full transition-all ${complexity >= 90 ? 'bg-link-down' : 'bg-link-congested'}`} style={{ width: `${complexity}%` }} /></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-noc-muted">
            <span>{3 + props.growthDevices.length} devices</span><span>{props.growthDevices.length * 4} config files</span><span>{props.growthDevices.length * 7} updates/hr</span>
          </div>
        </div>
        <p className="text-xs text-noc-muted">NovaNet is growing. Add the infrastructure needed by new customers.</p>
        <div className="grid grid-cols-2 gap-2">
          {['Switch', 'Router', 'Firewall', 'Load Balancer'].map((device) => (
            <button key={device} onClick={() => props.addGrowthDevice(device)} className={choiceClass(false)}>＋ {device}</button>
          ))}
        </div>
        {complexity >= 90 && <div className="rounded-lg border border-link-down/40 bg-link-down/10 p-3 text-xs font-medium text-link-down">Manual configuration limit reached. Policies are drifting across devices.</div>}
      </>
    )
  }

  if (props.mission === 'packet-dissection') {
    const colors: Record<string, string> = { Ethernet: 'border-link-packet/60 bg-link-packet/10', IP: 'border-module-c/60 bg-module-c/10', TCP: 'border-link-up/60 bg-link-up/10', Payload: 'border-link-congested/60 bg-link-congested/10' }
    return (
      <>
        <p className="text-xs text-noc-muted">Arrange the nested packet from the outermost header to its contents.</p>
        <div className="rounded-xl border border-noc-border bg-noc-surface/50 p-4">
          {props.layerStack.map((layer, index) => (
            <div key={layer} className={`mb-2 grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded-lg border px-3 py-3 ${colors[layer]}`} style={{ marginLeft: `${index * 10}px`, marginRight: `${index * 10}px` }}>
              <span className="font-mono text-[10px] text-noc-muted">{index + 1}</span><span className="text-xs font-semibold text-noc-bright">{layer}</span>
              <button onClick={() => props.moveLayer(index, -1)} aria-label={`Move ${layer} up`}>↑</button><button onClick={() => props.moveLayer(index, 1)} aria-label={`Move ${layer} down`}>↓</button>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (props.mission === 'topology-graph') {
    const candidates = [...REQUIRED_LINKS, 'Host A—Controller', 'Host A—Host B']
    return (
      <>
        <p className="text-xs text-noc-muted">Select links to build the controller’s logical topology.</p>
        <div className="grid grid-cols-2 gap-2">
          {candidates.map((link) => <button key={link} onClick={() => props.toggleTopologyLink(link)} className={choiceClass(props.topologyLinks.includes(link))}>{props.topologyLinks.includes(link) ? '● ' : '○ '}{link}</button>)}
        </div>
        <div className="rounded-lg border border-noc-border bg-noc-surface/60 p-3 text-xs text-noc-muted">Graph state: <b className="text-noc-text">{props.topologyLinks.length} links</b> · {props.topologyLinks.length >= 4 ? 'ready to validate' : 'network is partitioned'}</div>
      </>
    )
  }

  if (props.mission === 'routing-explorer') {
    return (
      <>
        <div className="rounded-lg border border-link-down/40 bg-link-down/10 p-3 text-xs text-link-down">Red path link R2—R4 has failed.</div>
        <ChoiceList value={props.choice} setValue={props.setChoice} options={[
          ['red', 'Red · 9 ms · 10 Gbps · FAILED'],
          ['blue', 'Blue · 14 ms · 8 Gbps · HEALTHY'],
          ['amber', 'Amber · 31 ms · 2 Gbps · HEALTHY'],
        ]} />
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-noc-muted"><span>Latency</span><span>Capacity</span><span>Health</span></div>
      </>
    )
  }

  if (props.mission === 'flow-optimizer') {
    return (
      <>
        <div className="overflow-hidden rounded-lg border border-noc-border font-mono text-xs">
          {['10.0.1.10', '10.0.1.11', '10.0.1.12', '10.0.1.13'].map((ip) => <div key={ip} className="grid grid-cols-2 border-b border-noc-border px-3 py-2 last:border-b-0"><span className="text-noc-text">dst={ip}</span><span className="text-link-up">→ port 3</span></div>)}
        </div>
        <p className="text-xs text-noc-muted">Choose one safe replacement. Broader wildcards may change unrelated traffic.</p>
        <ChoiceList value={props.choice} setValue={props.setChoice} options={[
          ['10.0.*.*', '10.0.*.* → Port 3'],
          ['10.0.1.*', '10.0.1.* → Port 3'],
          ['*', '* → Port 3'],
        ]} />
      </>
    )
  }

  if (props.mission === 'network-os') {
    const apps = [['Routing', 'Shortest-path computation'], ['Firewall', 'Block unauthorized traffic'], ['Load Balancer', 'Distribute backend requests'], ['Statistics', 'Collect counters'], ['Intent Engine', 'Translate high-level policy']]
    return (
      <>
        <div className="rounded-lg border border-module-c/40 bg-module-c/10 p-3 text-xs text-noc-text">Company intent: secure public traffic, balance it across servers, and use shortest healthy paths.</div>
        <div className="flex flex-col gap-2">
          {apps.map(([app, description]) => (
            <button key={app} onClick={() => props.toggleApp(app)} className={`${choiceClass(props.enabledApps.includes(app))} flex items-center justify-between`}>
              <span><b>{app}</b><small className="mt-0.5 block text-noc-muted">{description}</small></span><span className={props.enabledApps.includes(app) ? 'text-link-up' : 'text-noc-muted'}>{props.enabledApps.includes(app) ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </>
    )
  }

  if (props.mission === 'packet-race') {
    const packets = [['ssh', 'TCP dst 22', 'Blocked service'], ['https', 'TCP dst 443', 'Payroll traffic'], ['dns', 'UDP dst 53', 'Name lookup']]
    return (
      <>
        <p className="text-xs text-noc-muted">Assign an outcome to each packet, then replay all three together.</p>
        {packets.map(([id, header, label]) => (
          <div key={id} className="rounded-lg border border-noc-border bg-noc-surface/60 p-3">
            <div className="mb-2 flex justify-between"><span className="font-mono text-xs text-module-c">{header}</span><span className="text-[10px] text-noc-muted">{label}</span></div>
            <select aria-label={`Outcome for ${header}`} value={props.raceAnswers[id] ?? ''} onChange={(event) => props.setRaceAnswer(id, event.target.value)} className="w-full rounded border border-noc-border bg-noc-bg px-2 py-2 text-xs text-noc-text">
              <option value="">Predict outcome…</option><option value="drop">Drop</option><option value="port4">Payroll / Port 4</option><option value="port6">Resolver / Port 6</option><option value="controller">Send to Controller</option>
            </select>
          </div>
        ))}
      </>
    )
  }

  if (props.mission === 'why-sdn') {
    return <ChoiceList value={props.choice} setValue={props.setChoice} options={[
      ['distributed', 'Add a routing process to every switch'],
      ['centralized', 'Move decisions to a centralized controller'],
      ['broadcast', 'Broadcast every packet to all ports'],
    ]} />
  }

  if (props.mission === 'controller-event') {
    return (
      <>
        <div className="rounded-lg border border-link-down/50 bg-link-down/10 p-3 text-xs text-link-down">⚠ Link SW2 ↔ SW3 is down. Existing flow entries use the broken path.</div>
        <p className="text-sm font-medium text-noc-bright">Who recalculates the route?</p>
        <ChoiceList value={props.choice} setValue={props.setChoice} options={[
          ['switch', 'The affected switch alone'],
          ['host', 'The source host'],
          ['controller', 'The SDN Controller'],
          ['openflow', 'The OpenFlow protocol itself'],
        ]} />
      </>
    )
  }

  if (props.mission === 'planes') {
    const unassigned = PLANE_COMPONENTS.filter((component) => !props.planeAssignments[component])
    return (
      <>
        <p className="text-xs text-noc-muted">Drag a component into a plane, or select it and then choose a plane.</p>
        <div className="flex flex-wrap gap-2">
          {unassigned.map((component) => (
            <button
              key={component}
              draggable
              onDragStart={() => props.setHeldComponent(component)}
              onClick={() => props.setHeldComponent(component)}
              className={`rounded border px-2 py-1.5 text-xs ${props.heldComponent === component ? 'border-link-packet bg-link-packet/15 text-link-packet' : 'border-noc-border bg-noc-surface text-noc-text'}`}
            >
              {component}
            </button>
          ))}
        </div>
        {(['control', 'data'] as Plane[]).map((plane) => (
          <div
            key={plane}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => props.assignPlane(plane)}
            onClick={() => props.assignPlane(plane)}
            className="min-h-24 rounded-lg border border-dashed border-noc-muted bg-noc-surface/60 p-3"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-module-c">{plane} plane</p>
            <div className="flex flex-wrap gap-1.5">
              {PLANE_COMPONENTS.filter((component) => props.planeAssignments[component] === plane).map((component) => (
                <button key={component} onClick={(event) => { event.stopPropagation(); props.setHeldComponent(component) }} className="rounded bg-link-packet/10 px-2 py-1 text-xs text-noc-text">
                  {component}
                </button>
              ))}
            </div>
          </div>
        ))}
      </>
    )
  }

  if (props.mission === 'stack') {
    return (
      <>
        <p className="text-xs text-noc-muted">Top = application intent · Bottom = physical endpoints</p>
        <div className="flex flex-col gap-1.5">
          {props.stack.map((item, index) => (
            <div key={item} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 rounded border border-noc-border bg-noc-surface px-2 py-2">
              <span className="font-mono text-[10px] text-noc-muted">{index + 1}</span>
              <span className="text-xs text-noc-text">{item}</span>
              <button onClick={() => props.moveStack(index, -1)} aria-label={`Move ${item} up`} className="text-noc-muted hover:text-noc-bright">↑</button>
              <button onClick={() => props.moveStack(index, 1)} aria-label={`Move ${item} down`} className="text-noc-muted hover:text-noc-bright">↓</button>
            </div>
          ))}
        </div>
      </>
    )
  }

  const isAdmin = props.mission === 'admin'
  return (
    <>
      <div className="rounded-lg border border-noc-border bg-noc-surface/60 p-3">
        <p className="mb-3 text-xs font-semibold text-noc-bright">{isAdmin ? 'Payroll service policy' : 'Construct match–action rule'}</p>
        <label className="mb-2 block text-[10px] uppercase tracking-wider text-noc-muted">Match field</label>
        <select value={props.matchField} onChange={(event) => props.setMatchField(event.target.value)} className="mb-3 w-full rounded border border-noc-border bg-noc-bg px-3 py-2 text-xs text-noc-text">
          <option value="">Choose a packet field…</option>
          <option value="ip_src">Source IP</option>
          <option value="ip_dst">Destination IP</option>
          <option value="tcp_src">TCP Source Port</option>
          <option value="tcp_dst">TCP Destination Port</option>
          <option value="protocol">Protocol</option>
        </select>
        <label className="mb-2 block text-[10px] uppercase tracking-wider text-noc-muted">Value</label>
        <input value={props.matchValue} onChange={(event) => props.setMatchValue(event.target.value)} placeholder={props.mission === 'flow-rule' ? 'e.g. 51.6.0.8' : 'e.g. 22'} className="mb-3 w-full rounded border border-noc-border bg-noc-bg px-3 py-2 font-mono text-xs text-noc-text placeholder:text-noc-muted" />
        <label className="mb-2 block text-[10px] uppercase tracking-wider text-noc-muted">Action</label>
        <div className="grid grid-cols-2 gap-2">
          {['forward', 'drop', 'controller', 'modify'].map((item) => (
            <button key={item} onClick={() => props.setAction(item)} className={choiceClass(props.action === item)}>{item === 'controller' ? 'Send to Controller' : item[0].toUpperCase() + item.slice(1)}</button>
          ))}
        </div>
        {props.action === 'forward' && (
          <select value={props.outPort} onChange={(event) => props.setOutPort(event.target.value)} className="mt-3 w-full rounded border border-noc-border bg-noc-bg px-3 py-2 text-xs text-noc-text">
            <option value="">Choose output port…</option>
            {[2, 3, 4, 5, 6].map((port) => <option key={port} value={port}>Port {port}</option>)}
          </select>
        )}
      </div>
      {isAdmin && (
        <div>
          <p className="mb-2 text-xs font-medium text-noc-bright">If the primary link fails:</p>
          <ChoiceList value={props.adminRecovery} setValue={props.setAdminRecovery} options={[
            ['flood', 'Flood packets until the link returns'],
            ['controller', 'Controller installs the backup path'],
            ['host', 'Ask each host to choose a route'],
          ]} />
        </div>
      )}
    </>
  )
}

function ChoiceList({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: string[][] }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(([id, label]) => (
        <button key={id} onClick={() => setValue(id)} className={choiceClass(value === id)}>
          <span className={`mr-2 inline-block h-3 w-3 rounded-full border ${value === id ? 'border-link-packet bg-link-packet' : 'border-noc-muted'}`} />
          {label}
        </button>
      ))}
    </div>
  )
}

function NetworkScene({ failedLink, solved }: { failedLink: boolean; solved: boolean }) {
  return (
    <svg viewBox="0 0 720 330" className="h-auto w-full" role="img" aria-label="SDN controller connected to three switches and network hosts">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect x="245" y="12" width="230" height="74" rx="10" fill="#16283b" stroke="#58a6ff" strokeWidth="2" />
      <text x="360" y="38" textAnchor="middle" fill="#f0f6fc" fontSize="16" fontWeight="700">SDN CONTROLLER</text>
      <rect x="277" y="48" width="166" height="25" rx="4" fill="#0d1117" stroke="#30363d" />
      <text x="360" y="65" textAnchor="middle" fill="#79c0ff" fontSize="11">Network OS · Routing · Firewall</text>

      {[180, 360, 540].map((x) => <line key={x} x1="360" y1="86" x2={x} y2="145" stroke="#58a6ff" strokeWidth="2" strokeDasharray="5 6" opacity=".85" />)}
      <line x1="220" y1="176" x2="320" y2="176" stroke="#3fb950" strokeWidth="3" />
      <line x1="400" y1="176" x2="500" y2="176" stroke={failedLink && !solved ? '#f85149' : '#3fb950'} strokeWidth="3" strokeDasharray={failedLink && !solved ? '7 5' : undefined} />
      {failedLink && !solved && <text x="450" y="169" textAnchor="middle" fill="#f85149" fontSize="23" fontWeight="700">×</text>}

      {[180, 360, 540].map((x, index) => (
        <g key={x}>
          <rect x={x - 40} y="145" width="80" height="49" rx="7" fill="#1d3348" stroke="#79c0ff" strokeWidth="2" />
          <text x={x} y="166" textAnchor="middle" fill="#f0f6fc" fontSize="13" fontWeight="700">SW{index + 1}</text>
          {[x - 25, x - 8, x + 9, x + 26].map((px) => <rect key={px} x={px} y="177" width="10" height="6" rx="1" fill="#6e7681" />)}
        </g>
      ))}

      <line x1="180" y1="194" x2="115" y2="259" stroke="#3fb950" strokeWidth="2" />
      <line x1="360" y1="194" x2="360" y2="259" stroke="#3fb950" strokeWidth="2" />
      <line x1="540" y1="194" x2="605" y2="259" stroke="#3fb950" strokeWidth="2" />

      <g><rect x="82" y="259" width="66" height="40" rx="4" fill="#161b22" stroke="#79c0ff" /><rect x="74" y="300" width="82" height="7" rx="3" fill="#6e7681" /><text x="115" y="323" textAnchor="middle" fill="#c9d1d9" fontSize="11">Host A</text></g>
      <g><rect x="337" y="253" width="46" height="58" rx="4" fill="#161b22" stroke="#bc8cff" /><circle cx="360" cy="296" r="3" fill="#3fb950" /><text x="360" y="326" textAnchor="middle" fill="#c9d1d9" fontSize="11">Database</text></g>
      <g><rect x="572" y="259" width="66" height="40" rx="4" fill="#161b22" stroke="#79c0ff" /><rect x="564" y="300" width="82" height="7" rx="3" fill="#6e7681" /><text x="605" y="323" textAnchor="middle" fill="#c9d1d9" fontSize="11">Host B</text></g>

      <circle r="6" fill={failedLink && !solved ? '#f85149' : '#58a6ff'} filter="url(#glow)">
        <animateMotion dur={solved ? '1.8s' : '3s'} repeatCount="indefinite" path={failedLink && !solved ? 'M115 259 L180 194 L360 176 L445 176' : 'M115 259 L180 194 L360 176 L540 194 L605 259'} />
      </circle>
    </svg>
  )
}

function FeedbackModal({ kind, copy, onRetry, onContinue }: { kind: 'first' | 'second'; copy: MissionCopy; onRetry: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-noc-muted bg-noc-surface p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-link-down text-xl font-bold text-white">×</div>
          <div>
            <h3 className="text-lg font-bold text-link-down">{kind === 'first' ? 'Not quite!' : 'Still not correct.'}</h3>
            <p className="mt-1 text-sm text-noc-muted">{kind === 'first' ? 'Your choice would not produce the requested network behavior.' : 'Let’s make the controller logic explicit.'}</p>
          </div>
        </div>
        {kind === 'first' ? (
          <div className="mt-5 rounded-lg border border-link-congested/40 bg-link-congested/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-link-congested">Reconsider this</p>
            <p className="mt-2 text-sm leading-relaxed text-noc-text">{copy.hint}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-link-up/40 bg-link-up/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-link-up">Correct answer</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-noc-bright">{copy.correct}</p>
            <p className="mt-3 text-xs leading-relaxed text-noc-muted">{copy.concept}</p>
          </div>
        )}
        <button onClick={kind === 'first' ? onRetry : onContinue} className="mt-5 w-full rounded-lg bg-link-packet px-4 py-2.5 text-sm font-semibold text-noc-bg hover:bg-blue-400">
          {kind === 'first' ? 'Back to Mission' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

function ConceptModal({ title, concept, onDone }: { title: string; concept: string; onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-module-c/60 bg-noc-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-module-c/15 text-xl text-module-c">▤</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-module-c">Concept unlocked</p>
            <h3 className="text-lg font-bold text-noc-bright">{title}</h3>
          </div>
        </div>
        <div className="my-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-xs">
          <div className="rounded-lg border border-module-c/40 bg-module-c/10 p-3 text-module-c">Packet headers</div>
          <span className="text-noc-muted">→</span>
          <div className="rounded-lg border border-link-up/40 bg-link-up/10 p-3 text-link-up">Match fields</div>
          <span className="text-noc-muted">→</span>
          <div className="rounded-lg border border-link-congested/40 bg-link-congested/10 p-3 text-link-congested">Action</div>
        </div>
        <p className="text-sm leading-relaxed text-noc-text">{concept}</p>
        <button onClick={onDone} className="mt-6 w-full rounded-lg bg-link-packet px-4 py-2.5 text-sm font-semibold text-noc-bg hover:bg-blue-400">Got it — Earn XP & Finish</button>
      </div>
    </div>
  )
}
