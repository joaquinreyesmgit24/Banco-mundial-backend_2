import express from 'express'

import { createSurvey, listSurveys, downloadSurveys} from '../controllers/SurveyController.js'

const router = express.Router()

router.post('/create-survey',createSurvey)
router.get('/list-survey', listSurveys)
router.get('/download-surveys', downloadSurveys)

export default router;