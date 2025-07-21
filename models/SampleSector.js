import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const SampleSector = db.define('sampleSector',{
    description:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

export default SampleSector