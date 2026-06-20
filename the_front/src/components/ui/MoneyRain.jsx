import React, { useEffect, useState } from 'react'

export default function MoneyRain({ active, onDone }) {
  const [coins, setCoins] = useState([])

  useEffect(() => {
    if (!active) return
    const generated = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 1.8 + Math.random() * 1.2,
      emoji: ['💸', '💰', '🪙', '✨'][Math.floor(Math.random() * 4)],
      size: 18 + Math.random() * 16,
    }))
    setCoins(generated)
    const timer = setTimeout(() => { setCoins([]); onDone?.() }, 3200)
    return () => clearTimeout(timer)
  }, [active])

  if (!coins.length) return null

  return (
    <div className="money-rain">
      {coins.map(c => (
        <span
          key={c.id}
          className="money-coin"
          style={{
            left: `${c.left}%`,
            fontSize: `${c.size}px`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        >
          {c.emoji}
        </span>
      ))}
    </div>
  )
}
