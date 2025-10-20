import express from 'express'

import { listReports, downloadReports} from '../controllers/ReportController.js'

const router = express.Router()

router.get('/list-reports', listReports)
router.get('/download-reports', downloadReports)


export default router;