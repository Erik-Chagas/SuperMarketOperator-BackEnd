import dotenv from 'dotenv'
dotenv.config();

const refreshTokenConfig = {
    secret: process.env.REFRESH_TOKEN_CONFIG_SECRET,
    expiresIn: '9999 years'
}

export default refreshTokenConfig