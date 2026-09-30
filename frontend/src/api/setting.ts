import api from "./axiosInstance"
import type{settingProps,DangerZone} from '@/stores/useSettingsStore'

// get setting 
export const GetSetting=async()=>{
 try {
   const {data}=await api.get('/settings')
   return data.data
 } catch (error) {
    throw error
 }

}

export const GetDanger_zone=async(repo_id:number)=>{
  try {
    const {data}=await api.get(`/settings/danger-zone/${repo_id}`)
    return data.data
  } catch (error) {
    throw error   
  }
}

// update data

export const notificationSetting=async(form:Partial<settingProps>)=>{
  try{
    const {data}= await api.post('/settings/notification',form)
    return data.data
  }
  catch(error){
    throw error
  }
}


export const correlationSetting=async(form:Partial<settingProps>)=>{
  try {
    const {data}=await api.post('/settings/correlation',form)
    return data.data;
  } catch (error) {
     throw error
  }
}

export const danger_zone_update=async(repo_id:number,form:Partial<DangerZone>)=>{
  try {
    const {data}=await api.post(`/settings/danger-zone/${repo_id}`,form)
    return data.data
  } catch (error) {
      throw error    
  }
} 