import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'

const ProductItem = ({id,image,name,price,comparePrice,stock}) => {

    const {currency, isInWishlist, toggleWishlist} = useContext(ShopContext);
    const liked = isInWishlist(id)

  return (
    <Link onClick={()=>scrollTo(0,0)} className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='relative overflow-hidden'>
        <img className='hover:scale-110 transition ease-in-out' src={image?.[0]} alt="" />
        <button
          onClick={(e)=>{ e.preventDefault(); toggleWishlist(id) }}
          className='absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-lg'
          title={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className={liked ? 'text-red-500' : 'text-gray-400'}>{liked ? '♥' : '♡'}</span>
        </button>
        {stock === 0 && <p className='absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1'>OUT OF STOCK</p>}
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className=' text-sm font-medium'>
        {currency}{price}
        {comparePrice > price && <span className='ml-2 text-gray-400 line-through font-normal'>{currency}{comparePrice}</span>}
      </p>
    </Link>
  )
}

export default ProductItem
