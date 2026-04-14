"use client";

import React, { useState } from "react";
import { MdLocationOn, MdEmail, MdAccessTime } from "react-icons/md";
import { BsTelephone } from "react-icons/bs";
import { createContactMessageServerSide } from "@/server/functions/contact.fun";
import { toast } from "sonner";

function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) newErrors.email = "Invalid email address";
        if (!formData.subject.trim()) newErrors.subject = "Subject is required";
        if (!formData.message.trim()) newErrors.message = "Message is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }
        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name.trim());
            formDataToSend.append("email", formData.email.trim().toLowerCase());
            formDataToSend.append("subject", formData.subject.trim());
            formDataToSend.append("message", formData.message.trim());

            const result = await createContactMessageServerSide(formDataToSend);
            if (result.isError) {
                toast.error(result.message);
            } else {
                toast.success(result.message);
                setFormData({ name: "", email: "", subject: "", message: "" });
                setErrors({});
            }
        } catch (error) {
            toast.error("Failed to send message.");
            console.error("Contact form error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: <MdLocationOn size={32} className="text-primary" />,
            title: "Our Location",
            description: "123 Fitness Street, Dhaka, Bangladesh"
        },
        {
            icon: <BsTelephone size={28} className="text-primary" />,
            title: "Call Us",
            description: "+880 1234 567 890"
        },
        {
            icon: <MdEmail size={32} className="text-primary" />,
            title: "Email Us",
            description: "support@fitclub.com"
        },
        {
            icon: <MdAccessTime size={32} className="text-primary" />,
            title: "Working Hours",
            description: "Mon - Sat: 7AM - 10PM"
        }
    ];

    return (
        <div className="w-full bg-black min-h-screen pt-24 pb-20">
            {/* Section 1: Hero */}
            <section className="max-w-7xl mx-auto px-6 py-16 text-center">
                <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-6">
                    GET IN <span className="text-primary">TOUCH</span>
                </h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto">
                    Have questions or want to know more about our fitness programs?
                    Feel free to reach out to us. Our team is always ready to help!
                </p>
            </section>

            {/* Section 2: Contact Info */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                {contactInfo.map((info, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-4 bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-primary/50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                            {React.cloneElement(info.icon as React.ReactElement, { 
                                className: "text-primary group-hover:text-black transition-colors" 
                            })}
                        </div>
                        <h3 className="font-custom font-bold text-xl text-white uppercase tracking-widest">{info.title}</h3>
                        <p className="text-white/40 text-xs font-bold uppercase text-center tracking-wider">{info.description}</p>
                    </div>
                ))}
            </section>

            {/* Section 3: Contact Form */}
            <section className="max-w-4xl mx-auto px-6 py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                <h2 className="text-2xl md:text-4xl font-custom font-bold text-white text-center mb-12 uppercase tracking-widest">
                    Send Us a <span className="text-primary">Message</span>
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="YOUR NAME"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                errors.name ? "border-red-500" : "border-white/10"
                            }`}
                        />
                        {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4">{errors.name}</p>}
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="YOUR EMAIL"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                errors.email ? "border-red-500" : "border-white/10"
                            }`}
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4">{errors.email}</p>}
                    </div>

                    <div className="flex flex-col gap-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="HOW CAN WE HELP?"
                            className={`w-full bg-black border px-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all ${
                                errors.subject ? "border-red-500" : "border-white/10"
                            }`}
                        />
                        {errors.subject && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4">{errors.subject}</p>}
                    </div>

                    <div className="flex flex-col gap-3 md:col-span-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Your Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={5}
                            placeholder="WRITE YOUR MESSAGE HERE..."
                            className={`w-full bg-black border px-8 py-6 rounded-[2rem] text-white placeholder:text-white/10 resize-none focus:border-primary outline-none transition-all ${
                                errors.message ? "border-red-500" : "border-white/10"
                            }`}
                        />
                        {errors.message && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-4">{errors.message}</p>}
                    </div>

                    <div className="md:col-span-2 flex justify-center mt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-black font-custom font-bold text-sm tracking-widest px-12 py-4 rounded-full hover:bg-white transition-all disabled:opacity-50 min-w-[200px] uppercase shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default ContactPage;
