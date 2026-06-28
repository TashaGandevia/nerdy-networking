import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Level } from '@/types'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
type BlockKind = 'logic' | 'match' | 'action' | 'other'
interface CodeBlock { id: string; label: string; kind: BlockKind; indent?: number }
interface Challenge { title: string; briefing: string; packet: string[]; expected: string[]; explanation: string; hint: string }

const BLOCKS: CodeBlock[] = [
  { id: 'if', label: 'if ( condition )', kind: 'logic' },
  { id: 'else-if', label: 'else if ( condition )', kind: 'logic' },
  { id: 'else', label: 'else', kind: 'logic' },
  { id: 'apply', label: 'apply_actions()', kind: 'logic' },
  { id: 'dst-http', label: 'hdr.tcp.dstPort == 80', kind: 'match', indent: 1 },
  { id: 'dst-ssh', label: 'hdr.tcp.dstPort == 22', kind: 'match', indent: 1 },
  { id: 'dst-https', label: 'hdr.tcp.dstPort == 443', kind: 'match', indent: 1 },
  { id: 'src-guest', label: 'hdr.ipv4.srcAddr == GUEST', kind: 'match', indent: 1 },
  { id: 'ipv4-valid', label: 'hdr.ipv4.isValid()', kind: 'match', indent: 1 },
  { id: 'forward-2', label: 'forward( port 2 )', kind: 'action', indent: 2 },
  { id: 'forward-4', label: 'forward( port 4 )', kind: 'action', indent: 2 },
  { id: 'drop', label: 'drop()', kind: 'action', indent: 2 },
  { id: 'controller', label: 'send_to_controller()', kind: 'action', indent: 2 },
  { id: 'ttl-dec', label: 'modify_ttl( dec )', kind: 'action', indent: 2 },
  { id: 'set-vlan', label: 'set_field( vlan, 100 )', kind: 'action', indent: 2 },
  { id: 'metadata', label: 'set_metadata( tenant, id )', kind: 'other', indent: 1 },
  { id: 'int', label: 'append_int( queue_depth )', kind: 'other', indent: 2 },
  { id: 'deparse', label: 'deparser.emit( headers )', kind: 'other' },
  { id: 'return', label: 'return', kind: 'other' },
]

const CHALLENGES: Record<Difficulty, Challenge[]> = {
  easy: [
    { title: 'Forward Web Traffic', briefing: 'Forward HTTP traffic to server port 2.', packet: ['src IP 192.168.1.10', 'dst IP 10.0.0.5', 'dst Port 80 (HTTP)', 'Protocol TCP'], expected: ['if','dst-http','forward-2','apply'], explanation: 'Match TCP destination port 80, forward it to port 2, then apply the action.', hint: 'HTTP uses TCP destination port 80.' },
    { title: 'Block SSH', briefing: 'Drop all SSH traffic at the programmable switch.', packet: ['src IP 203.0.113.8', 'dst IP 10.0.0.5', 'dst Port 22 (SSH)', 'Protocol TCP'], expected: ['if','dst-ssh','drop','apply'], explanation: 'Match TCP destination port 22 and invoke drop().', hint: 'SSH is identified by destination port 22.' },
  ],
  medium: [
    { title: 'Web + SSH Policy', briefing: 'Forward HTTP to port 2, drop SSH, and send all other traffic to the controller.', packet: ['src IP 192.168.1.10', 'dst IP 10.0.0.5', 'dst Port 80 (HTTP)', 'Protocol TCP'], expected: ['if','dst-http','forward-2','else-if','dst-ssh','drop','else','controller','apply'], explanation: 'Ordered branches forward HTTP, block SSH, and handle the default case through the controller.', hint: 'Build three branches: HTTP, SSH, then a default else.' },
    { title: 'Guest HTTPS Isolation', briefing: 'Drop guest HTTPS traffic; forward other HTTPS traffic to port 4.', packet: ['src IP GUEST', 'dst IP PAYROLL', 'dst Port 443 (HTTPS)', 'Protocol TCP'], expected: ['if','src-guest','dst-https','drop','else','forward-4','apply'], explanation: 'The first branch combines guest source and HTTPS service; the fallback permits authorized HTTPS.', hint: 'The deny branch needs both a source class and destination service match.' },
  ],
  hard: [
    { title: 'Tenant Classification', briefing: 'Classify guest traffic into VLAN 100, block SSH, then send unmatched traffic to the controller.', packet: ['src IP GUEST', 'tenant unknown', 'dst Port 22 (SSH)', 'VLAN untagged'], expected: ['if','src-guest','set-vlan','else-if','dst-ssh','drop','else','controller','apply'], explanation: 'The pipeline classifies the tenant before enforcing service policy and a default control-plane path.', hint: 'Classification must occur before the SSH branch and default handling.' },
    { title: 'IPv4 Router Action', briefing: 'For valid IPv4 packets, decrement TTL and forward to port 4; otherwise drop.', packet: ['EtherType IPv4', 'IPv4 valid true', 'TTL 64', 'egress Port 4'], expected: ['if','ipv4-valid','ttl-dec','forward-4','else','drop','apply'], explanation: 'A valid routed packet needs TTL decrement and egress selection; invalid traffic is dropped.', hint: 'A router modifies TTL before forwarding.' },
  ],
  expert: [
    { title: 'INT Telemetry Pipeline', briefing: 'For valid IPv4 traffic, classify the tenant, append queue telemetry, forward to port 4, and emit headers.', packet: ['IPv4 valid true', 'tenant 42', 'queue depth 18', 'timestamp 90421'], expected: ['if','ipv4-valid','metadata','int','forward-4','apply','deparse'], explanation: 'The complete pipeline validates headers, writes metadata, appends INT, forwards, applies, and deparses.', hint: 'Metadata and telemetry must be written before the packet is emitted.' },
    { title: 'Secure Telemetry Edge', briefing: 'Drop SSH; otherwise append queue telemetry, forward to port 2, apply actions, and deparse.', packet: ['IPv4 valid true', 'dst Port 443', 'queue depth 9', 'edge switch 7'], expected: ['if','dst-ssh','drop','else','int','forward-2','apply','deparse'], explanation: 'Security is evaluated before telemetry and forwarding; the deparser emits the modified packet.', hint: 'Put the deny branch first and the deparser last.' },
  ],
}

const DIFFICULTIES: Difficulty[] = ['easy','medium','hard','expert']
const KIND_STYLE: Record<BlockKind,string> = { logic:'border-link-packet/60 bg-link-packet/15 text-link-packet', match:'border-module-b/60 bg-module-b/15 text-module-b', action:'border-link-up/60 bg-link-up/15 text-link-up', other:'border-link-congested/60 bg-link-congested/15 text-link-congested' }

export function CodeBuilderIDE({ level, onComplete }: Props) {
  const navigate = useNavigate()
  const [difficulty,setDifficulty] = useState<Difficulty>('easy')
  const [challengeIndex,setChallengeIndex] = useState(0)
  const [workspace,setWorkspace] = useState<string[]>([])
  const [dragged,setDragged] = useState<string|null>(null)
  const [hints,setHints] = useState(0)
  const [xp,setXp] = useState(0)
  const [message,setMessage] = useState<{type:'partial'|'wrong';text:string}|null>(null)
  const [complete,setComplete] = useState(false)
  const challenge = CHALLENGES[difficulty][challengeIndex % CHALLENGES[difficulty].length]
  const difficultyIndex = DIFFICULTIES.indexOf(difficulty)

  function reset(nextIndex=challengeIndex) { setChallengeIndex(nextIndex); setWorkspace([]); setMessage(null); setComplete(false) }
  function changeDifficulty(next:Difficulty) { setDifficulty(next); reset(0) }
  function addBlock(id:string) { setWorkspace((items)=>[...items,id]); setMessage(null) }
  function dropBlock() { if(dragged) addBlock(dragged); setDragged(null) }
  function move(index:number,dir:-1|1) { const target=index+dir; if(target<0||target>=workspace.length)return; setWorkspace((items)=>{const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next}) }
  function run() {
    const exact = workspace.length===challenge.expected.length && workspace.every((id,index)=>id===challenge.expected[index])
    if(exact){setXp((value)=>value+50);setComplete(true);setMessage(null);return}
    const correctBlocks=workspace.filter((id,index)=>challenge.expected[index]===id).length
    const containsUseful=workspace.some((id)=>challenge.expected.includes(id))
    setMessage({type:containsUseful?'partial':'wrong',text:containsUseful?`${correctBlocks} block${correctBlocks===1?' is':'s are'} in the correct position. Check order and missing logic.`:'These blocks do not express the required packet behavior.'})
  }

  return <div className="overflow-hidden rounded-xl border border-noc-border bg-[#0b1017] shadow-2xl shadow-black/30">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-noc-border bg-noc-surface px-4 py-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-link-packet/15 font-mono text-lg font-bold text-link-packet">&lt;/&gt;</div><div><p className="text-sm font-bold text-noc-bright">CODE BUILDER IDE</p><p className="text-[10px] text-noc-muted">{level.id} · Drag · Drop · Build · Understand</p></div></div><p className="text-sm font-semibold text-noc-text">Challenge: <span className="text-module-b">{challenge.title}</span></p><div className="flex items-center gap-2"><span className="rounded bg-module-b/15 px-2 py-1 text-xs capitalize text-module-b">{difficulty}</span><span className="rounded bg-link-congested/10 px-2 py-1 font-mono text-xs text-link-congested">XP {xp}</span></div></header>
    <div className="grid min-h-[670px] lg:grid-cols-[210px_1fr_250px]">
      <aside className="border-r border-noc-border bg-noc-surface/70 p-3"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-noc-muted">Blocks</p>{(['match','action','logic','other'] as BlockKind[]).map((kind)=><div key={kind} className="mb-4"><p className="mb-1.5 text-[10px] font-semibold uppercase text-noc-muted">{kind}</p><div className="flex flex-col gap-1">{BLOCKS.filter((block)=>block.kind===kind).map((block)=><button key={block.id} draggable onDragStart={()=>setDragged(block.id)} onClick={()=>addBlock(block.id)} className={`rounded border px-2 py-1.5 text-left font-mono text-[10px] ${KIND_STYLE[kind]}`}>{block.label}</button>)}</div></div>)}</aside>
      <main className="min-w-0 p-4"><div className="mb-3 rounded-lg border border-noc-border bg-noc-surface/60 p-3"><p className="text-[10px] uppercase tracking-widest text-noc-muted">Problem briefing</p><p className="mt-1 text-sm text-noc-text">{challenge.briefing}</p></div><div onDragOver={(event)=>event.preventDefault()} onDrop={dropBlock} className="min-h-[510px] rounded-lg border border-noc-border bg-[#0d141e] p-3"><div className="mb-2 grid grid-cols-[32px_1fr] text-[10px] text-noc-muted"><span>LINE</span><span>WORKSPACE · drop or click blocks to add</span></div>{workspace.length===0&&<div className="grid h-72 place-items-center rounded border border-dashed border-noc-border text-center"><div><p className="text-3xl text-noc-border">＋</p><p className="mt-2 text-xs text-noc-muted">Build your packet-processing logic here</p></div></div>}{workspace.map((id,index)=>{const block=BLOCKS.find((item)=>item.id===id)!;return <div key={`${id}-${index}`} className="grid grid-cols-[32px_1fr_auto_auto_auto] items-center gap-2 py-1"><span className="text-right font-mono text-[10px] text-noc-muted">{index+1}</span><div className={`rounded border px-3 py-2 font-mono text-xs ${KIND_STYLE[block.kind]}`} style={{marginLeft:`${(block.indent??0)*18}px`}}>{block.label}</div><button onClick={()=>move(index,-1)} className="text-noc-muted hover:text-noc-text">↑</button><button onClick={()=>move(index,1)} className="text-noc-muted hover:text-noc-text">↓</button><button onClick={()=>setWorkspace((items)=>items.filter((_,i)=>i!==index))} className="text-link-down">×</button></div>})}</div></main>
      <aside className="border-l border-noc-border bg-noc-surface/60 p-3"><section className="rounded-lg border border-noc-border bg-noc-bg/60 p-3"><p className="text-xs font-bold text-noc-bright">Packet Preview</p>{challenge.packet.map((line)=><div key={line} className="mt-2 flex justify-between gap-2 border-b border-noc-border/50 pb-1 font-mono text-[10px] text-noc-muted"><span>{line}</span></div>)}</section><section className="mt-3 rounded-lg border border-noc-border bg-noc-bg/60 p-3"><p className="text-xs font-bold text-noc-bright">Output / Feedback</p>{!message&&!complete&&<p className="mt-3 text-xs text-noc-muted">Run your program to test its packet behavior.</p>}{message&&<div className={`mt-3 rounded border p-3 ${message.type==='partial'?'border-link-congested/40 bg-link-congested/10 text-link-congested':'border-link-down/40 bg-link-down/10 text-link-down'}`}><p className="text-xs font-bold">{message.type==='partial'?'Partially correct':'Incorrect logic'}</p><p className="mt-1 text-[10px] leading-relaxed text-noc-text">{message.text}</p></div>}{complete&&<div className="mt-3 rounded border border-link-up/40 bg-link-up/10 p-3"><p className="text-xs font-bold text-link-up">✓ Looks good!</p><p className="mt-1 text-[10px] leading-relaxed text-noc-text">{challenge.explanation}</p></div>}</section>{hints>0&&<div className="mt-3 rounded-lg border border-link-congested/40 bg-link-congested/10 p-3 text-xs text-noc-text">💡 {challenge.hint}</div>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>{setHints((value)=>value+1)}} className="rounded-lg border border-link-congested/50 px-3 py-2 text-xs font-semibold text-link-congested">Hint</button><button onClick={run} className="rounded-lg bg-link-up px-3 py-2 text-xs font-bold text-noc-bg">▶ Run</button></div><button onClick={()=>setWorkspace([])} className="mt-2 w-full rounded border border-noc-border px-3 py-2 text-xs text-noc-muted">Clear Workspace</button></aside>
    </div>
    <footer className="flex flex-wrap items-center gap-2 border-t border-noc-border bg-noc-surface px-4 py-3"><span className="mr-2 text-[10px] uppercase tracking-widest text-noc-muted">Challenge level</span>{DIFFICULTIES.map((item)=><button key={item} onClick={()=>changeDifficulty(item)} className={`rounded border px-3 py-1.5 text-xs capitalize ${difficulty===item?'border-module-b bg-module-b/15 text-module-b':'border-noc-border text-noc-muted'}`}>{item}</button>)}</footer>
    {complete&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-xl border border-link-up/50 bg-noc-surface p-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-link-up text-2xl font-bold text-noc-bg">✓</div><h3 className="mt-3 text-xl font-bold text-noc-bright">Program passed!</h3><p className="mt-1 text-sm text-link-up">+50 XP · {difficulty} challenge complete</p><p className="mx-auto mt-3 max-w-lg text-xs text-noc-muted">{challenge.explanation}</p><div className={`mt-6 grid gap-3 ${difficulty==='expert'?'sm:grid-cols-2':'sm:grid-cols-3'}`}><button onClick={()=>reset((challengeIndex+1)%CHALLENGES[difficulty].length)} className="rounded-lg border border-link-packet/50 bg-link-packet/10 px-4 py-3 text-sm font-semibold text-link-packet">Another Challenge</button>{difficulty!=='expert'&&<button onClick={()=>changeDifficulty(DIFFICULTIES[difficultyIndex+1])} className="rounded-lg border border-link-congested/50 bg-link-congested/10 px-4 py-3 text-sm font-semibold text-link-congested">Try Harder Level</button>}<button onClick={()=>{onComplete(true,hints);navigate('/sandbox')}} className="rounded-lg bg-link-up px-4 py-3 text-sm font-bold text-noc-bg">Back to Sandbox</button></div></div></div>}
  </div>
}
