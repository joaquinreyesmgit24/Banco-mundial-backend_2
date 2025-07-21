import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const SampleSize = db.define('sampleSizes',{
    description:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default SampleSize