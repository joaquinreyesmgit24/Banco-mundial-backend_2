import express from 'express'

import {listQuotas, updateQuota } from '../controllers/QuotaController.js'

const router = express.Router()

router.get('/list-quotas', listQuotas)
router.put('/update-quota/:quotaId', updateQuota)

export default router;