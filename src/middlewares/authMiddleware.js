import jwt from 'jsonwebtoken'
import authConfig from '../config/authConfig.js'
import { promisify } from 'util';

import dotenv from 'dotenv'
dotenv.config();

export default async (req, res, next) => {
    const authHeaders = req.headers.authorization
    
    if (!authHeaders){
        return res.status(401).json({ 
            message: 'Para acessar este serviço é necessário estar logado'
        })
    }

    const [, token] = authHeaders.split(' ');

    try{
        const decoded = await jwt.verify(token, authConfig.secret)
        req.email = decoded.email;
        next()
    } catch(erro){
        return res.status(401).json({
            message: 'Token inválido'
        })
    }

}