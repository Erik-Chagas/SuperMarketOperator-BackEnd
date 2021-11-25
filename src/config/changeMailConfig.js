import dotenv from 'dotenv'
dotenv.config();

export default {
    secret: process.env.CHANGE_MAIL_CONFIG_SECRET,
    expiresIn: '1h'
}