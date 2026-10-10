import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';

const Cart = () => {

  const { products, currency, cartItems, updateQuantity, navigate } = useContext(ShopContext);

  // Skip lines whose product is no longer in the catalogue
  const cartData = cartItems
    .map((item) => ({ ...item, product: products.find((p) => p._id === item.productId) }))
    .filter((item) => item.product)

  return (
    <div className='border-t pt-14'>

      <div className=' text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {cartData.length === 0 && (
        <p className='py-10 text-gray-500'>Your cart is empty. <span onClick={() => navigate('/collection')} className='underline cursor-pointer'>Continue shopping</span></p>
      )}

      <div>
        {
          cartData.map((item) => (
              <div key={item.productId + item.size} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                <div className=' flex items-start gap-6'>
                  <img onClick={() => navigate(`/product/${item.productId}`)} className='w-16 sm:w-20 cursor-pointer' src={item.product.images?.[0]} alt="" />
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{item.product.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p>{currency}{item.price}</p>
                      {item.size && <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>}
                    </div>
                  </div>
                </div>
                <input
                  key={item.quantity}
                  onBlur={(e) => { const q = Number(e.target.value); if (q > 0 && q !== item.quantity) updateQuantity(item.productId, item.size, q) }}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' type="number" min={1} max={item.product.stock} defaultValue={item.quantity}
                />
                <img onClick={() => updateQuantity(item.productId, item.size, 0)} className='w-4 mr-4 sm:w-5 cursor-pointer' src={assets.bin_icon} alt="Remove" />
              </div>
          ))
        }
      </div>

      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className=' w-full text-end'>
            <button disabled={cartData.length === 0} onClick={() => navigate('/place-order')} className='bg-primary text-white text-sm my-8 px-8 py-3 disabled:bg-gray-400'>PROCEED TO CHECKOUT</button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Cart
