import * as registrationService from './customer-registrations.service.js';

export const createRegistration = async (req, res, next) => {
  try {
    const result = await registrationService.createRegistration(req.body, req.user);
    res.status(201).json({
      status: 'success',
      message: 'Pengajuan registrasi outlet berhasil disubmit',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const searchPlaces = async (req, res, next) => {
  try {
    const { q, lat, lng } = req.query;
    const results = await registrationService.searchPlaces(
      q,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined
    );
    res.status(200).json({ status: 'success', data: results });
  } catch (error) {
    next(error);
  }
};

export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const result = await registrationService.reverseGeocodeCoordinates(lat, lng);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getRegistrations = async (req, res, next) => {
  try {
    const result = await registrationService.getRegistrations(req.query, req.user);
    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination,
      statusCounts: result.statusCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationById = async (req, res, next) => {
  try {
    const result = await registrationService.getRegistrationById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const approveRegistration = async (req, res, next) => {
  try {
    const result = await registrationService.approveRegistration(
      req.params.id,
      req.body?.note,
      req.user
    );
    res.status(200).json({
      status: 'success',
      message: `Pengajuan outlet berhasil disetujui oleh ${req.user.role}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRegistration = async (req, res, next) => {
  try {
    const result = await registrationService.rejectRegistration(
      req.params.id,
      req.body.reason,
      req.user
    );
    res.status(200).json({
      status: 'success',
      message: 'Pengajuan outlet telah ditolak',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const finalizeAndRegister = async (req, res, next) => {
  try {
    const result = await registrationService.finalizeAndRegisterByAdmin(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      status: 'success',
      message: 'Outlet berhasil diinput ke sistem aktif dan diberi kode outlet',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
