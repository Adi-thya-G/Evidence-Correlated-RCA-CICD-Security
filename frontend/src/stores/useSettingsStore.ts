
import {create} from 'zustand';


type AlertThresholdProps="Critical only"|"Critical + High"|"All severities"

interface settingProps{
  threshold:number,
  retrieval:number,
  slack:boolean,
  email:boolean
  alertThresholds:AlertThresholdProps
  team:Array<{}>
  scanners:Array<{}>
  fetchData:()=>Promise<void>;
  updateSetting:(data:Partial<settingProps>)=>void;
}

const useSetting=create<settingProps>((set, get)=>({
  threshold: 0,
  retrieval: 0,
  slack: false,
  email: false,
  alertThresholds:"Critical only",
  team: [],
  scanners: [],

  fetchData:async()=>{
    set({

    })
  },
  updateSetting:(data)=>{
    set(data)
  }
  



}))
