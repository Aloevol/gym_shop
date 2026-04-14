"use client";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Dispatch, SetStateAction} from "react";
import {IError} from "@/server/interface/error.interface";
import Loader from "@/components/loader/Loader";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Props {
    signUp: () => Promise<string | null>;
    email: string;
    setEmail: Dispatch<SetStateAction<string>>;
    name: string;
    setName: Dispatch<SetStateAction<string>>;
    password: string;
    setPassword: Dispatch<SetStateAction<string>>;
    loading: boolean;
    error: IError;
    router: AppRouterInstance
}

export default function SignUpPresenter ( props: Props ) {

    const {
        signUp,
        email,
        setEmail,
        name,
        setName,
        password,
        setPassword,
        loading,
        error,
        router
    } = props;

    return (
        <div className="flex items-center justify-center min-h-screen bg-black px-4">

            {/* Loading added */}
            { loading && <Loader size={"lg"} overlay={true} message={"CREATING ACCOUNT..."} /> }

            <Card className="w-full max-w-[450px] bg-white/5 border border-white/10 rounded-[2.5rem] p-4 md:p-8">
                <CardHeader className="text-center pb-8">
                    <CardTitle className="text-3xl font-custom font-bold text-white uppercase tracking-widest">
                        Sign Up
                    </CardTitle>
                    <CardDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-2">
                        Start your performance journey
                    </CardDescription>
                </CardHeader>

                <CardContent className="gap-6 grid">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
                            Full Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            type="text"
                            name="name"
                            placeholder="YOUR FULL NAME"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                error.field == "name" ? "border-red-500" : "border-white/10"
                            }`}
                        />
                        { error.field == "name" && (<span className={"text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
                            Email Address
                        </label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="text"
                            name="email"
                            placeholder="YOUR EMAIL"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                error.field == "email" ? "border-red-600" : "border-white/10"
                            }`}
                        />
                        { error.field == "email" && (<span className={"text-red-600 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">
                            Password
                        </label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            name="password"
                            placeholder="YOUR PASSWORD"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                error.field == "password" ? "border-red-600" : "border-white/10"
                            }`}
                        />
                        { error.field == "password" && (<span className={"text-red-600 text-[10px] font-bold uppercase tracking-widest ml-4"}>{error.message}</span>)}
                    </div>

                </CardContent>

                <CardFooter className="gap-6 grid mt-4">
                    <button
                        className="w-full bg-primary text-black font-custom font-bold py-4 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10"
                        onClick={() => signUp()}
                    >
                        Create Account
                    </button>

                    <p className="text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Already have an account?{" "}
                        <span
                            className="text-primary cursor-pointer hover:text-white transition-colors ml-1"
                            onClick={() => router.push("/auth/signin")}
                        >
                          Log In
                        </span>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )

}