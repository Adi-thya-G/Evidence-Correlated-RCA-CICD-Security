// base url 
const url=import.meta.env.VITE_API_BASE_URL+"/api/v1/event"
// creating event source for server sent event
export const Event=new EventSource(url,{withCredentials:true})


