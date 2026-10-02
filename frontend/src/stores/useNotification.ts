import { create } from "zustand";
import{GetNotification,UpdateNotification} from "@/api/notification"
interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  updateNotification: (
    id: string,
    updatedNotification: Partial<Notification>
  ) => void;
}

export const useNotification = create<NotificationStore>((set) => ({
  notifications: [],

  fetchNotifications: async () => {
    try {
       

      const response=await GetNotification();

      const data: Notification[] = response

      set({
        notifications: data,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },

  updateNotification: async(id, updatedNotification) => {
    const response=await UpdateNotification(id)
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification._id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      ),
    }));
  },
}));

export default useNotification;