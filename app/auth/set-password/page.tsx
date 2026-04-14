"use client";

import React, { useState } from "react";
import {useRouter, useSearchParams} from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {IError} from "@/server/interface/error.interface";
import {ISetPasswordInput} from "@/server/interface/auth.interface";
import Loader from "@/components/loader/Loader";
import {setPasswordServerSide} from "@/server/functions/auth.fun";
import {toast} from "sonner";

const SetPassword = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<IError>({field: null, message: null});

  const email = params.get("email");
  const token = params.get("token");

  const handleSetPassword = async () => {
    setLoading(true);
    setError({field: null, message: null});

    if (!password.trim()){
        setError({field: "password", message: "You must specify a new password."});
        setLoading(false);
        return;
    }
    if (!confirm.trim()){
        setError({field: "confirm-password", message: "You must re-type the password."});
        setLoading(false);
        return;
    }
    if (!password || !confirm) {
      setLoading(false);
      setError({field: "confirm-password", message: "Passwords do not match"});
      return;
    }

    const formData = new FormData() as FormData & ISetPasswordInput;

    formData.append("password", password);
    formData.append("email", email!);
    formData.append("token", token!);

    const response = await setPasswordServerSide(formData);
    if(response.isError){
        toast.error(response.message)
        setLoading(false);
        return;
    }

    toast.success(response.message);

    setLoading(false);
    router.push("/auth/signin");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
        { loading && <Loader size={"lg"} overlay={true} message={"UPDATING PASSWORD..."} /> }
      <Card className="w-full max-w-[400px] bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
            New Password
          </CardTitle>
          <CardDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-2">
            Secure your account performance
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-6 grid">
          <div className="space-y-2">
            <label htmlFor="password" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
              New Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="ENTER NEW PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                error.field == "password" ? "border-red-500" : "border-white/10"
              }`}
            />
            { error.field == "password" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm"
              placeholder="RE-ENTER PASSWORD"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                error.field == "confirm-password" ? "border-red-500" : "border-white/10"
              }`}
            />
            { error.field == "confirm-password" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
          </div>
        </CardContent>

        <CardFooter className="gap-6 grid mt-4">
          <button
            className="w-full bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10"
            onClick={handleSetPassword}
          >
            Set Password
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

export default SetPassword;
