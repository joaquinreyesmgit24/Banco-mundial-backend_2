import { check, validationResult } from 'express-validator'
import { Company, SampleSize, SampleSector, Panel,Call, Country,Region, Sequelize, Report, Rescheduled, companyDelete } from '../models/index.js'
import moment from 'moment'
import { Op } from 'sequelize';
import xlsx from 'xlsx';

const createCompany = async (req, res) => {
    try {
        const {
            code,
            rut,
            name,
            sampleLocation,
            floorNumber,
            street,
            city,
            state,
            phoneNumberOne,
            numberPhoneCallsOne,
            phoneNumberSecond,
            numberPhoneCallsSecond,
            zipCode,
            faxNumber,
            preferenceNumber,
            emailAddress,
            sampleSectorId,
            sampleSizeId,
            panelId,
            web,
            regionId} = req.body;

        await check('code').notEmpty().withMessage('El id de la empresa no puede estar vacio').run(req)
        await check('rut').notEmpty().withMessage('El rut de la empresa no puede estar vacio').run(req)
        await check('name').notEmpty().withMessage('El nombre de la empresa no puede estar vacio').run(req)
        await check('sampleLocation').notEmpty().withMessage('La ubicación de la muestra no pueda estar vacia').run(req)
        await check('floorNumber').notEmpty().withMessage('El número de casa/piso/puerta de la empresa no puede ir vacio').isInt().withMessage('El número de casa/piso/puerta de la empresa debe ser un número entero').run(req)
        await check('street').notEmpty().withMessage('La calle de la empresa no puede ir vacio').run(req)
        await check('city').notEmpty().withMessage('La ciudad de la empresa no puede ir vacio').run(req)
        await check('state').notEmpty().withMessage('El estado de la empresa no puede ir vacio').run(req)
        await check('phoneNumberOne').notEmpty().withMessage('El teléfono uno de la empresa no puede ir vacio').isInt().withMessage('El teléfono uno de la empresa debe ser un número entero').run(req)
        await check('numberPhoneCallsOne').notEmpty().withMessage('El número de llamadas del teléfono uno no puede ir vacio').isInt().withMessage('El número de llamadas del teléfono uno debe ser un número entero').run(req)
        if(phoneNumberSecond){
            await check('phoneNumberSecond').isInt().withMessage('El teléfono dos de la empresa debe ser un número entero').run(req)
            await check('numberPhoneCallsSecond').notEmpty().withMessage('El número de llamadas del teléfono dos no puede ir vacio').isInt().withMessage('El número de llamadas del teléfono dos debe ser un número entero').run(req)
        
                // Validar que los números de teléfono no sean iguales
            if (phoneNumberOne === phoneNumberSecond) {
                return res.status(400).json({ error: 'El teléfono uno no puede ser igual al teléfono dos' });
            }
        }
        await check('preferenceNumber').notEmpty().withMessage('El número de preferencia no puede ir vacio').isInt().withMessage('El número de preferencia debe ser un número entero').run(req)
        let result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        } 

        const companyExists = await Company.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { code: code },
                    { rut: rut }
                ]
            }
        });

        if (companyExists) {
            return res.status(400).json({ error: 'La empresa ya existe' });
        }
        if (!sampleSectorId) {
            return res.status(400).json({ error: 'Debe seleccionar un sector de la muestra válido' });
        }
        if (!sampleSizeId) {
            return res.status(400).json({ error: 'Debe seleccionar un tamaño de la muestra válido' });
        }
        if (!panelId) {
            return res.status(400).json({ error: 'Debe seleccionar un panel válido' });
        }
        if(!regionId){
            return res.status(400).json({ error: 'Debe seleccionar una región válida' });
        }
        const company = await Company.create({ code: code,
            rut:rut,
            name: name,
            sampleLocation:sampleLocation,
            floorNumber:floorNumber || null,
            street:street,
            city:city,
            state:state,
            phoneNumberOne:phoneNumberOne,
            numberPhoneCallsOne:numberPhoneCallsOne,
            phoneNumberSecond:phoneNumberSecond || null,
            numberPhoneCallsSecond:numberPhoneCallsSecond || null,
            zipCode:zipCode || null,
            faxNumber:faxNumber|| null,
            preferenceNumber:preferenceNumber,
            emailAddress:emailAddress,
            sampleSectorId:sampleSectorId,
            sampleSizeId:sampleSizeId,
            panelId:panelId,
            countryId:1,
            web:web,
            regionId:regionId,
            use: false });

        const companies = await Company.findAll({
            include: [
                {
                    model: SampleSize,
                    required: true
                },
                {
                    model: SampleSector,
                    required: true
                },
                {
                    model: Panel,
                    required: true
                },
                {
                    model: Country,
                    required: true
                },
                {
                    model: Region,
                    required: true
                },
            ]
        });
        res.status(200).json({ msg: 'Empresa creada correctamente', company, companies })

    } catch (error) {
        res.status(500).json({ error: 'Error al crear la empresa' })
    }
}
const uploadCompanies = async (req, res) => {
    try {
        // Verificar si el archivo fue enviado
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        // Leer el archivo Excel
        const buffer = req.file.buffer;
        const workbook = xlsx.read(buffer, { type: 'buffer' });

        // Asumimos que los datos están en la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir el contenido de la hoja a JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const [headers, ...data] = jsonData;

        // Mapeamos las filas a objetos para insertar en la base de datos
        const companiesData = data.map(row => {
            return {
                code: row[headers.indexOf('code')],
                rut: row[headers.indexOf('rut')],
                name: row[headers.indexOf('name')],
                sampleLocation: row[headers.indexOf('sampleLocation')],
                floorNumber: row[headers.indexOf('floorNumber')] || null,
                street: row[headers.indexOf('street')],
                city: row[headers.indexOf('city')],
                state: row[headers.indexOf('state')],
                phoneNumberOne: row[headers.indexOf('phoneNumberOne')],
                numberPhoneCallsOne: row[headers.indexOf('numberPhoneCallsOne')],
                phoneNumberSecond: row[headers.indexOf('phoneNumberSecond')] || null,
                numberPhoneCallsSecond: row[headers.indexOf('numberPhoneCallsSecond')] || null,
                zipCode: row[headers.indexOf('zipCode')] || null,
                faxNumber: row[headers.indexOf('faxNumber')] || null,
                use: false,
                preferenceNumber: row[headers.indexOf('preferenceNumber')],
                emailAddress: row[headers.indexOf('emailAddress')],
                sampleSectorId: row[headers.indexOf('sampleSectorId')],
                sampleSizeId: row[headers.indexOf('sampleSizeId')],
                panelId: row[headers.indexOf('panelId')],
                countryId: row[headers.indexOf('countryId')],
                regionId: row[headers.indexOf('regionId')],
                web: row[headers.indexOf('web')],
            };
        });

        // Validación de los campos
        const errors = [];

        // Recorremos los datos de las empresas para validar
        for (const company of companiesData) {
            // Validación para cada campo
            await check('code').notEmpty().withMessage('El id de la empresa no puede estar vacío').run({ body: company });
            await check('rut').notEmpty().withMessage('El rut de la empresa no puede estar vacío').run({ body: company });
            await check('name').notEmpty().withMessage('El nombre de la empresa no puede estar vacío').run({ body: company });
            await check('sampleLocation').notEmpty().withMessage('La ubicación de la muestra no puede estar vacía').run({ body: company });
            await check('floorNumber').notEmpty().withMessage('El número de casa/piso/puerta no puede estar vacío').isInt().withMessage('El número de casa/piso/puerta de la empresa debe ser un número entero').run({ body: company });
            await check('street').notEmpty().withMessage('La calle no puede estar vacía').run({ body: company });
            await check('city').notEmpty().withMessage('La ciudad no puede estar vacía').run({ body: company });
            await check('state').notEmpty().withMessage('El estado no puede estar vacío').run({ body: company });
            await check('phoneNumberOne').notEmpty().withMessage('El teléfono uno de la empresa no puede ir vacio').isInt().withMessage('El teléfono uno de la empresa debe ser un número entero').run({ body: company });
            if (company.phoneNumberSecond) {
                await check('phoneNumberSecond').isInt().withMessage('El teléfono dos de la empresa debe ser un número entero').run({ body: company });
                await check('numberPhoneCallsSecond').notEmpty().withMessage('El número de llamadas del teléfono dos no puede ir vacio').isInt().withMessage('El número de llamadas del teléfono dos debe ser un número entero').run({ body: company });
                // Verificar si los números de teléfono son iguales
                if (company.phoneNumberOne === company.phoneNumberSecond) {
                    errors.push({
                        company,
                        errors: [{ msg: 'El teléfono uno no puede ser igual al teléfono dos' }]
                    });
                }
            }
            await check('preferenceNumber').notEmpty().withMessage('El número de preferencia no puede estar vacío').isInt().withMessage('El número de preferencia debe ser un número entero').run({ body: company });

            // Validaciones adicionales
            if (!company.sampleSectorId) {
                errors.push({
                    company,
                    errors: [{ msg: 'Debe seleccionar un sector de la muestra válido' }]
                });
            }
            if (!company.sampleSizeId) {
                errors.push({
                    company,
                    errors: [{ msg: 'Debe seleccionar un tamaño de la muestra válido' }]
                });
            }
            if (!company.panelId) {
                errors.push({
                    company,
                    errors: [{ msg: 'Debe seleccionar un panel válido' }]
                });
            }
            if (!company.regionId) {
                errors.push({
                    company,
                    errors: [{ msg: 'Debe seleccionar una región válida' }]
                });
            }

            // Verificar si las validaciones no pasaron
            const result = validationResult({ body: company });
            if (!result.isEmpty()) {
                errors.push({ company, errors: result.array() });
            }

            // Comprobar si la empresa ya existe
            const companyExists = await Company.findOne({
                where: {
                    [Sequelize.Op.or]: [
                        { code: company.code },
                        { rut: company.rut }
                    ]
                }
            });

            if (companyExists) {
                errors.push({
                    company,
                    errors: [{ msg: 'La empresa ya existe' }]
                });
            }
        }

        // Si hay errores, devuelve los errores encontrados
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Insertar los datos en la base de datos
        const insertedCompanies = await Company.bulkCreate(companiesData);

        res.status(200).json({ msg: 'Empresas cargadas exitosamente', insertedCompanies });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cargar las empresas' });
    }
};


const updateCompany = async (req, res) => {
    try {
        const {
            code,
            rut,
            name,
            sampleLocation,
            floorNumber,
            street,
            city,
            state,
            phoneNumberOne,
            numberPhoneCallsOne,
            phoneNumberSecond,
            numberPhoneCallsSecond,
            zipCode,
            faxNumber,
            preferenceNumber,
            emailAddress,
            sampleSectorId,
            sampleSizeId,
            web,
            panelId,
            regionId} = req.body;

        await check('code').notEmpty().withMessage('El id de la empresa no puede estar vacio').run(req)
        await check('rut').notEmpty().withMessage('El rut de la empresa no puede estar vacio').run(req)
        await check('name').notEmpty().withMessage('El nombre de la empresa no puede estar vacio').run(req)
        await check('sampleLocation').notEmpty().withMessage('La ubicación de la muestra no pueda estar vacia').run(req)
        await check('floorNumber').notEmpty().withMessage('El número de casa/piso/puerta de la empresa no puede ir vacio').isInt().withMessage('El número de casa/piso/puerta de la empresa debe ser un número entero').run(req)
        await check('street').notEmpty().withMessage('La calle de la empresa no puede ir vacio').run(req)
        await check('city').notEmpty().withMessage('La ciudad de la empresa no puede ir vacio').run(req)
        await check('state').notEmpty().withMessage('El estado de la empresa no puede ir vacio').run(req)
        await check('phoneNumberOne').notEmpty().withMessage('El teléfono uno de la empresa no puede ir vacio').isInt().withMessage('El teléfono uno de la empresa debe ser un número entero').run(req)
        await check('numberPhoneCallsOne').notEmpty().withMessage('El número de llamadas del teléfono uno no puede ir vacio').isInt().withMessage('El número de llamadas del teléfono uno debe ser un número entero').run(req)
        if(phoneNumberSecond){
            await check('phoneNumberSecond').isInt().withMessage('El teléfono dos de la empresa debe ser un número entero').run(req)
            await check('numberPhoneCallsSecond').notEmpty().withMessage('El número de llamadas del teléfono 2 no puede ir vacio').isInt().withMessage('El número de llamadas del teléfono 2 debe ser un número entero').run(req)
                // Validar que los números de teléfono no sean iguales
            if (phoneNumberOne === phoneNumberSecond) {
                return res.status(400).json({ error: 'El teléfono uno no puede ser igual al teléfono dos' });
            }
        }
        await check('preferenceNumber').notEmpty().withMessage('El número de preferencia no puede ir vacio').isInt().withMessage('El número de preferencia de la empresa debe ser un número entero').run(req)

        let result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        } 


        const company = await Company.findOne({ where: { code } })
        if (!company) {
            return res.status(400).json({ error: 'La empresa a actualizar no existe' });
        }
        if (!sampleSectorId) {
            return res.status(400).json({ error: 'Debe seleccionar un sector de la muestra válido' });
        }
        if (!sampleSizeId) {
            return res.status(400).json({ error: 'Debe seleccionar un tamaño de la muestra válido' });
        }
        if (!panelId) {
            return res.status(400).json({ error: 'Debe seleccionar un panel válido' });
        }
        if(!regionId){
            return res.status(400).json({ error: 'Debe seleccionar una región válida' });
        }

        company.code = code
        company.rut = rut
        company.name = name
        company.sampleLocation = sampleLocation
        company.floorNumber = floorNumber
        company.street = street
        company.city = city
        company.state = state
        company.phoneNumberOne = phoneNumberOne
        company.numberPhoneCallsOne= numberPhoneCallsOne
        company.phoneNumberSecond = phoneNumberSecond || null
        company.numberPhoneCallsSecond = numberPhoneCallsSecond || null
        company.zipCode = zipCode || null
        company.faxNumber = faxNumber || null
        company.preferenceNumber = preferenceNumber
        company.emailAddress = emailAddress
        company.sampleSectorId = sampleSectorId
        company.sampleSizeId = sampleSizeId
        company.web = web
        company.panelId = panelId
        company.regionId = regionId

        await company.save();

        const companies = await Company.findAll({
            include: [
                {
                    model: SampleSize,
                    required: true
                },
                {
                    model: SampleSector,
                    required: true
                },
                {
                    model: Panel,
                    required: true
                },
                {
                    model: Country,
                    required: true
                },
                {
                    model: Region,
                    required: true
                },
            ]
        });

        res.status(200).json({ msg: 'Empresa actualizada correctamente', company, companies })

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la empresa' })
    }
}
const listCompanies = async (req, res) => {
    try {
        const { page = 1, perPage = 5 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(perPage);  // Asegura que page y perPage sean números
        const limit = parseInt(perPage);


        const companies = await Company.findAll({
            limit,  // Limita el número de resultados
            offset,  // Desplazamiento basado en la página
            include: [
                {
                    model: SampleSize,
                    required: true
                },
                {
                    model: SampleSector,
                    required: true
                },
                {
                    model: Panel,
                    required: true
                },
                {
                    model: Country,
                    required: true
                },
                {
                    model: Region,
                    required: true
                },
            ],
            order: [['createdAt', 'DESC']] // Ordena los reportes por 'createdAt' en orden descendente (más reciente primero)
        });
        // Contar el total de reportes para calcular el número total de páginas
        const totalCompanies= await Company.count();

        res.status(200).json({ 
            companies,
            pagination: {
                totalCompanies,
                totalPages: Math.ceil(totalCompanies / perPage),
                currentPage: parseInt(page),
                perPage: parseInt(perPage),
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar las empresas' });
    }
}
const listPanels = async (req, res) => {
    try {
        const panels = await Panel.findAll();
        res.status(200).json({ panels });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los paneles' });
    }
}
const listSampleSectors = async (req, res) => {
    try {
        const sampleSectors = await SampleSector.findAll();
        res.status(200).json({ sampleSectors });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los sectores de la muestra' });
    }
}
const listSampleSizes = async (req, res) => {
    try {
        const sampleSizes = await SampleSize.findAll();
        res.status(200).json({ sampleSizes });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los tamaños de la muestra' });
    }
}
const listRegions = async (req, res) => {
    try {
        const regions = await Region.findAll();
        res.status(200).json({ regions });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar los tamaños de la muestra' });
    }
}

const deleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const company = await Company.findOne({ where: { id: companyId } })
        if (!company) {
            return res.status(400).json({ error: 'La empresa no existe' });
        }
        await company.destroy()
        const companies = await Company.findAll({
            include: [
                {
                    model: SampleSize,
                    required: true
                },
                {
                    model: SampleSector,
                    required: true
                },
                {
                    model: Panel,
                    required: true
                },
                {
                    model: Country,
                    required: true
                },
                {
                    model: Region,
                    required: true
                },
            ]
        });
        res.status(200).json({ msg: 'Empresa eliminada correctamente', company, companies })
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la empresa' });
    }
}

const getRandomCompany = async (req, res) => {
    try {
        const { userId } = req.params;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Traer los IDs de las empresas que no deben mostrarse
        const deletedCompanies = await companyDelete.findAll({
            attributes: ['id'],
        });

        const excludedIds = deletedCompanies.map(dc => dc.id);

        //  Consulta optimizada: excluir esas empresas desde el principio
        const companies = await Company.findAll({
            where: {
                id: { [Op.notIn]: excludedIds },
                [Op.or]: [
                    { assignedId: userId },
                    { assignedId: null }
                ]
            },
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
                    order: [['date', 'DESC']],
                    include: [
                        {
                            model: Rescheduled,
                            as: 'rescheduleds',
                            attributes: ['id'],
                            required: false
                        }
                    ]
                }
            ],
            subQuery: false,
            limit: 200,
            order: Sequelize.literal('RAND()') // Selección aleatoria desde SQL
        });

        if (!companies || companies.length === 0) {
            return res.status(404).json({ message: "No hay empresas disponibles en este momento." });
        }

        //  Filtros adicionales (reglas de negocio)
        const filtered = companies.filter(company => {
            if (company.reports && company.reports.length > 0) return false;

            if (company.calls.some(call => call.rescheduleds && call.rescheduleds.length > 0)) return false;

            const callsByPhoneOne = company.calls.filter(call => call.phone === company.phoneNumberOne).length;
            const callsByPhoneTwo = company.calls.filter(call => call.phone === company.phoneNumberSecond).length;

            const remainingCallsPhoneOne = company.numberPhoneCallsOne - callsByPhoneOne;
            const remainingCallsPhoneTwo = company.numberPhoneCallsSecond - callsByPhoneTwo;

            if (remainingCallsPhoneOne <= 0 && remainingCallsPhoneTwo <= 0) return false;

            const callsToday = company.calls.filter(call => new Date(call.date) >= startOfDay).length;
            if (callsToday >= 3) return false;

            if (company.calls.length > 0) {
                const lastCall = company.calls.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                const differenceMinutes = (Date.now() - new Date(lastCall.date)) / (60 * 1000);
                if (differenceMinutes < 30) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            return res.status(404).json({ message: "No hay empresas disponibles en este momento." });
        }

        //  Seleccionamos una empresa aleatoria del lote filtrado
        const randomCompany = filtered[Math.floor(Math.random() * filtered.length)];

        //  Si no está asignada, la asignamos al usuario
        if (!randomCompany.assignedId) {
            await Company.update(
                { assignedId: userId, use: true },
                { where: { id: randomCompany.id } }
            );
        }

        res.json(randomCompany);
    } catch (error) {
        console.error("Error obteniendo empresa aleatoria:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
}

const getSelectCompanyToCallById = async (req, res) => {
    const { companyId } = req.params;

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Traer los IDs de las empresas eliminadas
        const deletedCompanies = await companyDelete.findAll({
            attributes: ['id'],
        });
        const excludedIds = deletedCompanies.map(dc => dc.id);

        // Buscar la empresa específica excluyendo las eliminadas
        const company = await Company.findOne({
            where: {
                id: companyId,
                id: { [Op.notIn]: excludedIds }  // Excluir empresas eliminadas
            },
            include: [
                {
                    model: Call,
                    as: 'calls',
                    attributes: ['date', 'phone'],
                    required: false,
                    order: [['date', 'DESC']]
                },
                {
                    model: Report,
                    as: 'reports',
                    attributes: ['id'],
                    required: false
                }
            ]
        });

        if (!company) {
            return res.status(404).json({ message: "Empresa no encontrada o ha sido eliminada." });
        }

        // Verificar que no tenga reportes
        if (company.reports && company.reports.length > 0) {
            return res.status(400).json({ message: "Esta empresa tiene reportes y no es elegible." });
        }

        // Contar llamadas por cada número de teléfono
        const callsByPhoneOne = company.calls.filter(call => call.phone === company.phoneNumberOne).length;
        const callsByPhoneTwo = company.calls.filter(call => call.phone === company.phoneNumberSecond).length;

        const companyData = {
            ...company.toJSON(),
            callsByPhoneOne,
            callsByPhoneTwo,
            callsToday: company.calls.filter(call => new Date(call.date) >= startOfDay).length,
            calls: company.calls || []
        };

        console.log("Empresa antes de filtros:", {
            id: companyData.id,
            assignedId: companyData.assignedId,
            callsByPhoneOne: companyData.callsByPhoneOne,
            callsByPhoneTwo: companyData.callsByPhoneTwo,
            callsToday: companyData.callsToday
        });

        // Filtro 1: Verificar si aún tiene llamadas disponibles
        const remainingCallsPhoneOne = companyData.numberPhoneCallsOne - companyData.callsByPhoneOne;
        const remainingCallsPhoneTwo = companyData.numberPhoneCallsSecond - companyData.callsByPhoneTwo;
        if (remainingCallsPhoneOne <= 0 && remainingCallsPhoneTwo <= 0) {
            return res.status(400).json({ message: "La empresa ya ha alcanzado el límite de llamadas permitidas." });
        }

        // Filtro 2: No más de 3 llamadas hoy
        if (companyData.callsToday >= 3) {
            return res.status(400).json({ message: "La empresa ya ha recibido 3 llamadas hoy." });
        }

        res.json(companyData);
    } catch (error) {
        console.error("Error obteniendo empresa específica:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


export {
    createCompany,
    updateCompany,
    listCompanies,
    listPanels,
    listSampleSectors,
    listSampleSizes,
    deleteCompany,
    getRandomCompany,
    getSelectCompanyToCallById,
    uploadCompanies,
    listRegions
}
