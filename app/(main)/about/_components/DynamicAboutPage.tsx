// components/about/DynamicAboutPage.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { BsPeople } from 'react-icons/bs';
import { ImConnection } from 'react-icons/im';
import { IoCodeWorking } from 'react-icons/io5';
import { MdOutlineFlaky } from 'react-icons/md';
import { AboutSectionData, TeamMemberData } from '@/server/functions/about-page.fun';
import imageUrl from "@/const/imageUrl";

interface DynamicAboutPageProps {
    sections: AboutSectionData[];
    teamMembers: TeamMemberData[];
}

// Define proper interfaces for the feature objects
interface StoryFeature {
    text: string;
}

interface WhyChooseFeature {
    title: string;
    content: string;
    icon: string;
}

// Define interface for stats
interface Stats {
    happyMembers?: number;
    satisfiedCustomers?: number;
    [key: string]: number | undefined; // Allow for other potential stats
}

// Extend the AboutSectionData to include proper typing for stats and features
interface TypedAboutSectionData extends Omit<AboutSectionData, 'stats' | 'features'> {
    stats?: Stats;
    features?: StoryFeature[] | WhyChooseFeature[];
}

function DynamicAboutPage({ sections, teamMembers }: DynamicAboutPageProps) {
    const getSection = (key: string): TypedAboutSectionData => {
        const section = sections.find(s => s.section_key === key);
        if (section) {
            return {
                ...section,
                stats: section.stats as Stats || {},
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                features: section.features || []
            };
        }
        return {
            section_key: key,
            title: '',
            subtitle: '',
            content: '',
            image_url: '',
            stats: {},
            features: [],
            team_members: [],
            order_index: 0,
            isActive: true
        };
    };

    const heroSection = getSection('hero');
    const storySection = getSection('story');
    const whyChooseSection = getSection('why-choose');
    const teamSection = getSection('team');
    const visionSection = getSection('vision');
    const expertTeamSection = getSection('expert-team');

    // Helper function to render HTML content safely
    const renderHTML = (html: string) => {
        return { __html: html };
    };

    // Get icon component based on icon name
    const getIconComponent = (iconName: string, className?: string) => {
        const iconProps = { className: className || "text-[#F27D31] text-2xl" };
        switch (iconName) {
            case 'ImConnection':
                return <ImConnection {...iconProps} />;
            case 'BsPeople':
                return <BsPeople {...iconProps} />;
            case 'IoCodeWorking':
                return <IoCodeWorking {...iconProps} />;
            case 'MdOutlineFlaky':
                return <MdOutlineFlaky {...iconProps} />;
            default:
                return <ImConnection {...iconProps} />;
        }
    };

    // Type guard for StoryFeature
    const isStoryFeature = (feature: unknown): feature is StoryFeature => {
        return typeof feature === 'object' && feature !== null && 'text' in feature;
    };

    // Type guard for WhyChooseFeature
    const isWhyChooseFeature = (feature: unknown): feature is WhyChooseFeature => {
        return typeof feature === 'object' && feature !== null && 'title' in feature && 'content' in feature && 'icon' in feature;
    };

    // Get story features with proper typing
    const getStoryFeatures = (): StoryFeature[] => {
        if (storySection.features && storySection.features.length > 0) {
            return storySection.features.filter(isStoryFeature) as StoryFeature[];
        }
        return [
            { text: 'Care landscape shows health and care services that empower growth and strength.' },
            { text: 'Professional guidance and support for your fitness journey.' },
            { text: 'Community-driven approach to health and wellness.' }
        ];
    };

    // Get why choose features with proper typing
    const getWhyChooseFeatures = (): WhyChooseFeature[] => {
        if (whyChooseSection.features && whyChooseSection.features.length > 0) {
            return whyChooseSection.features.filter(isWhyChooseFeature) as WhyChooseFeature[];
        }
        return [
            {
                title: '24/7 Support',
                content: 'Get professional guidance anytime you need, helping you stay consistent and motivated throughout your journey.',
                icon: 'ImConnection'
            },
            {
                title: 'Expert Trainers',
                content: 'Learn from certified professionals with years of experience in fitness and nutrition.',
                icon: 'BsPeople'
            },
            {
                title: 'Custom Plans',
                content: 'Personalized workout and nutrition plans tailored to your specific goals and needs.',
                icon: 'IoCodeWorking'
            },
            {
                title: 'Community',
                content: 'Join a supportive community of like-minded individuals on the same fitness journey.',
                icon: 'MdOutlineFlaky'
            }
        ];
    };

    return (
        <div className="w-full bg-black min-h-screen pt-20">
            {/* Section 1 - Hero */}
            <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <h1
                    className="text-3xl md:text-6xl font-custom font-bold text-white text-center mb-12 uppercase tracking-widest leading-tight"
                    dangerouslySetInnerHTML={renderHTML(
                        heroSection.title || 'IMPROVE YOUR <span class="text-primary">FITNESS LEVEL</span> FOR THE BETTER'
                    )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
                    {/* Image */}
                    <div className="relative w-full aspect-video md:aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10">
                        <Image
                            src={heroSection.image_url || imageUrl.about[1]}
                            alt="about"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-8">
                        <p className="text-white/60 text-lg leading-relaxed uppercase font-bold tracking-tight">
                            {heroSection.content || 'We provide standard & express delivery services through our logistics partners, ensuring your fitness gear and essentials reach you quickly and safely. Join our growing community today!'}
                        </p>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                                <h2 className="text-4xl font-black text-primary mb-1">
                                    {(heroSection.stats?.happyMembers || 500)}+
                                </h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Happy Members</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                                <h2 className="text-4xl font-black text-primary mb-1">
                                    {(heroSection.stats?.satisfiedCustomers || 900)}+
                                </h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Satisfied Customers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2 - Our Story */}
            <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                <div className="text-center mb-16">
                    <h3 className="text-primary font-custom font-bold text-sm tracking-[0.3em] uppercase mb-4">
                        {storySection.subtitle || 'OUR STORY'}
                    </h3>
                    <h1 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest max-w-4xl mx-auto leading-tight">
                        {storySection.title || 'We Create and Glory for the Fitness Landscape'}
                    </h1>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <p className="text-white/60 text-lg leading-relaxed italic border-l-4 border-primary pl-8">
                        {storySection.content || 'We are dedicated to providing high-quality solutions that make your fitness journey smoother and more effective. Innovation, dedication, and community are our core values.'}
                    </p>

                    <div className="grid gap-4">
                        {getStoryFeatures().map((feature: StoryFeature, i: number) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <MdOutlineFlaky className="text-primary text-2xl shrink-0" />
                                <p className="text-white font-bold uppercase tracking-tight text-sm">
                                    {feature.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 3 - Why Choose Us */}
            <section className="bg-white/5 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-3xl md:text-5xl font-custom font-bold text-white mb-6 uppercase tracking-widest">
                            {whyChooseSection.title || 'WHY <span class="text-primary">CHOOSE</span> US'}
                        </h1>
                        <p className="text-white/40 max-w-2xl mx-auto font-bold uppercase tracking-widest text-sm">
                            {whyChooseSection.content || 'We offer a unique combination of personalized fitness training, expert guidance, and 24/7 support designed to help you achieve your goals faster.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {getWhyChooseFeatures().map((feature: WhyChooseFeature, i: number) => (
                            <div key={i} className="flex flex-col gap-6 bg-black border border-white/10 p-8 rounded-3xl hover:border-primary/50 transition-all group">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                                    {getIconComponent(feature.icon, "text-primary text-3xl group-hover:text-black transition-colors")}
                                </div>
                                <div>
                                    <h2 className="font-custom font-bold text-xl text-white mb-3 uppercase tracking-widest">
                                        {feature.title}
                                    </h2>
                                    <p className="text-white/40 text-xs font-bold uppercase leading-relaxed tracking-wider">
                                        {feature.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4 - Our Team */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest mb-4">
                        OUR <span className="text-primary">TEAM</span>
                    </h1>
                    <p className="text-white/40 max-w-2xl mx-auto font-bold uppercase tracking-widest text-sm">
                        Meet our passionate trainers and mentors who bring years of experience to help you stay fit and strong every day.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teamMembers.map((member, i) => (
                        <div key={member.id || i} className="bg-white/5 border border-white/10 p-8 rounded-3xl group hover:bg-white/10 transition-all">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                                <BsPeople className="text-primary text-3xl group-hover:text-black" />
                            </div>
                            <h2 className="font-custom font-bold text-2xl text-white uppercase tracking-widest mb-2">{member.name}</h2>
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                {member.role || 'Fitness Specialist'}
                            </p>
                            <p className="text-white/40 text-sm font-bold uppercase leading-relaxed tracking-widest line-clamp-3">
                                {member.bio || 'Certified fitness professional dedicated to transforming lives through expert guidance and personalized training strategies.'}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 5 - Vision Section & Expert Grid Combined */}
            <section className="bg-primary py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-6xl font-custom font-bold text-black uppercase tracking-tighter leading-none mb-8">
                                OUR VISION<br/>FOR THE FUTURE
                            </h1>
                            <p className="text-black/80 text-xl font-bold uppercase leading-tight tracking-tight max-w-lg mb-12">
                                {visionSection.content || 'Our mission is to create a global community of empowered individuals committed to health, fitness, and mental strength.'}
                            </p>
                            <div className="w-32 h-2 bg-black"></div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {teamMembers.slice(0, 4).map((member, i) => (
                                <div key={i} className="aspect-[3/4] relative rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border-2 border-black/10">
                                    <Image
                                        src={member.image_url! || imageUrl.about[1]}
                                        alt={member.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                        <p className="text-white font-custom text-[10px] uppercase tracking-widest">{member.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

}

export default DynamicAboutPage;