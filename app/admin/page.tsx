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
      const data = await res.json()
      setAuthenticated(!!data.authenticated)
    } catch {
      setAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAuthenticated(true)
      } else {
        setLoginError('Invalid username or password')
      }
    } catch {
      setLoginError('Login failed')
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

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    fetchOrders()
  }

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus })
    })
    fetchOrders()
  }

  const savePricing = async () => {
    setPricingSaving(true)
    setPricingFeedback('')
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boiled: boiledPrices, raw: rawPrices })
      })
      if (res.ok) {
        setPricingFeedback('Saved successfully!')
      } else {
        setPricingFeedback('Failed to save')
      }
    } catch {
      setPricingFeedback('Failed to save')
    } finally {
      setPricingSaving(false)
      setTimeout(() => setPricingFeedback(''), 3000)
    }
  }

  if (authenticated === null) return null // loading

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Only Andey Admin</h1>
          {loginError && <div className="text-red-500 text-sm text-center">{loginError}</div>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/50"
            required
          />
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-[#E8543E] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-70"
          >
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  const tierLabels = ['1 egg', '2 eggs', '3 eggs', '4 eggs', '5-9 eggs', '10+ eggs']

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Only Andey" className="h-6 w-auto object-contain" />
          <span className="bg-[#E8543E]/10 text-[#E8543E] px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          {notifPerm === 'default' && (
            <button onClick={requestNotif} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors">
              🔔 Enable Notifications
            </button>
          )}
          {notifPerm === 'denied' && (
            <button onClick={() => alert('Please click the lock icon next to localhost in your URL bar and allow notifications.')} className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full font-bold">
              🔕 Notifications Blocked
            </button>
          )}
          {shopOpen !== null && (
            <button
              onClick={toggleShop}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                shopOpen
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              {shopOpen ? '🟢 Shop Open' : '🔴 Shop Closed'}
            </button>
          )}
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 font-medium ml-4">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.todayOrders}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">₹{stats.todayRevenue}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Pending Orders</p>
              <p className="text-3xl font-bold mt-1 text-orange-500">{stats.pendingOrders}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Delivered</p>
              <p className="text-3xl font-bold mt-1 text-green-500">{stats.deliveredOrders}</p>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50/50">
            <div className="flex gap-2">
              {['All', 'New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-[#E8543E] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['All', 'Pending', 'Paid'].map(p => (
                <button
                  key={p}
                  onClick={() => setPaymentFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${paymentFilter === p ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Order ID / Time</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No orders found.</td></tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-500">#{order.id.substring(0,6).toUpperCase()}</div>
                        <div className="text-xs mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{order.room}</td>
                      <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.boiledQuantity > 0 && <div>{order.boiledQuantity} Boiled</div>}
                        {order.rawQuantity > 0 && <div>{order.rawQuantity} Raw</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{order.total}</td>
                      <td className="px-4 py-3">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 outline-none appearance-none cursor-pointer border ${
                            order.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'Confirmed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'Out for Delivery' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {['New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={order.paymentStatus}
                          onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 outline-none appearance-none cursor-pointer border ${
                            order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing Editor */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Pricing Management</h2>
            <div className="flex items-center gap-3">
              {pricingFeedback && <span className="text-sm font-medium text-green-600">{pricingFeedback}</span>}
              <button 
                onClick={savePricing}
                disabled={pricingSaving || pricingLoading}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-70"
              >
                {pricingSaving ? 'Saving...' : 'Save Prices'}
              </button>
            </div>
          </div>

          {pricingLoading ? (
            <p className="text-sm text-gray-500">Loading pricing tiers...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8543E]"></span> Boiled Eggs
                </h3>
                <div className="space-y-3">
                  {boiledPrices.map((price, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">{tierLabels[i]}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                        <input 
                          type="number" 
                          value={price}
                          onChange={(e) => {
                            const newArr = [...boiledPrices];
                            newArr[i] = Number(e.target.value);
                            setBoiledPrices(newArr);
                          }}
                          className="w-24 pl-7 pr-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#E8543E]/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Raw Eggs
                </h3>
                <div className="space-y-3">
                  {rawPrices.map((price, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">{tierLabels[i]}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                        <input 
                          type="number" 
                          value={price}
                          onChange={(e) => {
                            const newArr = [...rawPrices];
                            newArr[i] = Number(e.target.value);
                            setRawPrices(newArr);
                          }}
                          className="w-24 pl-7 pr-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#E8543E]/50"
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
