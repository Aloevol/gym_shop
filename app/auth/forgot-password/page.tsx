"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {IError} from "@/server/interface/error.interface";
import {toast} from "sonner";
import Loader from "@/components/loader/Loader";
import {forgotPasswordServerSide} from "@/server/functions/auth.fun";
import {IForgotPasswordInput} from "@/server/interface/auth.interface";

const ForgotPassword = () => {
  const router = useRouter();
  const [error, setError] = useState<IError>({field: null, message: null});
  const [email, setEmail] =useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleResetRequest = async () => {
    setEmail("");
    setLoading(true);
    setError({field: null, message: null});

    if (!email) {
      setError({field: "email", message: "Email is required"});
      setLoading(false);
      return;
    }

    const formData = new FormData() as FormData & IForgotPasswordInput;
    formData.append("email", email);

    const response = await forgotPasswordServerSide(formData);

    if (response.isError) {
        toast.error(response.message);
        setLoading(false);
        return null;
    }

    setLoading(false);

    toast.success('OTP send on email!');

    setTimeout(() => {
        router.push(`/auth/verify-otp?email=${email}`);
    }, 800);

  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
        { loading && <Loader size={"lg"} overlay={true} message={"SENDING OTP..."} /> }
      <Card className="w-full max-w-[400px] bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
            Reset Access
          </CardTitle>
          <CardDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-2">
            Recover your account performance
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-6 grid">
          <div className="space-y-2">
            <label htmlFor="email" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="YOUR REGISTERED EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                error.field == "email" ? "border-red-500" : "border-white/10"
              }`}
            />
            { error.field == "email" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
          </div>
        </CardContent>

        <CardFooter className="gap-6 grid mt-4">
          <button
            className="w-full bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10"
            onClick={handleResetRequest}
          >
            Send Reset OTP
          </button>

          <p className="text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <span
              className="text-primary cursor-pointer hover:text-white transition-colors"
              onClick={() => router.push("/auth/signin")}
            >
              Back to Login
            </span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
