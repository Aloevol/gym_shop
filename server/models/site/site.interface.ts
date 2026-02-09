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

export interface ISite {
  heroSlides: IHeroSlide[];
  privacyAndPolicy: string;
  navLinks: INavLink[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISiteModel extends Model<ISite>{
    findByOne(id: string): ISite;
}