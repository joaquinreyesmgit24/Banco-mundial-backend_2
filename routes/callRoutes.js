import express from 'express'

import {listIncidents, createCall, listCallsByCompany, deleteCall, listRescheduledByUserId, updateRescheduledStatus, sendEmail  } from '../controllers/CallController.js'
import {getRandomCompany, getSelectCompanyToCallById} from '../controllers/CompanyController.js'

const router = express.Router()

router.post('/create-call', createCall)
router.post('/send-email', sendEmail)
router.get('/list-incidents', listIncidents)
router.get('/get-random-company/:userId', getRandomCompany)
router.get('/list-calls/:companyId', listCallsByCompany)
router.delete('/delete-call/:companyId/:callId', deleteCall)
router.get('/list-rescheduled-by-user/:userId', listRescheduledByUserId)
router.get('/get-select-company-to-call-by-id/:companyId', getSelectCompanyToCallById)
router.put('/update-rescheduled-status/:rescheduledId', updateRescheduledStatus);



export default router;