
export interface IUpdateHeroSectionImageInput extends FormData {
  image: string
}

export interface IHeroSlideInput extends FormData {
  title: string;
  description: string;
  imageFile: File;
  buttonText?: string;
  buttonLink?: string;
}

export interface IUpdateHeroSlideInput extends IHeroSlideInput {
  slideId?: string;
}

export interface IReorderSlidesInput extends FormData {
  slides: Array<{
    slideId: string;
    order: number;
  }>;
}