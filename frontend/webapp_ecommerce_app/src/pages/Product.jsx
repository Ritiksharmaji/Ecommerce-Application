import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';

const Product = () => {

  const { productId } = useParams();
  const { api, currency, addToCart, isInWishlist, toggleWishlist } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [image, setImage] = useState('')
  const [size,setSize] = useState('')

  // GET /api/products/:id
  const fetchProductData = async () => {
    try {
      setNotFound(false)
      const { data } = await api.get(`/api/products/${productId}`)
      // Products created by the previous web backend store images in `image`
      const p = { ...data.data, images: data.data.images?.length ? data.data.images : data.data.image || [], sizes: data.data.sizes || [], stock: data.data.stock ?? 0 }
      setProductData(p)
      setImage(p.images[0] || '')
      setSize('')
    } catch (error) {
      console.log(error)
      setNotFound(true)
    }
  }

  useEffect(() => {
    fetchProductData();
  }, [productId])

  if (notFound) return <div className='border-t-2 pt-10 text-center text-gray-500'>Product not found.</div>

  if (!productData) return <div className=' opacity-0'></div>

  const rating = productData.ratings?.average || 0
  const outOfStock = productData.stock <= 0
  const liked = isInWishlist(productData._id)

  return (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*----------- Product Data-------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*---------- Product Images------------- */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
              {
                productData.images.map((item,index)=>(
                  <img onClick={()=>setImage(item)} src={item} key={index} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt="" />
                ))
              }
          </div>
          <div className='w-full sm:w-[80%]'>
              <img className='w-full h-auto' src={image} alt="" />
          </div>
        </div>

        {/* -------- Product Info ---------- */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className=' flex items-center gap-1 mt-2'>
              {[1, 2, 3, 4, 5].map((n) => (
                <img key={n} src={n <= Math.round(rating) ? assets.star_icon : assets.star_dull_icon} alt="" className="w-3 5" />
              ))}
              <p className='pl-2'>({productData.ratings?.count || 0})</p>
          </div>
          <p className='mt-5 text-3xl font-medium'>
            {currency}{productData.price}
            {productData.comparePrice > productData.price && (
              <span className='ml-3 text-lg text-gray-400 line-through font-normal'>{currency}{productData.comparePrice}</span>
            )}
          </p>
          <p className={`mt-2 text-sm ${outOfStock ? 'text-red-500' : productData.stock < 10 ? 'text-orange-500' : 'text-green-600'}`}>
            {outOfStock ? 'Out of stock' : productData.stock < 10 ? `Only ${productData.stock} left` : 'In stock'}
          </p>
          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          {productData.sizes?.length > 0 && (
            <div className='flex flex-col gap-4 my-8'>
                <p>Select Size</p>
                <div className='flex gap-2 flex-wrap'>
                  {productData.sizes.map((item,index)=>(
                    <button onClick={()=>setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`} key={index}>{item}</button>
                  ))}
                </div>
            </div>
          )}
          <div className={`flex gap-3 ${productData.sizes?.length ? '' : 'mt-8'}`}>
            <button disabled={outOfStock} onClick={()=>addToCart(productData._id,size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700 disabled:bg-gray-400'>{outOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}</button>
            <button onClick={()=>toggleWishlist(productData._id)} className='border px-5 py-3 text-sm'>
              <span className={liked ? 'text-red-500' : ''}>{liked ? '♥ WISHLISTED' : '♡ WISHLIST'}</span>
            </button>
          </div>
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
              <p>100% Original product.</p>
              <p>Cash on delivery is available on this product.</p>
              <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ---------- Description Section ------------- */}
      <div className='mt-20'>
        <div className='flex'>
          <b className='border px-5 py-3 text-sm'>Description</b>
          <p className='border px-5 py-3 text-sm'>Reviews ({productData.ratings?.count || 0})</p>
        </div>
        <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
          <p>{productData.description}</p>
          <p>Category: {productData.category}{productData.sizes?.length ? ` · Sizes: ${productData.sizes.join(', ')}` : ''}</p>
        </div>
      </div>

      {/* --------- display related products ---------- */}

      <RelatedProducts category={productData.category} currentId={productData._id} />

    </div>
  )
}

export default Product
