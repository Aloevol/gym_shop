"use server";

import { connectToDB } from "@/server/db";
import { SendResponse } from "../helper/sendResponse.helper";
import { handleServerError } from "../helper/ErrorHandler";
import { UserModel } from "../models/user/user.model";
import {IUser} from "@/server/models/user/user.interfce";

interface MongooseDocument {
  toJSON?: () => Record<string, unknown>;
}

interface ObjectIdLike {
  _id?: {
    toString?: () => string;
  };
}

type ConvertibleObject = Record<string, unknown> & MongooseDocument & ObjectIdLike;

const convertToPlainObject = (doc: unknown): unknown => {
  if (doc && typeof doc === 'object') {
    const convertibleDoc = doc as ConvertibleObject;
    if (convertibleDoc.toJSON) {
      return convertibleDoc.toJSON();
    }
    if (convertibleDoc._id && typeof convertibleDoc._id.toString === 'function') {
      return {
        ...convertibleDoc,
        _id: convertibleDoc._id.toString()
      };
    }
    if (Array.isArray(doc)) {
      return doc.map(item => convertToPlainObject(item));
    }
    const plainObj: Record<string, unknown> = {};
    for (const key in doc) {
      if (Object.prototype.hasOwnProperty.call(doc, key)) {
        plainObj[key] = convertToPlainObject((doc as Record<string, unknown>)[key]);
      }
    }
    return plainObj;
  }
  return doc;
};

export async function getUserByIdServerSide(userId: string) {
  try {
    await connectToDB();

    const user = await UserModel.findById(userId).select('-password -otp -hashToken').lean().exec();

    if (!user) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "User not found"
      });
    }

    const plainUser = convertToPlainObject(user);

    return SendResponse({
      isError: false,
      status: 200,
      message: "User fetched successfully",
      data: { user: plainUser }
    });

  } catch (error) {
    return handleServerError(error);
  }
}

export async function updateUserProfileServerSide(userId: string, updateData: {
  name?: string;
  image?: string;
  contact?: string;
}) {
  try {
    await connectToDB();

    const existingUser = await UserModel.findById(userId).lean().exec();
    if (!existingUser) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "User not found"
      });
    }

    const updateFields: Partial<IUser> = {};
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.image) updateFields.image = updateData.image;
    if (updateData.contact) updateFields.contact = updateData.contact;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -otp -hashToken').lean().exec();

    if (!updatedUser) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "User not found during update"
      });
    }

    const plainUser = convertToPlainObject(updatedUser);

    return SendResponse({
      isError: false,
      status: 200,
      message: "Profile updated successfully",
      data: { user: plainUser }
    });

  } catch (error) {
    return handleServerError(error);
  }
}

export async function changeUserPasswordServerSide(userId: string, passwordData: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    await connectToDB();

    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return SendResponse({
        isError: true,
        status: 404,
        message: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await UserModel.isPasswordMac(user.email, passwordData.currentPassword);

    if (!isCurrentPasswordValid) {
      return SendResponse({
        isError: true,
        status: 400,
        message: "Current password is incorrect"
      });
    }


    // Update password
    user.password = passwordData.newPassword;
    await user.save();

    return SendResponse({
      isError: false,
      status: 200,
      message: "Password changed successfully"
    });

  } catch (error) {
    return handleServerError(error);
  }
}

export async function getAllUsersServerSide({ 
  filter, 
  page, 
  limit 
}: { 
  filter?: Record<string, unknown> | null;
  page: number; 
  limit: number; 
}) {
  try {
    await connectToDB();

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(filter ? filter : {})
        .select('-password -otp -hashToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      UserModel.countDocuments(filter ? filter : {})
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;

    const plainUsers = users.map(user => convertToPlainObject(user));

    return SendResponse({
      isError: false,
      status: 200,
      message: "Users fetched successfully",
      data: { 
        users: plainUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext
        }
      }
    });

  } catch (error) {
    return handleServerError(error);
  }
}