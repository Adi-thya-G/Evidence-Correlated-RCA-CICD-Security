import axios,{AxiosError} from "axios"


const VITE_API_BASE_URL=import.meta.env.VITE_API_BASE_URL

const api=axios.create({
  baseURL:`${VITE_API_BASE_URL}/api/v1`,
  withCredentials:true
})

api.interceptors.response.use((response)=>response,(error:AxiosError)=>{
  if(error.response?.status==401){
    if(location.pathname!="/login"){
      window.location.href="/login"
    }
  }
  return Promise.reject(error)
})

export default api