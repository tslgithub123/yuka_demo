import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Leaf, Wind, Loader2 } from 'lucide-react';
import logo from "../assets/logo.png";

const ComingSoon = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({
    days: 15,
    hours: 10,
    minutes: 24,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans text-slate-800">
      {/* Abstract Background Elements - "Clean Air" particles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 w-full px-6 py-6 flex flex-col items-center justify-center max-w-7xl mx-auto">
  {/* Logo */}
  <img
    src={logo}
    alt="Techknowgreen Logo"
    className="h-20 w-auto object-contain mb-3"
  />

  {/* Link below */}
  <a
    href="https://www.techknowgreen.com"
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
  >
    Visit Website
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M13.5 5.5l6 6-6 6M5 11.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </a>
</nav>



      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto w-full mt-8 mb-16">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-8 animate-fade-in-up">
          <Wind size={16} />
          <span>The Future of Air Quality Management</span>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 animate-fade-in-up delay-100">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
            Yuka Yantra
          </span>
          <br />
          <span className="text-4xl md:text-6xl text-slate-700 font-extrabold">
            Is Almost Here.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200 leading-relaxed">
          We are building a revolutionary platform to monitor, analyze, and improve environmental standards. Get ready to breathe easier with Techknowgreen.
        </p>

       
        
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} <span className="font-semibold text-slate-700">Techknowgreen Solutions Limited</span>. All rights reserved.
        </p>
      </footer>
      
      {/* Tailwind Custom Animation Classes (Add these to your global css or tailwind config if needed, otherwise standard transition classes are used) */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ComingSoon;