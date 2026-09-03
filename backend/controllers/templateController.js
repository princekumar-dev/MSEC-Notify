import { MessageTemplate } from '../models/index.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const DEFAULT_LATE_TEMPLATE = `Dear Parent,

Your ward {{studentName}} ({{registerNumber}}) reported late to college on {{date}} at {{time}}.

Regards,
MSEC`;

const DEFAULT_ABSENT_TEMPLATE = `Dear Parent,

Your ward {{studentName}} ({{registerNumber}}) is marked absent today ({{date}}).

Regards,
MSEC`;

export const getTemplates = async (req, res) => {
  try {
    let templates = await MessageTemplate.find({});

    if (templates.length === 0) {
      templates = await MessageTemplate.insertMany([
        { type: 'late', template: DEFAULT_LATE_TEMPLATE },
        { type: 'absent', template: DEFAULT_ABSENT_TEMPLATE },
      ]);
    }

    return ApiSuccess(res, 'Templates fetched', { templates });
  } catch (error) {
    logger.error('Get templates error:', error);
    return ApiError(res, 'Failed to fetch templates', 500);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { type, template } = req.body;

    if (!type || !template) {
      return ApiError(res, 'Type and template are required', 400);
    }

    if (!['late', 'absent'].includes(type)) {
      return ApiError(res, 'Invalid template type', 400);
    }

    const updated = await MessageTemplate.findOneAndUpdate(
      { type },
      { template },
      { new: true, upsert: true }
    );

    logger.info(`Template updated: ${type}`);
    return ApiSuccess(res, 'Template updated successfully', { template: updated });
  } catch (error) {
    logger.error('Update template error:', error);
    return ApiError(res, 'Failed to update template', 500);
  }
};

export const resetTemplates = async (req, res) => {
  try {
    await MessageTemplate.deleteMany({});
    const templates = await MessageTemplate.insertMany([
      { type: 'late', template: DEFAULT_LATE_TEMPLATE },
      { type: 'absent', template: DEFAULT_ABSENT_TEMPLATE },
    ]);

    logger.info('Templates reset to defaults');
    return ApiSuccess(res, 'Templates reset to defaults', { templates });
  } catch (error) {
    logger.error('Reset templates error:', error);
    return ApiError(res, 'Failed to reset templates', 500);
  }
};

export const previewMessage = (template, student) => {
  return template
    .replace(/\{\{studentName\}\}/g, student.studentName)
    .replace(/\{\{registerNumber\}\}/g, student.registerNumber)
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-IN'))
    .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
};
