import { NotificationModel } from "@modules/Notification";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";
import { asyncHandler } from "@utils/asyncHandler";

export const GetNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(404, "user id not found", "cannot found user id");
  }

  const notification = await NotificationModel.find({
    userId: userId,
    unread: true,
  });
  return new ApiResponse(
    200,
    "noification successful fetched",
    notification,
  ).send(res);
});

export const UpdateNotificationById = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(404, "user not found", "user cannot be found");
  }
  const notification_id = req.params.id;
  if (!notification_id) {
    throw new ApiError(
      404,
      "notification id not found",
      "it neccessary to give notification id",
    );
  }

  const notification = await NotificationModel.findOne({
    userId,
    _id: notification_id,
  });
  if (!notification) {
    throw new ApiError(
      404,
      "notification not found",
      "following notification with id not found",
    );
  }
  notification.unread = false;
  await notification.save();
  return new ApiResponse(
    200,
    "notification updated successfuly",
    notification,
  ).send(res);
});

export const UpdateAll = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const notification = await NotificationModel.findOneAndUpdate(
    { userId, unread: true },
    { $set: { unread: false } },
    { new: true },
  );
  return new ApiResponse(
    200,
    "notifications are updated successfuly",
    notification,
  ).send(res);
});
