import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Level } from '@/types'
import type { SdnDifficulty } from '@/data/sdnQuestions'
import { P4_QUESTION_BANK, P4_TOPIC_ORDER, type P4TopicId } from '@/data/p4Questions'

interface Props { level: Level; topicId: P4TopicId; onComplete: (passed: boolean, hintsUsed: number) => void }

const DIFFICULTIES: SdnDifficulty[] = ['easy', 'medium', 'hard']
const DIFFICULTY_STYLE: Record<SdnDifficulty, string> = {
  easy: 'border-link-up/50 bg-link-up/10 text-link-up',
  medium: 'border-link-congested/50 bg-link-congested/10 text-link-congested',
  hard: 'border-link-down/50 bg-link-down/10 text-link-down',
}

export function P4QuestionGame({ level, topicId, onComplete }: Props) {
  const navigate = useNavigate()
  const topic = P4_QUESTION_BANK[topicId]
  const gameNumber = P4_TOPIC_ORDER.indexOf(topicId) + 1
  const [difficulty, setDifficulty] = useState<SdnDifficulty>('easy')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [xp, setXp] = useState(0)
  const [award, setAward] = useState(0)
  const [feedback, setFeedback] = useState<'hint' | 'answer' | null>(null)
  const [complete, setComplete] = useState(false)
  const questions = topic.questions[difficulty]
  const question = questions[questionIndex % questions.length]
  const difficultyIndex = DIFFICULTIES.indexOf(difficulty)
  const nextTopic = P4_TOPIC_ORDER[gameNumber]

  function resetQuestion(index = questionIndex) {
    setQuestionIndex(index); setSelected(null); setAttempts(0); setFeedback(null); setComplete(false); setAward(0)
  }

  function chooseDifficulty(next: SdnDifficulty) {
    setDifficulty(next); resetQuestion(0)
  }

  function finishQuestion() {
    const earned = attempts === 0 ? 100 : attempts === 1 ? 75 : 50
    setAward(earned); setXp((value) => value + earned); setFeedback(null); setComplete(true)
  }

  function submit() {
    if (selected === null) return
    if (selected === question.answer) return finishQuestion()
    setHintsUsed((value) => value + 1)
    if (attempts === 0) { setAttempts(1); setFeedback('hint') }
    else { setAttempts(2); setFeedback('answer') }
  }

  function nextGame() {
    onComplete(true, hintsUsed)
    navigate(nextTopic ? `/level/E-L${String(gameNumber + 1).padStart(2, '0')}` : '/sandbox')
  }

  return (
    <div className="overflow-hidden rounded-xl border border-noc-border bg-noc-surface shadow-2xl shadow-black/20">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-noc-border bg-gradient-to-r from-[#10251b] to-noc-surface px-4 py-3">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg border border-module-e/50 bg-module-e/10 font-mono text-lg font-bold text-module-e">P4</div><div><p className="text-sm font-bold text-noc-bright">PROGRAMMABLE DATAPLANE LAB</p><p className="text-[10px] text-noc-muted">Pipeline lesson {gameNumber} of {P4_TOPIC_ORDER.length}</p></div></div>
        <div className="text-center"><p className="text-sm font-semibold text-module-e">{topic.title}</p><p className="text-[10px] text-noc-muted">{topic.pipelineStage}</p></div>
        <div className="flex items-center gap-3 text-xs"><span className="rounded bg-module-e/15 px-2 py-1 font-mono text-module-e">XP {xp}</span><span className="text-noc-muted">Q{questionIndex + 1}/{questions.length}</span></div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <PipelineVisual topicId={topicId} difficulty={difficulty} active={selected !== null} verified={complete} />
          <section className="rounded-lg border border-noc-border bg-noc-bg/45 p-4">
            <div className="mb-3 flex justify-between"><p className="text-xs font-semibold uppercase tracking-widest text-noc-muted">Difficulty</p><p className="text-[10px] text-noc-muted">3 questions per level</p></div>
            <div className="grid grid-cols-3 gap-2">{DIFFICULTIES.map((item) => <button key={item} onClick={() => chooseDifficulty(item)} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${difficulty === item ? DIFFICULTY_STYLE[item] : 'border-noc-border text-noc-muted hover:text-noc-text'}`}>{item}</button>)}</div>
          </section>
        </div>

        <section className="flex min-h-[500px] flex-col rounded-lg border border-noc-border bg-noc-bg/35">
          <div className="border-b border-noc-border p-4"><div className="flex justify-between"><span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${DIFFICULTY_STYLE[difficulty]}`}>{difficulty}</span><span className="text-[10px] text-noc-muted">{level.id} · Q{questionIndex + 1}</span></div><h2 className="mt-3 text-base font-semibold leading-relaxed text-noc-bright">{question.prompt}</h2></div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            {question.options.map((option, index) => <button key={option} onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-3 text-left text-sm ${selected === index ? 'border-module-e bg-module-e/15 text-noc-bright' : 'border-noc-border bg-noc-surface/60 text-noc-text hover:border-noc-muted'}`}><span className={`mr-3 inline-grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${selected === index ? 'border-module-e bg-module-e text-noc-bg' : 'border-noc-muted text-noc-muted'}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}
            <button disabled={selected === null} onClick={submit} className="mt-auto rounded-lg bg-module-e px-4 py-3 text-sm font-bold text-noc-bg hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40">Run Pipeline Test</button>
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-3 border-t border-noc-border bg-noc-bg/40 px-4 py-3"><span className="text-[10px] uppercase tracking-widest text-noc-muted">P4 progression</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-noc-border"><div className="h-full rounded-full bg-module-e" style={{ width: `${(gameNumber / P4_TOPIC_ORDER.length) * 100}%` }} /></div><span className="font-mono text-xs text-module-e">{gameNumber}/{P4_TOPIC_ORDER.length}</span></footer>

      {feedback && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-xl border border-noc-muted bg-noc-surface p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-link-down text-xl font-bold text-white">×</div><div><h3 className="text-lg font-bold text-link-down">{feedback === 'hint' ? 'Pipeline test failed' : 'Guided trace'}</h3><p className="text-xs text-noc-muted">{feedback === 'hint' ? 'Inspect the active stage and try once more.' : 'Follow the packet through the correct behavior.'}</p></div></div><div className={`mt-5 rounded-lg border p-4 ${feedback === 'hint' ? 'border-link-congested/40 bg-link-congested/10' : 'border-link-up/40 bg-link-up/10'}`}><p className={`text-[10px] font-bold uppercase tracking-widest ${feedback === 'hint' ? 'text-link-congested' : 'text-link-up'}`}>{feedback === 'hint' ? 'Hint' : 'Correct answer'}</p><p className="mt-2 text-sm text-noc-text">{feedback === 'hint' ? question.explanation : question.options[question.answer]}</p>{feedback === 'answer' && <p className="mt-3 text-xs text-noc-muted">{question.explanation}</p>}</div><button onClick={feedback === 'hint' ? () => setFeedback(null) : finishQuestion} className="mt-5 w-full rounded-lg bg-module-e px-4 py-2.5 text-sm font-semibold text-noc-bg">{feedback === 'hint' ? 'Debug & Retry' : 'Continue'}</button></div></div>}

      {complete && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-xl border border-module-e/50 bg-noc-surface p-6"><div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-module-e text-2xl font-bold text-noc-bg">✓</div><h3 className="mt-3 text-xl font-bold text-noc-bright">Pipeline test passed!</h3><p className="mt-1 text-sm text-module-e">+{award} XP · {difficulty[0].toUpperCase() + difficulty.slice(1)} cleared</p><p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-noc-muted">{question.explanation}</p></div><div className={`mt-6 grid gap-3 ${difficulty === 'hard' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}><button onClick={() => resetQuestion((questionIndex + 1) % questions.length)} className="rounded-lg border border-module-e/50 bg-module-e/10 px-4 py-3 text-sm font-semibold text-module-e">Another Question<span className="mt-1 block text-[10px] font-normal text-noc-muted">Stay on {difficulty}</span></button>{difficulty !== 'hard' && <button onClick={() => chooseDifficulty(DIFFICULTIES[difficultyIndex + 1])} className="rounded-lg border border-link-congested/50 bg-link-congested/10 px-4 py-3 text-sm font-semibold text-link-congested">Try Harder Level<span className="mt-1 block text-[10px] font-normal text-noc-muted">Move to {DIFFICULTIES[difficultyIndex + 1]}</span></button>}<button onClick={nextGame} className="rounded-lg bg-module-e px-4 py-3 text-sm font-bold text-noc-bg">{nextTopic ? 'Next Game' : 'Back to Sandbox'}<span className="mt-1 block text-[10px] font-normal opacity-70">{nextTopic ? P4_QUESTION_BANK[nextTopic].title : 'Module complete'}</span></button></div></div></div>}
    </div>
  )
}

function PipelineVisual({ topicId, difficulty, active, verified }: { topicId: P4TopicId; difficulty: SdnDifficulty; active: boolean; verified: boolean }) {
  const stages = ['Parser', 'Ingress', 'Egress', 'Deparser']
  const activeStage = topicId === 'abstractions' ? 0 : topicId === 'forwarding' || topicId === 'match-action' || topicId === 'flow-tables' ? 1 : topicId === 'network-os' ? 2 : 0
  return <section className="min-h-[405px] overflow-hidden rounded-lg border border-noc-border bg-noc-bg/45"><div className="flex justify-between border-b border-noc-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-widest text-noc-muted">Live P4 pipeline</p><span className={`text-[10px] ${verified ? 'text-link-up' : 'text-module-e'}`}>{verified ? '● TEST PASSED' : '● READY'}</span></div><div className="p-4"><div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2">{stages.map((stage, index) => <div key={stage} className="contents"><div className={`rounded-lg border p-3 text-center ${index === activeStage ? 'border-module-e bg-module-e/15' : 'border-noc-border bg-noc-surface'}`}><p className={`text-xs font-bold ${index === activeStage ? 'text-module-e' : 'text-noc-text'}`}>{stage}</p><p className="mt-1 text-[9px] text-noc-muted">{index === 0 ? 'Extract headers' : index === 1 ? 'Match + action' : index === 2 ? 'Modify + queue' : 'Emit packet'}</p></div>{index < stages.length - 1 && <span className="text-noc-muted">→</span>}</div>)}</div><div className="relative mt-12 h-20 rounded-lg border border-noc-border bg-noc-surface/60"><div className="absolute inset-x-8 top-1/2 h-0.5 bg-noc-border"/><div className={`absolute top-[31px] h-4 w-8 rounded border transition-all duration-500 ${verified ? 'border-link-up bg-link-up' : active ? 'border-module-e bg-module-e' : 'border-link-packet bg-link-packet'}`} style={{ left: verified ? '85%' : active ? `${18 + activeStage * 22}%` : '7%' }}/><div className="absolute bottom-2 left-3 font-mono text-[9px] text-noc-muted">packet_in</div><div className="absolute bottom-2 right-3 font-mono text-[9px] text-noc-muted">packet_out</div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded border border-noc-border p-2 text-noc-muted">TARGET<br/><b className="text-module-e">P4</b></div><div className="rounded border border-noc-border p-2 text-noc-muted">COMPLEXITY<br/><b className="text-noc-text">{difficulty.toUpperCase()}</b></div><div className="rounded border border-noc-border p-2 text-noc-muted">THROUGHPUT<br/><b className="text-link-up">LINE RATE</b></div></div></div></section>
}
