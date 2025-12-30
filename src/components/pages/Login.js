import React, {useState, useContext} from 'react'
import { DContext } from '../../context/Datacontext'
import LoginImg from '../../assets/spine.jpg'

const Login = () => {

    const {setIsAuth, setCurrentUser, BeURL} = useContext(DContext)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const HandleLogin = async (e)=> {

        e.preventDefault()

        if(email!=="" && password!==""){
            fetch(`${BeURL}/login`, {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials: "include",
                body:JSON.stringify({
                    email, password
                })
            })
            .then(res=>res.json())
            .then(data=>{
                if(data.success){
                    setIsAuth(true)
                    setCurrentUser(data.user)
                    setEmail('')
                    setPassword('')
                    window.location.href="/"
                }else{
                    alert(data.message)
                }
            })
            .catch(err=>{
                alert('Trouble in connecting to the Server! Please try again later.')
                console.log('Error in Login:',err)
            })
        }
        else{
            alert("All fields are required!")
        }
   
    }


  return (
      <div className="flex justify-center items-center bg-gray-50 px-4" style={{ minHeight: "90vh" }}>

          {/* Card */}
          <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">

              {/* Top Section */}
              <div className="text-center mb-6">
                  <img src={LoginImg} alt="login" className="mx-auto h-24 rounded-lg shadow" />
                  <h1 className="text-3xl font-extrabold text-primary-500 mt-4">Welcome Back</h1>
                  <p className="text-gray-500 text-sm mt-1">Please login to continue</p>
              </div>

              {/* Form */}
              <form>
                  <label className="block mb-3">
                      <span className="text-gray-700 font-medium">Email</span>
                      <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                          placeholder="name@mail.com"
                      />
                  </label>

                  <label className="block mb-5">
                      <span className="text-gray-700 font-medium">Password</span>
                      <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                          placeholder="••••••••"
                      />
                  </label>

                  {/* Login Button */}
                  <button
                      onClick={HandleLogin}
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold shadow-md hover:opacity-90 transition"
                  >
                      Login <i className="bi bi-box-arrow-in-right"></i>
                  </button>

                  {/* Register text */}
                  <p className="text-center text-sm text-gray-600 mt-4">
                      Don't have an account?{" "}
                      <a href="/register" className="text-primary-500 font-medium hover:underline">
                          Register here
                      </a>
                  </p>
              </form>
          </div>
      </div>
  )
}

export default Login