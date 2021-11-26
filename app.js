import express, { json } from 'express'
import mongoose from 'mongoose'
import authMiddleware from './src/middlewares/authMiddleware.js'
import signUpController from './src/controllers/signUpController.js'
import AuthenticateController from './src/controllers/AuthenticateController.js'
import cors from 'cors'
import multer from 'multer'
import multerConfig from './src/config/multer.js'
import { fileURLToPath } from 'url';
import path from 'path'
import { dirname } from 'path';

import dotenv from 'dotenv'
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()

app.use(express.json())

app.use(cors())
app.use("/files", express.static(path.resolve(__dirname, '.', 'src', 'tmp', 'uploads')))

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(_ => console.log('Conexão com mongodb realizada com sucesso'))
  .catch(erro => console.log({
    message: 'Conexão com mongodb falha',
    erro
}))

app.post('/cadastro', signUpController.cadastro)

app.get('/confirm/:confirmationCode', signUpController.confirm)

app.post('/changeMail/:confirmationCode', signUpController.ChangeMailConfirmation)

app.post('/login', signUpController.Login)

app.post('/refreshToken', signUpController.RefreshToken)

app.use(authMiddleware) //rotas autenticadas

app.get('/userInfo', AuthenticateController.UserInfo)

app.post('/editProfile', multer(multerConfig).single('file'), AuthenticateController.EditProfile)

app.post('/categorias', AuthenticateController.PostCategories)

app.get('/categorias', AuthenticateController.GetCategories)

app.post('/produtos', multer(multerConfig).single('file'), AuthenticateController.PostProduct)

app.listen(process.env.PORT || 8080, () => {
    console.log('Servidor ligado em  localhost:8080')
})