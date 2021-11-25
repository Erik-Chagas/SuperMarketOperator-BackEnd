import user from '../schemas/user.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'
import changeMailConfig from '../config/changeMailConfig.js'
import mailSender from '../config/mailSender.js'

import dotenv from 'dotenv'
dotenv.config();

const UserDB = mongoose.model('user')

const hash = async (value) => {
    return await bcrypt.hash(value, 10)
}

class AuthenticateController{
    async UserInfo(req, res){
        const user = await UserDB.findOne({email: req.email})

        res.json({
            name: user.name,
            email: user.email,
            categories: user.categories,
            expirationDate: user.expirationDate,
            profileImage: user.profileImage
        })
    }

    async EditProfile(req, res){
        const user = await UserDB.findOne({email: req.email})

        if(req.body.email != '' && req.body.email){
            const userExists = await UserDB.findOne({email: req.body.email})
            if(userExists){
                return res.status(400).json({
                    error: true,
                    message: 'Já existe um usuário com esse endereço de email!'
                })
            }

            const confirmationCode = jwt.sign({email: user.email, newEmail: req.body.email}, changeMailConfig.secret, { expiresIn: changeMailConfig.expiresIn })

            user.status = 'ChangingMail'
            await user.save()

            const transport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                  user: mailSender.user,
                  pass: mailSender.pass
                },
              });

              transport.sendMail({
                from: 'suportemarketoperator@gmail.com',
                to: req.body.email,
                subject: "Troca de email - Confirmação de email requerida",
                html: `<h1>Troca de endereço de email</h1>
                    <h2>Olá ${user.name}</h2>
                    <p>Por favor confirme seu email para realizar a troca de email clicando no link abaixo:</p>
                    <a href=http://localhost:3000/confirmEmailChange/${confirmationCode}> Click here</a>
                    </div>`,
              }).catch(err => console.log(err));

              return res.json({
                message: 'E-mail salvo com sucesso. Verifique sua caixa de entrada para confirmar a troca de e-mails!'
            })
        }  

        if(req.body.name != '' && req.body.name){
            user.name = req.body.name;
            user.save().then(async saved => res.json({
                message: 'Nome salvo com sucesso'
            })).catch(erro => 
                res.status(400).json({
                    error: true,
                    message: 'Não foi possível realizar a troca de nome. Erro: ' + erro
                })
            )
        }

        if(req.file) {

            user.profileImage.name = req.file.originalname
            user.profileImage.size = req.file.size
            user.profileImage.url = req.file.location ? req.file.location : `${process.env.APP_URL}/files/${req.file.filename}`
            user.profileImage.key = req.file.key

            user.save().then(async saved => res.json({
                message: 'Imagem salva com sucesso'
            })).catch(erro => 
                res.status(400).json({
                    error: true,
                    message: 'Não foi possível salvar a imagem. Erro: ' + erro
                })
            )
        }

        if(req.body.password != '' && req.body.password){
            if(! (await bcrypt.compare(req.body.oldPassword, user.password))){
                return res.status(403).json({
                    error: true,
                    message: 'Senha inválida'
                })
            }

            req.body.password = await hash(req.body.password)
            user.password = req.body.password

            user.save().then(async saved => res.json({
                message: 'Nova senha salva com sucesso!'
            })).catch(erro => 
                res.status(400).json({
                    error: true,
                    message: 'Não foi possível salvar a nova senha. Erro: ' + erro
                })
            )
        }
    }

    async PostCategories(req, res){
        const { categorie } = req.body
        
        const user = await UserDB.findOne({email: req.email})

        const categorieExists = user.categories.filter(e => e.nome == categorie)

        if(categorieExists.length != 0){
            return res.status(400).json({
                error: true,
                message: 'Essa categoria já existe'
            })
        }

        user.categories.push({
            nome: categorie
        })

        user.save().then(async saved => res.json({
            message: 'Categoria salva com sucesso'
        })).catch(erro => 
            res.status(400).json({
                error: true,
                message: 'Não foi possível salvar a categoria. Erro: ' + erro
            })
        )
    }

    async GetCategories(req, res){
        const user = await UserDB.findOne({email: req.email})

        if(!user){
            return res.status(404).json({
                error: true,
                message: 'Usuário não encontrado'
            })
        }

        return res.json({
            categorias: user.categories
        })
    }

    async PostProduct(req, res){
        const { categorie } = req.body

        const user = await UserDB.findOne({email: req.email})
        let fileURL = ''

        if(req.file){
            fileURL = req.file.location ? req.file.location : `${process.env.APP_URL}/files/${req.file.filename}`
        }

        let categoria = user.categories.filter(e => e.nome == categorie)
        categoria[0].produtos.push({
            nome: req.body.nome,
            preco: req.body.preco,
            quantidade: req.body.quantidade,
            descricao: req.body.descricao,
            imageURL: fileURL
        })

        user.save().then(async saved => res.json({
            message: 'Produto salvo com sucesso'
        })).catch(erro => 
            res.status(400).json({
                error: true,
                message: 'Não foi possível salvar o produto. Erro: ' + erro
            })
        )
    }
}

export default new AuthenticateController()