import React from 'react'
import { useState, useContext } from 'react';
import { DContext } from '../../context/Datacontext';
import LoginImg from '../../assets/47479.jpg'

const Register = () => {

    const {setIsAuth, setCurrentUser, BeURL} = useContext(DContext)

    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [comparePassword, setComparePassword] = useState(true)

    const handleRegister = async () => {
        setComparePassword(password===confirmPassword)
        if(name!=="" || email!=="" || contact!=="" || password!==""){
            if(password===confirmPassword){
                fetch(`${BeURL}/register`, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    credentials: "include",
                    body: JSON.stringify({ fullname: name, email, contact, password }),
                })
                .then(res=>res.json())
                .then(data=>{
                    if (data.success) {
                        // Signup successful
                        setIsAuth(true)
                        setCurrentUser(data.user)
                        setName('')
                        setEmail('')
                        setContact('')
                        setPassword('')
                        setConfirmPassword('')
                        window.location.href="/"
                    } else {
                        alert(data.message)
                    }
                })
                .catch(err=>{
                    alert('Trouble in connecting to the Server! Please try again later.')
                    console.log('Error in Register: '+err)
                })
        
            }else{
                alert('passwords not match!')
            }
        }
        else{
            alert("All fields are required!")
        }
    }


    return (
        <div className="flex justify-center items-center bg-gray-50 px-4 min-h-[90vh]">

            {/* Card */}
            <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-8">

                {/* Top section */}
                <div className="text-center mb-6">
                    <img src={LoginImg} alt="register" className="mx-auto h-24 rounded-lg shadow" />
                    <h1 className="text-3xl font-extrabold text-primary-500 mt-4">Create Account</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Fill all details to create your account
                    </p>
                </div>

                {/* Register Form */}
                <form>
                    {/* Full Name */}
                    <label className="block mb-3">
                        <span className="text-gray-700 font-medium">Full Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            placeholder="Your Name"
                        />
                    </label>

                    {/* Contact */}
                    <label className="block mb-3">
                        <span className="text-gray-700 font-medium">Contact</span>
                        <input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            type="number"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            placeholder="+91 9876543210"
                        />
                    </label>

                    {/* Email */}
                    <label className="block mb-3">
                        <span className="text-gray-700 font-medium">Email Address</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            placeholder="name@example.com"
                        />
                    </label>

                    {/* Password */}
                    <label className="block mb-3">
                        <span className="text-gray-700 font-medium">Password</span>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </label>

                    {/* Confirm Password */}
                    <label className="block mb-3">
                        <span className="text-gray-700 font-medium">Confirm Password</span>
                        <input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-400 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </label>

                    {/* Error Message */}
                    {!comparePassword && (
                        <p className="text-red-500 text-sm mb-3 text-center">Passwords do not match</p>
                    )}

                    {/* Register Button */}
                    <button
                        onClick={handleRegister}
                        type="button"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold shadow-md hover:opacity-90 transition"
                    >
                        Register <i className="bi bi-door-open"></i>
                    </button>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-600 mt-4">
                        Already have an account?{" "}
                        <a href="/login" className="text-primary-500 font-medium hover:underline">
                            Login here
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );

}

export default Register