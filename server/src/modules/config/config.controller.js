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
    const updatedValue = await configService.upsertConfig(key, value,req.user);
    res.json({ message: 'Config updated successfully', data: updatedValue });
  } catch (error) {
    next(error);
  }
};

export const getAllConfigs = async (req, res, next) => {
  try {
    const configs = await configService.getAllConfigs();
    res.json({ data: configs });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateConfigs = async (req, res, next) => {
  try {
    const { configs } = req.body;
    const updated = await configService.bulkUpsertConfigs(configs,req.user);
    res.json({ message: 'Configs updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
