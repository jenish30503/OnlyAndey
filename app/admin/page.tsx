
'use client'

import { useState, useEffect, useRef } from 'react'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  
  // Login State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Dashboard State
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingSaving, setPricingSaving] = useState(false)
  const [pricingFeedback, setPricingFeedback] = useState('')
  const [notifPerm, setNotifPerm] = useState('default')
  const [shopOpen, setShopOpen] = useState<boolean | null>(null)
  
  // Pricing Arrays (length 6)
  const [boiledPrices, setBoiledPrices] = useState<number[]>([])
  const [rawPrices, setRawPrices] = useState<number[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const knownOrders = useRef(new Set<string>())
  const firstLoad = useRef(true)

  useEffect(() => {
    if (authenticated && typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission);
    }
  }, [authenticated])

  const requestNotif = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(p => {
        setNotifPerm(p);
        if (p === 'granted') alert('Notifications enabled successfully!');
        if (p === 'denied') alert('Notifications are blocked by your browser settings. Please allow them in Chrome settings.');
      });
    }
  }

  const fetchShopStatus = async () => {
    try {
      const res = await fetch('/api/shop-status')
      const data = await res.json()
      setShopOpen(data.isOpen)
    } catch (e) {}
  }

  const toggleShop = async () => {
    if (shopOpen) {
      if (!confirm('Close the shop? Customers will not be able to order.')) return
    }
    try {
      const res = await fetch('/api/shop-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !shopOpen })
      })
      const data = await res.json()
      if (data.isOpen !== undefined) setShopOpen(data.isOpen)
    } catch (e) {
      alert('Failed to update shop status')
    }
  }

  useEffect(() => {
    if (authenticated) {
      fetchOrders()
      fetchPricing()
      fetchShopStatus()
      const interval = setInterval(fetchOrders, 30000)
      const notifInterval = setInterval(checkNewOrders, 5000)
      return () => { clearInterval(interval); clearInterval(notifInterval) }
    }
  }, [authenticated, statusFilter, paymentFilter])

  const checkNewOrders = async () => {
    try {
      const url = new URL(window.location.origin + '/api/admin/orders')
      url.searchParams.set('status', 'New')
      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.orders) {
        let newFound = false;
        data.orders.forEach((o: any) => {
          if (!knownOrders.current.has(o.id)) {
            if (!firstLoad.current) {
              const text = `Room ${o.room} ordered ${o.boiledQuantity} boiled, ${o.rawQuantity} raw eggs.`
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('New Egg Order!', { body: text })
              } else {
                alert('NEW ORDER!\n' + text)
              }
            }
            knownOrders.current.add(o.id)
            newFound = true;
          }
        });
        if (newFound && !firstLoad.current) fetchOrders();
        firstLoad.current = false;
      }
    } catch (e) {}
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth')
      setAuthenticated(res.ok)
    } catch {
      setAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        setAuthenticated(true)
      } else {
        setLoginError('Invalid credentials')
      }
    } catch {
      setLoginError('Something went wrong')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setAuthenticated(false)
  }

  const fetchOrders = async () => {
    try {
      const url = new URL(window.location.origin + '/api/admin/orders')
      if (statusFilter !== 'All') url.searchParams.set('status', statusFilter)
      if (paymentFilter !== 'All') url.searchParams.set('payment', paymentFilter)
      
      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
        setStats(data.stats)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPricing = async () => {
    setPricingLoading(true)
    try {
      const res = await fetch('/api/admin/pricing')
      const data = await res.json()
      if (data.boiled && data.raw) {
        setBoiledPrices(data.boiled)
        setRawPrices(data.raw)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPricingLoading(false)
    }
  }

  const savePricing = async () => {
    setPricingSaving(true)
    setPricingFeedback('')
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boiled: boiledPrices, raw: rawPrices })
      })
      if (res.ok) {
        setPricingFeedback('Prices saved!')
        setTimeout(() => setPricingFeedback(''), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPricingSaving(false)
    }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchOrders()
    } catch (err) {}
  }

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      })
      fetchOrders()
    } catch (err) {}
  }

  if (authenticated === null) return null // loading

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#FFFDF7] p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-[#2A2420] text-center mb-6">Admin Login</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#DD5B3B]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#DD5B3B]"
                required
              />
            </div>
          </div>
          
          {loginError && <p className="text-red-500 text-sm mt-4 text-center">{loginError}</p>}
          
          <button 
            type="submit" 
            disabled={loginLoading}
            className="w-full bg-[#DD5B3B] text-white font-bold py-2.5 rounded-lg mt-6 hover:bg-[#c94d30] disabled:opacity-70 transition-colors"
          >
            {loginLoading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    )
  }

  const tierLabels = ['1 egg', '2 eggs', '3 eggs', '4 eggs', '5-9 eggs', '10+ eggs']

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2A2420] font-sans pb-12">
      <header className="bg-[#FFFDF7] px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Only Andey" className="h-8 rounded-lg object-contain" />
          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold tracking-wider">ADMIN</span>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {notifPerm === 'default' && (
            <button onClick={requestNotif} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors">
              🔔 Enable Notifications
            </button>
          )}
          {notifPerm === 'denied' && (
            <button onClick={() => alert('Please allow notifications in browser settings.')} className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full font-bold">
              🔕 Notifications Blocked
            </button>
          )}

          {shopOpen !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{shopOpen ? 'Shop Open' : 'Shop Closed'}</span>
              <button
                onClick={toggleShop}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  shopOpen ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    shopOpen ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
          
          <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 font-medium">Logout</button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[#FFFDF7] p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium mb-1">Total Orders</p>
              <p className="text-4xl font-extrabold tracking-tight">{stats.todayOrders}</p>
            </div>
            <div className="bg-[#FFFDF7] p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-extrabold tracking-tight">₹{stats.todayRevenue}</p>
            </div>
            <div className="bg-[#FFFDF7] p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium mb-1">Pending Orders</p>
              <p className="text-4xl font-extrabold tracking-tight text-[#DD5B3B]">{stats.pendingOrders}</p>
            </div>
            <div className="bg-[#FFFDF7] p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium mb-1">Delivered</p>
              <p className="text-4xl font-extrabold tracking-tight text-green-500">{stats.deliveredOrders}</p>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <section className="bg-[#FFFDF7] rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold mb-4">Orders</h2>
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {['All', 'New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all ${
                      statusFilter === s ? 'bg-[#DD5B3B] border-[#DD5B3B] text-white' : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {['All', 'Pending', 'Paid'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setPaymentFilter(s)}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all ${
                      paymentFilter === s ? 'bg-[#DD5B3B] border-[#DD5B3B] text-white' : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 font-medium text-gray-500">Order ID + time</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Room</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Phone</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Items</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Total</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Order Status</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Payment</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">No orders match the filters.</td></tr>
                ) : (
                  orders.map(order => {
                    const time = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const isNew = order.status === 'New';
                    
                    const selectBg = 
                      order.status === 'New' ? 'bg-blue-500 text-white' :
                      order.status === 'Confirmed' ? 'bg-amber-400 text-white' :
                      order.status === 'Out for Delivery' ? 'bg-purple-500 text-white' :
                      order.status === 'Delivered' ? 'bg-green-500 text-white' :
                      'bg-[#DD5B3B] text-white';

                    return (
                      <tr key={order.id} className="group hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 relative">
                          {isNew && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DD5B3B] rounded-r" />}
                          <div className="flex items-baseline gap-2">
                            <span className="font-extrabold text-[#2A2420]">#{order.id.substring(0,6).toUpperCase()}</span>
                            <span className="text-gray-400 text-xs font-medium">{time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2A2420]">{order.room}</td>
                        <td className="px-6 py-4 text-gray-500">{order.phone}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {order.boiledQuantity > 0 && <span className="bg-[#DD5B3B]/10 text-[#DD5B3B] px-3 py-1 rounded-full text-xs font-bold">{order.boiledQuantity} Boiled</span>}
                            {order.rawQuantity > 0 && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{order.rawQuantity} Raw</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#2A2420]">₹{order.total}</td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block w-36">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`appearance-none w-full text-xs font-bold rounded-full pl-4 pr-8 py-1.5 outline-none cursor-pointer ${selectBg}`}
                            >
                              {['New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {order.paymentStatus}
                            </span>
                            {order.paymentStatus === 'Pending' && (
                              <button onClick={() => updatePaymentStatus(order.id, 'Paid')} className="text-[#DD5B3B] border border-[#DD5B3B] text-[10px] font-bold px-2 py-1 rounded-full hover:bg-[#DD5B3B]/5 transition-colors">
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.status !== 'Cancelled' && (
                            <button onClick={() => updateOrderStatus(order.id, 'Cancelled')} className="text-[#DD5B3B] text-xs font-semibold hover:underline">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing Management */}
        <section className="bg-[#FFFDF7] rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Pricing Management</h2>
            <div className="flex items-center gap-3">
              {pricingFeedback && <span className="text-sm font-medium text-green-600">{pricingFeedback}</span>}
              <button 
                onClick={savePricing}
                disabled={pricingSaving || pricingLoading}
                className="bg-[#2A2420] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#1a1614] disabled:opacity-70 transition-colors shadow-sm"
              >
                {pricingSaving ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>

          {pricingLoading ? (
            <p className="text-sm text-gray-500">Loading pricing tiers...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Boiled Sub-card */}
              <div className="border border-gray-100 rounded-xl p-6 bg-white/50">
                <h3 className="font-bold text-[#2A2420] mb-6 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DD5B3B]"></span> Boiled Eggs
                </h3>
                <div className="space-y-3">
                  {boiledPrices.map((price, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">{tierLabels[i]}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input 
                          type="number" 
                          value={price}
                          onChange={(e) => {
                            const newArr = [...boiledPrices];
                            newArr[i] = Number(e.target.value);
                            setBoiledPrices(newArr);
                          }}
                          className="w-24 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-[#2A2420] outline-none focus:border-[#DD5B3B] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Raw Sub-card */}
              <div className="border border-gray-100 rounded-xl p-6 bg-white/50">
                <h3 className="font-bold text-[#2A2420] mb-6 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span> Raw Eggs
                </h3>
                <div className="space-y-3">
                  {rawPrices.map((price, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">{tierLabels[i]}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input 
                          type="number" 
                          value={price}
                          onChange={(e) => {
                            const newArr = [...rawPrices];
                            newArr[i] = Number(e.target.value);
                            setRawPrices(newArr);
                          }}
                          className="w-24 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-[#2A2420] outline-none focus:border-[#DD5B3B] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
