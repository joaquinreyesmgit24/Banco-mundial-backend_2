import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const companyDelete  = db.define('companiesDelete',{
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
})

export default companyDelete