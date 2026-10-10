import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

export const ShopContext = createContext();

// Base URL of the expressJs_ecommerce_backend backend (no trailing /api).
// `npm run dev` uses .env.development (http://localhost:3000); production builds use the deployed
// API on AWS unless VITE_BACKEND_URL overrides it (e.g. in .env.production).
const PRODUCTION_API_URL = 'https://api.shopvra.space'
const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : 'http://localhost:3000')

const api = axios.create({ baseURL: backendUrl })

// The backend returns errors as non-2xx `{ success:false, message }`; surface that message
api.interceptors.response.use(
    (res) => res,
    (error) => {
        const message = error?.response?.data?.message || error?.response?.data?.error || error.message
        return Promise.reject(Object.assign(new Error(message), { status: error?.response?.status }))
    }
)

const GUEST_CART_KEY = 'guest_cart'
const GUEST_WISHLIST_KEY = 'guest_wishlist'

const readLocal = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

// Backend cart: { items: [{ product: {_id,name,images,price,stock} | null, quantity, price, size }] }
// UI cart line: { productId, size, quantity, price }
const fromServerCart = (cart) => (cart?.items ?? [])
    .filter((it) => it.product) // product may have been deleted
    .map((it) => ({ productId: it.product._id, size: it.size || '', quantity: it.quantity, price: it.price }))

const sameLine = (it, productId, size) => it.productId === productId && it.size === size

const ShopContextProvider = (props) => {

    const currency = '$';
    // Must match the flat shippingCost in expressJs_ecommerce_backend controllers/ordersController.ts
    const delivery_fee = 2;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [token, setTokenState] = useState(localStorage.getItem('token') || '')
    const [user, setUser] = useState(readLocal('user', null))
    const [cartItems, setCartItems] = useState(token ? [] : readLocal(GUEST_CART_KEY, []));
    const [wishlist, setWishlist] = useState([]); // product ids
    const navigate = useNavigate();

    // ---------- auth ----------

    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    else delete api.defaults.headers.common['Authorization']

    const saveSession = (newToken, newUser) => {
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(newUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        setUser(newUser)
        setTokenState(newToken)
    }

    // POST /api/auth/login | /api/auth/register -> { success, token, user }
    const login = async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email: email.trim().toLowerCase(), password })
        saveSession(data.token, data.user)
    }

    const register = async (name, email, password) => {
        const { data } = await api.post('/api/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password })
        saveSession(data.token, data.user)
    }

    const clearSession = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        setTokenState('')
        setUser(null)
        setCartItems([])
        setWishlist([])
    }

    const logout = () => {
        clearSession()
        navigate('/login')
    }

    // DELETE /api/auth/me { password } - permanently deletes the account (Google Play requirement)
    const deleteAccount = async (password) => {
        await api.delete('/api/auth/me', { data: { password } })
        clearSession()
    }

    // ---------- products ----------

    // GET /api/products is paginated; fetch a large page to get the whole catalogue (newest first)
    const getProductsData = async () => {
        try {
            const { data } = await api.get('/api/products', { params: { page: 1, limit: 1000 } })
            const list = data.data.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setProducts(list)
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // ---------- cart ----------

    // Server updates run one at a time so the last response reflects every change
    const queue = useRef(Promise.resolve())
    const enqueue = (fn) => {
        queue.current = queue.current.then(fn).catch(async (error) => {
            toast.error(error.message)
            await getUserCart()
        })
    }
    const flushCart = () => queue.current

    const getUserCart = async () => {
        try {
            const { data } = await api.get('/api/cart')
            setCartItems(fromServerCart(data.data))
        } catch (error) {
            console.log(error)
            if (error.status === 401) logout()
        }
    }

    const addToCart = async (productId, size) => {
        const product = products.find((p) => p._id === productId)
        if (product?.sizes?.length && !size) {
            toast.error('Select Product Size');
            return;
        }
        const lineSize = size || ''

        setCartItems((prev) => {
            const existing = prev.find((it) => sameLine(it, productId, lineSize))
            if (existing) return prev.map((it) => it === existing ? { ...it, quantity: it.quantity + 1 } : it)
            return [...prev, { productId, size: lineSize, quantity: 1, price: product?.price ?? 0 }]
        })
        toast.success('Added to cart')

        if (token) {
            enqueue(async () => {
                const { data } = await api.post('/api/cart/add', { productId, quantity: 1, size: lineSize })
                setCartItems(fromServerCart(data.data))
            })
        }
    }

    // quantity 0 removes the line
    const updateQuantity = async (productId, size, quantity) => {
        if (quantity <= 0) {
            setCartItems((prev) => prev.filter((it) => !sameLine(it, productId, size)))
            if (token) {
                enqueue(async () => {
                    const { data } = await api.delete(`/api/cart/item/${productId}`, { params: { size } })
                    setCartItems(fromServerCart(data.data))
                })
            }
            return
        }

        setCartItems((prev) => prev.map((it) => sameLine(it, productId, size) ? { ...it, quantity } : it))
        if (token) {
            enqueue(async () => {
                const { data } = await api.put(`/api/cart/item/${productId}`, { quantity, size })
                setCartItems(fromServerCart(data.data))
            })
        }
    }

    const clearCart = () => {
        setCartItems([])
        if (token) enqueue(async () => { await api.delete('/api/cart') })
    }

    const getCartCount = () => cartItems.reduce((sum, it) => sum + it.quantity, 0)

    const getCartAmount = () => cartItems.reduce((sum, it) => sum + it.price * it.quantity, 0)

    // ---------- wishlist ----------

    const getWishlist = async () => {
        try {
            const { data } = await api.get('/api/wishlist')
            setWishlist(data.data.map((p) => p._id))
        } catch (error) {
            console.log(error)
        }
    }

    const isInWishlist = (productId) => wishlist.includes(productId)

    const toggleWishlist = async (productId) => {
        const previous = wishlist
        setWishlist(previous.includes(productId) ? previous.filter((id) => id !== productId) : [...previous, productId])
        if (!token) return
        try {
            const { data } = await api.post('/api/wishlist/toggle', { productId })
            setWishlist(data.data.map((p) => p._id))
        } catch (error) {
            setWishlist(previous)
            toast.error(error.message)
        }
    }

    // ---------- effects ----------

    useEffect(() => {
        getProductsData()
        if (!token) setWishlist(readLocal(GUEST_WISHLIST_KEY, []))
    }, [])

    // Guest cart/wishlist live in localStorage
    useEffect(() => {
        if (!token) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems))
    }, [cartItems, token])

    useEffect(() => {
        if (!token) localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist))
    }, [wishlist, token])

    // On login (or page load while logged in): refresh profile, move guest items into the account, load cart + wishlist
    useEffect(() => {
        if (!token) return
        const sync = async () => {
            try {
                const { data } = await api.get('/api/auth/me')
                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
            } catch (error) {
                if (error.status === 401) return logout()
            }

            const guestCart = readLocal(GUEST_CART_KEY, [])
            for (const it of guestCart) {
                await api.post('/api/cart/add', { productId: it.productId, quantity: it.quantity, size: it.size }).catch(() => {})
            }
            localStorage.removeItem(GUEST_CART_KEY)

            const guestWishlist = readLocal(GUEST_WISHLIST_KEY, [])
            if (guestWishlist.length) {
                const { data } = await api.get('/api/wishlist').catch(() => ({ data: { data: [] } }))
                const saved = data.data.map((p) => p._id)
                for (const productId of guestWishlist.filter((id) => !saved.includes(id))) {
                    await api.post('/api/wishlist/toggle', { productId }).catch(() => {})
                }
                localStorage.removeItem(GUEST_WISHLIST_KEY)
            }

            await Promise.all([getUserCart(), getWishlist()])
        }
        sync()
    }, [token])

    const value = {
        api, backendUrl, navigate,
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        token, user, login, register, logout, deleteAccount,
        cartItems, addToCart, updateQuantity, clearCart, flushCart, getUserCart,
        getCartCount, getCartAmount,
        wishlist, isInWishlist, toggleWishlist,
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )

}

export default ShopContextProvider;
