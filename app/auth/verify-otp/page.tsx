"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {verifyOtpServerSide} from "@/server/functions/auth.fun";
import {IVerifyOtpInput} from "@/server/interface/auth.interface";
import { useSearchParams } from 'next/navigation';
import Loader from "@/components/loader/Loader";
import {toast} from "sonner";
import {IResponse} from "@/server/interface/response.interface";

const VerifyOtp = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const email = params.get("email");
  const isFromSignUp = params.get("from");

  const handleVerify = async () => {
    setLoading(true);
    if (otp.length === 6) {

      const fromData = new FormData() as FormData as IVerifyOtpInput;
      fromData.append("otp", otp);
      fromData.append("email", email!);

      const response = await verifyOtpServerSide(fromData) as IResponse & { data: { token: string } };
      if (response.isError){
          toast.error(response.message);
          setLoading(false);
          return null;
      }

      toast.success(response.message);

      setLoading(false);
      if( isFromSignUp == "signUp") router.push("/auth/signin");
      router.push(`/auth/set-password?email=${email}&token=${response.data.token}`);
    } else {
      alert("Please enter a valid 6-digit OTP");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
        { loading && <Loader size={"lg"} overlay={true} message={"VERIFYING..."} /> }
      <Card className="w-full max-w-[400px] bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
            Secure Verify
          </CardTitle>
          <CardDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-2">
            Enter the code sent to your email
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-6 grid">
          <div className="space-y-2">
            <label htmlFor="otp" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              name="otp"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full bg-black border border-white/10 px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none text-center tracking-[0.5em] font-black text-xl transition-all"
            />
          </div>
        </CardContent>

        <CardFooter className="gap-6 grid mt-4">
          <button
            className="w-full bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10"
            onClick={handleVerify}
          >
            Verify Now
          </button>
          
          <p className='text-center text-[10px] font-bold text-white/40 uppercase tracking-widest cursor-pointer hover:text-white transition-colors'>
            Didn't receive the code? Resend
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyOtp;
