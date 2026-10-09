import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {

  const { products , search , showSearch } = useContext(ShopContext);
  const [showFilter,setShowFilter] = useState(false);
  const [filterProducts,setFilterProducts] = useState([]);
  const [category,setCategory] = useState([]);
  const [maxPrice,setMaxPrice] = useState('');
  const [inStockOnly,setInStockOnly] = useState(false);
  const [sortType,setSortType] = useState('relavent')

  const toggleCategory = (e) => {

    if (category.includes(e.target.value)) {
        setCategory(prev=> prev.filter(item => item !== e.target.value))
    }
    else{
      setCategory(prev => [...prev,e.target.value])
    }

  }

  const applyFilter = () => {

    let productsCopy = products.slice();

    if (showSearch && search) {
      const q = search.toLowerCase()
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    if (maxPrice) {
      productsCopy = productsCopy.filter(item => item.price <= Number(maxPrice))
    }

    if (inStockOnly) {
      productsCopy = productsCopy.filter(item => item.stock > 0)
    }

    setFilterProducts(sortList(productsCopy))

  }

  const sortList = (list) => {
    switch (sortType) {
      case 'low-high':
        return list.sort((a,b)=>(a.price - b.price));
      case 'high-low':
        return list.sort((a,b)=>(b.price - a.price));
      default:
        return list; // products already come newest first
    }
  }

  useEffect(()=>{
      applyFilter();
  },[category,maxPrice,inStockOnly,sortType,search,showSearch,products])

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      
      {/* Filter Options */}
      <div className='min-w-60'>
        <p onClick={()=>setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>
        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' :'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Men'} onChange={toggleCategory}/> Men
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Women'} onChange={toggleCategory}/> Women
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Kids'} onChange={toggleCategory}/> Kids
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Shoes'} onChange={toggleCategory}/> Shoes
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Bags'} onChange={toggleCategory}/> Bags
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Other'} onChange={toggleCategory}/> Other
            </p>
          </div>
        </div>
        {/* Price & Availability Filter */}
        <div className={`border border-gray-300 pl-5 pr-5 py-3 my-5 ${showFilter ? '' :'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>PRICE & AVAILABILITY</p>
          <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
            <input className='border border-gray-300 px-2 py-1' type="number" min={0} placeholder='Max price' value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)}/> In stock only
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className='flex-1'>

        <div className='flex justify-between text-base sm:text-2xl mb-4'>
            <Title text1={'ALL'} text2={'COLLECTIONS'} />
            {/* Porduct Sort */}
            <select onChange={(e)=>setSortType(e.target.value)} className='border-2 border-gray-300 text-sm px-2'>
              <option value="relavent">Sort by: Relavent</option>
              <option value="low-high">Sort by: Low to High</option>
              <option value="high-low">Sort by: High to Low</option>
            </select>
        </div>

        {/* Map Products */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
          {
            filterProducts.map((item,index)=>(
              <ProductItem key={index} name={item.name} id={item._id} price={item.price} comparePrice={item.comparePrice} stock={item.stock} image={item.images} />
            ))
          }
        </div>
      </div>

    </div>
  )
}

export default Collection
