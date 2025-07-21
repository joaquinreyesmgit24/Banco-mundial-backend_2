import User from './User.js'
import Role from './Role.js'
import Panel from './Panel.js'
import SampleSize from './SampleSize.js'
import SampleSector from './SampleSector.js'
import Company from './Company.js'
import Sequelize  from 'sequelize'
import Call from './Call.js'
import Incidence from './Incidence.js'
import Quota from './Quota.js'
import Survey from './Survey.js'
import Rescheduled from './Rescheduled.js'
import Report from './Report.js'
import Country from './Country.js'
import Region from './Region.js'


Role.hasMany(User, {foreignKey:'roleId'})
User.belongsTo(Role, {foreignKey: 'roleId'})
SampleSector.hasMany(Company, {foreignKey: 'sampleSectorId'})
Company.belongsTo(SampleSector, {foreignKey:'sampleSectorId'})
SampleSize.hasMany(Company, {foreignKey:'sampleSizeId'})
Company.belongsTo(SampleSize, {foreignKey: 'sampleSizeId'})
Panel.hasMany(Company, {foreignKey: 'panelId'})
Company.belongsTo(Panel, {foreignKey:'panelId'})
Company.hasMany(Call,{foreignKey:'companyId'})
Call.belongsTo(Company, {foreignKey: 'companyId'})
Incidence.hasMany(Call, {foreignKey: 'incidenceId'})
Call.belongsTo(Incidence, {foreignKey:'incidenceId'})
User.hasMany(Company,{foreignKey: 'assignedId'} )
Company.belongsTo(User,{foreignKey: {name:'assignedId', allowNull:true}} )
SampleSize.hasMany(Quota, {foreignKey: 'sampleSizeId'})
Quota.belongsTo(SampleSize, {foreignKey:'sampleSizeId'})
Call.hasMany(Rescheduled, {foreignKey: 'callId'})
Rescheduled.belongsTo(Call, {foreignKey: 'callId'})
Company.hasMany(Survey,{foreignKey:'companyId'} )
Survey.belongsTo(Company, {foreignKey:'companyId'})
Company.hasMany(Report,{foreignKey:'companyId'} )
Report.belongsTo(Company, {foreignKey:'companyId'})
Country.hasMany(Company, {foreignKey: 'countryId'})
Company.belongsTo(Country, {foreignKey:'countryId'})
Region.hasMany(Company, {foreignKey: 'regionId'})
Company.belongsTo(Region, {foreignKey:'regionId'})



export{
    User,
    Role,
    Panel,
    Company,
    Sequelize,
    SampleSector,
    SampleSize,
    Call,
    Incidence,
    Quota,
    Survey,
    Rescheduled,
    Report,
    Region,
    Country
}