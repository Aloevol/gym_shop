"use client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import React, {useState} from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import {isAuthenticatedAndGetUser, signInServerSide} from "@/server/functions/auth.fun";
import Loader from "@/components/loader/Loader";
import {IError} from "@/server/interface/error.interface";
import {ISignInInput} from "@/server/interface/auth.interface";
import {isErrorResponse} from "@/server/helper/sendResponse.helper";
import {toast} from "sonner";
import {setCookie} from "@/server/helper/jwt.helper";
import { USER_ROLE } from "@/enum/user.enum";

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState<IError>({field: null, message: null});
  const [email, setEmail] =useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignIn = async () => {
      setLoading(true);
      setError({field: null, message: null});

      if (!email) {
        setError({field: "email", message: "Email is required"});
        setLoading(false);
        return null;
      }
      if (!password) {
        setError({field: "password", message: "Password is required"});
        setLoading(false);
        return null;
      }

      const formData = new FormData() as FormData & ISignInInput;

      // Form data appended
      formData.append("email", email);
      formData.append("password", password);

      const response = await signInServerSide(formData);
      if ( typeof response != "string" && isErrorResponse(response)) {
        toast.error(response.message);
        setLoading(false);
        return null;
      }

      setLoading(false);
      setEmail("");
      setPassword("");

      toast.success('Login successfully!', {
        description: 'Welcome to our platform!',
      });

      await setCookie({ value: response });          
      const res = await isAuthenticatedAndGetUser();
      await setCookie({name:"user", value: res as string });

      const user = typeof res === "string" ? JSON.parse(res) : null;

      router.refresh();
      router.push(user?.role === USER_ROLE.ADMIN ? '/dashboard' : '/');
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-black px-4'>
        { loading && <Loader size={"lg"} overlay={true} message={"LOGGING IN..."} /> }
        <Card className='w-full max-w-[400px] bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8'>
        <CardHeader className='text-center pb-8'>
          <CardTitle className='text-3xl font-custom font-bold text-white uppercase tracking-widest'>Log In</CardTitle>
          <CardDescription className='text-white/40 font-bold uppercase text-[10px] tracking-widest mt-2'>Welcome back to Thryve</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
          <CardContent className='gap-6 grid'>
            <div className="space-y-2">
              <label htmlFor="email" className='text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2'>Email Address</label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                name="email"
                autoComplete="email"
                placeholder='YOUR EMAIL'
                className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                  error.field == "email" ? "border-red-500" : "border-white/10"
                }`}
              />
              {error.field == "email" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className='text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2'>Password</label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder='YOUR PASSWORD'
                className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                  error.field == "password" ? "border-red-500" : "border-white/10"
                }`}
              />
              {error.field == "password" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
            </div>

            <Link href="/auth/forgot-password" className='text-right text-primary text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors'>Forgot Password?</Link>
          </CardContent>
          <CardFooter className='gap-6 grid mt-4'>
            <button
              type="submit"
              className='w-full bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10'
            >
              Log In
            </button>

            <p className='text-center text-[10px] font-bold text-white/40 uppercase tracking-widest'>
              {"Don't have an account? "}
              <Link href='/auth/signup' className='text-primary hover:text-white transition-colors ml-1'>
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default SignIn
