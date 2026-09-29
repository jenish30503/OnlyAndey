'use client'

import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Egg, LoaderCircle, LockKeyhole, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { calculateOrder, money, type Pricing, type Quantities, type Receipt } from '@/lib/pricing'

export function OrderPanel({ quantities, pricing, step, setStep, receipt, onSubmit, pending, error, onReset }: { quantities: Quantities; pricing?: Pricing; step: 'cart' | 'details'; setStep: (step: 'cart' | 'details') => void; receipt: Receipt | null; onSubmit: (room: string, phone: string) => Promise<void>; pending: boolean; error: string; onReset: () => void }) {
  const [room, setRoom] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ room?: string; phone?: string }>({})
  const count = quantities.boiled + quantities.raw
  const totals = pricing ? calculateOrder(quantities, pricing) : null
  async function submit(event: FormEvent) {
    event.preventDefault()
    const next = { room: /^\\d{3}$/.test(room.trim()) ? undefined : 'Room number must be exactly 3 digits.', phone: /^(?:\+91)?[6-9]\d{9}$/.test(phone.replace(/[\s()-]/g, '')) ? undefined : 'Enter a valid 10-digit phone number.' }
    setErrors(next)
    if (!next.room && !next.phone) await onSubmit(room.trim(), phone)
  }
  if (receipt) return <aside className="order-panel receipt-panel" id="your-order" aria-live="polite">
    <span className="receipt-check"><Check size={30} /></span><p className="eyebrow">ORDER PLACED</p><h2>Egg-cellent choice.</h2><p className="receipt-intro">We&apos;ll deliver your eggs straight to<br />Room {receipt.room}.</p>
    <Separator />
    <div className="order-lines">{receipt.boiled > 0 && <div><span>{receipt.boiled} Boiled Eggs</span><strong>{money(receipt.boiledSubtotal)}</strong></div>}{receipt.raw > 0 && <div><span>{receipt.raw} Raw Eggs</span><strong>{money(receipt.rawSubtotal)}</strong></div>}</div>
    <div className="total-line"><span>Total to pay</span><strong>{money(receipt.total)}</strong></div><p className="payment-note">Pay when we deliver. Cash or UPI.</p><p className="receipt-id">Order #{receipt.id.slice(0, 8).toUpperCase()}</p>
    <Button className="w-full h-12" onClick={onReset}>Start another order <ArrowRight data-icon="inline-end" /></Button>
  </aside>
  return <aside className="order-panel" id="your-order">
    <div className="order-panel-heading"><div><p className="eyebrow">FRESH PICKS</p><h2>{step === 'details' ? 'Where to?' : 'Your order'}</h2></div><span className="order-step">{step === 'cart' ? '01' : '02'} <span>/ 02</span></span></div>
    {step === 'details' && <button className="back-to-cart" onClick={() => setStep('cart')} disabled={pending}><ArrowLeft size={14} /> Back to your eggs</button>}
    {count === 0 ? <div className="empty-order"><Egg size={36} strokeWidth={1} /><p>A little hungry?</p><span>Tap an egg to start your order.</span></div> : <div className="order-lines" aria-live="polite">
      {quantities.boiled > 0 && <div><span>Boiled eggs<small>{quantities.boiled} × {money(totals?.boiledPrice ?? 0)} · salt included</small></span><strong>{money(totals?.boiledSubtotal ?? 0)}</strong></div>}
      {quantities.raw > 0 && <div><span>Raw eggs<small>{quantities.raw} × {money(totals?.rawPrice ?? 0)}</small></span><strong>{money(totals?.rawSubtotal ?? 0)}</strong></div>}
    </div>}
    <Separator />
    <div className="delivery-line"><span>Room delivery</span><span>On us</span></div><div className="total-line"><span>Total</span><strong>{money(totals?.total ?? 0)}</strong></div>
    {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
    {step === 'details' ? <form onSubmit={submit} noValidate><FieldGroup className="gap-4"><Field data-invalid={!!errors.room}><FieldLabel htmlFor="room">Room number</FieldLabel><Input id="room" placeholder="e.g. 013" value={room} maxLength={3} onChange={e => setRoom(e.target.value)} aria-invalid={!!errors.room} disabled={pending} required autoComplete="off" className="h-11" />{errors.room && <FieldError>{errors.room}</FieldError>}</Field><Field data-invalid={!!errors.phone}><FieldLabel htmlFor="phone">Phone number</FieldLabel><Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Your 10-digit mobile number" value={phone} maxLength={10} onChange={e => setPhone(e.target.value)} aria-invalid={!!errors.phone} disabled={pending} required className="h-11" />{errors.phone && <FieldError>{errors.phone}</FieldError>}</Field><Button type="submit" className="w-full h-12" disabled={pending || !count || !pricing}>{pending ? <><LoaderCircle className="animate-spin" data-icon="inline-start" />Placing your order…</> : <>Place order · {money(totals?.total ?? 0)}<ArrowRight data-icon="inline-end" /></>}</Button></FieldGroup></form> : <Button className="w-full h-12" disabled={!count || !pricing} onClick={() => setStep('details')}>Continue <ArrowRight data-icon="inline-end" /></Button>}
    <p className="payment-note"><LockKeyhole size={12} /> No payment now. Pay at your door.</p><div className="panel-footer"><MapPin size={14} /><span>Your hostel. Your room. Your eggs.</span></div>
  </aside>
}
