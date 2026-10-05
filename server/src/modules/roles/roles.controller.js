/**
 * roles.controller.js
 * Single Responsibility: Handle HTTP requests for dynamic roles & permission templates.
 */

import * as rolesService from './roles.service.js';

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
};

export const getRoleByCode = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleByCode(req.params.code);
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const newRole = await rolesService.createRole(req.body);
    res.status(201).json({ success: true, data: newRole, message: 'Role berhasil dibuat' });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const updated = await rolesService.updateRole(req.params.code, req.body);
    res.json({ success: true, data: updated, message: 'Role berhasil diperbarui' });
  } catch (err) {
    next(err);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const result = await rolesService.deleteRole(req.params.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllPermissions = (req, res, next) => {
  try {
    const permissions = rolesService.getAllPermissions();
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
};
