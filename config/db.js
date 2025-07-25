import Sequelize from 'sequelize'
import dotenv from 'dotenv'
dotenv.config({path:'.env'})

const db = new Sequelize(process.env.BD_NOMBRE, process.env.BD_USER,process.env.BD_PASS ?? '',{
    host: process.env.BD_HOST,
    port: '3307',
    dialect: 'mysql',
    timezone: '-04:00',
    define:{
        timestamps:true
    },
    pool:{
        max:5,
        min:0,
        acquire:60000,
        idle:10000
    },
    operatorAliases:false 
})

db.sync().then(()=>{
    console.log('Model synchronized with the database')
}).catch(err=>{
    console.error('Error syncing model:',err)
})


export default db