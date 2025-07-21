import express from 'express'

import { listReports} from '../controllers/ReportController.js'

const router = express.Router()

router.get('/list-reports', listReports)

export default router;