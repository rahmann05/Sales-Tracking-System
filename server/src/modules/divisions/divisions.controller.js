import * as divisionsService from './divisions.service.js';

export const listDivisions = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
    const data = await divisionsService.getDivisions({ includeInactive });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createDivision = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama divisi wajib diisi' });
    const data = await divisionsService.createDivision({ name, code });
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Divisi dengan nama atau kode ini sudah ada' });
    }
    next(err);
  }
};

export const updateDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;
    const data = await divisionsService.updateDivision(id, { name, code, isActive });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    await divisionsService.deleteDivision(id);
    res.json({ success: true, message: 'Divisi dinonaktifkan' });
  } catch (err) {
    next(err);
  }
};
