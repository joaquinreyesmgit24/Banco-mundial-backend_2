import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Report = db.define('reports', {
    countryName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    countryCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nameStratificationRegion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    regionalStratificationCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nameSizeStratification: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sizeStratificationCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nameStratificationSector: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sectorStratificationCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    panelName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    panelCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    eligibilityCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    statusCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rejectionCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    locality: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    zipCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactPerson: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contactPosition: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phoneNumberOne: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    phoneNumberSecond: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    faxNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    emailAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    web: {
        type: DataTypes.STRING,
        allowNull: true
    },
    companyStreetUpdate: {
        type: DataTypes.STRING,
        allowNull: true
    },
   
})

export default Report