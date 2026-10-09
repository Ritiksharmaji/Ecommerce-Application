import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'

// Logged in: saved on the server (GET /api/wishlist). Guest: saved in this browser and
// moved into the account after login.
const Wishlist = () => {

  const { products, wishlist, token, navigate } = useContext(ShopContext)
  const items = products.filter((p) => wishlist.includes(p._id))

  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-6'>
        <Title text1={'MY'} text2={'WISHLIST'} />
      </div>

      {!token && items.length > 0 && (
        <p className='text-sm text-gray-500 mb-4'>
          <span onClick={() => navigate('/login')} className='underline cursor-pointer'>Login</span> to save your wishlist to your account.
        </p>
      )}

      {items.length === 0 ? (
        <p className='py-10 text-gray-500'>
          Your wishlist is empty. Tap ♡ on a product to save it. <span onClick={() => navigate('/collection')} className='underline cursor-pointer'>Browse products</span>
        </p>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 mb-20'>
          {items.map((item) => (
            <ProductItem key={item._id} id={item._id} name={item.name} image={item.images} price={item.price} comparePrice={item.comparePrice} stock={item.stock} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist
