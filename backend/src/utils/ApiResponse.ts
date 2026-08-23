
import { Response } from "express"


class ApiResponse<T=unknown>{
  status:number
  success:boolean
  message:string
  data:T|null
  constructor(status:number,message:string,data:T|null=null){
    this.status=status
    this.success=status<400;
    this.message=message
    this.data=data
  }
  send(res:Response){
    return res.status(this.status).json(this)   
  }

}

export default ApiResponse