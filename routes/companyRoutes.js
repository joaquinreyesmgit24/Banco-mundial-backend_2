import express from 'express'
import multer from 'multer';

import { createCompany, listCompanies,updateCompany,uploadCompanies,
    listPanels, listSampleSectors, listSampleSizes, listRegions, deleteCompany} from '../controllers/CompanyController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage()}).single('file');

router.post('/create-company',createCompany)
router.post('/upload-companies',upload, uploadCompanies)
router.put('/update-company/:companyId', updateCompany)
router.get('/list-companies', listCompanies)
router.get('/list-panels', listPanels)
router.get('/list-sample-sectors', listSampleSectors)
router.get('/list-sample-sizes', listSampleSizes)
router.get('/list-regions', listRegions)
router.delete('/delete-company/:companyId', deleteCompany)

export default router;