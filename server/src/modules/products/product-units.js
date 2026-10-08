import {unitDefinitionError} from '../../../../shared/product-units.mjs';
import {AppError} from '../../utils/errors.js';
export function validateProductUnits(data) {
 if(['unit','baseUnit','unitsPerUnit'].every(key=>data[key]===undefined))return {};
 const error=unitDefinitionError(data);if(error)throw new AppError(error,400);
 return {unit:data.unit.trim(),baseUnit:data.baseUnit.trim(),unitsPerUnit:data.unitsPerUnit};
}
