import { Op } from 'sequelize';
import db from '../config/db.js';
import { Survey, Report, Company, SampleSector, SampleSize, Country, Region, Panel } from '../models/index.js';

const createSurvey = async (req, res) => {
    const t = await db.transaction();
    try {
        const {
            Q_1, Q_2, Q_3, Q_4, Q_5, Q_6, Q_7,companyId, selectedMainStatus, selectedSubStatus,
            companyStreetUpdate, incidenceId
        } = req.body;

        const company = await Company.findByPk(companyId, {
            include: [
                { model: SampleSize, attributes: ['code', 'description'] },
                { model: SampleSector, attributes: ['code', 'description'] },
                { model: Country, attributes: ['name', 'code'] },
                { model: Region, attributes: ['name', 'code'] },
                { model: Panel, attributes: ['code', 'description'] },
            ]
        });

        if (!company) {
            return res.status(404).json({ msg: 'Compañía no encontrada' });
        }

        const surveyData = {
            Q_1: Q_1? parseInt(Q_1) : null,
            Q_2: Q_2 ? parseInt(Q_2) : null,
            Q_3: Q_3 ? parseInt(Q_3) : null,
            Q_4: Q_4 || null,
            Q_5: Q_5 || null,
            Q_6: Q_6 || null,
            Q_7: Q_7 || null,
            companyId: companyId ? parseInt(companyId) : null,
            status: 'Confirmada'
        };
        if(selectedMainStatus==2){
            surveyData.status = 'Incompleta';
        }
        if(selectedMainStatus==3 && selectedSubStatus){
            surveyData.status = 'Rechazada';
        }

        // Asignación del eligibilityCode
        let eligibilityCode = "";
        if (surveyData.Q_1 === 1) eligibilityCode = "8";
        else if (surveyData.Q_2 === -9) eligibilityCode = "8";
        else if (surveyData.Q_3 !== null && surveyData.Q_3 < 5) eligibilityCode = "5";
        else if (incidenceId === 1 && surveyData.Q_1 != 1 && surveyData.Q_2 !=-9 && (surveyData.Q_3 !== null && surveyData.Q_3 >= 5)) eligibilityCode = "1";
        else if (incidenceId === 2 && surveyData.Q_1 != 1 && surveyData.Q_2 !=-9 && (surveyData.Q_3 !== null && surveyData.Q_3 >= 5)) eligibilityCode = "2";
        else if (incidenceId === 3 && surveyData.Q_1 != 1 && surveyData.Q_2 !=-9 && (surveyData.Q_3 !== null && surveyData.Q_3 >= 5)) eligibilityCode = "3";
        else if (incidenceId === 4 && surveyData.Q_1 != 1 && surveyData.Q_2 !=-9 && (surveyData.Q_3 !== null && surveyData.Q_3 >= 5)) eligibilityCode = "4";

        // Lógica para cambiar el estado de la encuesta si es rechazada
        if (eligibilityCode=="8"||eligibilityCode=="5") {
            surveyData.status = 'Inelegible';
        }

        // Crear encuesta dentro de una transacción
        const survey = await Survey.create(surveyData, { transaction: t });

        const reportData = {
            countryName: company.country.name,
            countryCode: company.country.code,
            nameStratificationRegion: company.region.name,
            regionalStratificationCode: company.region.code,
            nameSizeStratification: company.sampleSize.description,
            sizeStratificationCode: company.sampleSize.code,
            nameStratificationSector: company.sampleSector.description,
            sectorStratificationCode: company.sampleSector.code,
            panelName: company.panel.description,
            panelCode: company.panel.code,
            eligibilityCode:eligibilityCode,
            statusCode: null,
            rejectionCode:  null,
            companyName: company.name,
            locality: null,
            address: company.street,
            zipCode: company.zipCode || null,
            contactPerson: Q_4,
            contactPosition: Q_5,
            phoneNumberOne: company.phoneNumberOne,
            phoneNumberSecond: company.phoneNumberSecond || null,
            faxNumber: company.faxNumber || null,
            emailAddress: company.emailAddress,
            web: company.web || null,
            companyId: company.id,
            companyStreetUpdate: companyStreetUpdate || null
        };
        if (selectedMainStatus) {
            reportData.statusCode = selectedMainStatus;
        }
        if(selectedSubStatus){
            reportData.rejectionCode = selectedSubStatus;
        }
        // Crear reporte dentro de la misma transacción
        await Report.create(reportData, { transaction: t });

    //     // Confirmar la transacción
        await t.commit();
        res.status(200).json({ msg: 'Encuesta procesada correctamente' });

    } catch (error) {
        // Hacer rollback en caso de error
        await t.rollback();
        console.error('Error:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

const listSurveys = async (req, res) => {
    try {
        const surveys = await Survey.findAll({
            include: [{
                model: Company,
            }]
        });
        res.status(200).json({ surveys });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los tamaños de la muestra' });
    }
}

export { createSurvey, listSurveys };
