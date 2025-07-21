import { check, validationResult } from 'express-validator'
import {Quota, SampleSize } from '../models/index.js'

const listQuotas = async (req,res)=>{
    try {
        const quotas = await Quota.findAll({
            required:true,
            include: SampleSize,
        });
        res.status(200).json({ quotas });
    } catch (error) {
        res.status(500).json({ error: 'Error al listar las cuotas' });
    }
}
const updateQuota = async (req,res)=>{
    try {
        const { quantity, sampleSizeId} = req.body;

        console.log(quantity, sampleSizeId)
        await check('quantity').notEmpty().withMessage('La cantidad no puede ir vacía').run(req);
        let resultado = validationResult(req);
        if (!resultado.isEmpty()) {
            return res.status(400).json({ errors: resultado.array() });
        }
        const { quotaId } = req.params;

        const quota = await Quota.findOne({ where: { id: quotaId } });

        if (!quota) {
            return res.status(400).json({ error: 'La cuota no existe' });
        }
        if (!sampleSizeId) {
            return res.status(400).json({ error: 'Debes seleccionar un tamaño de la muestra válido' });
        }
        quota.quantity = quantity;
        await quota.save();

        const quotas = await Quota.findAll({
            required:true,
            include: SampleSize,
        });
        res.status(200).json({ msg: 'La cuota se ha actualizado correctamente', quotas });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar las cuotas' });
    }
}
export{
    listQuotas,
    updateQuota
}