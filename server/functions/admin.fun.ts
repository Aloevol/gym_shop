"use server";

import { connectToDB } from "@/server/db";
import { UserModel } from "../models/user/user.model";
import { USER_ROLE, USER_STATUS } from "@/enum/user.enum";
import { SendResponse } from "../helper/sendResponse.helper";
import { ServerError } from "../interface/serverError.interface";
import { handleServerError } from "../helper/ErrorHandler";
import { IResponse } from "../interface/response.interface";
import {IUpdateHeroSectionInput, IUpdatePrivacyPolicySectionInput} from "../interface/auth.interface";
import { SiteModle } from "../models/site/site.model";
import { ISite, IHeroSlide, INavLink } from "../models/site/site.interface";
import { IHeroSlideInput, IReorderSlidesInput, IUpdateHeroSectionImageInput, IUpdateHeroSlideInput, INavLinkInput, IUpdateNavLinkInput, IReorderNavLinksInput } from "../interface/admin.interface";
import { uploadImageToCloudinary, uploadMultipleToCloudinary } from "../helper/cloudinary.helper";
import { ICreateOfferInput, IOfferResponse, IUpdateOfferInput } from "../interface/offer.interface";
import { OfferModel } from "../models/offer/offer.model";
import { Types } from "mongoose";
import { hashData } from "../helper/crypt";

let isAdminCreated = false;

const DEFAULT_NAV_LINKS: INavLink[] = [
  { name: "Home", href: "/", order: 0, isActive: true },
  { name: "Shop", href: "/shop", order: 1, isActive: true },
  { name: "Contact", href: "/contact", order: 2, isActive: true },
];

export async function createAdminServerSide(){
    if(isAdminCreated) return SendResponse({ isError: true, status: 409, message: "Admin already exists!" });
    try {
        await connectToDB();

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();

        if (!adminEmail || !adminPassword) {
            return SendResponse({ isError: true, status: 400, message: "Admin credentials are missing from .env" });
        }

        const isAdminExist = await UserModel.exists({ role: USER_ROLE.ADMIN });
        if(isAdminExist) {
            isAdminCreated = true;
            return SendResponse({ isError: true, status: 409, message: "Admin already exists!" });
        }

        await UserModel.collection.insertOne({
            name: "Hasan Saud",
            image: "",
            email: adminEmail,
            password: adminPassword,
            contact: "+880",
            status: USER_STATUS.ACTIVE,
            isVerified: true,
            role: USER_ROLE.ADMIN,
            otp: "",
            hashToken: await hashData(`${adminEmail}:${adminPassword}`),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        isAdminCreated = true;

        return SendResponse({ isError: false, status: 200, message: "Admin created successfully!" });

    } catch (error: ServerError) {
        return handleServerError(error);
    }
}

export async function ensureAdminFromEnvServerSide() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();

        if (!adminEmail || !adminPassword) return;

        await connectToDB();

        const existingAdmin = await UserModel.findOne({
            $or: [
                { role: USER_ROLE.ADMIN },
                { email: adminEmail }
            ]
        }).lean().exec();

        if (existingAdmin) {
            isAdminCreated = true;
            return;
        }

        await createAdminServerSide();
    } catch (error) {
        console.error("Failed to ensure admin from env:", error);
    }
}

export async function editeHeroSectionServerSide ( body: IUpdateHeroSectionInput ): Promise<IResponse> {
  try {
    await connectToDB();

    const title = body.get("title") as string;
    const description = body.get("description") as string;

    let res = await SiteModle.findOneAndUpdate({},{ $set: {
      "hero.title":title,
      "hero.description":description
    }}, { new: true}).lean().exec();

    if ( !res ) {
      res = await SiteModle.create({
        hero: {
            title,
            description
        }
      })
    }

    return SendResponse({ isError: false, status: 200, message: "Hero section updated successfully!" });

  } catch (error : ServerError ) {
    return handleServerError(error);
  }
}

// Get all hero slides
export async function getHeroSlidesServerSide(): Promise<IResponse> {
  try {
    await connectToDB();

    const site = await SiteModle.findOne({}).lean().exec();
    
    const slides = site?.heroSlides || [];
    const sortedSlides = slides
      .filter(slide => slide.isActive)
      .sort((a, b) => a.order - b.order);
    
    return SendResponse({
      isError: false,
      status: 200,
      message: "Hero slides fetched successfully!",
      data: sortedSlides
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Get all hero slides for admin
export async function getAllHeroSlidesAdminServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();
    
    const slides = site?.heroSlides || [];
    const sortedSlides = slides.sort((a, b) => a.order - b.order);
    
    return SendResponse({
      isError: false,
      status: 200,
      message: "All hero slides fetched successfully!",
      data: sortedSlides
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Add new hero slide
export async function addHeroSlideServerSide(body: IHeroSlideInput): Promise<IResponse> {
  try {
    await connectToDB();

    const title = body.get("title") as string;
    const description = body.get("description") as string;
    const buttonText = (body.get("buttonText") as string) || "Shop Now";
    const buttonLink = (body.get("buttonLink") as string) || "/shop";
    const imageFile = body.get("imageFile") as File;

    if (!imageFile) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Image file is required"
      });
    }

    if (!title.trim() || !description.trim()) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Title and description are required"
      });
    }

    if (!imageFile) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Image file is required"
      });
    }

    // Upload image to Cloudinary
    const cloudinaryResponse = await uploadImageToCloudinary(imageFile);
    
    if (!cloudinaryResponse ) {
      return SendResponse({
        isError: true,
        status: 500,
        message: "Failed to upload image"
      });
    }

    const imageUrl = cloudinaryResponse.url

    // Find or create site document
    let site = await SiteModle.findOne({});
    
    if (!site) {
      // Create new site with heroSlides array
      site = await SiteModle.create({ 
        heroSlides: [] 
      });
    } else {
      // Ensure heroSlides array exists
      if (!site.heroSlides) {
        site.heroSlides = [];
      }
    }

    // Calculate order
    const currentSlides = site.heroSlides || [];
    const maxOrder = currentSlides.length > 0 
      ? Math.max(...currentSlides.map(slide => slide.order))
      : -1;

    const newSlide = {
      _id: new Types.ObjectId(),
      title,
      description,
      imageUrl,
      order: maxOrder + 1,
      isActive: true,
      buttonText,
      buttonLink
    };

    // Add the new slide
    site.heroSlides.push(newSlide);
    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Hero slide added successfully!",
      data: {
        slideId: newSlide._id.toString(),
        ...newSlide,
        _id: newSlide._id.toString()
      }
    });
  } catch (error: ServerError) {
    console.error("Error in addHeroSlideServerSide:", error);
    return handleServerError(error);
  }
}

// Update hero slide
export async function updateHeroSlideServerSide(body: IUpdateHeroSlideInput): Promise<IResponse> {
  try {
    await connectToDB();

    const slideId = body.get("slideId") as string;
    const title = body.get("title") as string;
    const description = body.get("description") as string;
    const buttonText = body.get("buttonText") as string;
    const buttonLink = body.get("buttonLink") as string;
    const imageFile = body.get("imageFile") as File;

    if (!slideId) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Slide ID is required"
      });
    }

    if (!title.trim() || !description.trim()) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Title and description are required"
      });
    }

    // Find the site
    const site = await SiteModle.findOne({});
    
    if (!site) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Site configuration not found"
      });
    }

    // Find the slide index
    const slideIndex = site.heroSlides.findIndex(
      (slide) => (slide as unknown as { _id: Types.ObjectId })._id.toString() === slideId
    );

    if (slideIndex === -1) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Slide not found"
      });
    }

    // Update slide data
    site.heroSlides[slideIndex].title = title;
    site.heroSlides[slideIndex].description = description;
    
    if (buttonText !== undefined) {
      site.heroSlides[slideIndex].buttonText = buttonText;
    }
    
    if (buttonLink !== undefined) {
      site.heroSlides[slideIndex].buttonLink = buttonLink;
    }

    // Update image if provided
    if (imageFile) {
      const cloudinaryResponse = await uploadMultipleToCloudinary([imageFile]);
      if (cloudinaryResponse && cloudinaryResponse.length > 0) {
        site.heroSlides[slideIndex].imageUrl = cloudinaryResponse[0];
      }
    }

    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Hero slide updated successfully!",
      data: JSON.parse(JSON.stringify(site.heroSlides[slideIndex]))
    });
  } catch (error: ServerError) {
    console.error("Error in updateHeroSlideServerSide:", error);
    return handleServerError(error);
  }
}

// Delete hero slide
export async function deleteHeroSlideServerSide(slideId: string): Promise<IResponse> {
  try {
    await connectToDB();

    // Using findOneAndUpdate with $pull
    const updatedSite = await SiteModle.findOneAndUpdate(
      {},
      { $pull: { heroSlides: { _id: slideId } } },
      { new: true }
    ).lean().exec();

    if (!updatedSite) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Site not found"
      });
    }

    return SendResponse({
      isError: false,
      status: 200,
      message: "Hero slide deleted successfully!"
    });
  } catch (error: ServerError) {
    console.error("Error in deleteHeroSlideServerSide:", error);
    return handleServerError(error);
  }
}

// Reorder hero slides
export async function reorderHeroSlidesServerSide(body: IReorderSlidesInput): Promise<IResponse> {
  try {
    await connectToDB();

    const slidesData = JSON.parse(body.get("slides") as string);

    // Find the site
    const site = await SiteModle.findOne({});
    
    if (!site) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Site configuration not found"
      });
    }

    // Update orders
    slidesData.forEach((slideUpdate: { slideId: string; order: number }) => {
      const slideIndex = site.heroSlides.findIndex(
        (slide) => (slide as unknown as { _id: Types.ObjectId })._id.toString() === slideUpdate.slideId
      );
      
      if (slideIndex !== -1) {
        site.heroSlides[slideIndex].order = slideUpdate.order;
      }
    });

    // Sort by order
    site.heroSlides.sort((a: IHeroSlide, b: IHeroSlide) => a.order - b.order);
    
    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Slides reordered successfully!"
    });
  } catch (error: ServerError) {
    console.error("Error in reorderHeroSlidesServerSide:", error);
    return handleServerError(error);
  }
}

// Toggle slide active status
export async function toggleHeroSlideStatusServerSide(slideId: string): Promise<IResponse> {
  try {
    await connectToDB();

    const site = await SiteModle.findOne({});
    
    if (!site) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Site configuration not found"
      });
    }

    const slideIndex = site.heroSlides.findIndex(
      (slide) => (slide as unknown as { _id: Types.ObjectId })._id.toString() === slideId
    );
    
    if (slideIndex === -1) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "Slide not found"
      });
    }

    // Toggle isActive
    site.heroSlides[slideIndex].isActive = !site.heroSlides[slideIndex].isActive;
    
    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: `Slide ${site.heroSlides[slideIndex].isActive ? 'activated' : 'deactivated'} successfully!`
    });
  } catch (error: ServerError) {
    console.error("Error in toggleHeroSlideStatusServerSide:", error);
    return handleServerError(error);
  }
}


export async function createOfferServerSide(body: ICreateOfferInput): Promise<IResponse> {
  try {
    await connectToDB();

    const {
      title,
      shortNote,
      promoCode,
      discount,
      startDate,
      endDate,
      isActive = true
    } = body;

    // Check if promo code already exists
    const existingOffer = await OfferModel.findOne({ promoCode: promoCode.toUpperCase() });
    if (existingOffer) {
      return {
        isError: true,
        status: 409,
        message: "Promo code already exists"
      };
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return {
        isError: true,
        status: 400,
        message: "End date must be after start date"
      };
    }

    const newOffer = await OfferModel.create({
      title,
      shortNote,
      promoCode: promoCode.toUpperCase(),
      discount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive
    });

    return {
      isError: false,
      status: 201,
      message: "Offer created successfully",
      data: { offer: newOffer }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function getAllOffersServerSide(): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const offers = await OfferModel.find().sort({ createdAt: -1 }).exec();

    return {
      isError: false,
      status: 200,
      message: "Offers fetched successfully",
      data: { offers }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function getActiveOffersServerSide(): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const offers = await OfferModel.findActiveOffers();

    return {
      isError: false,
      message: "Active offers fetched successfully",
      status: 200,
      data: { offers }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function getOfferByIdServerSide(offerId: string): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const offer = await OfferModel.findById(offerId).exec();

    if (!offer) {
      return {
        isError: true,
        status: 404,
        message: "Offer not found"
      };
    }

    return {
      isError: false,
      status: 200,
      message: "Offer fetched successfully",
      data: { offer }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function updateOfferServerSide(offerId: string, body: IUpdateOfferInput): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const {
      title,
      shortNote,
      promoCode,
      discount,
      startDate,
      endDate,
      isActive
    } = body;

    // Check if offer exists
    const existingOffer = await OfferModel.findById(offerId);
    if (!existingOffer) {
      return {
        isError: true,
        status: 404,
        message: "Offer not found"
      };
    }

    // Check if promo code is being updated and if it already exists
    if (promoCode && promoCode !== existingOffer.promoCode) {
      const promoCodeExists = await OfferModel.findOne({ 
        promoCode: promoCode.toUpperCase(),
        _id: { $ne: offerId } // Exclude current offer
      });
      
      if (promoCodeExists) {
        return {
          isError: true,
          status: 409,
          message: "Promo code already exists"
        };
      }
    }

    // Validate dates if both are provided
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return {
        isError: true,
        status: 400,
        message: "End date must be after start date"
      };
    }

    const updateData: {
      title: string;
      shortNote: string;
      promoCode: string;
      discount: number;
      startDate: Date;
      endDate: Date;
      isActive: boolean;
    } = {
      title: "",
      shortNote: "",
      promoCode: "",
      discount: 0,
      startDate: new Date(),
      endDate: new Date,
      isActive: false
    };
    if (title) updateData.title = title;
    if (shortNote) updateData.shortNote = shortNote;
    if (promoCode) updateData.promoCode = promoCode.toUpperCase();
    if (discount) updateData.discount = discount;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedOffer = await OfferModel.findByIdAndUpdate(
      offerId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    return {
      isError: false,
      status: 200,
      message: "Offer updated successfully",
      data: { offer: updatedOffer }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function deleteOfferServerSide(offerId: string): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const offer = await OfferModel.findByIdAndDelete(offerId).exec();

    if (!offer) {
      return {
        isError: true,
        status: 404,
        message: "Offer not found"
      };
    }

    return {
      isError: false,
      status: 200,
      message: "Offer deleted successfully"
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function toggleOfferStatusServerSide(offerId: string): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const offer = await OfferModel.findById(offerId).exec();

    if (!offer) {
      return {
        isError: true,
        status: 404,
        message: "Offer not found"
      };
    }

    const updatedOffer = await OfferModel.findByIdAndUpdate(
      offerId,
      { $set: { isActive: !offer.isActive } },
      { new: true }
    ).exec();

    return {
      isError: false,
      status: 200,
      message: `Offer ${updatedOffer?.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { offer: updatedOffer }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function validatePromoCodeServerSide(promoCode: string): Promise<IOfferResponse> {
  try {
    await connectToDB();

    const validOffer = await OfferModel.validatePromoCode(promoCode);

    if (!validOffer) {
      return {
        isError: true,
        status: 404,
        message: "Invalid or expired promo code"
      };
    }

    return {
      isError: false,
      status: 200,
      message: "Promo code is valid",
      data: { offer: validOffer }
    };

  } catch (error) {
    return handleServerError(error as ServerError);
  }
}

export async function createAndUpdatePrivacyAndPolicyServerSide(body: IUpdatePrivacyPolicySectionInput ): Promise<IOfferResponse> {
    try {
        await connectToDB();

        const content = body.get("content") as string;

        let res = await SiteModle.findOneAndUpdate({},{ $set: {
                "privacyAndPolicy": content
            }}, { new: true}).lean().exec();

        if ( !res ) {
            res = await SiteModle.create({
                "privacyAndPolicy": content
            })
        }

        return SendResponse({ isError: false, status: 200, message: "Hero section updated successfully!" });

    } catch (error : ServerError ) {
        return handleServerError(error);
    }
}

export async function getPrivacyAndPolicyServerSide( ): Promise<IOfferResponse> {
    try {
        await connectToDB();

        const res = await SiteModle.findOne({}).lean().exec();

        return SendResponse({ isError: false, status: 200, message: "Hero section updated successfully!", data: res?.privacyAndPolicy ?? "" });

    } catch (error : ServerError ) {
        return handleServerError(error);
    }
}

// Get all nav links
export async function getNavLinksServerSide(): Promise<IResponse> {
  try {
    await connectToDB();

    let site = await SiteModle.findOne({});
    if (!site) {
      site = await SiteModle.create({ navLinks: DEFAULT_NAV_LINKS });
    } else if (!site.navLinks || site.navLinks.length === 0) {
      site.navLinks = DEFAULT_NAV_LINKS;
      await site.save();
    }

    const links = site.navLinks || [];
    const sortedLinks = links.sort((a, b) => a.order - b.order);
    
    return SendResponse({
      isError: false,
      status: 200,
      message: "Nav links fetched successfully!",
      data: sortedLinks
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Add new nav link
export async function addNavLinkServerSide(body: INavLinkInput): Promise<IResponse> {
  try {
    await connectToDB();

    const { name, href, isActive = true } = body;

    if (!name || !href) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Name and href are required"
      });
    }

    // Find or create site document
    let site = await SiteModle.findOne({});
    
    if (!site) {
      site = await SiteModle.create({ navLinks: [] });
    }

    // Calculate order
    const maxOrder = (site.navLinks || []).length > 0 
      ? Math.max(...site.navLinks.map(link => link.order))
      : -1;

    const newLink = {
      _id: new Types.ObjectId(),
      name,
      href,
      order: maxOrder + 1,
      isActive
    };

    if (!site.navLinks) site.navLinks = [];
    site.navLinks.push(newLink as INavLink);
    await site.save();

    return SendResponse({
      isError: false,
      status: 201,
      message: "Nav link added successfully!",
      data: newLink
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Update nav link
export async function updateNavLinkServerSide(body: IUpdateNavLinkInput): Promise<IResponse> {
  try {
    await connectToDB();

    const { linkId, name, href, isActive } = body;

    const site = await SiteModle.findOne({});
    if (!site) {
      return SendResponse({ isError: true, status: 404, message: "Site configuration not found" });
    }

    const linkIndex = site.navLinks.findIndex((link) => (link as unknown as { _id: Types.ObjectId })._id.toString() === linkId);
    if (linkIndex === -1) {
      return SendResponse({ isError: true, status: 404, message: "Nav link not found" });
    }

    if (name) site.navLinks[linkIndex].name = name;
    if (href) site.navLinks[linkIndex].href = href;
    if (typeof isActive === 'boolean') site.navLinks[linkIndex].isActive = isActive;

    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Nav link updated successfully!",
      data: site.navLinks[linkIndex]
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Delete nav link
export async function deleteNavLinkServerSide(linkId: string): Promise<IResponse> {
  try {
    await connectToDB();

    const updatedSite = await SiteModle.findOneAndUpdate(
      {},
      { $pull: { navLinks: { _id: linkId } } },
      { new: true }
    ).lean().exec();

    if (!updatedSite) {
      return SendResponse({ isError: true, status: 404, message: "Site configuration not found" });
    }

    return SendResponse({
      isError: false,
      status: 200,
      message: "Nav link deleted successfully!"
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

// Reorder nav links
export async function reorderNavLinksServerSide(body: IReorderNavLinksInput): Promise<IResponse> {
  try {
    await connectToDB();

    const site = await SiteModle.findOne({});
    if (!site) {
      return SendResponse({ isError: true, status: 404, message: "Site configuration not found" });
    }

    body.links.forEach((update) => {
      const linkIndex = site.navLinks.findIndex((link) => (link as unknown as { _id: Types.ObjectId })._id.toString() === update.linkId);
      if (linkIndex !== -1) {
        site.navLinks[linkIndex].order = update.order;
      }
    });

    site.navLinks.sort((a: INavLink, b: INavLink) => a.order - b.order);
    await site.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Nav links reordered successfully!"
    });
  } catch (error: ServerError) {
    return handleServerError(error);
  }
}
// --- Features Management ---
export async function getFeaturesServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();
    return SendResponse({ isError: false, status: 200, message: "Features fetched", data: site?.features || [] });
  } catch (error: any) { return handleServerError(error); }
}

export async function updateFeaturesServerSide(features: any[]): Promise<IResponse> {
  try {
    await connectToDB();
    await SiteModle.findOneAndUpdate({}, { $set: { features } }, { upsert: true });
    return SendResponse({ isError: false, status: 200, message: "Features updated successfully" });
  } catch (error: any) { return handleServerError(error); }
}

// --- Testimonials Management ---
export async function getTestimonialsServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();
    return SendResponse({ isError: false, status: 200, message: "Testimonials fetched", data: site?.testimonials || [] });
  } catch (error: any) { return handleServerError(error); }
}

export async function updateTestimonialsServerSide(testimonials: any[]): Promise<IResponse> {
  try {
    await connectToDB();
    await SiteModle.findOneAndUpdate({}, { $set: { testimonials } }, { upsert: true });
    return SendResponse({ isError: false, status: 200, message: "Testimonials updated successfully" });
  } catch (error: any) { return handleServerError(error); }
}

// --- Instagram Gallery Management ---
export async function getInstagramGalleryServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();
    return SendResponse({ isError: false, status: 200, message: "Instagram gallery fetched", data: site?.instagramGallery || [] });
  } catch (error: any) { return handleServerError(error); }
}

export async function addInstagramPostServerSide(body: FormData): Promise<IResponse> {
  try {
    await connectToDB();
    const imageFile = body.get("imageFile") as File;
    const link = (body.get("link") as string) || "";
    
    const cloudinaryResponse = await uploadImageToCloudinary(imageFile);
    if (!cloudinaryResponse) return SendResponse({ isError: true, status: 500, message: "Upload failed" });

    await SiteModle.findOneAndUpdate({}, { $push: { instagramGallery: { imageUrl: cloudinaryResponse.url, link } } }, { upsert: true });
    return SendResponse({ isError: false, status: 200, message: "Post added to gallery" });
  } catch (error: any) { return handleServerError(error); }
}

export async function deleteInstagramPostServerSide(postId: string): Promise<IResponse> {
  try {
    await connectToDB();
    await SiteModle.findOneAndUpdate({}, { $pull: { instagramGallery: { _id: postId } } });
    return SendResponse({ isError: false, status: 200, message: "Post deleted" });
  } catch (error: any) { return handleServerError(error); }
}

// --- Site Settings Management ---
export async function getSiteSettingsServerSide(): Promise<IResponse<ISite>> {
  try {
    await connectToDB();
    let site = await SiteModle.findOne({});
    if (!site) {
      // Initialize if not exists
      site = await SiteModle.create({
        siteName: "THRYVE",
        siteDescription: "Performance nutrition, premium gear, and a fast storefront experience managed from one dashboard.",
        logoUrl: "/NavLogo.png",
        contactEmail: "support@thryve.com",
        contactPhone: "+880 1234 567 890",
        contactAddress: "Dhaka, Bangladesh",
        navLinks: DEFAULT_NAV_LINKS,
        socialLinks: { facebook: "", instagram: "", twitter: "", whatsapp: "" }
      });
    } else if (!site.navLinks || site.navLinks.length === 0) {
      site.navLinks = DEFAULT_NAV_LINKS;
      await site.save();
    }
    
    // Ensure socialLinks object exists even in old documents
    if (!site.socialLinks) {
      await SiteModle.updateOne({ _id: site._id }, { $set: { socialLinks: { facebook: "", instagram: "", twitter: "", whatsapp: "" } } });
      const updatedSite = await SiteModle.findById(site._id).lean();
      return SendResponse<ISite>({ isError: false, status: 200, message: "Settings fetched", data: updatedSite as ISite });
    } else if (site.socialLinks.whatsapp === undefined) {
      // Force whatsapp field if missing in existing socialLinks object
      await SiteModle.updateOne({ _id: site._id }, { $set: { "socialLinks.whatsapp": "" } });
      const updatedSite = await SiteModle.findById(site._id).lean();
      return SendResponse<ISite>({ isError: false, status: 200, message: "Settings fetched", data: updatedSite as ISite });
    }

    const finalSite = await SiteModle.findOne({}).lean().exec();
    return SendResponse<ISite>({ isError: false, status: 200, message: "Settings fetched", data: finalSite as ISite });
  } catch (error: any) { return handleServerError<ISite>(error); }
}

export async function updateSiteSettingsServerSide(settings: Partial<ISite>): Promise<IResponse<ISite>> {
  try {
    await connectToDB();
    
    // Create a clean update object
    const updateData: any = {};
    if (settings.siteName) updateData.siteName = settings.siteName;
    if (settings.siteDescription !== undefined) updateData.siteDescription = settings.siteDescription;
    if (settings.logoUrl) updateData.logoUrl = settings.logoUrl;
    if (settings.contactEmail) updateData.contactEmail = settings.contactEmail;
    if (settings.contactPhone) updateData.contactPhone = settings.contactPhone;
    if (settings.contactAddress) updateData.contactAddress = settings.contactAddress;
    if (settings.galleryTitle) updateData.galleryTitle = settings.galleryTitle;
    if (settings.gallerySubtitle) updateData.gallerySubtitle = settings.gallerySubtitle;
    if (settings.privacyAndPolicy) updateData.privacyAndPolicy = settings.privacyAndPolicy;
    
    // Save social links object directly to ensure all sub-fields (like whatsapp) are included
    if (settings.socialLinks) {
      updateData.socialLinks = {
        facebook: settings.socialLinks.facebook || "",
        instagram: settings.socialLinks.instagram || "",
        twitter: settings.socialLinks.twitter || "",
        whatsapp: settings.socialLinks.whatsapp || ""
      };
    }

    // Use updateOne on the collection directly to bypass any cached schema issues in Mongoose
    await SiteModle.collection.updateOne({}, { $set: updateData }, { upsert: true });
    
    // Fetch the updated document as a plain object
    const finalSite = await SiteModle.findOne({}).lean().exec();

    return SendResponse<ISite>({ 
      isError: false, 
      status: 200, 
      message: "Global settings updated successfully", 
      data: finalSite as ISite
    });
  } catch (error: any) { 
    console.error("Update Site Settings Error:", error);
    return handleServerError<ISite>(error); 
  }
}

// --- Athletes Management ---
export async function getAthletesServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const site = await SiteModle.findOne({}).lean().exec();
    return SendResponse({ isError: false, status: 200, message: "Athletes fetched", data: site?.athletes || [] });
  } catch (error: any) { return handleServerError(error); }
}

export async function addAthleteServerSide(body: FormData): Promise<IResponse> {
  try {
    await connectToDB();
    const name = body.get("name") as string;
    const role = body.get("role") as string;
    const bio = body.get("bio") as string;
    const imageFile = body.get("imageFile") as File;
    const facebook = body.get("facebook") as string;
    const instagram = body.get("instagram") as string;
    const twitter = body.get("twitter") as string;

    let imageUrl = "";
    if (imageFile) {
      const cloudinaryResponse = await uploadImageToCloudinary(imageFile);
      if (cloudinaryResponse) imageUrl = cloudinaryResponse.url;
    }

    if (!imageUrl) return SendResponse({ isError: true, status: 400, message: "Image is required" });

    const newAthlete = {
      name,
      role,
      bio,
      image: imageUrl,
      socialLinks: { facebook, instagram, twitter },
      isActive: true
    };

    await SiteModle.findOneAndUpdate({}, { $push: { athletes: newAthlete } }, { upsert: true });
    return SendResponse({ isError: false, status: 200, message: "Athlete added successfully" });
  } catch (error: any) { return handleServerError(error); }
}

export async function deleteAthleteServerSide(athleteId: string): Promise<IResponse> {
  try {
    await connectToDB();
    await SiteModle.findOneAndUpdate({}, { $pull: { athletes: { _id: athleteId } } });
    return SendResponse({ isError: false, status: 200, message: "Athlete removed" });
  } catch (error: any) { return handleServerError(error); }
}
