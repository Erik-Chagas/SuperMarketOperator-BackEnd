import dotenv from 'dotenv'
dotenv.config();

const authConfig = {
    secret: process.env.AUTH_CONFIG_SECRET,
    expiresIn: 300
}

export default authConfig