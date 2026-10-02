import api from "./axiosInstance";

export const GetNotification = async () => {
  try {
    const { data } = await api.get("/api/v1/notifications");
    return data.data;
  } catch (err) {
    throw err;
  }
};

export const UpdateNotification = async (id: string) => {
  try {
    const { data } = await api.put(`/api/v1/notifications/${id}`, {
      unread: false,
    });
    return data.data;
  } catch (err) {
    throw err;
  }
};
