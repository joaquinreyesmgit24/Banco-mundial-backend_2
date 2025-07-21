import jwt from 'jsonwebtoken'

const generateJWT = data =>
    jwt.sign({
        id:data.id,
        username:data.username
    },process.env.JWT_SECRET,{
        expiresIn:'1d'
    })


export {
    generateJWT
}