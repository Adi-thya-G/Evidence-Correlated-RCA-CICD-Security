
import {create} from 'zustand';
import { correlationSetting, GetSetting ,notificationSetting,GetDanger_zone,danger_zone_update} from '@/api/setting';
import { useRepoStore } from './repoStore';
export type AlertThresholdProps="Critical only"|"Critical + High"|"All severities"

export interface settingProps{
  threshold:number,
  retrieval:number,
  slack:boolean,
  email:boolean
  alertThresholds:AlertThresholdProps
  team:Array<{}>
  scanners:Array<{}>
  fetchData:()=>Promise<void>;
  notificationSetting:(data:Partial<settingProps>)=>void;
  correlationSetting:(data:Partial<settingProps>)=>void;
  danger_zoneSetting:(data:Partial<settingProps>)=>void;
}

export const useSetting=create<settingProps>((set, get)=>({
  threshold: 0,
  retrieval: 0,
  slack: false,
  email: false,
  alertThresholds:"Critical only",
  team: [],
  scanners: [],

  fetchData:async()=>{
    const data=await GetSetting();
   console.log(data)
    set({
      ...data
    })
  },
  notificationSetting:async(data)=>{
    console.log(data,"inside")
    
   await notificationSetting(data)
   set({
      email:data.email,
      slack:data.slack,
      alertThresholds:data.alertThresholds
    })

  },
   correlationSetting:async(data)=>{

    set({
      retrieval:data.retrieval,
      threshold:data.threshold
    })
    await correlationSetting(data)
  },
  danger_zoneSetting:(data)=>{
    set({
      
    })
  }
  



}))

export interface DangerZone{
  correlation_history:boolean,
  Disconnect_repository:boolean,
  fetch_data:()=>void,
  update_data:({correlation_history,Disconnect_repository}:{correlation_history:boolean,Disconnect_repository:boolean})=>void
}

export const useDangerZone=create<DangerZone>((set,get)=>({
  correlation_history:false,
  Disconnect_repository:false,
  fetch_data:async()=>{
    const defualt = useRepoStore.getState().default;
    const data=await GetDanger_zone(defualt?.repo_id as number)
    set({
      correlation_history:data?.correlation_history,
      Disconnect_repository:data?.Disconnect_repository
    })
  },
  update_data:async({correlation_history,Disconnect_repository}:{correlation_history:boolean,Disconnect_repository:boolean})=>{
      const defualt = useRepoStore.getState().default;
     const data=await danger_zone_update(defualt?.repo_id as number,{correlation_history,Disconnect_repository})
     console.log(data)
     set({
      correlation_history:data.correlation_history,
      Disconnect_repository:data.Disconnect_repository
     })
     
     


  }


}))