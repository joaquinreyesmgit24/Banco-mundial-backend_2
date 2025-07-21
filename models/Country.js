import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Country = db.define('countries',{
    name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default Country