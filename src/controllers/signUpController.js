import user from '../schemas/user.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'
import signUpConfig from '../config/signUpConfig.js'
import refreshTokenConfig from '../config/refreshTokenConfig.js'
import authConfig from '../config/authConfig.js'
import mailSender from '../config/mailSender.js'
import changeMailConfig from '../config/changeMailConfig.js'

import dotenv from 'dotenv'
dotenv.config();

const UserDB = mongoose.model('user')

const hash = async (value) => {
    return await bcrypt.hash(value, 10)
}

class signUpController{
    async cadastro(req, res){
        const confirmationCode = jwt.sign({email: req.body.email}, signUpConfig.secret, { expiresIn: signUpConfig.expiresIn })
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 3)
    
        req.body.password = await hash(req.body.password)
        req.body.confirmationCode = confirmationCode
        req.body.expirationDate = expirationDate
    
        const transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: mailSender.user,
              pass: mailSender.pass
            },
          });
    
        const userExists = await UserDB.findOne({email: req.body.email})
        if(userExists){
            return res.status(400).json({
                error: true,
                message: 'Já existe um usuário com esse endereço de email!'
            })
        }

        const user = UserDB.create(req.body, erro => {
            if(erro){
                return res.status(400).json({
                    error: erro,
                    message: 'Não foi possível cadastrar o usuário'
                })
            }
    
            transport.sendMail({
                from: 'suportemarketoperator@gmail.com',
                to: req.body.email,
                subject: "Confirmação de email requerida",
                html: `<h1>Confirmação de email</h1>
                    <h2>Olá ${req.body.name}</h2>
                    <p>Obrigado por se cadastrar. Por favor confirme seu email clicando no link abaixo:</p>
                    <a href=${process.env.APP_FRONT_URL}/confirmAccount/${confirmationCode}> Click here</a>
                    </div>`,
              }).catch(err => console.log(err));
    
            return res.json({
                message: 'Usuário cadastrado com sucesso!'
            })
        })
    };

//Confirmação de email
    async confirm(req, res) {
        const user = await UserDB.findOne({confirmationCode: req.params.confirmationCode})
    
        if (!user) {
            return res.status(404).send({ message: 'Usuário não encontrado'});
        }
    
        user.status = 'Active'
    
        user.save().then(async saved => res.json({
            message: 'Usuário confirmado com sucesso'
        })).catch(erro => 
            res.status(400).json({
                error: true,
                message: 'Não foi possível confirmar o usuário'
            })
        )
    };

//Confirmação de troca de email
    async ChangeMailConfirmation(req, res) {
        const token = req.params.confirmationCode
        const { password } = req.body
    
        try{
            const decoded = await jwt.verify(token, changeMailConfig.secret)
            const user = await UserDB.findOne({email: decoded.email})

            if(!user){
                return res.status(404).json({
                    error: true,
                    message: 'Usuário não encontrado'
                })
            }

            if(! (await bcrypt.compare(password, user.password))){
                return res.status(403).json({
                    error: true,
                    message: 'Senha inválida'
                })
            }

            if(user.status !== 'ChangingMail'){
                return res.status(400).json({
                    error: true,
                    message: 'Esse usuário não solicitou uma troca de e-mail!'
                })
            }

            user.email = decoded.newEmail
            user.status = 'Active'

            user.save().then(async saved => res.json({
                message: 'Usuário confirmado com sucesso'
            })).catch(erro => 
                res.status(400).json({
                    error: true,
                    message: 'Não foi possível confirmar o usuário'
                })
            )
        } catch(erro){
            return res.status(500).json({
                message: erro.toString()
            })
        }
    }

    async Login(req, res){
        const { email, password } = req.body

        const user = await UserDB.findOne({email: email})

        if(!user){
            return res.status(404).json({
                error: true,
                message: 'Usuário não encontrado'
            })
        }

        if(user.status === 'Pending'){
            return res.status(403).json({
                error: true,
                message: 'Confirmação de email necessária'
            })
        }

        if(! (await bcrypt.compare(password, user.password))){
            return res.status(403).json({
                error: true,
                message: 'Senha inválida'
            })
        }

        return res.json({
            message: 'Usuário logado com sucesso',
            userData: {
                name: user.name,
                email: user.email,
                categories: user.categories,
                expirationDate: user.expirationDate,
                profileImage: user.profileImage
            },
            token: jwt.sign({ email: user.email }, authConfig.secret, { expiresIn: authConfig.expiresIn }),
            refreshToken: jwt.sign({ email: user.email }, refreshTokenConfig.secret, { expiresIn: refreshTokenConfig.expiresIn })
        })
    }

    async RefreshToken(req, res){
        const authHeaders = req.headers.authorization
    
        if (!authHeaders){
            return res.status(401).json({ 
                message: 'Sem refreshToken'
            })
        }
    
        const [, refreshToken] = authHeaders.split(' ');
    
        try{
            const decoded = await jwt.verify(refreshToken, refreshTokenConfig.secret)
            
            return res.json({token: jwt.sign({ email: decoded.email }, authConfig.secret, { expiresIn: authConfig.expiresIn })})
        } catch(erro){
            return res.status(401).json({
                message: 'Token inválido'
            })
        }
    }
}

export default new signUpController()