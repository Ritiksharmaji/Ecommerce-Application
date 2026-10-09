import React from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import {toast} from 'react-toastify'

// Stripe redirects here after checkout. The backend webhook (POST /api/stripe) marks the
// order paid and clears the server cart, so this page only updates the UI.
const Verify = () => {

    const { navigate, token, clearCart, getUserCart } = useContext(ShopContext)
    const [searchParams] = useSearchParams()

    const success = searchParams.get('success')

    useEffect(() => {
        if (!token) return
        if (success === 'true') {
            clearCart()
            toast.success('Payment successful - your order is confirmed')
        } else {
            getUserCart()
            toast.error('Payment cancelled - your order is awaiting payment')
        }
        navigate('/orders')
    }, [token])

    return (
        <div className='min-h-[60vh] flex items-center justify-center text-gray-500'>
            Confirming your payment...
        </div>
    )
}

export default Verify
