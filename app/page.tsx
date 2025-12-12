'use client'

import { useState, useEffect, useCallback } from 'react'
import './styles.css'

interface Fry {
  id: number
  name: string
  style: string
  score: number
  emoji: string
  tags: string[]
  note: string
  battles: number
}

interface TasteEntry {
  id: number
  score: number
  wins: number
  losses: number
  comps: number
}

const initialFries: Fry[] = [
  { id: 0, name: "McDonald's", style: "Shoestring", score: 1500, emoji: "🍟",
    tags: ["Thin + snappy", "Salt-forward", "Dip-friendly", "Classic"],
    note: "Iconic shoestrings: quick crunch, fast melt, pure salt-and-potato simplicity.",
    battles: 0 },
  { id: 1, name: "Five Guys", style: "Boardwalk", score: 1450, emoji: "🥜",
    tags: ["Thick cut", "Peanut oil", "Soft center", "Best fresh"],
    note: "Hand-cut heft with a soft interior; peanut oil aroma does a lot of the heavy lifting.",
    battles: 0 },
  { id: 2, name: "Chick-fil-A", style: "Waffle", score: 1400, emoji: "🧇",
    tags: ["Waffle pockets", "Crisp edges", "Sauce sponge", "Balanced salt"],
    note: "Waffles = texture + maximum sauce capacity. Peak performance with dipping.",
    battles: 0 },
  { id: 3, name: "Shake Shack", style: "Crinkle Cut", score: 1350, emoji: "🍔",
    tags: ["Crinkle ridges", "Crispy shell", "Soft middle", "Sauce-ready"],
    note: "Crinkle geometry brings crunch and grip. Feels engineered (in a good way).",
    battles: 0 },
  { id: 4, name: "Popeyes", style: "Cajun Fries", score: 1300, emoji: "🍗",
    tags: ["Cajun spice", "Peppery heat", "Crunchy edges", "Bold seasoning"],
    note: "Spice-first fries that play well with a creamy dip. Loud in the best way.",
    battles: 0 },
  { id: 5, name: "Arby's", style: "Curly", score: 1250, emoji: "🌀",
    tags: ["Curly chaos", "Seasoned", "Textural mix", "Snackable"],
    note: "Curly fries are a rollercoaster: crunchy bits, soft coils, constant surprises.",
    battles: 0 },
  { id: 6, name: "Wendy's", style: "Natural Cut", score: 1200, emoji: "🥤",
    tags: ["Skin-on", "Sturdy", "Salt + pepper", "Reliable"],
    note: "Skin-on sturdiness. Not always the crispiest, but it holds up.",
    battles: 0 },
  { id: 7, name: "Wingstop", style: "Seasoned", score: 1150, emoji: "🪽",
    tags: ["Seasoned dust", "Crisp edges", "Savory", "Snack mode"],
    note: "That seasoned dust is the point. Crisp edges + savory hit = addictive.",
    battles: 0 },
  { id: 8, name: "In-N-Out", style: "Fresh Cut", score: 1000, emoji: "🌴",
    tags: ["Fresh potato", "Soft bite", "Light salt", "Best animal-style"],
    note: "Fresh cut and simple. If you're judging strictly on crispiness, it's polarizing.",
    battles: 0 },
  { id: 9, name: "Burger King", style: "Thick Cut", score: 1400, emoji: "👑",
    tags: ["Thick cut", "Soft center", "Lightly crisp", "Classic fast-food"],
    note: "Hefty and straightforward—more potato-forward than crunchy.",
    battles: 0 },
  { id: 10, name: "KFC", style: "Seasoned Wedge", score: 1300, emoji: "🍗",
    tags: ["Wedge cut", "Peppery", "Hearty", "Needs sauce"],
    note: "Wedges are built like side dishes. Best when dunked.",
    battles: 0 },
  { id: 11, name: "Checkers/Rally's", style: "Famous Seasoned", score: 1250, emoji: "🚦",
    tags: ["Max seasoning", "Crisp shell", "Garlic notes", "Late-night hero"],
    note: "Aggressively seasoned. The 'how is this so good?' drive-thru classic.",
    battles: 0 },
  { id: 12, name: "Steak 'n Shake", style: "Shoestring", score: 1150, emoji: "🥛",
    tags: ["Ultra thin", "Crispy", "Salty", "Snackable"],
    note: "Thin and crispy—feels like a fry that wants to be eaten by the handful.",
    battles: 0 },
  { id: 13, name: "Culver's", style: "Crinkle Cut", score: 1100, emoji: "🐄",
    tags: ["Crinkle", "Buttery vibe", "Soft middle", "Comfort"],
    note: "Comfort crinkles. Plush texture; great with a rich burger.",
    battles: 0 },
  { id: 14, name: "Taco Bell", style: "Nacho Fries", score: 1200, emoji: "🌮",
    tags: ["Nacho spice", "Warm cumin", "Dip-required", "Limited-time hype"],
    note: "Seasoning-forward with a signature nacho vibe. Built for cheese sauce.",
    battles: 0 },
  { id: 15, name: "Jack in the Box", style: "Classic", score: 1125, emoji: "🃏",
    tags: ["Medium cut", "Light crisp", "Neutral salt", "Reliable"],
    note: "A classic middle-of-the-road fry that can surprise you when it's fresh.",
    battles: 0 },
  { id: 16, name: "Del Taco", style: "Crinkle Cut", score: 1100, emoji: "🌯",
    tags: ["Crinkle", "Crisp edges", "Salt-forward", "Hot-sauce friendly"],
    note: "Crinkles with fast-food swagger. Hot sauce compatibility is elite.",
    battles: 0 },
  { id: 17, name: "Sonic", style: "Tots", score: 1180, emoji: "🛼",
    tags: ["Tater tots", "Crispy outside", "Fluffy inside", "Cheese-ready"],
    note: "Not a fry, but it belongs here. Peak with chili + cheese.",
    battles: 0 },
  { id: 18, name: "White Castle", style: "Crinkle Cut", score: 1075, emoji: "🏰",
    tags: ["Crinkle", "Soft middle", "Snackable", "Slider companion"],
    note: "Crinkles made for tiny burgers. Hits different at 1 a.m.",
    battles: 0 }
]

const REVEAL_AT = 18
const LOCKED_TOTAL = 36

export default function FryRanker() {
  const [fries, setFries] = useState<Fry[]>(initialFries)
  const [taste, setTaste] = useState<TasteEntry[]>(() => 
    initialFries.map(f => ({ id: f.id, score: 1500, wins: 0, losses: 0, comps: 0 }))
  )
  const [comparisons, setComparisons] = useState(0)
  const [currentPair, setCurrentPair] = useState<[Fry, Fry] | null>(null)
  const [activeVote, setActiveVote] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<{
    emoji: string
    title: string
    subtitle: string
    chipsHTML: string
    noteHTML: string
    actionsType: 'fry' | 'taste' | 'locked'
  } | null>(null)

  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
  const getFry = (id: number) => fries.find(f => f.id === id)
  const getTaste = (id: number) => taste.find(t => t.id === id)

  const pickNewDuel = useCallback(() => {
    const idx1 = Math.floor(Math.random() * fries.length)
    let idx2 = Math.floor(Math.random() * fries.length)
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * fries.length)
    setCurrentPair([fries[idx1], fries[idx2]])
    setActiveVote(null)
  }, [fries])

  useEffect(() => {
    pickNewDuel()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tasteConfidencePct = () => {
    const pct = clamp(18 + (Math.log10(comparisons + 1) * 52), 18, 100)
    return comparisons >= LOCKED_TOTAL ? 100 : pct
  }

  const topTaste = () => {
    const sorted = [...taste].sort((a, b) => b.score - a.score)
    return sorted[0]
  }

  const getTopTagFromTopN = (n = 3) => {
    const topN = [...taste].sort((a, b) => b.score - a.score).slice(0, n).map(t => getFry(t.id)).filter(Boolean) as Fry[]
    const tagCounts = new Map<string, number>()
    topN.forEach(f => (f.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)))
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
    const fry = getFry(top.id)
    if (!fry) return { headline: "Warming up…", sub: "Your favorites will sharpen as you vote.", emoji: "🍟" }

    const topTag = getTopTagFromTopN(3)
    const headline = comparisons < 18 ? `Leaning: ${fry.name}` : `Your #1 right now: ${fry.name}`
    const sub = comparisons < 18 ? `Keep voting to confirm it.` : (topTag ? `You seem to love: ${topTag}.` : `Keep going to refine your style.`)

    return { headline, sub, emoji: fry.emoji || "🍟" }
  }

  const getConfidenceHint = () => {
    if (comparisons >= LOCKED_TOTAL) return "Locked. You have a very real fry opinion now."
    if (comparisons >= 18) return "This is getting specific. The #1 is starting to separate."
    if (comparisons >= REVEAL_AT) return "Unlocked. Now we can start calling your shots."
    if (comparisons >= 8) return "Nice. Your taste profile is taking shape."
    return "Vote a few times to start dialing in your personal #1."
  }

  const vote = (winnerIndex: number) => {
    if (!currentPair) return
    setActiveVote(winnerIndex)

    setTimeout(() => {
      const winner = currentPair[winnerIndex]
      const loser = currentPair[winnerIndex === 0 ? 1 : 0]

      // Update global ELO
      setFries(prev => {
        const newFries = [...prev]
        const winnerFry = newFries.find(f => f.id === winner.id)!
        const loserFry = newFries.find(f => f.id === loser.id)!

        const K = 32
        const expectedWinner = 1 / (1 + Math.pow(10, (loserFry.score - winnerFry.score) / 400))
        const expectedLoser = 1 / (1 + Math.pow(10, (winnerFry.score - loserFry.score) / 400))

        winnerFry.score = Math.round(winnerFry.score + K * (1 - expectedWinner))
        loserFry.score = Math.round(loserFry.score + K * (0 - expectedLoser))
        winnerFry.battles += 1
        loserFry.battles += 1

        return newFries
      })

      // Update taste ELO
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
      pickNewDuel()
    }, 100)
  }

  const skipMatchup = () => {
    pickNewDuel()
  }

  const isSpicyTag = (tag: string) => /spice|cajun|nacho|pepper|heat|cumin|garlic/i.test(tag)

  const styleBucket = (style: string) => {
    const s = (style || "").toLowerCase()
    if (s.includes("waffle")) return "Waffle"
    if (s.includes("curly")) return "Curly"
    if (s.includes("wedge")) return "Wedges"
    if (s.includes("tots")) return "Tots"
    if (s.includes("crinkle")) return "Crinkle"
    if (s.includes("shoestring") || s.includes("thin")) return "Shoestring"
    if (s.includes("thick") || s.includes("boardwalk")) return "Thick Cut"
    if (s.includes("fresh")) return "Fresh Cut"
    return "Classic"
  }

  const computeTasteInsights = () => {
    const sorted = [...taste].sort((a, b) => b.score - a.score)
    const top5 = sorted.slice(0, 5)

    const styleCounts = new Map<string, number>()
    top5.forEach(t => {
      const fry = getFry(t.id)
      const bucket = styleBucket(fry?.style || "")
      styleCounts.set(bucket, (styleCounts.get(bucket) || 0) + 1)
    })
    let topStyle = "Mixed bag", topStyleCount = 0
    Array.from(styleCounts.entries()).forEach(([k, v]) => {
      if (v > topStyleCount) { topStyle = k; topStyleCount = v }
    })

    const topFries = top5.map(t => getFry(t.id)).filter(Boolean) as Fry[]
    const spicyWords = /spice|cajun|nacho|pepper|heat|cumin|max seasoning/i
    const spiceHits = topFries.reduce((acc, f) => acc + ((f.tags || []).some(t => spicyWords.test(t.toLowerCase())) ? 1 : 0), 0)
    const spiceLane = spiceHits >= 3 ? "Seasoning-forward" : (spiceHits === 2 ? "Balanced" : "Clean + classic")

    const crunchWords = /crisp|crispy|snappy|crunch|shell|edges/i
    const softWords = /soft|fluffy|plush|melt/i
    let crunch = 0, soft = 0
    topFries.forEach(f => {
      const tags = (f.tags || []).join(" ")
      if (crunchWords.test(tags)) crunch += 1
      if (softWords.test(tags)) soft += 1
    })
    const textureLane = crunch > soft ? "Crunch-chaser" : (soft > crunch ? "Soft-center loyalist" : "Texture-agnostic")

    let decisive: { id: number; wr: number; comps: number } | null = null
    sorted.forEach(t => {
      if (t.comps >= 3) {
        const wr = t.wins / (t.wins + t.losses)
        if (!decisive || wr > decisive.wr) {
          decisive = { id: t.id, wr, comps: t.comps }
        }
      }
    })

    return { topStyle, spiceLane, textureLane, decisive }
  }

  const openFryModal = (id: number) => {
    const fry = fries.find(f => f.id === id)
    if (!fry) return

    const chips = (fry.tags || []).map(t => 
      `<span class="chip${isSpicyTag(t) ? " red" : ""}">${t}</span>`
    ).join("")

    setModalContent({
      emoji: fry.emoji,
      title: fry.name,
      subtitle: `${fry.style} • ${fry.battles} battles`,
      chipsHTML: chips,
      noteHTML: fry.note || "",
      actionsType: 'fry'
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
        noteHTML: `You're still calibrating. Rank <strong>${remaining}</strong> more matchup${remaining === 1 ? "" : "s"} and we'll reveal your current #1 + style lean.`,
        actionsType: 'locked'
      })
      setModalOpen(true)
      return
    }

    const sorted = [...taste].sort((a, b) => b.score - a.score)
    const top5HTML = sorted.slice(0, 5).map((t, i) => {
      const fry = getFry(t.id)
      const pct = (t.wins + t.losses) ? Math.round((t.wins / (t.wins + t.losses)) * 100) : 0
      return `<div style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:${i < 4 ? '1px solid rgba(29,29,31,0.08)' : '0'};">
        <div style="min-width:0;">
          <div style="font-weight:800; letter-spacing:-0.01em;">${i + 1}. ${fry ? fry.name : "—"}</div>
          <div style="color: var(--text-secondary); font-weight:600; font-size:0.85rem;">${fry ? fry.style : ""} • ${t.comps} comps • ${pct}% win</div>
        </div>
        <div style="font-size:1.3rem; line-height:1;">${fry ? fry.emoji : "🍟"}</div>
      </div>`
    }).join("")

    const topTag = getTopTagFromTopN(3)
    const tagChip = topTag ? `<span class="chip">${topTag}</span>` : `<span class="chip">Still learning</span>`
    const insights = computeTasteInsights()

    const topTagLine = topTag ? `You seem to love: <strong>${topTag}</strong>.` : `We're still learning what you like most.`
    const profileLine = `Profile: <strong>${insights.textureLane}</strong> • <strong>${insights.spiceLane}</strong> • <strong>${insights.topStyle}</strong>.`

    const stats = `
      <div class="statgrid">
        <div class="stat">
          <div class="k">Style lane</div>
          <p class="v">${insights.topStyle}</p>
          <p class="s">Top 5 trend</p>
        </div>
        <div class="stat">
          <div class="k">Seasoning</div>
          <p class="v">${insights.spiceLane}</p>
          <p class="s">Based on winners</p>
        </div>
        <div class="stat">
          <div class="k">Texture</div>
          <p class="v">${insights.textureLane}</p>
          <p class="s">Crunch vs soft</p>
        </div>
      </div>
    `

    const pct = tasteConfidencePct().toFixed(0)
    const note = comparisons < 18
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
    setTaste(initialFries.map(f => ({ id: f.id, score: 1500, wins: 0, losses: 0, comps: 0 })))
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

  const sortedFries = [...fries].sort((a, b) => b.score - a.score)
  const summary = tasteSummary()

  return (
    <>
      <div className="wrap">
        <header>
          <h1>Fry<span>Ranker</span></h1>
          <p className="subtitle">The Definitive Fry Rankings.</p>
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
        </div>

        <div className="grid">
          <div className="duel-container">
            <p className="duel-kicker">Which is better?</p>
            <div className="duel-cards">
              {currentPair && (
                <>
                  <div 
                    className={`duel-card ${activeVote === 0 ? 'active-vote' : ''}`}
                    onClick={() => vote(0)}
                  >
                    <div className="emoji">{currentPair[0].emoji}</div>
                    <h2>{currentPair[0].name}</h2>
                    <p className="style-line">{currentPair[0].style}</p>
                    <div className="chips">
                      {currentPair[0].tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={`chip${isSpicyTag(tag) ? ' red' : ''}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div 
                    className={`duel-card ${activeVote === 1 ? 'active-vote' : ''}`}
                    onClick={() => vote(1)}
                  >
                    <div className="emoji">{currentPair[1].emoji}</div>
                    <h2>{currentPair[1].name}</h2>
                    <p className="style-line">{currentPair[1].style}</p>
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
              <span>Current Standings</span>
              <small>Click a row for details</small>
            </div>
            <div>
              {sortedFries.map((fry, index) => (
                <div key={fry.id} className="fry-row" onClick={() => openFryModal(fry.id)}>
                  <div className="row-left">
                    <span className="rank-number">{index + 1}</span>
                    <div className="info">
                      <h3>{fry.name}</h3>
                      <p>{fry.style} • {fry.battles} battles</p>
                    </div>
                  </div>
                  <div className="score-badge">{fry.score}</div>
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
            <div className="modal-emoji">{modalContent?.emoji || "🍟"}</div>
            <div>
              <h3>{modalContent?.title || ""}</h3>
              <p>{modalContent?.subtitle || ""}</p>
            </div>
          </div>

          <div className="chips" dangerouslySetInnerHTML={{ __html: modalContent?.chipsHTML || "" }} />
          <div className="note" dangerouslySetInnerHTML={{ __html: modalContent?.noteHTML || "" }} />

          <div className="modal-actions">
            {modalContent?.actionsType === 'fry' && (
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
    </>
  )
}

