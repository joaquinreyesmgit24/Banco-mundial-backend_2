import { Report, Company, User } from '../models/index.js'
import { Op } from 'sequelize';

const listReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [
                {
                    model: Company,  // Relaciona la tabla reports con la tabla companies
                    include: [
                        {
                            model: User,  // Relaciona la tabla companies con la tabla users
                            attributes: ['username']  // Solo obtiene el nombre del usuario
                        }
                    ]
                }
            ]
        });
        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los reportes' });
    }
}

export{
    listReports
}