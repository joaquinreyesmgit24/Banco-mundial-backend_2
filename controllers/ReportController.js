import { Report } from '../models/index.js'

const listReports = async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.status(200).json({ reports });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los tamaños de la muestra' });
    }
}
export{
    listReports
}