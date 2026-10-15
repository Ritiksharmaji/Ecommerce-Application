import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

// Shopvra shopping assistant (same backend as the mobile app: POST /api/chat).
// The assistant replies with text, product cards and "actions" the page performs:
// navigate / add_to_cart / update_cart_item / update_wishlist run instantly; forms and destructive actions
// (sign in, address, order, clear cart, delete address, sign out, delete account) render as cards the user confirms.
// Passwords are typed only into those cards and go straight to our auth API - never to the AI.

const SUGGESTIONS = ['Show me denim jackets', 'Shoes under $60', "What's in my cart?", 'Sign me in', 'Add a new address', 'Where is my order?']

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

const MicIcon = ({ className = 'w-5 h-5' }) => (
    <svg viewBox='0 0 24 24' className={className} fill='currentColor' aria-hidden='true'>
        <path d='M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z' />
    </svg>
)
const SpeakerIcon = ({ on, className = 'w-5 h-5' }) => (
    <svg viewBox='0 0 24 24' className={className} fill='currentColor' aria-hidden='true'>
        <path d='M3 9v6h4l5 5V4L7 9H3z' />
        {on ? <path d='M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z' />
            : <path d='M16.5 12l2.5-2.5 1.4 1.4L17.9 13.4l2.5 2.5-1.4 1.4-2.5-2.5-2.5 2.5-1.4-1.4 2.5-2.5-2.5-2.5 1.4-1.4z' />}
    </svg>
)

// Browser speech support (Chrome, Edge, Safari). Firefox has no speech recognition -> mic hidden.
const SpeechRecognitionImpl = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

// Pleasant female voices, best first (browsers don't say a voice's gender, so we match known names).
// Edge has Microsoft's natural voices, Chrome has Google's, Safari/macOS has Apple's.
const FEMALE_VOICES = [
    'Microsoft Aria Online', 'Microsoft Jenny Online', 'Microsoft Ava Online', 'Microsoft Emma Online', 'Microsoft Michelle Online',
    'Microsoft Neerja Online', 'Microsoft Sonia Online', 'Microsoft Libby Online', 'Microsoft Natasha Online',
    'Google UK English Female', 'Google US English',
    'Ava', 'Zoe', 'Samantha', 'Allison', 'Susan', 'Serena', 'Karen', 'Moira', 'Tessa', 'Veena', 'Isha',
    'Microsoft Zira', 'Microsoft Hazel', 'Microsoft Heera', 'female',
]
let chosenVoice = null
const pickVoice = () => {
    const english = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'))
    const lang = (navigator.language || 'en-US').toLowerCase()
    const score = (v) => {
        const rank = FEMALE_VOICES.findIndex((name) => v.name.toLowerCase().includes(name.toLowerCase()))
        if (rank < 0) return -1
        let points = 1000 - rank * 10
        if (/natural|premium|enhanced|neural/i.test(v.name)) points += 300
        if (v.lang.toLowerCase() === lang) points += 20
        return points
    }
    chosenVoice = english.map((v) => ({ v, s: score(v) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s)[0]?.v ?? null
}
if (canSpeak) {
    pickVoice()
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice) // voices load asynchronously
}

const speakText = (text) => {
    if (!canSpeak || !text) return
    window.speechSynthesis.cancel()
    if (!chosenVoice) pickVoice()
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`>|]/g, ''))
    if (chosenVoice) { utterance.voice = chosenVoice; utterance.lang = chosenVoice.lang }
    else { utterance.lang = navigator.language || 'en-US'; utterance.pitch = 1.15 } // softer tone if no female voice
    utterance.rate = 0.98
    window.speechSynthesis.speak(utterance)
}
const stopSpeaking = () => canSpeak && window.speechSynthesis.cancel()

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

const inputCls = 'border border-border rounded-lg px-3 py-2 text-sm w-full'

function AuthForm({ action, done, onDone }) {
    const { login, register } = useContext(ShopContext)
    const [mode, setMode] = useState(action.input.mode === 'signup' ? 'signup' : 'signin')
    const [name, setName] = useState(action.input.name || '')
    const [email, setEmail] = useState(action.input.email || '')
    const [password, setPassword] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const signup = mode === 'signup'
    const complete = email.trim() && password && (!signup || name.trim())
    const submit = async (e) => {
        e.preventDefault()
        if (!complete) return
        setBusy(true); setError('')
        try {
            if (signup) await register(name, email, password)
            else await login(email, password)
            onDone(true, signup ? `Created a new account for ${name.trim()} (${email.trim()}) and signed in.` : `Signed in as ${email.trim()}.`)
        } catch (err) {
            setError(errorMessage(err, signup ? 'Could not create the account' : 'Could not sign in')); setBusy(false)
        }
    }
    return (
        <form onSubmit={submit} className='border border-border rounded-xl p-3 bg-white'>
            <p className='font-semibold text-primary mb-2'>{signup ? 'Create your account' : 'Sign in'}</p>
            <div className='flex flex-col gap-2'>
                {signup && <input disabled={done} className={inputCls} placeholder='Full name' autoComplete='name' value={name} onChange={(e) => setName(e.target.value)} />}
                <input disabled={done} className={inputCls} type='email' placeholder='Email' autoComplete='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                {!done && <input className={inputCls} type='password' placeholder={signup ? 'Password (min 6 characters)' : 'Password'}
                    autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />}
            </div>
            {!done && <p className='text-[11px] text-muted mt-2'>Your password goes only to the secure Shopvra sign-in, never to the assistant.</p>}
            {error && <p className='text-xs text-error mt-2'>{error}</p>}
            {!done && (
                <>
                    <div className='flex gap-2 mt-3'>
                        <button type='button' onClick={() => onDone(false, 'The user cancelled signing in.')} className='flex-1 border border-border rounded-lg py-2 text-sm'>Cancel</button>
                        <button type='submit' disabled={!complete || busy} className='flex-1 bg-primary text-white rounded-lg py-2 text-sm disabled:bg-gray-300'>
                            {busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
                        </button>
                    </div>
                    <button type='button' onClick={() => { setMode(signup ? 'signin' : 'signup'); setError('') }} className='text-xs text-secondary underline mt-2'>
                        {signup ? 'Already have an account? Sign in' : 'New to Shopvra? Create an account'}
                    </button>
                </>
            )}
        </form>
    )
}

// Yes/No card for actions the user should confirm (clear cart, delete address, sign out, delete account).
function ConfirmCard({ title, message, confirmLabel, danger, needPassword, done, onConfirm, onCancel }) {
    const [password, setPassword] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const confirm = async () => {
        setBusy(true); setError('')
        try { await onConfirm(password) } catch (e) { setError(errorMessage(e, 'Something went wrong')); setBusy(false) }
    }
    return (
        <div className={`border rounded-xl p-3 bg-white text-sm ${danger ? 'border-red-200' : 'border-border'}`}>
            <p className={`font-semibold mb-1 ${danger ? 'text-error' : 'text-primary'}`}>{title}</p>
            {message && <p className='text-xs text-secondary mb-2'>{message}</p>}
            {needPassword && !done && <input className={inputCls} type='password' placeholder='Enter your password to confirm' autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} />}
            {error && <p className='text-xs text-error mt-2'>{error}</p>}
            {!done && (
                <div className='flex gap-2 mt-3'>
                    <button onClick={onCancel} className='flex-1 border border-border rounded-lg py-2'>Cancel</button>
                    <button onClick={confirm} disabled={busy || (needPassword && !password)}
                        className={`flex-1 text-white rounded-lg py-2 disabled:bg-gray-300 ${danger ? 'bg-red-600' : 'bg-primary'}`}>{busy ? 'Please wait…' : confirmLabel}</button>
                </div>
            )}
        </div>
    )
}

function DeleteAddressCard({ action, done, api, onDone }) {
    const [address, setAddress] = useState(undefined)
    useEffect(() => {
        api.get('/api/addresses')
            .then(({ data }) => setAddress((data.data || []).find((a) => a._id === action.input.addressId) || null))
            .catch(() => setAddress(null))
    }, [api, action.input.addressId])
    useEffect(() => { if (address === null && !done) onDone(false, 'Address not found.') }, [address])
    if (address === undefined) return <div className='border border-border rounded-xl p-4 text-sm text-secondary bg-white'>Loading address…</div>
    if (address === null) return null
    return (
        <ConfirmCard title='Delete this address?' danger done={done} confirmLabel='Delete'
            message={address ? `${address.type}: ${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}` : ''}
            onCancel={() => onDone(false, 'The user kept the address.')}
            onConfirm={async () => { await api.delete(`/api/addresses/${address._id}`); onDone(true, 'Address deleted.') }} />
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
    const { api, token, user, navigate, products, addToCart, cartItems, updateQuantity, clearCart, isInWishlist, toggleWishlist, logout, deleteAccount } = useContext(ShopContext)
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const sessionId = useRef(undefined)
    const batch = useRef(new Map())
    const started = useRef(new Set())
    const listRef = useRef(null)
    // Voice (typing stays the default): mic = speech-to-text, speaker = read replies aloud
    const [listening, setListening] = useState(false)
    const [interim, setInterim] = useState('')
    const [voiceError, setVoiceError] = useState('')
    const [readAloud, setReadAloud] = useState(false)
    const readAloudRef = useRef(false)
    readAloudRef.current = readAloud
    const recognitionRef = useRef(null)

    // New conversation on sign-out / account switch. A guest who signs in keeps the chat (the server moves it
    // to the account), so "sign me in, then show my orders" works in one conversation.
    const lastToken = useRef(token)
    useEffect(() => {
        if (lastToken.current && lastToken.current !== token) { sessionId.current = undefined; batch.current = new Map(); setItems([]) }
        lastToken.current = token
    }, [token])

    useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [items, loading, open])

    const post = async (body) => {
        setLoading(true)
        try {
            const { data } = await api.post('/api/chat', { ...body, sessionId: sessionId.current }, { timeout: 60000 })
            sessionId.current = data.sessionId
            if (readAloudRef.current && data.reply) speakText(data.reply)
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
        stopSpeaking()
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
            } else if (action.name === 'update_cart_item') {
                started.current.add(action.id)
                const { productId, size = '' } = action.input
                const line = cartItems.find((it) => it.productId === productId && it.size === size)
                const name = products.find((p) => p._id === productId)?.name ?? 'the item'
                const qty = Math.min(Math.max(Number(action.input.quantity) || 0, 0), 10)
                if (!line) resolveAction(action.id, false, 'That item is not in the cart (check the size).')
                else {
                    updateQuantity(productId, size, qty)
                    resolveAction(action.id, true, qty === 0 ? `Removed ${name} from the cart.` : `Set ${name} quantity to ${qty}.`)
                }
            } else if (action.name === 'update_wishlist') {
                started.current.add(action.id)
                const product = products.find((p) => p._id === action.input.productId)
                const add = !!action.input.add
                if (!product) resolveAction(action.id, false, 'Product not found.')
                else if (isInWishlist(product._id) === add) resolveAction(action.id, true, `${product.name} is already ${add ? 'in' : 'not in'} the wishlist.`)
                else { toggleWishlist(product._id); resolveAction(action.id, true, `${add ? 'Added' : 'Removed'} ${product.name} ${add ? 'to' : 'from'} the wishlist.`) }
            }
        }
    })

    const startListening = () => {
        if (!SpeechRecognitionImpl || loading) return
        setVoiceError('')
        const rec = new SpeechRecognitionImpl()
        rec.lang = navigator.language || 'en-US'
        rec.interimResults = true
        rec.continuous = false
        let finalText = ''
        rec.onresult = (event) => {
            let live = ''
            for (const result of event.results) {
                if (result.isFinal) finalText += result[0].transcript
                else live += result[0].transcript
            }
            setInterim(finalText + live)
        }
        rec.onerror = (event) => {
            setVoiceError(event.error === 'not-allowed' ? 'Allow microphone access to talk to the assistant' : event.error === 'no-speech' ? "Didn't catch that - try again" : 'Voice input stopped')
        }
        rec.onend = () => {
            setListening(false)
            setInterim('')
            if (finalText.trim()) send(finalText)
        }
        recognitionRef.current = rec
        setListening(true)
        rec.start()
    }
    const stopListening = () => recognitionRef.current?.stop()
    const toggleReadAloud = () => setReadAloud((on) => { if (on) stopSpeaking(); return !on })

    const reset = () => { sessionId.current = undefined; batch.current = new Map(); setItems([]); stopSpeaking() }

    // Sign out / delete account end the conversation (it belongs to the account) and leave a short note.
    const endSession = (note) => {
        lastToken.current = ''
        sessionId.current = undefined
        batch.current = new Map()
        setItems([{ key: key(), kind: 'assistant', text: note, products: [] }])
        if (readAloudRef.current) speakText(note)
    }

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
                            <p className='text-xs text-gray-300'>Shop, cart, account and orders</p>
                        </div>
                        {canSpeak && (
                            <button onClick={toggleReadAloud} title={readAloud ? 'Stop reading replies aloud' : 'Read replies aloud'} aria-pressed={readAloud}
                                className={`mr-1 ${readAloud ? 'text-accent' : 'text-gray-300 hover:text-white'}`}>
                                <SpeakerIcon on={readAloud} />
                            </button>
                        )}
                        <button onClick={reset} className='text-xs text-gray-300 hover:text-white mr-2' disabled={loading}>New chat</button>
                        <button onClick={() => setOpen(false)} aria-label='Close' className='text-2xl leading-none hover:text-accent'>×</button>
                    </div>

                    <div ref={listRef} className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-white'>
                        {items.length === 0 && (
                            <div className='m-auto text-center px-4'>
                                <div className='mx-auto mb-3 w-14 h-14 rounded-2xl bg-primary text-accent flex items-center justify-center'><SparkIcon className='w-7 h-7' /></div>
                                <p className='text-lg font-semibold text-primary'>Hi! How can I help?</p>
                                <p className='text-sm text-secondary mb-4'>Ask me to find products, manage your cart, sign in or create an account, save an address or place an order.</p>
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
                            const finish = (ok, r) => resolveAction(it.action.id, ok, r)
                            if (it.action.name === 'confirm_order') return <ConfirmOrder key={it.key} action={it.action} done={done} onDone={finish} />
                            if (it.action.name === 'show_auth_form') return <AuthForm key={it.key} action={it.action} done={done} onDone={finish} />
                            if (it.action.name === 'delete_address') return <DeleteAddressCard key={it.key} action={it.action} done={done} api={api} onDone={finish} />
                            if (it.action.name === 'clear_cart') return (
                                <ConfirmCard key={it.key} title='Empty your cart?' message={`Removes all ${cartItems.length} item${cartItems.length === 1 ? '' : 's'} from your cart.`}
                                    confirmLabel='Empty cart' danger done={done} onCancel={() => finish(false, 'The user kept the cart.')}
                                    onConfirm={async () => { clearCart(); finish(true, 'The cart is now empty.') }} />
                            )
                            if (it.action.name === 'sign_out') return (
                                <ConfirmCard key={it.key} title='Sign out?' message={user?.email ? `You are signed in as ${user.email}.` : ''}
                                    confirmLabel='Sign out' done={done} onCancel={() => finish(false, 'The user stayed signed in.')}
                                    onConfirm={async () => { logout(); endSession("You're signed out. Ask me anything or sign in again to see your cart and orders.") }} />
                            )
                            if (it.action.name === 'delete_account') return (
                                <ConfirmCard key={it.key} title='Delete your account permanently?' needPassword danger done={done} confirmLabel='Delete account'
                                    message='This removes your account, saved addresses, cart and wishlist. It cannot be undone.'
                                    onCancel={() => finish(false, 'The user kept their account.')}
                                    onConfirm={async (password) => { await deleteAccount(password); endSession('Your account has been deleted. Thanks for shopping with Shopvra.') }} />
                            )
                            return (
                                <div key={it.key} className={`self-start text-xs rounded-full px-3 py-1 ${it.status === 'failed' ? 'bg-red-50 text-error' : 'bg-surface text-secondary'}`}>
                                    {it.note || 'Working on it…'}
                                </div>
                            )
                        })}
                        {loading && <div className='self-start bg-surface text-secondary rounded-2xl px-3 py-2 text-sm animate-pulse'>Thinking…</div>}
                    </div>

                    {(listening || voiceError) && (
                        <div className={`px-4 pt-2 text-xs flex items-center gap-2 ${voiceError ? 'text-error' : 'text-secondary'}`}>
                            {listening && <span className='w-2 h-2 rounded-full bg-accent animate-pulse' />}
                            {voiceError || 'Listening… speak now, click the mic to stop'}
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); send(text) }} className='flex items-end gap-2 border-t border-border p-3'>
                        <textarea rows={1} maxLength={1000} value={listening ? interim : text} readOnly={listening} onChange={(e) => setText(e.target.value)}
                            placeholder={listening ? 'Listening…' : 'Type or click the mic to talk…'}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) } }}
                            className='flex-1 resize-none bg-surface rounded-xl px-3 py-2 text-sm outline-none max-h-28' />
                        {SpeechRecognitionImpl && (
                            <button type='button' onClick={listening ? stopListening : startListening} disabled={loading}
                                aria-label={listening ? 'Stop listening' : 'Speak your message'} title={listening ? 'Stop listening' : 'Speak your message'}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${listening ? 'bg-accent text-white' : 'bg-surface text-primary hover:bg-gray-200'}`}>
                                <MicIcon />
                            </button>
                        )}
                        <button type='submit' disabled={!text.trim() || loading} aria-label='Send'
                            className='w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:bg-gray-300'>↑</button>
                    </form>
                </div>
            )}
        </>
    )
}

export default ChatWidget
