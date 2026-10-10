import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Title from '../components/Title'
import { ShopContext } from '../context/ShopContext'

// Account deletion page required by Google Play ("Delete account URL" in the Data safety form).
// Signed-in users can delete directly; others can sign in first or email us.
const CONTACT_EMAIL = 'support@shopvra.space'

const DeleteAccount = () => {
  const { token, user, deleteAccount } = useContext(ShopContext)
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.title = 'Delete account - Shopvra'
    return () => { document.title = 'Shopvra - Fashion for everyone' }
  }, [])

  const onDelete = async (e) => {
    e.preventDefault()
    if (!window.confirm('This permanently deletes your Shopvra account. Continue?')) return
    setLoading(true)
    try {
      await deleteAccount(password)
      setDone(true)
      toast.success('Your account has been deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border-t pt-10 pb-16'>
      <div className='text-2xl mb-6'>
        <Title text1={'DELETE'} text2={'ACCOUNT'} />
      </div>

      <div className='max-w-2xl text-gray-600 leading-relaxed'>
        <p className='mb-6'>
          You can permanently delete your <b>Shopvra</b> account and its personal data at any time - here, or in the
          Shopvra app under <b>Profile → Delete account</b>.
        </p>

        <div className='grid sm:grid-cols-2 gap-4 mb-8'>
          <div className='border rounded-lg p-4'>
            <p className='font-semibold text-primary mb-2'>Deleted immediately</p>
            <ul className='list-disc ml-5 text-sm space-y-1'>
              <li>Your account (name, email, password)</li>
              <li>Saved delivery addresses</li>
              <li>Cart and wishlist</li>
            </ul>
          </div>
          <div className='border rounded-lg p-4'>
            <p className='font-semibold text-primary mb-2'>Kept for a limited time</p>
            <ul className='list-disc ml-5 text-sm space-y-1'>
              <li>Order and payment records, only as long as tax and accounting law requires</li>
            </ul>
          </div>
        </div>

        {done ? (
          <div className='border border-green-200 bg-green-50 rounded-lg p-5'>
            <p className='font-semibold text-green-700'>Your account has been deleted.</p>
            <p className='text-sm mt-1'>Thank you for shopping with Shopvra. <Link to='/' className='underline'>Back to the store</Link></p>
          </div>
        ) : token ? (
          <form onSubmit={onDelete} className='border rounded-lg p-5'>
            <p className='mb-4'>Signed in as <b>{user?.email}</b>. Enter your password to confirm.</p>
            <input
              type='password'
              required
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Password'
              className='w-full border border-gray-300 px-3 py-2 mb-4'
            />
            <label className='flex items-start gap-2 text-sm mb-5'>
              <input type='checkbox' checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className='mt-1' />
              I understand this cannot be undone.
            </label>
            <button
              disabled={!password || !confirmed || loading}
              className='bg-error text-white px-6 py-2 text-sm disabled:bg-gray-300'
            >
              {loading ? 'DELETING...' : 'DELETE MY ACCOUNT'}
            </button>
          </form>
        ) : (
          <div className='border rounded-lg p-5'>
            <p className='font-semibold text-primary mb-3'>How to delete your account</p>
            <ol className='list-decimal ml-5 space-y-2 text-sm mb-5'>
              <li><b>In the app:</b> open Shopvra → Profile → Delete account.</li>
              <li><b>On the web:</b> sign in, then come back to this page.</li>
              <li>
                <b>By email:</b> write to{' '}
                <a className='underline' href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20Shopvra%20account`}>{CONTACT_EMAIL}</a>{' '}
                from your registered email address. We delete the account within 7 days.
              </li>
            </ol>
            <Link to='/login?redirect=/delete-account' className='inline-block bg-primary text-white px-6 py-2 text-sm'>
              SIGN IN TO DELETE
            </Link>
          </div>
        )}

        <p className='text-sm mt-8'>
          More details in our <Link to='/privacy' className='underline'>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

export default DeleteAccount
