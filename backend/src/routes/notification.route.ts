
import { Router } from "express";
import { GetNotification,UpdateAll,UpdateNotificationById } from "@controllers/notification.controller";
const router=Router()

router.get("/",GetNotification)
router.put("/update",UpdateAll)
router.put("/:id",UpdateNotificationById)  // update by id;

export default router;