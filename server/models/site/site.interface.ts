import { Model } from "mongoose";

export interface IHeroSlide {
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  buttonText?: string;
  buttonLink?: string;
}

export interface INavLink {
  name: string;
  href: string;
  order: number;
  isActive: boolean;
}

export interface IFeature {
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
}

export interface ITestimonial {
  name: string;
  role: string;
  quote: string;
  stars: number;
}

export interface IInstagramPost {
  imageUrl: string;
  link?: string;
}

export interface ISite {
  // Global Identity
  siteName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };

  heroSlides: IHeroSlide[];
  features: IFeature[];
  testimonials: ITestimonial[];
  instagramGallery: IInstagramPost[];
  privacyAndPolicy: string;
  navLinks: INavLink[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISiteModel extends Model<ISite>{
    findByOne(id: string): ISite;
}