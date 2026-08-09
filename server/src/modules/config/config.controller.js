import * as configService from './config.service.js';

export const getConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const value = await configService.getConfigByKey(key);
    res.json({ data: value });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updatedValue = await configService.upsertConfig(key, value);
    res.json({ message: 'Config updated successfully', data: updatedValue });
  } catch (error) {
    next(error);
  }
};
