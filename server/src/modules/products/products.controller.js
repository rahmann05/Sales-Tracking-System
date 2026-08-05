import * as productService from './products.service.js';
import { successResponse } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await productService.getProducts(req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await productService.getProductById(req.params.id);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);
    return successResponse(res, 201, data, 'Produk berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body);
    return successResponse(res, 200, data, 'Produk berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return successResponse(res, 200, null, 'Produk berhasil dihapus');
  } catch (error) {
    next(error);
  }
};
