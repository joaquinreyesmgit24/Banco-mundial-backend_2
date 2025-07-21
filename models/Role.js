import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Role = db.define('roles',{
    name:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default Role