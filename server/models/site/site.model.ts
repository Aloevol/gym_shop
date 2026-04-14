import { model, models, Schema } from "mongoose";
import { ISite, ISiteModel } from "./site.interface";

const heroSlideSchema = new Schema({
  title: { type: String, default: "", required: true },
  description: { type: String, default: "", required: true },
  imageUrl: { type: String, default: "", required: true },
  order: { type: Number, default: 0, required: true },
  isActive: { type: Boolean, default: true },
  buttonText: { type: String, default: "Shop Now" },
  buttonLink: { type: String, default: "/shop" }
});

const navLinkSchema = new Schema({
  name: { type: String, required: true },
  href: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const featureSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: "Dumbbell" }
});

const testimonialSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, default: "Athlete" },
  quote: { type: String, required: true },
  stars: { type: Number, default: 5 }
});

const instagramPostSchema = new Schema({
  imageUrl: { type: String, required: true },
  link: { type: String, default: "" }
});

const siteSchema = new Schema<ISite>({
  siteName: { type: String, default: "THRYVE" },
  logoUrl: { type: String, default: "/NavLogo.png" },
  contactEmail: { type: String, default: "support@thryve.com" },
  contactPhone: { type: String, default: "+880 1234 567 890" },
  contactAddress: { type: String, default: "Dhaka, Bangladesh" },
  socialLinks: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
  heroSlides: [heroSlideSchema],
  features: [featureSchema],
  testimonials: [testimonialSchema],
  instagramGallery: [instagramPostSchema],
  privacyAndPolicy: { type: String, default: "" },
  navLinks: [navLinkSchema],
}, { timestamps: true });

let SiteModle: ISiteModel;

if (typeof models !== 'undefined' && models.Site) {
  SiteModle = models.Site as unknown as ISiteModel;
} else {
  SiteModle = model<ISite, ISiteModel>("Site", siteSchema);
}

export { SiteModle };