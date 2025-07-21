import { DataTypes } from 'sequelize';
import db from '../config/db.js'

const Survey = db.define('surveys',{
    Q_1:{
        type:DataTypes.INTEGER,
        allowNull:true
    },
    Q_2:{
        type:DataTypes.INTEGER,
        allowNull:true
    },
    Q_3:{
        type:DataTypes.INTEGER,
        allowNull:true
    },
    Q_4:{
        type:DataTypes.DATE,
        allowNull:true
    },
    Q_5:{
        type:DataTypes.TIME,
        allowNull:true
    },
    Q_6:{
        type:DataTypes.STRING,
        allowNull:true
    },
    Q_7:{
        type:DataTypes.STRING,
        allowNull:true
    },
    status:{
        type:DataTypes.STRING,
        allowNull:true
    }
})

export default Survey