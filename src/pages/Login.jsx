import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/callcalendar-logo.png';
import { toast } from 'react-hot-toast';
import { useAuth } from '../utils/idb';
import API_URL from '../utils/constants';
function Login() {
  const [username, setUsername] = useState('');
  const [userpass, setUserpass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{
    if(user && user?.id){
      console.log("user found",user);
      navigate("/")
    }
  },[user])

  const handleSubmit = async () => {
   

    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userpass }),
      });

      const result = await response.json();
      if (result.status) {
        toast.success('Login successful');
        login(result.user);
        navigate('/');
      } else {
        toast.error(result.message || 'Invalid credentials', { icon: '🚫' });
        setErrorMsg(result.message || 'Invalid credentials');
      }
    } catch (error) {
      console
      toast.error('Unable to connect to server');
    }finally{
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f2f7ff]">
      <div className="bg-white shadow rounded w-full max-w-[400px] p-6">
        <div className="text-center mb-4">
          <img src={logo} alt="Logo" className="mx-auto w-85" />
        </div>
        <h2 className="text-[18px] fo text-center prime-text mb-5 border-b border-gray-300 pb-3">
          Sign into your account
        </h2>

        {/* {errorMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded relative mb-4">
            <strong className="font-semibold">Error:</strong> {errorMsg}
            <button
              onClick={() => setErrorMsg('')}
              className="absolute right-2 top-2 text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        )} */}

        < >
          <div className="mb-5">
            {/* <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label> */}
            <div className="relative">
              <input
                type="text"
                id="username"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-[12px]"
              />
              <div className="absolute right-[0px] top-[0px] text-gray-400 bg-white px-2 py-[4px] rounded h-[36px] border border-gray-300 text-center w-[40px]">
                <i className="fa fa-user"></i>
              </div>
            </div>
          </div>

          <div className="mb-5">
            {/* <label htmlFor="userpass" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label> */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="userpass"
                required
                placeholder="********"
                value={userpass}
                onChange={(e) => setUserpass(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-[12px]"
              />
              <div
                className="absolute right-[0px] top-[0px] text-gray-400 bg-white px-2 py-[4px] rounded h-[36px] border border-gray-300 text-center w-[40px]"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className="fa fa-eye"></i>
              </div>
            </div>
          </div>

          <div className="mb-4 mt-6 flex justify-between">
            
            <button
              type="button" onClick={handleSubmit} disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 shadow-[0_5px_10px_rgba(250,113,59,0.3)] hover:shadow-[0px] text-white flex items-center justify-center font-semibold py-2 px-2 rounded text-[13px] w-full text-center"
            >
              {submitting ? "Logging In...": "Login"}<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" className='ml-0 pt-1' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right-icon lucide-chevrons-right"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>
            </button>
          </div>
          <div className="mb-4 mt-6 flex justify-center">
            
             <a href="/reset_password" className="text-[15px] font-semibold text-gray-600  hover:text-orange-600 hover:underline ">
              Forgot password?
            </a>
           
          </div>

          {/* <div className="text-center">
           
          </div> */}
        </>
      </div>
    </div>
  );
}

export default Login;
