import { check, validationResult } from 'express-validator'
import { Call, Incidence, Company, Rescheduled, Sequelize, Report, SampleSize,SampleSector, Country, Region, Panel } from '../models/index.js'
import db from '../config/db.js'
import moment from 'moment'
import { Op } from 'sequelize';
import { DateTime } from 'luxon';


const createCall = async (req, res) => {
    const t = await db.transaction(); // Iniciar transacción
    try {
        await check('phone').notEmpty().withMessage('El teléfono no ha sido seleccionado').run(req);
        await check('date').notEmpty().withMessage('La fecha no es válida').run(req);


        const { phone, comment, date, companyId, incidenceId, rescheduled, companyStreetUpdate } = req.body;

        const utcDate = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm:ss", { zone: "America/Santiago" }).toUTC().toISO();

        if (incidenceId == 7) {
            await check('rescheduled.date').notEmpty().withMessage('La fecha de reprogramación de llamado no puede ir vacía').run(req);
            await check('rescheduled.time').notEmpty().withMessage('La hora de reprogramación de llamado no puede ir vacía').run(req);
        }
        let result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        if (!companyId) {
            return res.status(400).json({ error: 'La empresa no es válida' });
        }

        if (!incidenceId) {
            return res.status(400).json({ error: 'Debe seleccionar una incidencia' });
        }
    

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
            return res.status(400).json({ error: 'La empresa no existe' });
        }

        const callsCount = await Call.findAll({
            where: {
                date,
                phone: { [Op.in]: [company.phoneNumberOne, company.phoneNumberSecond] }
            },
            attributes: [
                'phone',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalCalls']
            ],
            group: ['phone'],
            raw: true
        });

        const callsByPhone = callsCount.reduce((acc, item) => {
            acc[item.phone] = item.totalCalls;
            return acc;
        }, {});

        const callsMadeOne = callsByPhone[company.phoneNumberOne] || 0;
        const callsMadeTwo = callsByPhone[company.phoneNumberSecond] || 0;

        if (phone === company.phoneNumberOne && callsMadeOne >= company.numberPhoneCallsOne) {
            return res.status(400).json({ error: 'No hay llamadas disponibles para este número de teléfono' });
        } else if (phone === company.phoneNumberSecond && callsMadeTwo >= company.numberPhoneCallsSecond) {
            return res.status(400).json({ error: 'No hay llamadas disponibles para este número de teléfono' });
        } else if (phone !== company.phoneNumberOne && phone !== company.phoneNumberSecond) {
            return res.status(400).json({ error: 'El número de teléfono no coincide con los números registrados' });
        }

        // Crear la llamada dentro de la transacción
        const callCreate = await Call.create({ phone, comment, date:utcDate, companyId, incidenceId }, { transaction: t });

        // Si incidenceId es 3, crear también el registro en Rescheduled

        if (incidenceId == 7) {
            const rescheduledCreate = await Rescheduled.create({ callId: callCreate.id, date: rescheduled.date,status:true, time: rescheduled.time }, { transaction: t });
        }

        if (![1, 2, 3, 4,6, 7].includes(incidenceId)) {  
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
                eligibilityCode:"",
                statusCode: "",
                rejectionCode: "",
                companyName: company.name,
                locality: "",
                address: company.street,
                zipCode: company.zipCode,
                contactPerson: "",
                contactPosition: "",
                phoneNumberOne: company.phoneNumberOne,
                phoneNumberSecond: company.phoneNumberSecond || "",
                faxNumber: company.faxNumber,
                emailAddress: company.emailAddress,
                web: company.web,
                companyStreetUpdate: companyStreetUpdate || null,
                companyId: company.id
            };
            if(incidenceId){
                reportData.eligibilityCode = incidenceId;
            }
            await Report.create(reportData, { transaction: t });
        }

        // Confirmar la transacción si todo está bien
        await t.commit();

        // Obtener todas las llamadas con su incidencia
        const calls = await Call.findAll({
            include: [{ model: Incidence, required: true }]
        });

        if (incidenceId != 1 && incidenceId != 2 && incidenceId != 3 && incidenceId != 4 && 
            incidenceId != 7
         ) {
            return res.status(200).json({ msg: 'Se ha guardado correctamente la incidencia', callCreate, calls });
        }
        if (incidenceId == 1 ||incidenceId == 2 || incidenceId == 3  ||incidenceId == 4  ) {
            return res.status(200).json({ msg: 'Se ha empezado la encuesta', callCreate, calls });
        }
        if (incidenceId == 7) {
            return res.status(200).json({ msg: 'Se ha reprogramado la llamada', callCreate, rescheduled, calls });
        }
    } catch (error) {
        await t.rollback(); // Revertir transacción en caso de error
        return res.status(500).json({ error: 'Error al registrar la llamada' });
    }
};
const listIncidents = async (req, res) => {
    try {
        const incidents = await Incidence.findAll();
        res.status(200).json({ incidents });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar las incidencias' });
    }
}

const listCallsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ error: 'Falta el ID de la compañía' });
        }

        const calls = await Call.findAll({
            where: { companyId }, // Filtra por empresa
            include: [
                {
                    model: Incidence,
                    required: true // Si quieres que las llamadas sin incidencia también aparezcan
                },
            ]
        });
        res.status(200).json({ calls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar las llamadas' });
    }
};
const deleteCall = async (req, res) => {
    try {
        const { companyId, callId } = req.params;

        if (!companyId) {
            return res.status(400).json({ error: 'Falta el ID de la compañía' });
        }
        console.log(companyId, callId)
        const call = await Call.findOne({ where: { id: callId } })

        if (!call) {
            return res.status(400).json({ error: 'La llamada no existe' });
        }
        const deleted = await call.destroy()
        console.log(`Registros eliminados: ${deleted}`);

        const calls = await Call.findAll({
            where: { companyId }, // Filtra por empresa
            include: [
                {
                    model: Incidence,
                    required: true // Si quieres que las llamadas sin incidencia también aparezcan
                },
            ]
        });

        res.status(200).json({ msg: 'Llamada eliminada correctamente', calls })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar al usuario' });
    }
}

const listRescheduledByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        // Obtener las reschedulaciones filtrando por el assignedId de las compañías asociadas al usuario
        const rescheduleds = await Rescheduled.findAll({
            where: {
                status: true  // Filtrar las reprogramaciones por el status
            },
            include: [
                {
                    model: Call,
                    include: {
                        model: Company,
                        where: {
                            assignedId: userId  // Filtrar las compañías por assignedId del usuario
                        },
                        required: true  // Aseguramos que la relación de la compañía exista
                    },
                    required: true  // Aseguramos que la relación de la llamada exista
                }
            ]
        });

        res.status(200).json({ rescheduleds })
    } catch (error) {
        console.error('Error al obtener las reprogramaciones:', error);
    }
}
const updateRescheduledStatus = async (req, res) => {
    try {
        const { rescheduledId } = req.params; // Obtén el ID de la reprogramación desde los parámetros de la URL
        // Buscar la reprogramación por su ID y actualizar el estado a 'false'
        const rescheduled = await Rescheduled.update(
            { status: false }, // Establece el estado a 'false'
            { where: { id: rescheduledId } } // Filtra por el ID de la reprogramación
        );

        if (rescheduled[0] === 0) { // Si no se encontró la reprogramación
            return res.status(404)
        }

        res.status(200).json({ message: "No se puede contactar" });
    } catch (error) {
        console.error('Error al actualizar el estado de la reprogramación:', error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
}




export {
    listIncidents,
    createCall,
    listCallsByCompany,
    deleteCall,
    listRescheduledByUserId,
    updateRescheduledStatus
}