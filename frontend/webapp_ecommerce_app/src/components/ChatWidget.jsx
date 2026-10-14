import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

// Shopvra shopping assistant (same backend as the mobile app: POST /api/chat).
// The assistant replies with text, product cards and "actions" the page performs:
// navigate / add_to_cart run instantly; show_address_form and confirm_order render as cards.

const SUGGESTIONS = ['Show me denim jackets', 'Shoes under $60', "What's in my cart?", 'Add a new address', 'Where is my order?']

const ROUTES = {
    Home: () => '/',
    Shop: () => '/collection',
    ProductDetails: (i) => `/product/${i.productId}`,
    Cart: () => '/cart',
    Favorites: () => '/wishlist',
    Profile: () => '/profile',
    Checkout: () => '/place-order',
    Orders: () => '/orders',
    OrderDetails: () => '/orders',
    SignIn: () => '/login',
}

let seq = 0
const key = () => `w${Date.now()}-${seq++}`
const money = (n) => `$${Number(n || 0).toFixed(2)}`
const errorMessage = (e, fallback) => e?.response?.data?.message || e?.message || fallback

const SparkIcon = ({ className = 'w-6 h-6' }) => (
    <svg viewBox='0 0 24 24' className={className} fill='currentColor' aria-hidden='true'>
        <path d='M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm6 12l.9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9L18 14zM5 15l.6 1.6L7 17l-1.4.4L5 19l-.6-1.6L3 17l1.4-.4L5 15z' />
    </svg>
)

function ProductCards({ products, onOpen }) {
    if (!products?.length) return null
    return (
        <div className='flex gap-2 overflow-x-auto pb-1 mt-2'>
            {products.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} onClick={onOpen} className='min-w-[120px] w-[120px] border border-border rounded-xl overflow-hidden bg-white hover:shadow'>
                    <div className='h-28 bg-surface'>{p.image && <img src={p.image} alt={p.name} className='w-full h-full object-cover' />}</div>
                    <div className='p-2'>
                        <p className='text-xs font-medium line-clamp-2 text-primary'>{p.name}</p>
                        <p className='text-sm font-bold text-primary mt-1'>
                            {money(p.price)}
                            {p.comparePrice > p.price && <span className='ml-1 text-[10px] text-muted line-through'>{money(p.comparePrice)}</span>}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}

function AddressForm({ action, done, api, onDone }) {
    const pre = action.input
    const [type, setType] = useState(['Home', 'Work', 'Other'].includes(pre.type) ? pre.type : 'Home')
    const [form, setForm] = useState({ street: pre.street || '', city: pre.city || '', state: pre.state || '', zipCode: pre.zipCode || '', country: pre.country || '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const complete = Object.values(form).every((v) => v.trim())
    const field = (name, label, cls = '') => (
        <input disabled={done} className={`border border-border rounded-lg px-3 py-2 text-sm w-full ${cls}`} placeholder={label}
            value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
    )
    const save = async () => {
        setSaving(true); setError('')
        try {
            const { data } = await api.post('/api/addresses', { ...form, type })
            onDone(true, `Address saved (id ${data.data._id}): ${form.street}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}.`)
        } catch (e) {
            setError(errorMessage(e, 'Could not save the address')); setSaving(false)
        }
    }
    return (
        <div className='border border-border rounded-xl p-3 bg-white'>
            <p className='font-semibold text-primary mb-2'>New delivery address</p>
            <div className='flex gap-2 mb-2'>
                {['Home', 'Work', 'Other'].map((t) => (
                    <button key={t} disabled={done} onClick={() => setType(t)}
                        className={`text-xs px-3 py-1 rounded-full border ${type === t ? 'bg-primary text-white border-primary' : 'border-border'}`}>{t}</button>
                ))}
            </div>
            <div className='flex flex-col gap-2'>
                {field('street', 'Street')}
                <div className='flex gap-2'>{field('city', 'City')}{field('state', 'State')}</div>
                <div className='flex gap-2'>{field('zipCode', 'Zip code')}{field('country', 'Country')}</div>
            </div>
            {error && <p className='text-xs text-error mt-2'>{error}</p>}
            {!done && (
                <div className='flex gap-2 mt-3'>
                    <button onClick={() => onDone(false, 'The user cancelled the address form.')} className='flex-1 border border-border rounded-lg py-2 text-sm'>Cancel</button>
                    <button onClick={save} disabled={!complete || saving} className='flex-1 bg-primary text-white rounded-lg py-2 text-sm disabled:bg-gray-300'>{saving ? 'Saving…' : 'Save'}</button>
                </div>
            )}
        </div>
    )
}

function ConfirmOrder({ action, done, onDone }) {
    const { api, cartItems, products, delivery_fee, getCartAmount, flushCart, clearCart } = useContext(ShopContext)
    const [address, setAddress] = useState(undefined)
    const [placing, setPlacing] = useState(false)
    const [error, setError] = useState('')
    const method = action.input.paymentMethod === 'stripe' ? 'stripe' : 'cash'
    const subtotal = getCartAmount()
    const shipping = subtotal > 0 ? delivery_fee : 0

    useEffect(() => {
        api.get('/api/addresses')
            .then(({ data }) => setAddress((data.data || []).find((a) => a._id === action.input.addressId) || null))
            .catch(() => setAddress(null))
    }, [api, action.input.addressId])

    const confirm = async () => {
        if (!address) return
        setPlacing(true); setError('')
        try {
            await flushCart()
            const { street, city, state, zipCode, country } = address
            const { data } = await api.post('/api/orders', { shippingAddress: { street, city, state, zipCode, country }, paymentMethod: method, notes: action.input.notes || '' })
            const order = data.data
            if (method === 'stripe') {
                const items = cartItems.map((it) => {
                    const product = products.find((p) => p._id === it.productId)
                    return { product: { name: product?.name ?? 'Product', images: product?.images ?? [] }, price: it.price, quantity: it.quantity }
                })
                const origin = window.location.origin
                const session = await api.post('/api/payments/checkout-session', {
                    items, shipping: order.shippingCost, orderId: order._id,
                    success_url: `${origin}/verify?success=true&orderId=${order._id}`,
                    cancel_url: `${origin}/verify?success=false&orderId=${order._id}`,
                })
                onDone(true, `Order #${order.orderNumber} created; redirecting to Stripe's secure payment page.`)
                window.location.assign(session.data.url)
                return
            }
            clearCart()
            onDone(true, `Order #${order.orderNumber} placed with cash on delivery. Total ${money(order.totalAmount)}.`)
        } catch (e) {
            setError(errorMessage(e, 'Could not place the order'))
        } finally {
            setPlacing(false)
        }
    }

    if (address === undefined) return <div className='border border-border rounded-xl p-4 text-sm text-secondary bg-white'>Loading order summary…</div>
    return (
        <div className='border border-border rounded-xl p-3 bg-white text-sm'>
            <p className='font-semibold text-primary mb-2'>Confirm your order</p>
            {cartItems.map((it) => {
                const product = products.find((p) => p._id === it.productId)
                return (
                    <div key={`${it.productId}-${it.size}`} className='flex justify-between text-xs text-secondary mb-1'>
                        <span className='truncate mr-2'>{it.quantity} × {product?.name ?? 'Product'}{it.size ? ` (${it.size})` : ''}</span>
                        <span className='text-primary font-medium'>{money(it.price * it.quantity)}</span>
                    </div>
                )
            })}
            <hr className='my-2' />
            <div className='flex justify-between text-xs'><span className='text-secondary'>Shipping</span><span>{money(shipping)}</span></div>
            <div className='flex justify-between font-semibold'><span>Total</span><span>{money(subtotal + shipping)}</span></div>
            <hr className='my-2' />
            <p className='text-xs text-secondary'>Deliver to</p>
            <p className='mb-1'>{address ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}` : 'Address not found'}</p>
            <p className='text-xs text-secondary'>Payment</p>
            <p className='mb-2'>{method === 'stripe' ? 'Card (secure Stripe page)' : 'Cash on delivery'}</p>
            {error && <p className='text-xs text-error mb-2'>{error}</p>}
            {!done && (
                <div className='flex gap-2'>
                    <button onClick={() => onDone(false, 'The user cancelled the order.')} className='flex-1 border border-border rounded-lg py-2'>Cancel</button>
                    <button onClick={confirm} disabled={!address || !cartItems.length || placing} className='flex-1 bg-primary text-white rounded-lg py-2 disabled:bg-gray-300'>
                        {placing ? 'Placing…' : method === 'stripe' ? 'Pay now' : 'Place order'}
                    </button>
                </div>
            )}
        </div>
    )
}

const ChatWidget = () => {
    const { api, token, navigate, products, addToCart } = useContext(ShopContext)
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const sessionId = useRef(undefined)
    const batch = useRef(new Map())
    const started = useRef(new Set())
    const listRef = useRef(null)

    // New conversation when the account changes (sign in / out)
    const lastToken = useRef(token)
    useEffect(() => {
        if (lastToken.current !== token) { sessionId.current = undefined; batch.current = new Map(); setItems([]) }
        lastToken.current = token
    }, [token])

    useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [items, loading, open])

    const post = async (body) => {
        setLoading(true)
        try {
            const { data } = await api.post('/api/chat', { ...body, sessionId: sessionId.current }, { timeout: 60000 })
            sessionId.current = data.sessionId
            const added = []
            if (data.reply || data.products?.length) added.push({ key: key(), kind: 'assistant', text: data.reply, products: data.products || [] })
            batch.current = new Map(data.actions.map((a) => [a.id, null]))
            data.actions.forEach((action) => added.push({ key: key(), kind: 'action', action, status: 'pending' }))
            setItems((prev) => [...prev, ...added])
        } catch (e) {
            setItems((prev) => [...prev, { key: key(), kind: 'error', text: errorMessage(e, 'Could not reach the assistant') }])
        } finally {
            setLoading(false)
        }
    }

    const send = (value) => {
        const message = value.trim()
        if (!message || loading) return
        batch.current = new Map()
        setItems((prev) => [...prev.map((it) => (it.kind === 'action' && it.status === 'pending' ? { ...it, status: 'dismissed' } : it)), { key: key(), kind: 'user', text: message }])
        setText('')
        post({ message })
    }

    const resolveAction = (id, ok, result) => {
        if (!batch.current.has(id) || batch.current.get(id)) return
        batch.current.set(id, { id, ok, result })
        setItems((prev) => prev.map((it) => (it.kind === 'action' && it.action.id === id ? { ...it, status: ok ? 'done' : 'failed', note: result } : it)))
        const results = [...batch.current.values()]
        if (results.every(Boolean)) { batch.current = new Map(); post({ actionResults: results }) }
    }

    // Instant actions
    useEffect(() => {
        for (const it of items) {
            if (it.kind !== 'action' || it.status !== 'pending' || started.current.has(it.action.id)) continue
            const { action } = it
            if (action.name === 'navigate') {
                started.current.add(action.id)
                const route = ROUTES[action.input.screen]
                if (!route) { resolveAction(action.id, false, `Unknown screen ${action.input.screen}`); continue }
                if (action.input.screen === 'SignIn' && token) { resolveAction(action.id, true, 'The user is already signed in.'); continue }
                navigate(route(action.input))
                resolveAction(action.id, true, `Opened the ${action.input.screen} page.`)
            } else if (action.name === 'add_to_cart') {
                started.current.add(action.id)
                const product = products.find((p) => p._id === action.input.productId)
                const size = action.input.size || ''
                if (!product) resolveAction(action.id, false, 'Product not found.')
                else if (product.sizes?.length && !product.sizes.includes(size)) resolveAction(action.id, false, `Size "${size}" is not available. Available sizes: ${product.sizes.join(', ')}.`)
                else {
                    const qty = Math.min(Math.max(Number(action.input.quantity) || 1, 1), 10)
                    for (let i = 0; i < qty; i++) addToCart(product._id, size)
                    resolveAction(action.id, true, `Added ${qty} x ${product.name}${size ? ` (size ${size})` : ''} to the cart.`)
                }
            }
        }
    })

    const reset = () => { sessionId.current = undefined; batch.current = new Map(); setItems([]) }

    return (
        <>
            {!open && (
                <button onClick={() => setOpen(true)} aria-label='Ask the Shopvra assistant'
                    className='fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-accent shadow-xl flex items-center justify-center hover:scale-105 transition'>
                    <SparkIcon />
                </button>
            )}
            {open && (
                <div className='fixed z-50 bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-[85vh] sm:w-[400px] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden'>
                    <div className='flex items-center gap-3 px-4 py-3 bg-primary text-white'>
                        <div className='w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-accent'><SparkIcon className='w-5 h-5' /></div>
                        <div className='flex-1'>
                            <p className='font-semibold leading-tight'>Shopvra Assistant</p>
                            <p className='text-xs text-gray-300'>Search, cart, addresses and orders</p>
                        </div>
                        <button onClick={reset} className='text-xs text-gray-300 hover:text-white mr-2' disabled={loading}>New chat</button>
                        <button onClick={() => setOpen(false)} aria-label='Close' className='text-2xl leading-none hover:text-accent'>×</button>
                    </div>

                    <div ref={listRef} className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-white'>
                        {items.length === 0 && (
                            <div className='m-auto text-center px-4'>
                                <div className='mx-auto mb-3 w-14 h-14 rounded-2xl bg-primary text-accent flex items-center justify-center'><SparkIcon className='w-7 h-7' /></div>
                                <p className='text-lg font-semibold text-primary'>Hi! How can I help?</p>
                                <p className='text-sm text-secondary mb-4'>Ask me to find products, add them to your cart, save an address or place an order.</p>
                                <div className='flex flex-wrap justify-center gap-2'>
                                    {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className='text-xs border border-border rounded-full px-3 py-1.5 hover:bg-surface'>{s}</button>)}
                                </div>
                            </div>
                        )}
                        {items.map((it) => {
                            if (it.kind === 'user') return <div key={it.key} className='self-end max-w-[85%] bg-primary text-white rounded-2xl rounded-br-md px-3 py-2 text-sm'>{it.text}</div>
                            if (it.kind === 'error') return <div key={it.key} className='self-start bg-red-50 text-error rounded-2xl px-3 py-2 text-sm'>{it.text}</div>
                            if (it.kind === 'assistant') return (
                                <div key={it.key} className='self-start max-w-full'>
                                    {it.text && <div className='inline-block bg-surface text-primary rounded-2xl rounded-bl-md px-3 py-2 text-sm whitespace-pre-line'>{it.text}</div>}
                                    <ProductCards products={it.products} />
                                </div>
                            )
                            const done = it.status !== 'pending'
                            if (it.action.name === 'show_address_form') return <AddressForm key={it.key} action={it.action} done={done} api={api} onDone={(ok, r) => resolveAction(it.action.id, ok, r)} />
                            if (it.action.name === 'confirm_order') return <ConfirmOrder key={it.key} action={it.action} done={done} onDone={(ok, r) => resolveAction(it.action.id, ok, r)} />
                            return (
                                <div key={it.key} className={`self-start text-xs rounded-full px-3 py-1 ${it.status === 'failed' ? 'bg-red-50 text-error' : 'bg-surface text-secondary'}`}>
                                    {it.note || 'Working on it…'}
                                </div>
                            )
                        })}
                        {loading && <div className='self-start bg-surface text-secondary rounded-2xl px-3 py-2 text-sm animate-pulse'>Thinking…</div>}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); send(text) }} className='flex items-end gap-2 border-t border-border p-3'>
                        <textarea rows={1} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder='Ask Shopvra anything…'
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) } }}
                            className='flex-1 resize-none bg-surface rounded-xl px-3 py-2 text-sm outline-none max-h-28' />
                        <button type='submit' disabled={!text.trim() || loading} aria-label='Send'
                            className='w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:bg-gray-300'>↑</button>
                    </form>
                </div>
            )}
        </>
    )
}

export default ChatWidget
