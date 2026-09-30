import { Router } from "express";
import {getDangerZone,getSetting,notificationUpdate,correlationUpdate,danger_zone_update} from "@controllers/setting.controller"
const router=Router()

router.get('/',getSetting)
router.get('/danger-zone/:repo_id',getDangerZone)

// update setting
router.post('/notification',notificationUpdate)
router.post('/correlation',correlationUpdate)


// update danger-zone
router.post('/danger-zone/:repo_id',danger_zone_update)
export default router;