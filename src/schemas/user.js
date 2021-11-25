import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config();

const user = new mongoose.Schema({
    name: {type: String, required: true, ref: 'name'},
    email: {type: String, required: true, unique: true, ref: 'email'},
    password: {type: String, required: true, ref: 'password'},
    profileImage: {
        name: {
            type: String, 
            default: 'DefaultImage'
        },
        size: {
            type: Number, 
            default: 0
        },
        url: {
            type: String, 
            default: `${process.env.APP_URL}/files/DefaultProfileImage.png`
        },
        key: {
            type: String, 
            default: 'DefaultImage'
        }
    },
    status: {
        type: String, 
        enum: ['Pending', 'Active', 'ChangingMail'],
        default: 'Pending'
    },
    confirmationCode: { 
        type: String, 
        unique: true 
    },
    expirationDate: {
        type: Date,
        required: true
    },
    categories: [{
        nome: {type: String, default: '', ref: 'categories'},
        produtos: [{
            nome: {type: String, default: ''},
            preco: {type: Number, default: 0},
            quantidade: {type: String, default: ''},
            descricao: {type: String, default: ''},
            imageURL: {type: String, default: ''}
        }]
    }]
},{
    timestamps: true
});

export default mongoose.model('user', user)