import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Call = db.define('calls',{
    phone:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    comment:{
        type:DataTypes.STRING,
        allowNull:false
    },
    date:{
        type:DataTypes.DATE
    }
})

export default Call