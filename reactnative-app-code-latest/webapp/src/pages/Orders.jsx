import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';

const STATUS_COLORS = {
  placed: 'bg-yellow-500',
  processing: 'bg-indigo-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const STEPS = ['placed', 'processing', 'shipped', 'delivered']

const Orders = () => {

  const { api, token, currency, navigate } = useContext(ShopContext);

  const [orders,setOrders] = useState([])
  const [loading,setLoading] = useState(true)

  // GET /api/orders -> the user's orders, newest first
  const loadOrderData = async () => {
    try {
      const { data } = await api.get('/api/orders')
      setOrders(data.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    if (!token) {
      navigate('/login')
      return
    }
    loadOrderData()
  },[token])

  return (
    <div className='border-t pt-16'>

        <div className='text-2xl'>
            <Title text1={'MY'} text2={'ORDERS'}/>
        </div>

        {!loading && orders.length === 0 && <p className='py-10 text-gray-500'>You have no orders yet.</p>}

        <div className='flex flex-col gap-6'>
            {
              orders.map((order) => (
                <div key={order._id} className='border text-gray-700'>
                    {/* Order header */}
                    <div className='flex flex-wrap justify-between gap-2 bg-gray-50 px-4 py-3 text-sm'>
                        <div>
                          <p className='font-medium'>Order #{order.orderNumber}</p>
                          <p className='text-gray-500'>{new Date(order.createdAt).toDateString()}</p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium'>{currency}{order.totalAmount.toFixed(2)}</p>
                          <p className='text-gray-500 capitalize'>{order.paymentMethod === 'cash' ? 'Cash on delivery' : 'Card (Stripe)'} · Payment {order.paymentStatus}</p>
                        </div>
                    </div>

                    {/* Items */}
                    {order.items.map((item) => (
                      <div key={item._id} className='flex items-start gap-6 text-sm px-4 py-3 border-t'>
                          <img onClick={() => item.product && navigate(`/product/${item.product._id}`)} className='w-16 sm:w-20 cursor-pointer' src={item.product?.images?.[0]} alt="" />
                          <div>
                            <p className='sm:text-base font-medium'>{item.name}</p>
                            <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                              <p>{currency}{item.price}</p>
                              <p>Quantity: {item.quantity}</p>
                              {item.size && <p>Size: {item.size}</p>}
                            </div>
                          </div>
                      </div>
                    ))}

                    {/* Status / tracking */}
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t text-sm'>
                        <div className='flex items-center gap-2'>
                            <p className={`min-w-2 h-2 rounded-full ${STATUS_COLORS[order.orderStatus] || 'bg-gray-400'}`}></p>
                            <p className='capitalize'>{order.orderStatus}</p>
                            {order.orderStatus !== 'cancelled' && (
                              <div className='hidden sm:flex items-center gap-1 ml-4 text-xs text-gray-400'>
                                {STEPS.map((step, i) => (
                                  <span key={step} className={i <= STEPS.indexOf(order.orderStatus) ? 'text-black' : ''}>{step}{i < STEPS.length - 1 ? ' →' : ''}</span>
                                ))}
                              </div>
                            )}
                        </div>
                        <p className='text-gray-500'>Ship to: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                        <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>Track Order</button>
                    </div>
                </div>
              ))
            }
        </div>
    </div>
  )
}

export default Orders
