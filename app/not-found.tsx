"use client";
import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
      <h1 className="text-8xl md:text-9xl font-custom font-black mb-4 text-primary tracking-tighter shadow-2xl shadow-primary/10">404</h1>
      <h2 className="text-2xl md:text-4xl font-custom font-bold mb-6 uppercase tracking-widest">PERFORMANCE LOST</h2>
      <p className="text-white/40 text-center mb-12 uppercase font-bold tracking-widest text-xs max-w-md leading-relaxed">
        THE RESOURCE YOU ARE LOOKING FOR HAS BEEN MOVED OR NO LONGER EXISTS IN OUR PERFORMANCE ARCHIVE.
      </p>
      <Link
        href="/"
        className="px-12 py-4 bg-primary text-black font-custom font-bold rounded-full hover:bg-white transition-all uppercase text-sm tracking-widest"
      >
        BACK TO BASE
      </Link>
    </div>
  );
}
