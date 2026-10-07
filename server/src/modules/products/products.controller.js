import { getDynamicConfig } from '../config/config.service.js';
import { AppError } from '../../utils/errors.js';
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
    if (req.user.role !== 'ADMIN' && !await getDynamicConfig('SALES_ALLOW_PRODUCT_CREATE', false)) throw new AppError('Admin tidak mengizinkan sales menambah produk', 403);
    const { sku, name, price, stock } = req.body;
    const data = await productService.createProduct({ sku, name, price, ...(req.user.role === 'ADMIN' && stock !== undefined ? { stock } : {}) });
    return successResponse(res, 201, data, 'Produk berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, Object.fromEntries(Object.entries(req.body).filter(([key]) => ['sku', 'name', 'price', 'stock'].includes(key))));
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
