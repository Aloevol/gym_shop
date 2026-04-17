import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const now = new Date();

    return [
        { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
        { url: `${baseUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${baseUrl}/personal-training`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
        { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
        { url: `${baseUrl}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${baseUrl}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ];
}
