import { create } from "zustand";
import{GetNotification,UpdateNotification,UpdateAll} from "@/api/notification"
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
  updateAll:()=>Promise<void>
}

export const useNotification = create<NotificationStore>((set) => ({
  notifications: [],

  fetchNotifications: async () => {
    try {
       

      const response=await GetNotification();

      const data: Notification[] = response
      console.log(data)
      set({
        notifications: data,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },

  updateNotification: async(id, updatedNotification) => {
    const response=await UpdateNotification(id)
    console.log(response,"update")
    set((state) => ({
      notifications: state.notifications.filter((notification) =>
        notification._id !=id &&  notification
      ),
    }));
  },
  updateAll:async()=>{
    const notification=await UpdateAll()
    set({
      ...notification
    })


  }
}));

export default useNotification;