import express from 'express'

import { createSurvey, listSurveys} from '../controllers/SurveyController.js'

const router = express.Router()

router.post('/create-survey',createSurvey)
router.get('/list-survey', listSurveys)

export default router;