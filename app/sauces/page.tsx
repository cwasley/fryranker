'use client'

import { useState, useEffect, useCallback } from 'react'
import CategoryNav from '../components/CategoryNav'
import { saucesData, type SauceMeta } from '../data/sauces'
import '../styles.css'

// Global sauce data from database
interface GlobalSauce {
  id: number
  name: string
  restaurant: string
  score: number
  battles: number
}

// Combined sauce for display
interface Sauce extends SauceMeta {
  score: number
  battles: number
}

interface TasteEntry {
  id: number
  score: number
  wins: number
  losses: number
  comps: number
}

const REVEAL_AT = 12 // Fewer sauces, so reveal earlier
const LOCKED_TOTAL = 24

const STORAGE_KEYS = {
  taste: 'sauceranker_taste',
  comparisons: 'sauceranker_comparisons'
}

// Merge global DB data with local metadata
function mergeSauces(globalSauces: GlobalSauce[]): Sauce[] {
  return globalSauces.map(gs => {
    const meta = saucesData.find(m => m.id === gs.id)
    return {
      id: gs.id,
      name: gs.name,
      restaurant: gs.restaurant,
      score: gs.score,
      battles: gs.battles,
      emoji: meta?.emoji || "🌶️",
      tags: meta?.tags || [],
      note: meta?.note || "",
      style: meta?.restaurant || ""
    }
  })
}

export default function SauceRanker() {
  const [sauces, setSauces] = useState<Sauce[]>([])
  const [taste, setTaste] = useState<TasteEntry[]>(() => 
    saucesData.map(s => ({ id: s.id, score: 1500, wins: 0, losses: 0, comps: 0 }))
  )
  const [comparisons, setComparisons] = useState(0)
  const [currentPair, setCurrentPair] = useState<[Sauce, Sauce] | null>(null)
  const [activeVote, setActiveVote] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [voteAnimating, setVoteAnimating] = useState<number | null>(null)
  const [modalContent, setModalContent] = useState<{
    emoji: string
    title: string
    subtitle: string
    chipsHTML: string
    noteHTML: string
    actionsType: 'sauce' | 'taste' | 'locked'
  } | null>(null)

  // Dark mode effect
  useEffect(() => {
    // Use requestAnimationFrame to ensure repaint happens
    requestAnimationFrame(() => {
      if (isDarkMode) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
      
      // Force repaint on mobile browsers (multiple techniques for iOS Safari)
      void document.body.offsetHeight
      document.body.style.transform = 'translateZ(0)'
      requestAnimationFrame(() => {
        document.body.style.transform = ''
      })
    })
  }, [isDarkMode])

  // Share function
  const shareTopSauce = () => {
    const sorted = [...taste].sort((a, b) => b.score - a.score)
    const topSauce = saucesData.find(s => s.id === sorted[0].id)
    if (!topSauce) return

    const url = `${window.location.origin}/sauces`
    const text = `My #1 sauce is ${topSauce.name} ${topSauce.emoji}. What's yours?`

    if (navigator.share) {
      navigator.share({ 
        title: 'SauceRanker - The Definitive Sauce Standings', 
        text: text,
        url: url
      }).catch(() => {})
    } else {
      // Fallback: copy to clipboard
      const fullMessage = `${text}\n${url}`
      navigator.clipboard?.writeText(fullMessage)
      alert('Link copied to clipboard!')
    }
  }

  // Fetch global leaderboard from database
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/sauces/leaderboard')
      if (res.ok) {
        const data = await res.json()
        const merged = mergeSauces(data.fries) // API returns 'fries' key for consistency
        setSauces(merged)
      } else {
        setSauces(saucesData.map(m => ({ ...m, score: 1500, battles: 0, style: m.restaurant })))
      }
    } catch (error) {
      console.error('Failed to fetch sauces leaderboard:', error)
      setSauces(saucesData.map(m => ({ ...m, score: 1500, battles: 0, style: m.restaurant })))
    }
    setIsLoading(false)
  }, [])

  // Load personal taste from localStorage on mount
  useEffect(() => {
    try {
      const savedTaste = localStorage.getItem(STORAGE_KEYS.taste)
      const savedComparisons = localStorage.getItem(STORAGE_KEYS.comparisons)

      if (savedTaste) {
        const parsed = JSON.parse(savedTaste) as TasteEntry[]
        const merged = saucesData.map(s => {
          const saved = parsed.find(p => p.id === s.id)
          return saved || { id: s.id, score: 1500, wins: 0, losses: 0, comps: 0 }
        })
        setTaste(merged)
      }

      if (savedComparisons) {
        setComparisons(parseInt(savedComparisons, 10) || 0)
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
    setIsHydrated(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Save taste to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEYS.taste, JSON.stringify(taste))
    } catch (e) {
      console.warn('Failed to save taste to localStorage:', e)
    }
  }, [taste, isHydrated])

  // Save comparisons to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEYS.comparisons, comparisons.toString())
    } catch (e) {
      console.warn('Failed to save comparisons to localStorage:', e)
    }
  }, [comparisons, isHydrated])

  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
  const getSauce = (id: number) => sauces.find(s => s.id === id)
  const getSauceMeta = (id: number) => saucesData.find(s => s.id === id)
  const getTaste = (id: number) => taste.find(t => t.id === id)

  const pickNewDuel = useCallback(() => {
    if (sauces.length < 2) return
    const idx1 = Math.floor(Math.random() * sauces.length)
    let idx2 = Math.floor(Math.random() * sauces.length)
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * sauces.length)
    setCurrentPair([sauces[idx1], sauces[idx2]])
    setActiveVote(null)
  }, [sauces])

  // Pick initial duel once data is loaded
  useEffect(() => {
    if (isHydrated && !isLoading && sauces.length > 0 && !currentPair) {
      pickNewDuel()
    }
  }, [isHydrated, isLoading, sauces, currentPair, pickNewDuel])

  const tasteConfidencePct = () => {
    const pct = clamp(18 + (Math.log10(comparisons + 1) * 52), 18, 100)
    return comparisons >= LOCKED_TOTAL ? 100 : pct
  }

  const topTaste = () => {
    const sorted = [...taste].sort((a, b) => b.score - a.score)
    return sorted[0]
  }

  const getTopTagFromTopN = (n = 3) => {
    const topN = [...taste].sort((a, b) => b.score - a.score).slice(0, n).map(t => getSauceMeta(t.id)).filter(Boolean) as SauceMeta[]
    const tagCounts = new Map<string, number>()
    topN.forEach(s => (s.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)))
    let topTag = "", best = 0
    Array.from(tagCounts.entries()).forEach(([k, v]) => { if (v > best) { best = v; topTag = k } })
    return topTag
  }

  const tasteSummary = () => {
    if (comparisons < REVEAL_AT) {
      const remaining = REVEAL_AT - comparisons
      return {
        headline: "Hidden until you vote a bit…",
        sub: `Rank ${remaining} more matchup${remaining === 1 ? "" : "s"} to unlock your taste read.`,
        emoji: "🔒"
      }
    }

    const top = topTaste()
    const meta = getSauceMeta(top.id)
    if (!meta) return { headline: "Warming up…", sub: "Your favorites will sharpen as you vote.", emoji: "🌶️" }

    const topTag = getTopTagFromTopN(3)
    const headline = comparisons < 12 ? `Leaning: ${meta.name}` : `Your #1 right now: ${meta.name}`
    const sub = comparisons < 12 ? `Keep voting to confirm it.` : (topTag ? `You seem to love: ${topTag}.` : `Keep going to refine your style.`)

    return { headline, sub, emoji: meta.emoji || "🌶️" }
  }

  const getConfidenceHint = () => {
    if (comparisons >= LOCKED_TOTAL) return "Locked. You have a very real sauce opinion now."
    if (comparisons >= 12) return "This is getting specific. The #1 is starting to separate."
    if (comparisons >= REVEAL_AT) return "Unlocked. Now we can start calling your shots."
    if (comparisons >= 6) return "Nice. Your taste profile is taking shape."
    return "Vote a few times to start dialing in your personal #1."
  }

  const vote = async (winnerIndex: number) => {
    if (!currentPair) return
    setActiveVote(winnerIndex)
    
    // Trigger vote animation
    setVoteAnimating(winnerIndex)
    setTimeout(() => setVoteAnimating(null), 500)

    const winner = currentPair[winnerIndex]
    const loser = currentPair[winnerIndex === 0 ? 1 : 0]

    // Update personal taste locally
    setTaste(prev => {
      const newTaste = [...prev]
      const w = newTaste.find(t => t.id === winner.id)!
      const l = newTaste.find(t => t.id === loser.id)!

      const K = 28
      const expectedW = 1 / (1 + Math.pow(10, (l.score - w.score) / 400))
      const expectedL = 1 / (1 + Math.pow(10, (w.score - l.score) / 400))

      w.score = Math.round(w.score + K * (1 - expectedW))
      l.score = Math.round(l.score + K * (0 - expectedL))
      w.wins += 1
      l.losses += 1
      w.comps += 1
      l.comps += 1

      return newTaste
    })
    setComparisons(c => c + 1)

    // Optimistically update local state
    setSauces(prev => {
      const newSauces = [...prev]
      const winnerSauce = newSauces.find(s => s.id === winner.id)
      const loserSauce = newSauces.find(s => s.id === loser.id)
      if (winnerSauce && loserSauce) {
        const K = 32
        const expectedWinner = 1 / (1 + Math.pow(10, (loserSauce.score - winnerSauce.score) / 400))
        const expectedLoser = 1 / (1 + Math.pow(10, (winnerSauce.score - loserSauce.score) / 400))
        winnerSauce.score = Math.round(winnerSauce.score + K * (1 - expectedWinner))
        loserSauce.score = Math.round(loserSauce.score + K * (0 - expectedLoser))
        winnerSauce.battles += 1
        loserSauce.battles += 1
      }
      return newSauces
    })

    // Send vote to server
    fetch('/api/sauces/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId: winner.id, loserId: loser.id })
    }).catch(error => console.error('Failed to record vote:', error))

    setTimeout(() => {
      pickNewDuel()
    }, 100)
  }

  const skipMatchup = () => {
    pickNewDuel()
  }

  const isSpicyTag = (tag: string) => /spice|spicy|heat|hot|cajun|pepper|fire/i.test(tag)

  const computeTasteInsights = () => {
    const sorted = [...taste].sort((a, b) => b.score - a.score)
    const top5 = sorted.slice(0, 5)

    const topSauces = top5.map(t => getSauceMeta(t.id)).filter(Boolean) as SauceMeta[]
    const spicyWords = /spice|spicy|heat|hot|fire|diablo|cajun/i
    const spiceHits = topSauces.reduce((acc, s) => acc + ((s.tags || []).some(t => spicyWords.test(t.toLowerCase())) ? 1 : 0), 0)
    const spiceLane = spiceHits >= 3 ? "Heat-seeker" : (spiceHits === 2 ? "Balanced" : "Mild & creamy")

    const creamyWords = /creamy|mayo|ranch/i
    const tangyWords = /tangy|vinegar|mustard|sweet/i
    let creamy = 0, tangy = 0
    topSauces.forEach(s => {
      const tags = (s.tags || []).join(" ")
      if (creamyWords.test(tags)) creamy += 1
      if (tangyWords.test(tags)) tangy += 1
    })
    const textureLane = creamy > tangy ? "Creamy lover" : (tangy > creamy ? "Tangy fan" : "Texture-agnostic")

    let decisive: { id: number; wr: number; comps: number } | null = null
    sorted.forEach(t => {
      if (t.comps >= 3) {
        const wr = t.wins / (t.wins + t.losses)
        if (!decisive || wr > decisive.wr) {
          decisive = { id: t.id, wr, comps: t.comps }
        }
      }
    })

    return { spiceLane, textureLane, decisive }
  }

  const openSauceModal = (id: number) => {
    const sauce = sauces.find(s => s.id === id)
    if (!sauce) return

    const chips = (sauce.tags || []).map(t => 
      `<span class="chip${isSpicyTag(t) ? " red" : ""}">${t}</span>`
    ).join("")

    setModalContent({
      emoji: sauce.emoji,
      title: sauce.name,
      subtitle: `${sauce.restaurant} • ${sauce.battles} battles`,
      chipsHTML: chips,
      noteHTML: sauce.note || "",
      actionsType: 'sauce'
    })
    setModalOpen(true)
  }

  const openTasteResults = () => {
    if (comparisons < REVEAL_AT) {
      const remaining = REVEAL_AT - comparisons
      const pct = tasteConfidencePct().toFixed(0)

      setModalContent({
        emoji: "🔒",
        title: "Taste Profile (Locked)",
        subtitle: `${comparisons} comparisons • ${pct}% confidence`,
        chipsHTML: `<span class="chip">Keep it unbiased</span> <span class="chip red">${remaining} to unlock</span>`,
        noteHTML: `You're still calibrating. Rank <strong>${remaining}</strong> more matchup${remaining === 1 ? "" : "s"} and we'll reveal your current #1 + flavor lean.`,
        actionsType: 'locked'
      })
      setModalOpen(true)
      return
    }

    const sorted = [...taste].sort((a, b) => b.score - a.score)
    const top5HTML = sorted.slice(0, 5).map((t, i) => {
      const meta = getSauceMeta(t.id)
      const pct = (t.wins + t.losses) ? Math.round((t.wins / (t.wins + t.losses)) * 100) : 0
      return `<div style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:${i < 4 ? '1px solid rgba(29,29,31,0.08)' : '0'};">
        <div style="min-width:0;">
          <div style="font-weight:800; letter-spacing:-0.01em;">${i + 1}. ${meta ? meta.name : "—"}</div>
          <div style="color: var(--text-secondary); font-weight:600; font-size:0.85rem;">${meta ? meta.restaurant : ""} • ${t.comps} comps • ${pct}% win</div>
        </div>
        <div style="font-size:1.3rem; line-height:1;">${meta ? meta.emoji : "🌶️"}</div>
      </div>`
    }).join("")

    const topTag = getTopTagFromTopN(3)
    const tagChip = topTag ? `<span class="chip">${topTag}</span>` : `<span class="chip">Still learning</span>`
    const insights = computeTasteInsights()

    const topTagLine = topTag ? `You seem to love: <strong>${topTag}</strong>.` : `We're still learning what you like most.`
    const profileLine = `Profile: <strong>${insights.textureLane}</strong> • <strong>${insights.spiceLane}</strong>.`

    const stats = `
      <div class="statgrid">
        <div class="stat">
          <div class="k">Heat level</div>
          <p class="v">${insights.spiceLane}</p>
          <p class="s">Based on winners</p>
        </div>
        <div class="stat">
          <div class="k">Texture</div>
          <p class="v">${insights.textureLane}</p>
          <p class="s">Creamy vs tangy</p>
        </div>
      </div>
    `

    const pct = tasteConfidencePct().toFixed(0)
    const note = comparisons < 12
      ? "Early read: your top picks can still flip. Keep voting to separate the #1."
      : "This is your personal read based on head-to-head votes in this session."

    setModalContent({
      emoji: "🧠",
      title: "Your Taste Profile",
      subtitle: `${comparisons} comparisons • ${pct}% confidence`,
      chipsHTML: tagChip,
      noteHTML: `<div style="margin-bottom:10px;">${note}</div><div style="margin:10px 0 10px; font-weight:800; letter-spacing:-0.01em;">${profileLine}</div><div style="margin-bottom:10px; color: var(--text-secondary); font-weight:600;">${topTagLine}</div>${stats}<details style="margin-top:14px;"><summary style="cursor:pointer; font-weight:800; letter-spacing:-0.01em;">Top 5</summary><div style="margin-top:10px;">${top5HTML}</div></details>`,
      actionsType: 'taste'
    })
    setModalOpen(true)
  }

  const resetTaste = () => {
    setComparisons(0)
    setTaste(saucesData.map(s => ({ id: s.id, score: 1500, wins: 0, losses: 0, comps: 0 })))
    try {
      localStorage.removeItem(STORAGE_KEYS.taste)
      localStorage.removeItem(STORAGE_KEYS.comparisons)
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
    setModalOpen(false)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalContent(null)
  }

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        vote(0)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        vote(1)
      } else if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowDown') {
        event.preventDefault()
        skipMatchup()
      } else if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentPair]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortedSauces = [...sauces].sort((a, b) => b.score - a.score)
  const summary = tasteSummary()

  // Calculate total global votes
  const totalGlobalVotes = sauces.reduce((sum, s) => sum + s.battles, 0) / 2

  // Show loading state until hydrated
  if (!isHydrated || isLoading) {
    return (
      <>
        <CategoryNav />
        <div className="wrap">
          <header>
            <h1>Sauce<span>Ranker</span></h1>
            <p className="subtitle">The Definitive Sauce Rankings.</p>
          </header>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            Loading the global sauce standings...
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <button 
        className="dark-mode-toggle" 
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <CategoryNav />

      <div className="wrap">
        <header>
          <h1>Sauce<span>Ranker</span></h1>
          <p className="subtitle">The Definitive Sauce Rankings.</p>
        </header>

        <div className="confidence" title="This estimates how confident we are about your personal favorites (not the global leaderboard).">
          <div className="confidence-top">
            <div className="confidence-title">Your Taste Confidence</div>
            <div className="confidence-meta"><span>{comparisons}</span> comparisons</div>
          </div>
          <div className="bar" aria-label="Taste confidence bar">
            <div style={{ width: `${tasteConfidencePct().toFixed(0)}%` }}></div>
          </div>
          <div className="confidence-hint">{getConfidenceHint()}</div>

          <div className="taste-card">
            <div className="taste-left">
              <p className="taste-kicker">Current read</p>
              <p className="taste-main">{summary.headline}</p>
              <p className="taste-sub">{summary.sub}</p>
            </div>
            <div className="taste-emoji">{summary.emoji}</div>
            <button className="taste-btn" onClick={openTasteResults}>View</button>
          </div>
          {comparisons >= REVEAL_AT && (
            <button className="share-btn" onClick={shareTopSauce}>
              🌶️ Share my #1
            </button>
          )}
        </div>

        <div className="grid">
          <div className="duel-container">
            <p className="duel-kicker">Which is better?</p>
            <div className="duel-cards">
              {currentPair && (
                <>
                  <div 
                    className={`duel-card ${activeVote === 0 ? 'active-vote' : ''} ${voteAnimating === 0 ? 'vote-animate' : ''}`}
                    onClick={() => vote(0)}
                  >
                    <div className="emoji">{currentPair[0].emoji}</div>
                    <h2>{currentPair[0].name}</h2>
                    <p className="style-line">{currentPair[0].restaurant}</p>
                    <div className="chips">
                      {currentPair[0].tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={`chip${isSpicyTag(tag) ? ' red' : ''}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div 
                    className={`duel-card ${activeVote === 1 ? 'active-vote' : ''} ${voteAnimating === 1 ? 'vote-animate' : ''}`}
                    onClick={() => vote(1)}
                  >
                    <div className="emoji">{currentPair[1].emoji}</div>
                    <h2>{currentPair[1].name}</h2>
                    <p className="style-line">{currentPair[1].restaurant}</p>
                    <div className="chips">
                      {currentPair[1].tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={`chip${isSpicyTag(tag) ? ' red' : ''}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button className="pill-btn" onClick={skipMatchup}>Skip matchup</button>
            </div>

            <div className="keyboard-hint">
              Use <span className="key">←</span> or <span className="key">→</span> to vote quickly!
            </div>
          </div>

          <div className="leaderboard-container">
            <div className="section-title">
              <span>Global Standings</span>
              <small>{Math.floor(totalGlobalVotes).toLocaleString()} total votes</small>
            </div>
            <div>
              {sortedSauces.map((sauce, index) => (
                <div key={sauce.id} className="fry-row" onClick={() => openSauceModal(sauce.id)}>
                  <div className="row-left">
                    <span className="rank-number">{index + 1}</span>
                    <div className="info">
                      <h3>{sauce.name}</h3>
                      <p>{sauce.restaurant} • {sauce.battles} battles</p>
                    </div>
                  </div>
                  <div className="score-badge">{sauce.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div 
        className="modal-backdrop" 
        style={{ display: modalOpen ? 'flex' : 'none' }}
        onClick={(e) => e.target === e.currentTarget && closeModal()}
        role="dialog" 
        aria-modal="true" 
        aria-hidden={!modalOpen}
      >
        <div className="modal">
          <button className="close" onClick={closeModal} aria-label="Close">✕</button>
          <div className="modal-head">
            <div className="modal-emoji">{modalContent?.emoji || "🌶️"}</div>
            <div>
              <h3>{modalContent?.title || ""}</h3>
              <p>{modalContent?.subtitle || ""}</p>
            </div>
          </div>
          <div className="chips" dangerouslySetInnerHTML={{ __html: modalContent?.chipsHTML || "" }} />
          <div className="note" dangerouslySetInnerHTML={{ __html: modalContent?.noteHTML || "" }} />
          <div className="modal-actions">
            {modalContent?.actionsType === 'sauce' && (
              <>
                <button className="pill-btn" onClick={() => { pickNewDuel(); closeModal(); }}>New matchup</button>
                <button className="pill-btn red" onClick={closeModal}>Back to ranking</button>
              </>
            )}
            {modalContent?.actionsType === 'taste' && (
              <>
                <button className="pill-btn" onClick={closeModal}>Back</button>
                <button className="pill-btn red" onClick={resetTaste}>Reset taste profile</button>
              </>
            )}
            {modalContent?.actionsType === 'locked' && (
              <>
                <button className="pill-btn" onClick={closeModal}>Back</button>
                <button className="pill-btn red" onClick={resetTaste}>Reset</button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Made with 🍟 by fry enthusiasts <a href="https://maxjeffrey.com" target="_blank" rel="noopener noreferrer">Max</a> & <a href="https://github.com/cwasley" target="_blank" rel="noopener noreferrer">Collin</a></p>
      </footer>
    </>
  )
}
