'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowDown, ArrowUpRight, ShoppingBag } from 'lucide-react'
import { EggProduct } from '@/components/egg-product'
import { OrderPanel } from '@/components/order-panel'
import { type EggType, type Pricing, type Quantities, type Receipt } from '@/lib/pricing'

async function fetchPricing(url: string): Promise<Pricing> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Couldn’t load prices.')
  return response.json()
}
export function EggStore() {
  const { data: pricing, error: pricingError, mutate } = useSWR<Pricing>('/api/pricing', fetchPricing, { refreshInterval: 30000, revalidateOnFocus: true })
  const [quantities, setQuantities] = useState<Quantities>({ boiled: 0, raw: 0 })
  const [step, setStep] = useState<'cart' | 'details'>('cart')
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const submission = useRef<{ fingerprint: string; id: string } | null>(null)
  const submitting = useRef(false)
  useEffect(() => setReady(true), [])
  const count = quantities.boiled + quantities.raw
  function change(type: EggType, delta: number) {
    setReceipt(null)
    setError('')
    setQuantities(q => ({ ...q, [type]: Math.max(0, q[type] + delta) }))
  }
  async function submit(room: string, phone: string) {
    if (!pricing || submitting.current) return
    submitting.current = true
    setPending(true)
    setError('')
    const fingerprint = JSON.stringify({ quantities, room, phone })
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, id: crypto.randomUUID() }
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...quantities, room, phone, version: pricing.version, id: submission.current!.id }) })
      const body = await response.json()
      if (!response.ok) { if (body.code === 'PRICING_CHANGED') await mutate(); throw new Error(body.error || 'Please try placing your order again.') }
      setReceipt(body)
      document.getElementById('your-order')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (e) { setError(e instanceof Error ? e.message : 'Couldn’t reach us. Please try again.') }
    finally { setPending(false); submitting.current = false }
  }
  function goToOrder() { document.getElementById('your-order')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  return <div className="store-page" data-ready={ready}>
    <header className="store-header"><a href="/" className="wordmark" aria-label="Only Andey home"><img src="/logo.png" alt="Only Andey" className="wordmark-logo" /></a><div className="header-right"><span className="delivery-status"><span />Room delivery, made easy</span><button className="cart-indicator" onClick={goToOrder} aria-label={`View order, ${count} eggs`}><ShoppingBag size={17} /><span>{count}</span></button></div></header>
    <main className="store-main"><section className="store-intro" aria-labelledby="store-title"><h1 id="store-title">Good eggs.<br /><span>Right to your room.</span></h1><p>Pick your eggs. We&apos;ll handle the rest.</p></section>
      <div className="ordering-layout"><section className="products-section" aria-label="Choose your eggs"><div className="products-grid"><EggProduct type="boiled" quantity={quantities.boiled} tiers={pricing?.boiled} onChange={delta => change('boiled', delta)} disabled={!pricing || pending} /><EggProduct type="raw" quantity={quantities.raw} tiers={pricing?.raw} onChange={delta => change('raw', delta)} disabled={!pricing || pending} /></div><div className="tap-instruction"><ArrowUpRight size={15} /><span>Tap an egg. Add a little goodness.</span></div>{pricingError && <p className="pricing-error" role="alert">Prices couldn&apos;t load. <button onClick={() => mutate()}>Try again</button></p>}</section>
        <OrderPanel quantities={quantities} pricing={pricing} step={step} setStep={next => { setStep(next); if (next === 'details') requestAnimationFrame(goToOrder) }} receipt={receipt} onSubmit={submit} pending={pending} error={error} onReset={() => { setReceipt(null); setQuantities({ boiled: 0, raw: 0 }); setStep('cart'); submission.current = null }} />
      </div><button className="mobile-order-link" onClick={goToOrder}>Your order · {count} {count === 1 ? 'egg' : 'eggs'} <ArrowDown size={16} /></button>
    </main><footer className="store-footer"><span>GOOD FOOD. NO FUSS.</span><span>Made for hostel life.</span></footer>
  </div>
}
