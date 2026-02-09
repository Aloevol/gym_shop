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

const siteSchema = new Schema<ISite>({
  heroSlides: [heroSlideSchema],
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