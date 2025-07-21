import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Quota = db.define('quotas',{
    quantity:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
})

export default Quota