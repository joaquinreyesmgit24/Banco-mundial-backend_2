import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Panel = db.define('panels',{
    description:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default Panel