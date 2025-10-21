import { check, validationResult } from 'express-validator'
import { Call, Incidence, Company, Rescheduled, Sequelize, Report, SampleSize, SampleSector, Country, Region, Panel, companyDelete }
from '../models/index.js'
import { transporter } from '../helpers/emailTransporter.js';
import db from '../config/db.js'
import moment from 'moment'
import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path'; // Asegúrate de importar 'join' desde 'path'


// Obtener el __dirname en ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const createCall = async (req, res) => {
    const t = await db.transaction(); // Iniciar transacción
    try {
        await check('phone').notEmpty().withMessage('El teléfono no ha sido seleccionado').run(req);
        await check('date').notEmpty().withMessage('La fecha no es válida').run(req);


        const { phone, comment, date, companyId, incidenceId, rescheduled, companyStreetUpdate, selectedSubStatus } = req.body;

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
        const callCreate = await Call.create({ phone, comment, date: utcDate, companyId, incidenceId }, { transaction: t });

        // Si incidenceId es 3, crear también el registro en Rescheduled

        if (incidenceId == 7) {
            const rescheduledCreate = await Rescheduled.create({
                callId: callCreate.id, date: rescheduled.date, status: true, time:
                    rescheduled.time
            }, { transaction: t });
        }

        if (![1, 2, 3, 4, 6, 7].includes(incidenceId)) {
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
                eligibilityCode: "",
                statusCode: "",
                rejectionCode: selectedSubStatus ? selectedSubStatus : "",
                companyName: company.name,
                locality: "",
                address: company.street,
                zipCode: company.zipCode,
                contactPerson: "",
                contactPosition: "",
                phoneNumberOne: company.phoneNumberOne,
                phoneNumberSecond: company.phoneNumberSecond || null,
                faxNumber: company.faxNumber,
                emailAddress: company.emailAddress,
                web: company.web,
                companyStreetUpdate: companyStreetUpdate || null,
                companyId: company.id
            };
            if (incidenceId) {
                reportData.eligibilityCode = incidenceId;
            }
            await Report.create(reportData, { transaction: t });
        }

        // Confirmar la transacción si todo está bien
        await t.commit();


        if (incidenceId != 1 && incidenceId != 2 && incidenceId != 3 && incidenceId != 4 &&
            incidenceId != 7
        ) {
            return res.status(200).json({ msg: 'Se ha guardado correctamente la incidencia', callCreate });
        }
        if (incidenceId == 1 || incidenceId == 2 || incidenceId == 3 || incidenceId == 4) {
            return res.status(200).json({ msg: 'Se ha empezado la encuesta', callCreate });
        }
        if (incidenceId == 7) {
            return res.status(200).json({ msg: 'Se ha reprogramado la llamada', callCreate, rescheduled });
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
// Función para enviar el correo con múltiples archivos y una imagen embebida
const sendEmail = async (req, res) => {
    const { to, companyName } = req.body; // El destinatario es enviado desde el frontend

    // Rutas de los archivos que ya están en el servidor
    const file1 = resolve(__dirname, "../folders/Carta_Invitacion_CHI_Invitation_Letter_Fresh_ESP.pdf");
    const file2 = resolve(__dirname, "../folders/Chile_2010.pdf");
    const mailOptions = {
        from: process.env.OUTLOOK_EMAIL,
        to: to,
        subject: `Invitación a participar en la Encuesta WBES 2025 - ${companyName}`,
        html: `
            <p>Estimado/a,</p>
            <p>Junto con saludar, le escribe Marion Cepeda, profesional de la Consultora DATAVOZ <a href="https://datavoz.cl/">https://datavoz.cl/</a>, empresa encargada por el Banco Mundial para el levantamiento de la WBES 2025. Este correo tiene como finalidad extender la siguiente invitación para que la Empresa ${companyName} forme parte de las WBES 2025.</p>
            <p>El siguiente mail es para invitarle a participar en la versión actual de la encuesta WBES Encuesta Empresarial del Banco Mundial en Chile, la cual ya fue levantada en el año 2010, lo que permitió contar con información relevante respecto al entorno empresarial que enfrentan las empresas en el país.</p>
            <p>Para mayor detalle, las Encuestas Empresariales del Banco Mundial (WBES) son encuestas a altos directivos/as y dueños/as de empresas que se han aplicado en más de 170 países, las que contribuyen a contar con información sobre el entorno empresarial, acceso a financiamiento, facilidad para hacer negocios, entre otros.</p>
            <p>Comparto link de acceso a WBES del Banco Mundial en caso que requiera más información <a href="https://espanol.enterprisesurveys.org/es/enterprisesurveys">https://espanol.enterprisesurveys.org/es/enterprisesurveys</a>.</p>
            <p>A continuación, adjunto carta de invitación a participar en el presente estudio, y estaré atenta para resolver sus dudas e inquietudes, y en lo posible, agendar un horario para realizar una entrevista.</p>
            <p>Adicionalmente, pongo a su disposición, una nota de El Mostrador del día 04 de abril de 2025 en que se menciona el estudio al que tanto usted como su empresa están siendo invitados.</p>
            <p><a href="https://www.elmostrador.cl/noticias/pais/2025/04/04/empresas-chilenas-bajo-la-lupa-del-banco-mundial-encuesta-sondeara-al-sector-privado-tras-15-anos/">https://www.elmostrador.cl/noticias/pais/2025/04/04/empresas-chilenas-bajo-la-lupa-del-banco-mundial-encuesta-sondeara-al-sector-privado-tras-15-anos/</a></p>
            <p>Muchas gracias y quedo atenta a cualquier comentario.</p>
            <p>Saludos,</p>
        `,
        attachments: [
            {
                filename: "Carta Invitación CHI Invitation Letter_Fresh_ESP.pdf",
                path: file1,
            },
            {
                filename: "Chile-2010.pdf",
                path: file2,
            },
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ ok: true, msg: "Correo enviado" });
    } catch (error) {
        console.error("Error al enviar el correo: ", error);
        res.status(500).json({ error: "Error al enviar el correo" });
    }
};


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
            ],
            order: [['date', 'DESC']] // Ordena por date en orden descendente (más reciente primero)
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
            ],
            order: [['date', 'DESC']] // Ordena por date en orden descendente (más reciente primero)
        });

        res.status(200).json({ msg: 'Llamada eliminada correctamente', calls })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar al usuario' });
    }
}
const listRescheduledByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Traer los IDs de las empresas eliminadas
        const deletedCompanies = await companyDelete.findAll({
            attributes: ['id']
        });
        console.log(deletedCompanies)
        const excludedIds = deletedCompanies.map(dc => dc.id);

        // Traemos las reprogramaciones con sus llamadas y compañías relacionadas
        const rescheduleds = await Rescheduled.findAll({
            attributes: { exclude: ['status'] },
            include: [
                {
                    model: Call,
                    as: 'call',
                    required: true,
                    include: [
                        {
                            model: Company,
                            as: 'company',
                            where: {
                                assignedId: userId,
                                id: { [Op.notIn]: excludedIds } // Excluir compañías eliminadas
                            },
                            required: true,
                            include: [
                                {
                                    model: Report,
                                    as: 'reports',
                                    attributes: ['id'],
                                    required: false
                                },
                                {
                                    model: Call,
                                    as: 'calls',
                                    attributes: ['date', 'phone'],
                                    required: false,
                                    include: [
                                        {
                                            model: Rescheduled,
                                            as: 'rescheduleds',
                                            attributes: ['id','createdAt'],
                                            required: false,
                                            order: [['createdAt', 'DESC']]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            subQuery: false
        });

        // Post-filtro igual al que usaste en getRandomCompany
        const filtered = rescheduleds.filter(r => {
            const company = r.call.company;
            if (!company) return false;

            // Sin reportes
            if (company.reports && company.reports.length > 0) return false;

            // Cumple con llamadas disponibles
            const callsByPhoneOne = company.calls.filter(call => call.phone === company.phoneNumberOne).length;
            const callsByPhoneTwo = company.calls.filter(call => call.phone === company.phoneNumberSecond).length;

            const remainingCallsPhoneOne = company.numberPhoneCallsOne - callsByPhoneOne;
            const remainingCallsPhoneTwo = company.numberPhoneCallsSecond - callsByPhoneTwo;

            if (remainingCallsPhoneOne <= 0 && remainingCallsPhoneTwo <= 0) return false;

            return true;
        });

        if (filtered.length === 0) {
            return res.status(404).json({ message: "No hay reprogramaciones disponibles." });
        }

        res.status(200).json({ rescheduleds: filtered });
    } catch (error) {
        console.error('Error al obtener las reprogramaciones:', error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

const deleteRescheduled = async (req, res) => {
        try {
        const { rescheduledId, userId } = req.params;

        // Eliminar la reprogramación
        const rescheduled = await Rescheduled.findOne({ where: { id: rescheduledId } });
        if (!rescheduled) {
            return res.status(400).json({ error: 'La reprogramación no existe' });
        }
        await rescheduled.destroy();

        // Traer las reprogramaciones filtradas por usuario
        const rescheduleds = await Rescheduled.findAll({
            attributes: { exclude: ['status'] },
            include: [
                {
                    model: Call,
                    as: 'call',
                    required: true,
                    include: [
                        {
                            model: Company,
                            as: 'company',
                            where: { assignedId: userId },
                            required: true,
                            include: [
                                {
                                    model: Report,
                                    as: 'reports',
                                    attributes: ['id'],
                                    required: false
                                },
                                {
                                    model: Call,
                                    as: 'calls',
                                    attributes: ['date', 'phone'],
                                    required: false,
                                    include: [
                                        {
                                            model: Rescheduled,
                                            as: 'rescheduleds',
                                            attributes: ['id', 'createdAt'],
                                            required: false,
                                            order: [['createdAt', 'DESC']]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
                ],
                subQuery: false
            });

        // Aplicar el mismo post-filtro de disponibilidad
        const filtered = rescheduleds.filter(r => {
            const company = r.call.company;
            if (!company) return false;

            if (company.reports && company.reports.length > 0) return false;

            const callsByPhoneOne = company.calls.filter(call => call.phone === company.phoneNumberOne).length;
            const callsByPhoneTwo = company.calls.filter(call => call.phone === company.phoneNumberSecond).length;

            const remainingCallsPhoneOne = company.numberPhoneCallsOne - callsByPhoneOne;
            const remainingCallsPhoneTwo = company.numberPhoneCallsSecond - callsByPhoneTwo;

            return remainingCallsPhoneOne > 0 || remainingCallsPhoneTwo > 0;
        });


        res.status(200).json({  msg: 'Reprogramación eliminada correctamente', rescheduleds: filtered });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }

}





export {
    listIncidents,
    createCall,
    listCallsByCompany,
    deleteCall,
    listRescheduledByUserId,
    sendEmail,
    deleteRescheduled
}