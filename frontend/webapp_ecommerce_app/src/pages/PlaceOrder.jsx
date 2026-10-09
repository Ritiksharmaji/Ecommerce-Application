import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'

const EMPTY_ADDRESS = { street: '', city: '', state: '', zipCode: '', country: '' }

const PlaceOrder = () => {

    const [method, setMethod] = useState('cash');
    const { api, navigate, token, cartItems, products, clearCart, flushCart } = useContext(ShopContext);
    const [formData, setFormData] = useState(EMPTY_ADDRESS)
    const [notes, setNotes] = useState('')
    const [hasSavedAddress, setHasSavedAddress] = useState(false)
    const [loading, setLoading] = useState(false)

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData(data => ({ ...data, [name]: value }))
    }

    // Login is required to order; prefill the default saved address (GET /api/addresses, default first)
    useEffect(() => {
        if (!token) {
            toast.info('Please login to place an order')
            navigate('/login')
            return
        }
        api.get('/api/addresses')
            .then(({ data }) => {
                const saved = data.data[0]
                if (saved) {
                    const { street, city, state, zipCode, country } = saved
                    setFormData({ street, city, state, zipCode, country })
                    setHasSavedAddress(true)
                }
            })
            .catch(() => {})
    }, [token])

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        if (cartItems.length === 0) {
            toast.error('Your cart is empty')
            return
        }
        setLoading(true)
        try {
            // The order is built from the server cart, so wait for pending cart updates first
            await flushCart()

            // POST /api/orders -> creates the order from the cart and reduces stock.
            // Cash: the server clears the cart. Stripe: the webhook clears it after payment.
            const { data } = await api.post('/api/orders', { shippingAddress: formData, paymentMethod: method, notes })
            const order = data.data

            // First order: remember the address for next time
            if (!hasSavedAddress) {
                await api.post('/api/addresses', { type: 'Home', ...formData, isDefault: true }).catch(() => {})
            }

            if (method === 'stripe') {
                // POST /api/payments/checkout-session -> { id, url }; Stripe redirects back to /verify
                const items = cartItems.map((it) => {
                    const product = products.find((p) => p._id === it.productId)
                    return { product: { name: product?.name ?? 'Product', images: product?.images ?? [] }, price: it.price, quantity: it.quantity }
                })
                const origin = window.location.origin
                const session = await api.post('/api/payments/checkout-session', {
                    items,
                    shipping: order.shippingCost,
                    orderId: order._id,
                    success_url: `${origin}/verify?success=true&orderId=${order._id}`,
                    cancel_url: `${origin}/verify?success=false&orderId=${order._id}`,
                })
                window.location.replace(session.data.url)
                return
            }

            clearCart()
            toast.success(`Order placed: ${order.orderNumber}`)
            navigate('/orders')
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
            {/* ------------- Left Side ---------------- */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

                <div className='text-xl sm:text-2xl my-3'>
                    <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                </div>
                <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
                    <input required onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='zipCode' value={formData.zipCode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Zip code' />
                    <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country' />
                </div>
                <textarea onChange={(e) => setNotes(e.target.value)} value={notes} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' rows={3} placeholder='Delivery notes (optional)' />
                {hasSavedAddress && <p className='text-xs text-gray-500'>Filled in from your saved address. Manage addresses in <span onClick={() => navigate('/profile')} className='underline cursor-pointer'>My Profile</span>.</p>}
            </div>

            {/* ------------- Right Side ------------------ */}
            <div className='mt-8'>

                <div className='mt-8 min-w-80'>
                    <CartTotal />
                </div>

                <div className='mt-12'>
                    <Title text1={'PAYMENT'} text2={'METHOD'} />
                    {/* --------------- Payment Method Selection ------------- */}
                    <div className='flex gap-3 flex-col lg:flex-row'>
                        <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
                            <img className='h-5 mx-4' src={assets.stripe_logo} alt="Stripe" />
                        </div>
                        <div onClick={() => setMethod('cash')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cash' ? 'bg-green-400' : ''}`}></p>
                            <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
                        </div>
                    </div>

                    <div className='w-full text-end mt-8'>
                        <button disabled={loading} type='submit' className='bg-black text-white px-16 py-3 text-sm disabled:bg-gray-400'>{loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default PlaceOrder
