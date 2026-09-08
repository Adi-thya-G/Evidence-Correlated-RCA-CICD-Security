import {Router} from "express";
import {getRepo} from "@controllers/repo.controller"
const router=Router()

router.get("/",getRepo)

export default router