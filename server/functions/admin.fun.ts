"use server";

import { connectToDB } from "@/server/db";
import { UserModel } from "../models/user/user.model";
import { USER_ROLE } from "@/enum/user.enum";
import { SendResponse } from "../helper/sendResponse.helper";
import { ServerError } from "../interface/serverError.interface";
import { handleServerError } from "../helper/ErrorHandler";
import { IResponse } from "../interface/response.interface";
import {IUpdateHeroSectionInput, IUpdatePrivacyPolicySectionInput} from "../interface/auth.interface";
import { SiteModle } from "../models/site/site.model";
import { ISite } from "../models/site/site.interface";
import { IUpdateHeroSectionImageInput } from "../interface/admin.interface";
import { uploadMultipleToCloudinary } from "../helper/cloudinary.helper";
import { ICreateOfferInput, IOfferResponse, IUpdateOfferInput } from "../interface/offer.interface";
import { OfferModel } from "../models/offer/offer.model";

let isAdminCreated = false;

export async function createAdminServerSide(){
    if(isAdminCreated) return SendResponse({ isError: true, status: 409, message: "Admin already exists!" });
    try {
        await connectToDB();

        const isAdminExist = await UserModel.exists({ role: USER_ROLE.ADMIN });
        if(isAdminExist) return SendResponse({ isError: true, status: 409, message: "Admin already exists!" });

        await UserModel.create({
            name: "Hasan Saud",
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            isVerified: true,
            role: USER_ROLE.ADMIN
        });

        isAdminCreated = true;

        return SendResponse({ isError: false, status: 200, message: "Admin created successfully!" });

    } catch (error: ServerError) {
        return handleServerError(error);
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

export async function getHeroSectionServerSide(): Promise<IResponse> {
  try {
    await connectToDB();
    const res = await SiteModle.findOne({}).lean().exec() as ISite;
    return SendResponse({ 
        isError: false, 
        status: 200, 
        message: "Get Hero section successfully!", 
        data: res 
    });

  } catch (error: ServerError) {
    return handleServerError(error);
  }
}

export async function updateHeroSectionImageServerSide(body: IUpdateHeroSectionImageInput): Promise<IResponse> {
  try {
    await connectToDB();

    const imageFile = body.get("imageFile") as File;
    
    if (!imageFile) {
      return SendResponse({ 
        isError: true, 
        status: 400, 
        message: "No image file provided" 
      });
    }

    // Upload to Cloudinary
    const cloudinaryResponse = await uploadMultipleToCloudinary([imageFile]);
    
    if (!cloudinaryResponse || cloudinaryResponse.length === 0) {
      return SendResponse({ 
        isError: true, 
        status: 500, 
        message: "Failed to upload image to Cloudinary" 
      });
    }

    const imageUrl = cloudinaryResponse[0];

    // Update database
    await SiteModle.findOneAndUpdate(
      {},
      { $set: { "hero.imageUrl": imageUrl } },
      { new: true, upsert: true }
    ).lean().exec();

    return SendResponse({ 
      isError: false, 
      status: 200, 
      message: "Hero section image updated successfully!",
      data: { imageUrl }
    });

  } catch (error) {
    console.error("Error in updateHeroSectionImageServerSide:", error);
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