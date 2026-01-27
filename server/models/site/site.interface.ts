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

export interface ISite {
  heroSlides: IHeroSlide[];
  privacyAndPolicy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISiteModel extends Model<ISite>{
    findByOne(id: string): ISite;
}