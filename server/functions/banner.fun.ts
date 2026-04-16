"use server";

import { BannerMessageModel } from "@/server/models/banner/banner.model";
import { connectToDB } from "@/server/db";
import { handleServerError } from "@/server/helper/ErrorHandler";
import { IBannerMessage } from "../models/banner/banner.interface";

// Get all banner messages
export async function getBannerMessagesServerSide() {
  try {
    await connectToDB();

    const messages = await BannerMessageModel.find({ isActive: true })
      .sort({ order: 1 })
      .exec();

    return {
      isError: false,
      status: 200,
      message: "Banner messages fetched successfully",
      data: { messages }
    };

  } catch (error) {
    return handleServerError(error);
  }
}

// Get all messages for admin (including inactive)
export async function getAllBannerMessagesServerSide() {
  try {
    await connectToDB();

    const messages = await BannerMessageModel.find().sort({ order: 1 }).exec();

    return {
      isError: false,
      status: 200,
      message: "All banner messages fetched successfully",
      data: JSON.parse(JSON.stringify({ messages }))
    };

  } catch (error) {
    return handleServerError(error);
  }
}

// Create new banner message
export async function createBannerMessageServerSide(text: string, icon: string = "🔹") {
  try {
    await connectToDB();

    // Get the highest order to place new message at the end
    const lastMessage = await BannerMessageModel.findOne().sort({ order: -1 }).exec();
    const newOrder = lastMessage ? lastMessage.order + 1 : 0;

    const newMessage = await BannerMessageModel.create({
      text,
      icon,
      order: newOrder
    });

    return {
      isError: false,
      status: 201,
      message: "Banner message created successfully",
      data: { message: newMessage }
    };

  } catch (error) {
    return handleServerError(error);
  }
}

// Update banner message
export async function updateBannerMessageServerSide(messageId: string, updates: Partial<IBannerMessage>) {
  try {
    await connectToDB();

    const updatedMessage = await BannerMessageModel.findByIdAndUpdate(
      messageId,
      { $set: updates },
      { new: true }
    ).exec();

    if (!updatedMessage) {
      return {
        isError: true,
        status: 404,
        message: "Banner message not found"
      };
    }

    return {
      isError: false,
      status: 200,
      message: "Banner message updated successfully",
      data: { message: updatedMessage }
    };

  } catch (error) {
    return handleServerError(error);
  }
}

// Delete banner message
export async function deleteBannerMessageServerSide(messageId: string) {
  try {
    await connectToDB();

    const deletedMessage = await BannerMessageModel.findByIdAndDelete(messageId).exec();

    if (!deletedMessage) {
      return {
        isError: true,
        status: 404,
        message: "Banner message not found"
      };
    }

    return {
      isError: false,
      status: 200,
      message: "Banner message deleted successfully"
    };

  } catch (error) {
    return handleServerError(error);
  }
}

// Reorder messages
export async function reorderBannerMessagesServerSide(orderedIds: string[]) {
  try {
    await connectToDB();

    const updatePromises = orderedIds.map((id, index) => 
      BannerMessageModel.findByIdAndUpdate(id, { $set: { order: index } }).exec()
    );

    await Promise.all(updatePromises);

    return {
      isError: false,
      status: 200,
      message: "Banner messages reordered successfully"
    };

  } catch (error) {
    return handleServerError(error);
  }
}