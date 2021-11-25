import dotenv from 'dotenv'
dotenv.config();

const mailSender = {
    user: process.env.EMAIL_SENDER_MAIL,
    pass: process.env.EMAIL_SENDER_PASSWORD
}

export default mailSender