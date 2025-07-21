import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt'
import db from '../config/db.js'

const User = db.define('users',{
    username:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false
    },
    imgUrl:{
        type:DataTypes.STRING
    },
    status:{
        type:DataTypes.BOOLEAN
    }
},{
    hooks:{
        beforeCreate:async function(user){
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt);
            
        }
    }
})
//Métodos Personalizados
User.prototype.verifyPassword = function(password){
    return bcrypt.compareSync(password,this.password)
}

export default User