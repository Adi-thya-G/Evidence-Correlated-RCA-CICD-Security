import api from "./axiosInstance";

export const GetNotification = async () => {
  try {
    const { data } = await api.get("/notifications");
    return data.data;
  } catch (err) {
    throw err;
  }
};

export const UpdateNotification = async (id: string) => {
  try {
    const { data } = await api.put(`/notifications/${id}`, {
      unread: false,
    });
    return data.data;
  } catch (err) {
    throw err;
  }
};


export const UpdateAll=async()=>{
  try {
    const {data}=await api.put(`/notifications/update`)
    return data.data
  } catch (error) {
    throw error
    
  }
}