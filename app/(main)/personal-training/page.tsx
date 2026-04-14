"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {getAllTrainingProgramsServerSide} from "@/server/functions/training.fun";
import {getAllVideosServerSide} from "@/server/functions/video.fun";
import {useRouter} from "next/navigation";

interface TrainingProgram {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    duration: string;
    imageUrl: string[];
    videoUrl?: string;
    features: string[];
    category: string;
    isActive: boolean;
    isFeatured: boolean;
    rating: number;
}

interface Video {
    _id: string;
    url: string;
    title?: string;
    duration?: number;
    format?: string;
}

function PersonalTrainingPage() {
    const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
    const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load training programs using server action
            const programsResponse = await getAllTrainingProgramsServerSide();
            if (!programsResponse.isError && programsResponse.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                setTrainingPrograms(programsResponse.data.programs as TrainingProgram[]);
            } else {
                throw new Error(programsResponse.message || 'Failed to load programs');
            }

            // Load featured videos using server action
            const videosResponse = await getAllVideosServerSide();
            if (!videosResponse.isError && videosResponse.data) {// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                const videos = videosResponse.data.videos as Video[];
                setFeaturedVideos(videos.slice(0, 1)); // Get the latest video for hero section
            }

            console.log("Video Response :-> ", videosResponse)

        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load training programs');
        } finally {
            setLoading(false);
        }
    };

    const getFeaturedVideo = () => {
        return featuredVideos.length > 0 ? featuredVideos[0] : null;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    const contactHandaler = () => {
        router.push("/contact");
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 font-custom font-bold uppercase tracking-widest text-sm">Loading programs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
                <div className="text-red-500 font-custom font-bold uppercase tracking-widest">{error}</div>
            </div>
        );
    }

    const featuredVideo = getFeaturedVideo();

    return (
        <div className="w-full min-h-screen bg-black text-white pt-20">
            {/* Hero / Live Training Section */}
            <section className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center py-16 px-6">
                <motion.h1
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-12 leading-tight"
                >
                    DAILY LIVE <span className="text-primary">TRAINING</span>
                </motion.h1>

                {featuredVideo ? (
                    <div className="w-full aspect-video md:h-[600px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl shadow-primary/5 bg-white/5 relative group">
                        <video 
                            src={featuredVideo.url} 
                            autoPlay 
                            loop 
                            muted
                            controls 
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full max-w-5xl aspect-video rounded-[3rem] border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-primary border-b-[15px] border-b-transparent ml-2" />
                        </div>
                        <p className="text-white/20 font-custom font-bold uppercase tracking-widest text-sm">Live stream currently offline</p>
                    </motion.div>
                )}
            </section>

            {/* Personal Training Programs */}
            <section className="max-w-7xl mx-auto py-24 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest mb-4">
                        ELITE <span className="text-primary">PROGRAMS</span>
                    </h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Elevate your performance with our certified specialists</p>
                </motion.div>

                {trainingPrograms.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 border border-white/10 rounded-[3rem]">
                        <p className="text-white/20 font-custom font-bold uppercase tracking-widest">No programs available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {trainingPrograms.map((program, i) => (
                            <motion.div
                                key={program._id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-primary/50 transition-all duration-500 flex flex-col"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                    {program.imageUrl.length > 0 ? (
                                        <Image
                                            src={program.imageUrl[0]}
                                            alt={program.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-black flex items-center justify-center">
                                            <span className="text-white/10 uppercase font-black tracking-widest">NO IMAGE</span>
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                                        {program.originalPrice && program.originalPrice > program.price && (
                                            <div className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                                -{Math.round(((program.originalPrice - program.price) / program.originalPrice) * 100)}% OFF
                                            </div>
                                        )}
                                        {program.isFeatured && (
                                            <div className="bg-primary text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                                FEATURED
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="mb-6 flex-1">
                                        <h3 className="text-2xl font-custom font-bold text-white uppercase tracking-widest mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                            {program.title}
                                        </h3>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{program.duration} INTENSIVE</p>
                                        <p className="text-white/60 text-sm font-bold uppercase tracking-tight line-clamp-3 leading-relaxed">
                                            {program.description}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-primary font-black text-2xl tracking-tighter">
                                                ৳ {program.price.toLocaleString()}
                                            </span>
                                            {program.originalPrice && program.originalPrice > program.price && (
                                                <span className="text-white/20 line-through text-xs font-bold uppercase tracking-widest">
                                                    ৳ {program.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => contactHandaler()} 
                                            className="bg-white/5 border border-white/10 text-white font-custom font-bold px-8 py-3 rounded-full text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                                        >
                                            ENROLL NOW
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default PersonalTrainingPage;