import multer from 'multer'
import multerS3 from 'multer-s3'
import aws from 'aws-sdk'
import crypto from 'crypto'
import { fileURLToPath } from 'url';
import path from 'path'
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storageTypes = {
    local: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.resolve(__dirname, '..', '..', 'src', 'tmp', 'uploads'));
        },
        filename: (req, file, cb) => {
            crypto.randomBytes(16, (erro, hash) => {
                if(erro) cb(erro);

                file.key = `${hash.toString('hex')}-${file.originalname}`

                cb(null, file.key);
            })
        }
    }),

    s3: multerS3({
        s3: new aws.S3(),
        bucket: 'smopictures',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: (req, file, cb) => {
            crypto.randomBytes(16, (erro, hash) => {
                if(erro) cb(erro);

                const fileName = `${hash.toString('hex')}-${file.originalname}`

                cb(null, fileName);
            })
        }
    })
}

export default {
    dest: path.resolve(__dirname, '..', '..', 'src', 'tmp', 'uploads'),
    storage: storageTypes.local,
    limits: {
        filesize: 100 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/pjpeg',
            'image/png'
        ];

        if(allowedMimes.includes(file.mimetype)){
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
}