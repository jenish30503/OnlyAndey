'use client'

import { useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { type EggType, money, pricePerEgg } from '@/lib/pricing'
import { cn } from '@/lib/utils'

export function EggProduct({ type, quantity, tiers, onChange, disabled }: { type: EggType; quantity: number; tiers?: number[]; onChange: (delta: number) => void; disabled: boolean }) {
  const photo = useRef<HTMLSpanElement>(null)
  const [tap, setTap] = useState(0)
  const boiled = type === 'boiled'
  function add() {
    onChange(1)
    setTap(v => v + 1)
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) photo.current?.animate([
      { transform: 'rotate(0deg) translateY(0)' }, { transform: 'rotate(-6deg) translateY(-5px)' },
      { transform: 'rotate(5deg) translateY(-3px)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(0deg) translateY(0)' },
    ], { duration: 380, easing: 'ease-out' })
  }
  return <article className="egg-product">
    <div className="product-title"><h2>{boiled ? 'BOILED' : 'RAW'}</h2><span>{boiled ? 'Ready to eat. Salt included.' : 'Fresh eggs. Your way.'}</span></div>
    <button className={cn('egg-tap', boiled ? 'egg-boiled' : 'egg-raw')} aria-label={`Add ${type} egg`} onClick={add} disabled={disabled} type="button">
      <span ref={photo} className="egg-photo" role="img" aria-label={`A fresh brown ${type} egg`} />
      {tap > 0 && <span key={tap} className="egg-plus" aria-hidden="true">+1</span>}
      <span className="tap-dot" aria-hidden="true"><Plus size={19} strokeWidth={1.7} /></span>
    </button>
    <div className="product-bottom"><div className="product-price">{tiers ? money(pricePerEgg(quantity, tiers)) : '—'}<span> / egg</span></div>
      <div className="quantity-control"><button type="button" onClick={() => onChange(-1)} disabled={!quantity || disabled} aria-label={`Remove ${type} egg`}><Minus size={17} /></button><output aria-label={`${boiled ? 'Boiled' : 'Raw'} egg quantity`}>{quantity}</output><button type="button" onClick={add} disabled={disabled} aria-label={`Increase ${type} eggs`}><Plus size={17} /></button></div>
    </div>
    <p className="tier-hint">{tiers ? quantity >= 10 ? 'You’ve unlocked our best price.' : `10+ eggs? Just ${money(tiers[5])} each.` : 'Getting today’s prices…'}</p>
  </article>
}
