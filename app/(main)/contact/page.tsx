"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MdLocationOn, MdEmail } from "react-icons/md";
import { BsTelephone } from "react-icons/bs";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { createContactMessageServerSide } from "@/server/functions/contact.fun";
import { getSiteSettingsServerSide } from "@/server/functions/admin.fun";
import { toast } from "sonner";

function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const res = await getSiteSettingsServerSide();
      if (!res.isError && res.data) {
        setSiteSettings(res.data);
      }
    })();
  }, []);

  const contactInfo = useMemo(
    () => [
      {
        icon: <MdLocationOn size={28} className="text-primary" />,
        title: "Our Location",
        description: siteSettings?.contactAddress || "Dhaka, Bangladesh",
      },
      {
        icon: <BsTelephone size={24} className="text-primary" />,
        title: "Call Us",
        description: siteSettings?.contactPhone || "+880 1234 567 890",
      },
      {
        icon: <MdEmail size={28} className="text-primary" />,
        title: "Email Us",
        description: siteSettings?.contactEmail || "support@thryve.com",
      },
      {
        icon: <FaInstagram size={24} className="text-primary" />,
        title: "Social Reach",
        description: siteSettings?.socialLinks?.instagram || siteSettings?.socialLinks?.facebook || "@thryve",
      },
    ],
    [siteSettings]
  );

  const socialLinks = [
    { href: siteSettings?.socialLinks?.instagram, icon: <FaInstagram size={18} />, label: "Instagram" },
    { href: siteSettings?.socialLinks?.facebook, icon: <FaFacebookF size={18} />, label: "Facebook" },
    { href: siteSettings?.socialLinks?.twitter, icon: <FaTwitter size={18} />, label: "Twitter / X" },
  ].filter((item) => item.href);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
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

  return (
    <div className="min-h-screen w-full bg-black pt-24 pb-20">
      <section className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h1 className="mb-6 text-3xl font-custom font-bold uppercase tracking-widest text-white md:text-6xl">
          Get In <span className="text-primary">Touch</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm font-bold uppercase tracking-widest text-white/40">
          Reach the {siteSettings?.siteName || "storefront"} team for product questions, delivery updates, or dashboard-managed support details.
        </p>

        {socialLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-primary hover:bg-primary hover:text-black"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-14 sm:grid-cols-2 xl:grid-cols-4 sm:px-6">
        {contactInfo.map((info) => (
          <div
            key={info.title}
            className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center transition-all hover:border-primary/40"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              {React.cloneElement(info.icon as React.ReactElement<{ className?: string }>, {
                className: "text-primary",
              })}
            </div>
            <h3 className="font-custom text-xl font-bold uppercase tracking-widest text-white">{info.title}</h3>
            <p className="break-words text-xs font-bold uppercase tracking-wider text-white/40">{info.description}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:rounded-[3rem] sm:p-10">
          <h2 className="mb-10 text-center text-2xl font-custom font-bold uppercase tracking-widest text-white md:text-4xl">
            Send Us a <span className="text-primary">Message</span>
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="YOUR NAME"
                className={`w-full rounded-full border bg-black px-6 py-4 text-white outline-none transition-all placeholder:text-white/10 ${
                  errors.name ? "border-red-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.name && <p className="ml-4 text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <label className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="YOUR EMAIL"
                className={`w-full rounded-full border bg-black px-6 py-4 text-white outline-none transition-all placeholder:text-white/10 ${
                  errors.email ? "border-red-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.email && <p className="ml-4 text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-3 md:col-span-2">
              <label className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="HOW CAN WE HELP?"
                className={`w-full rounded-full border bg-black px-6 py-4 text-white outline-none transition-all placeholder:text-white/10 ${
                  errors.subject ? "border-red-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.subject && <p className="ml-4 text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.subject}</p>}
            </div>

            <div className="flex flex-col gap-3 md:col-span-2">
              <label className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Your Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="WRITE YOUR MESSAGE HERE..."
                className={`w-full resize-none rounded-[2rem] border bg-black px-6 py-5 text-white outline-none transition-all placeholder:text-white/10 ${
                  errors.message ? "border-red-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.message && <p className="ml-4 text-[10px] font-bold uppercase tracking-widest text-red-500">{errors.message}</p>}
            </div>

            <div className="mt-2 flex justify-center md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[220px] rounded-full bg-primary px-12 py-4 text-sm font-custom font-bold uppercase tracking-widest text-black transition-all hover:bg-white disabled:opacity-50"
              >
                {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
