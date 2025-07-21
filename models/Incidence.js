import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Incidence = db.define('incidents',{
    description:{
        type:DataTypes.STRING,
        allowNull:false
    },
})

export default Incidence