import { Report, Company, User } from '../models/index.js'
import XLSX from 'xlsx';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

const listReports = async (req, res) => {
    try {
        const { page = 1, perPage = 5 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(perPage);  // Asegura que page y perPage sean números
        const limit = parseInt(perPage);

        const reports = await Report.findAll({
            limit,  // Limita el número de resultados
            offset,  // Desplazamiento basado en la página
            include: [
                {
                    model: Company,
                    include: [
                        {
                            model: User,
                            attributes: ['username']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']] // Ordena los reportes por 'createdAt' en orden descendente (más reciente primero)
        });

        // Contar el total de reportes para calcular el número total de páginas
        const totalReports = await Report.count();

        // Responder con los datos de los reportes y la información de paginación
        res.status(200).json({
            reports,
            pagination: {
                totalReports,
                totalPages: Math.ceil(totalReports / perPage),
                currentPage: parseInt(page),
                perPage: parseInt(perPage),
            }
        });
    } catch (error) {
        console.log(error);  // Imprime el error completo
        res.status(500).json({ error: 'Error al listar los reportes', details: error.message });
    }
};

const downloadReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: Company,
          as: 'company',
          include: [{ model: User, as: 'user' }],
        },
      ],
      order: [['createdAt', 'DESC']] // Ordena los reportes por 'createdAt' en orden descendente (más reciente primero)
    });

    const eligibilityDescriptions = {
      1: "Establecimiento elegible (Nombre y dirección correctos)",
      2: "Establecimiento elegible (Nombre diferente pero misma dirección - la nueva",
      3: "Establecimiento elegible (Nombre diferente pero misma dirección - la empresa/establecimiento ha cambiado de nombre)",
      4: "Establecimiento elegible (Trasladado y localizado)",
      5: "El establecimiento tiene menos de 5 empleados permanentes",
      6: "No contesta",
      7: "Reprogramar llamado",
      10: "Contestador automático",
      11: "Línea de fax - línea de datos",
      12: "Dirección incorrecta/se mudó y no se pudo conseguir información",
      13: "Se niega a responder al cuestionario de selección",
      14: "En proceso (se está llamando al establecimiento/se está procesando)",
      71: "Estatus legal no elegible: no es una empresa, sino un hogar privado",
      91: "Sin respuesta después de haber llamado en diferentes ocasiones",
      92: "Línea fuera de servicio",
      93: "No timbra",
      94: "El número de teléfono no existe",
      133: "Rechazo - número en lista negra",
      151: "Fuera del objetivo: fuera de las regiones cubiertas",
      152: "Fuera del objetivo: trasladado al extranjero",
      155: "Fuera del objetivo - el establecimiento no estuvo disponible",
      156: "Empresa duplicada dentro de la muestra",
      616: "La empresa dejó de funcionar - (El establecimiento quebró)",
      618: "La empresa dejó de funcionar - (El establecimiento original desapareció y ahora es una empresa diferente)",
      619: "La empresa dejó de funcionar - (El establecimiento fue comprado por otra empresa)",
      620: "La empresa dejó de funcionar - (No se pudo determinar)",
      621: "La empresa dejó de funcionar - (Otros)",
    };

    const formattedData = reports.map(report => ({
      'Id': report.id,
      'Nombre de la empresa': report.company?.name || report.companyName || '',
      'Nombre del País': report.countryName || '',
      'Código del País': report.countryCode || '',
      'Región de Estratificación': report.nameStratificationRegion || '',
      'Código de Estratificación Regional': report.regionalStratificationCode || '',
      'Tamaño de la Estratificación': report.nameSizeStratification || '',
      'Código de Estratificación de Tamaño': report.sizeStratificationCode || '',
      'Sector de Estratificación': report.nameStratificationSector || '',
      'Código de Estratificación de Sector': report.sectorStratificationCode || '',
      'Nombre del Panel': report.panelName || '',
      'Código del Panel': report.panelCode || '',
      'Código de Elegibilidad': report.eligibilityCode ?? '',
      'Nombre de Elegibilidad': eligibilityDescriptions[report.eligibilityCode] || 'Descripción no disponible',
      'Código de Estado': report.statusCode ?? '',
      'Código de Rechazo': report.rejectionCode ?? '',
      'Localidad': report.locality || '',
      'Dirección': report.address || report.company?.address || '',
      'Dirreción de la empresa (Actualización)': report.companyStreetUpdate || '',
      'Código Postal': report.zipCode || '',
      'Persona de Contacto': report.contactPerson || '',
      'Cargo de Contacto': report.contactPosition || '',
      'Teléfono 1': report.phoneNumberOne || report.company?.phoneNumberOne || '',
      'Teléfono 2': report.phoneNumberSecond || report.company?.phoneNumberSecond || '',
      'Número de Fax': report.faxNumber || '',
      'Correo Electrónico': report.emailAddress || report.company?.email || '',
      'Página Web': report.web || report.company?.web || '',
      'Encuestador': report.company?.user?.username || report.username || '',
      'Fecha': report.createdAt ? dayjs(report.createdAt).format('DD-MM-YYYY HH:mm:ss') : ''
    }));

    // Crear hoja y libro
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

    // Convertir a buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Enviar archivo al frontend
    res.setHeader('Content-Disposition', 'attachment; filename="Reportes.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el archivo Excel.' });
  }
};



export{
    listReports,
    downloadReports
}