import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Region = db.define('regions',{
    name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default Region