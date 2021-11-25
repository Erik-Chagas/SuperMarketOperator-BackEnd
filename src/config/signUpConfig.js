import dotenv from 'dotenv'
dotenv.config();

export default {
    secret: process.env.SIGN_UP_CONFIG_SECRET,
    expiresIn: '24h'
}