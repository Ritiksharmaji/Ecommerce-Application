import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, login, register, navigate } = useContext(ShopContext)

  const [name,setName] = useState('')
  const [password,setPasword] = useState('')
  const [email,setEmail] = useState('')
  const [showPassword,setShowPassword] = useState(false)
  const [loading,setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
      event.preventDefault();
      setLoading(true)
      try {
        if (currentState === 'Sign Up') {
          await register(name, email, password)
          toast.success('Account created')
        } else {
          await login(email, password)
        }
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
  }

  useEffect(()=>{
    if (token) {
      navigate('/')
    }
  },[token])

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
        <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>{currentState}</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
        </div>
        {currentState === 'Login' ? '' : <input onChange={(e)=>setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800' placeholder='Name' required/>}
        <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800' placeholder='Email' required/>
        <div className='w-full flex border border-gray-800'>
            <input onChange={(e)=>setPasword(e.target.value)} value={password} type={showPassword ? 'text' : 'password'} minLength={6} className='flex-1 px-3 py-2 outline-none' placeholder='Password (min 6 characters)' required/>
            <button type='button' onClick={()=>setShowPassword(!showPassword)} className='px-3 text-xs text-gray-500'>{showPassword ? 'HIDE' : 'SHOW'}</button>
        </div>
        <div className='w-full flex justify-end text-sm mt-[-8px]'>
            {
              currentState === 'Login'
              ? <p onClick={()=>setCurrentState('Sign Up')} className=' cursor-pointer'>Create account</p>
              : <p onClick={()=>setCurrentState('Login')} className=' cursor-pointer'>Login Here</p>
            }
        </div>
        <button disabled={loading} className='bg-black text-white font-light px-8 py-2 mt-4 disabled:opacity-60'>{loading ? 'Please wait...' : currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>
    </form>
  )
}

export default Login
