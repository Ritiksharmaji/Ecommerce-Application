import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <img src={assets.logo} className='mb-5 h-9 w-auto' alt='Shopvra' />
            <p className='w-full md:w-2/3 text-gray-600'>
            Shopvra brings you everyday fashion for men, women and kids - plus shoes and bags - with easy returns and fast delivery. Shop on the web or with the Shopvra mobile app.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li><Link to='/' className='hover:text-black'>Home</Link></li>
                <li><Link to='/about' className='hover:text-black'>About us</Link></li>
                <li><Link to='/privacy' className='hover:text-black'>Privacy policy</Link></li>
                <li><Link to='/delete-account' className='hover:text-black'>Delete account</Link></li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>+1-212-456-7890</li>
                <li>support@shopvra.space</li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center'>© {new Date().getFullYear()} shopvra.space - All rights reserved.</p>
        </div>

    </div>
  )
}

export default Footer
