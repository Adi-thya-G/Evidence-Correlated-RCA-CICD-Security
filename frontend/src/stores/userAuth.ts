import { create } from "zustand";
import api from "@/api/axiosInstance";

interface IUser {
  id: string | null;
  displayName: string | null;
  login: string | null;
  avatarUrl: string | null;
  role: string | null;
  installationId: number | null;
  loginCount: number | null;
  lastLoginAt: Date | null;
  email: string | null;
}

interface IUserStore extends IUser {
  isLoading: boolean;
  isAuthenticated: boolean;
  initialFetch: () => Promise<void>;
  clearUser: () => void;
}

const initialState: IUser = {
  id: null,
  displayName: null,
  login: null,
  avatarUrl: null,
  role: null,
  installationId: null,
  loginCount: null,
  lastLoginAt: null,
  email: null,
};

export const useUserStore = create<IUserStore>((set,get) => ({
  ...initialState,
  isLoading: true,
  isAuthenticated: false,

  initialFetch: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/auth/me");
     
      const user = data.data; // adjust to your ApiResponse shape
      set({
        ...user,
        isAuthenticated: true,
        isLoading: false,
       
      });
      return
    } catch {
      set({
        ...initialState,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearUser: () => {
    set({
      ...initialState,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
