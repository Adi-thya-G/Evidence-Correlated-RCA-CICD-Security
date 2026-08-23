import { env } from '@config/env'
import { randomUUID } from 'crypto'
import Jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

export const tokenGenerator=async():Promise<string>=>{
  try {
    return  Jwt.sign(
    {
    user_id:randomUUID()
    },env.JWT_SECRET,
    {expiresIn:env.JWT_EXPIRES_IN as SignOptions['expiresIn'],algorithm:"HS384"})

    
  } catch (error) {
    throw error
  }

}