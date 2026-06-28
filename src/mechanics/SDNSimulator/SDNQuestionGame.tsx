import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Level } from '@/types'
import {
  SDN_GAME_ORDER,
  SDN_QUESTION_BANK,
  type SdnDifficulty,
  type SdnGameId,
} from '@/data/sdnQuestions'

interface Props {
  level: Level
  gameId: SdnGameId
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const DIFFICULTIES: SdnDifficulty[] = ['easy', 'medium', 'hard']
const DIFFICULTY_COLOR: Record<SdnDifficulty, string> = {
  easy: 'text-link-up border-link-up/50 bg-link-up/10',
  medium: 'text-link-congested border-link-congested/50 bg-link-congested/10',
  hard: 'text-link-down border-link-down/50 bg-link-down/10',
}

export function SDNQuestionGame({ level, gameId, onComplete }: Props) {
  const navigate = useNavigate()
  const game = SDN_QUESTION_BANK[gameId]
  const gameNumber = SDN_GAME_ORDER.indexOf(gameId) + 1
  const [difficulty, setDifficulty] = useState<SdnDifficulty>('easy')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [totalHints, setTotalHints] = useState(0)
  const [sessionXp, setSessionXp] = useState(0)
  const [award, setAward] = useState(0)
  const [feedback, setFeedback] = useState<'hint' | 'reveal' | null>(null)
  const [questionComplete, setQuestionComplete] = useState(false)

  const questions = game.questions[difficulty]
  const question = questions[questionIndex % questions.length]
  const difficultyIndex = DIFFICULTIES.indexOf(difficulty)
  const nextGameId = SDN_GAME_ORDER[gameNumber]

  function resetQuestion(nextIndex = questionIndex) {
    setQuestionIndex(nextIndex)
    setSelected(null)
    setAttempts(0)
    setFeedback(null)
    setQuestionComplete(false)
    setAward(0)
  }

  function changeDifficulty(next: SdnDifficulty) {
    setDifficulty(next)
    resetQuestion(0)
  }

  function finishQuestion() {
    const earned = attempts === 0 ? 100 : attempts === 1 ? 75 : 50
    setAward(earned)
    setSessionXp((value) => value + earned)
    setQuestionComplete(true)
    setFeedback(null)
  }

  function submit() {
    if (selected === null) return
    if (selected === question.answer) {
      finishQuestion()
      return
    }
    if (attempts === 0) {
      setAttempts(1)
      setTotalHints((value) => value + 1)
      setFeedback('hint')
    } else {
      setAttempts(2)
      setTotalHints((value) => value + 1)
      setFeedback('reveal')
    }
  }

  function anotherQuestion() {
    resetQuestion((questionIndex + 1) % questions.length)
  }

  function harderQuestion() {
    const harder = DIFFICULTIES[difficultyIndex + 1]
    if (harder) changeDifficulty(harder)
  }

  function goToNextGame() {
    onComplete(true, totalHints)
    navigate(nextGameId ? `/level/C-L${String(gameNumber + 1).padStart(2, '0')}` : '/sandbox')
  }

  return (
    <div className="overflow-hidden rounded-xl border border-noc-border bg-noc-surface shadow-2xl shadow-black/20">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-noc-border bg-gradient-to-r from-[#111c2b] to-noc-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border border-link-packet/40 bg-link-packet/10 text-lg text-link-packet">⌁</div>
          <div><p className="text-sm font-bold tracking-wide text-noc-bright">NOVANET SDN LAB</p><p className="text-[10px] text-noc-muted">Simulation {gameNumber} of {SDN_GAME_ORDER.length}</p></div>
        </div>
        <div className="text-center"><p className="text-sm font-semibold text-link-congested">{game.title}</p><p className="text-[10px] text-noc-muted">{game.subtitle}</p></div>
        <div className="flex items-center gap-3 text-xs"><span className="rounded bg-link-packet/15 px-2 py-1 font-mono text-link-packet">XP {sessionXp}</span><span className="text-noc-muted">Question {questionIndex + 1}/{questions.length}</span></div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <SimulatorVisual gameId={gameId} difficulty={difficulty} context={question.context} selected={selected} correct={questionComplete} />
          <div className="rounded-lg border border-noc-border bg-noc-bg/45 p-4">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-widest text-noc-muted">Difficulty</p><p className="text-[10px] text-noc-muted">2 questions per level</p></div>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((item) => (
                <button key={item} onClick={() => changeDifficulty(item)} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${difficulty === item ? DIFFICULTY_COLOR[item] : 'border-noc-border text-noc-muted hover:text-noc-text'}`}>{item}</button>
              ))}
            </div>
          </div>
        </div>

        <section className="flex min-h-[490px] flex-col rounded-lg border border-noc-border bg-noc-bg/35">
          <div className="border-b border-noc-border px-4 py-3">
            <div className="flex items-center justify-between"><span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[difficulty]}`}>{difficulty}</span><span className="text-[10px] text-noc-muted">{level.id} · Q{questionIndex + 1}</span></div>
            <h2 className="mt-3 text-base font-semibold leading-relaxed text-noc-bright">{question.prompt}</h2>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            {question.options.map((option, index) => (
              <button key={option} onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${selected === index ? 'border-link-packet bg-link-packet/15 text-noc-bright' : 'border-noc-border bg-noc-surface/60 text-noc-text hover:border-noc-muted'}`}>
                <span className={`mr-3 inline-grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${selected === index ? 'border-link-packet bg-link-packet text-noc-bg' : 'border-noc-muted text-noc-muted'}`}>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            ))}
            <button disabled={selected === null} onClick={submit} className="mt-auto rounded-lg bg-link-up px-4 py-3 text-sm font-bold text-[#07130a] transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40">Submit Answer</button>
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-3 border-t border-noc-border bg-noc-bg/40 px-4 py-3"><span className="text-[10px] uppercase tracking-widest text-noc-muted">Game progress</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-noc-border"><div className="h-full rounded-full bg-module-c" style={{ width: `${(gameNumber / SDN_GAME_ORDER.length) * 100}%` }} /></div><span className="font-mono text-xs text-module-c">{gameNumber}/{SDN_GAME_ORDER.length}</span></footer>

      {feedback && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-noc-muted bg-noc-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-link-down text-xl font-bold text-white">×</div><div><h3 className="text-lg font-bold text-link-down">{feedback === 'hint' ? 'Not quite!' : 'Let’s trace it.'}</h3><p className="text-xs text-noc-muted">{feedback === 'hint' ? 'Use the network evidence and try once more.' : 'Here is the matching network behavior.'}</p></div></div>
            <div className={`mt-5 rounded-lg border p-4 ${feedback === 'hint' ? 'border-link-congested/40 bg-link-congested/10' : 'border-link-up/40 bg-link-up/10'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${feedback === 'hint' ? 'text-link-congested' : 'text-link-up'}`}>{feedback === 'hint' ? 'Hint' : 'Correct answer'}</p>
              <p className="mt-2 text-sm leading-relaxed text-noc-text">{feedback === 'hint' ? question.explanation : question.options[question.answer]}</p>
              {feedback === 'reveal' && <p className="mt-3 text-xs leading-relaxed text-noc-muted">{question.explanation}</p>}
            </div>
            <button onClick={feedback === 'hint' ? () => setFeedback(null) : finishQuestion} className="mt-5 w-full rounded-lg bg-link-packet px-4 py-2.5 text-sm font-semibold text-noc-bg">{feedback === 'hint' ? 'Try Again' : 'Continue'}</button>
          </div>
        </div>
      )}

      {questionComplete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-link-up/50 bg-noc-surface p-6 shadow-2xl">
            <div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-link-up text-2xl font-bold text-[#07130a]">✓</div><h3 className="mt-3 text-xl font-bold text-noc-bright">Question complete!</h3><p className="mt-1 text-sm text-link-up">+{award} XP · {difficulty[0].toUpperCase() + difficulty.slice(1)} cleared</p><p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-noc-muted">{question.explanation}</p></div>
            <div className={`mt-6 grid gap-3 ${difficulty === 'hard' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              <button onClick={anotherQuestion} className="rounded-lg border border-link-packet/50 bg-link-packet/10 px-4 py-3 text-sm font-semibold text-link-packet hover:bg-link-packet/20">Another Question<span className="mt-1 block text-[10px] font-normal text-noc-muted">Stay on {difficulty}</span></button>
              {difficulty !== 'hard' && <button onClick={harderQuestion} className="rounded-lg border border-link-congested/50 bg-link-congested/10 px-4 py-3 text-sm font-semibold text-link-congested hover:bg-link-congested/20">Try Harder Level<span className="mt-1 block text-[10px] font-normal text-noc-muted">Move to {DIFFICULTIES[difficultyIndex + 1]}</span></button>}
              <button onClick={goToNextGame} className="rounded-lg bg-link-up px-4 py-3 text-sm font-bold text-[#07130a] hover:bg-green-400">{nextGameId ? 'Next Game' : 'Back to Sandbox'}<span className="mt-1 block text-[10px] font-normal opacity-70">{nextGameId ? SDN_QUESTION_BANK[nextGameId].title : 'Campaign complete'}</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SimulatorVisual({ gameId, difficulty, context, selected, correct }: { gameId: SdnGameId; difficulty: SdnDifficulty; context?: string[]; selected: number | null; correct: boolean }) {
  const load = gameId === 'growth' ? (difficulty === 'easy' ? 36 : difficulty === 'medium' ? 68 : 94) : 42
  return (
    <section className="min-h-[390px] overflow-hidden rounded-lg border border-noc-border bg-noc-bg/45">
      <div className="flex items-center justify-between border-b border-noc-border px-4 py-3"><p className="text-xs font-semibold uppercase tracking-widest text-noc-muted">Live simulation</p><span className={`text-[10px] ${correct ? 'text-link-up' : 'text-link-packet'}`}>{correct ? '● VERIFIED' : '● RUNNING'}</span></div>
      <div className="p-4">
        <svg viewBox="0 0 680 250" className="w-full" role="img" aria-label={`${gameId} network simulation`}>
          <line x1="100" y1="170" x2="270" y2="125" stroke="#3fb950" strokeWidth="3" /><line x1="330" y1="125" x2="500" y2="170" stroke="#3fb950" strokeWidth="3" /><line x1="300" y1="80" x2="300" y2="110" stroke="#58a6ff" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="215" y="15" width="170" height="65" rx="9" fill="#16283b" stroke="#58a6ff" strokeWidth="2" /><text x="300" y="42" textAnchor="middle" fill="#f0f6fc" fontSize="14" fontWeight="700">SDN CONTROLLER</text><text x="300" y="62" textAnchor="middle" fill="#79c0ff" fontSize="10">Topology · Policy · Flow Rules</text>
          <rect x="270" y="105" width="60" height="42" rx="6" fill="#1d3348" stroke="#79c0ff" strokeWidth="2" /><text x="300" y="131" textAnchor="middle" fill="#f0f6fc" fontSize="12">SW1</text>
          <rect x="54" y="151" width="92" height="45" rx="5" fill="#161b22" stroke="#bc8cff" /><text x="100" y="178" textAnchor="middle" fill="#c9d1d9" fontSize="11">CLIENTS</text>
          <rect x="500" y="151" width="100" height="45" rx="5" fill="#161b22" stroke="#bc8cff" /><text x="550" y="178" textAnchor="middle" fill="#c9d1d9" fontSize="11">SERVICES</text>
          <circle cx={selected === null ? 190 : 410} cy={selected === null ? 146 : 148} r="7" fill={correct ? '#3fb950' : '#58a6ff'}><animate attributeName="opacity" values="1;.35;1" dur="1s" repeatCount="indefinite" /></circle>
        </svg>
        {gameId === 'growth' && <div className="rounded-lg border border-noc-border bg-noc-surface/60 p-3"><div className="mb-2 flex justify-between text-xs"><span className="text-noc-muted">Configuration complexity</span><b className={load > 85 ? 'text-link-down' : 'text-link-congested'}>{load}%</b></div><div className="h-2 overflow-hidden rounded-full bg-noc-border"><div className={`h-full ${load > 85 ? 'bg-link-down' : 'bg-link-congested'}`} style={{ width: `${load}%` }} /></div></div>}
        {context && <div className="mt-3 grid gap-2 sm:grid-cols-2">{context.map((line) => <div key={line} className="rounded border border-noc-border bg-noc-surface/70 px-3 py-2 font-mono text-xs text-module-c">{line}</div>)}</div>}
        {!context && gameId !== 'growth' && <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded border border-noc-border p-2 text-noc-muted">PACKETS<br/><b className="text-noc-text">128/s</b></div><div className="rounded border border-noc-border p-2 text-noc-muted">RULES<br/><b className="text-noc-text">{difficulty === 'hard' ? 24 : 8}</b></div><div className="rounded border border-noc-border p-2 text-noc-muted">LINKS<br/><b className="text-link-up">UP</b></div></div>}
      </div>
    </section>
  )
}
