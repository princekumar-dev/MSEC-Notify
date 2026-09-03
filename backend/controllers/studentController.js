import { Student } from '../models/index.js';
import { ApiSuccess, ApiError } from '../utils/helpers.js';
import * as XLSX from 'xlsx';
import logger from '../utils/logger.js';

export const uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return ApiError(res, 'No file uploaded', 400);
    }

    const {
      year = '1',
      department = 'CSE',
      section = 'A',
      classIncharge = '',
    } = req.body || {};

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return ApiError(res, 'Excel file is empty', 400);
    }

    const errors = [];
    const validStudents = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors = [];
      const registerNumber = (row['Register Number'] || row['registerNumber'] || row['RegNo'] || '').toString().trim();
      const studentName = (row['Student Name'] || row['studentName'] || row['Name'] || '').toString().trim();
      const parentMobile = (row['Parent Mobile Number'] || row['parentMobile'] || row['Mobile'] || row['Phone'] || '').toString().trim();
      const rowYear = (row['Year'] || row['Class'] || year).toString().trim();
      const rowDept = (row['Department'] || row['Dept'] || row['Branch'] || department).toString().trim().toUpperCase();
      const rowSection = (row['Section'] || row['Sec'] || section).toString().trim().toUpperCase();
      const rowIncharge = (row['Class Incharge'] || row['Incharge'] || classIncharge).toString().trim();

      if (!registerNumber) rowErrors.push('Missing Register Number');
      if (!studentName) rowErrors.push('Missing Student Name');
      if (!parentMobile) rowErrors.push('Missing Parent Mobile Number');

      if (parentMobile) {
        const cleaned = parentMobile.replace(/\D/g, '');
        if (cleaned.length < 10 || cleaned.length > 15) {
          rowErrors.push('Invalid Phone Number');
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, registerNumber, studentName, errors: rowErrors });
      } else {
        validStudents.push({
          registerNumber,
          studentName,
          parentMobile: parentMobile.replace(/\D/g, ''),
          year: rowYear,
          department: rowDept,
          section: rowSection,
          classIncharge: rowIncharge,
        });
      }
    }

    if (validStudents.length === 0) {
      return ApiError(res, 'No valid students found', 400, errors);
    }

    let imported = 0;

    for (const student of validStudents) {
      const result = await Student.findOneAndUpdate(
        { registerNumber: student.registerNumber },
        { $set: student },
        { upsert: true, new: true }
      );
      if (result) {
        imported++;
      }
    }

    logger.info(`Imported/updated ${imported} students for Year ${year} ${department}-${section}`);
    return ApiSuccess(res, `Successfully imported/updated ${imported} students`, {
      imported,
      updated: 0,
      duplicates: 0,
      validationErrors: errors.length,
      errors,
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return ApiError(res, 'Failed to upload students: ' + error.message, 500);
  }
};

export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      year = '',
      department = '',
      section = '',
      sortBy = 'registerNumber',
      sortOrder = 'asc',
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { registerNumber: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { parentMobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (year) query.year = year;
    if (department) query.department = department.toUpperCase();
    if (section) query.section = section.toUpperCase();

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort(sort).skip(skip).limit(parseInt(limit));

    return ApiSuccess(res, 'Students fetched successfully', {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get students error:', error);
    return ApiError(res, 'Failed to fetch students', 500);
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const { year = '', department = '', section = '' } = req.query;
    const query = {};
    if (year) query.year = year;
    if (department) query.department = department.toUpperCase();
    if (section) query.section = section.toUpperCase();

    const students = await Student.find(query).sort({ registerNumber: 1 });
    return ApiSuccess(res, 'Students fetched successfully', { students });
  } catch (error) {
    logger.error('Get all students error:', error);
    return ApiError(res, 'Failed to fetch students', 500);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { registerNumber, studentName, parentMobile, year, department, section, classIncharge } = req.body;

    const existingStudent = await Student.findOne({
      registerNumber,
      _id: { $ne: id },
    });

    if (existingStudent) {
      return ApiError(res, 'Register Number already exists', 400);
    }

    const updateData = {
      registerNumber,
      studentName,
      parentMobile: parentMobile.replace(/\D/g, ''),
    };
    if (year) updateData.year = year;
    if (department) updateData.department = department.toUpperCase();
    if (section) updateData.section = section.toUpperCase();
    if (classIncharge !== undefined) updateData.classIncharge = classIncharge;

    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) {
      return ApiError(res, 'Student not found', 404);
    }

    logger.info(`Updated student: ${student.registerNumber}`);
    return ApiSuccess(res, 'Student updated successfully', { student });
  } catch (error) {
    logger.error('Update student error:', error);
    return ApiError(res, 'Failed to update student', 500);
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return ApiError(res, 'Student not found', 404);
    }
    logger.info(`Deleted student: ${student.registerNumber}`);
    return ApiSuccess(res, 'Student deleted successfully');
  } catch (error) {
    logger.error('Delete student error:', error);
    return ApiError(res, 'Failed to delete student', 500);
  }
};

export const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return ApiError(res, 'No student IDs provided', 400);
    }
    const result = await Student.deleteMany({ _id: { $in: ids } });
    logger.info(`Bulk deleted ${result.deletedCount} students`);
    return ApiSuccess(res, `Deleted ${result.deletedCount} students`);
  } catch (error) {
    logger.error('Bulk delete error:', error);
    return ApiError(res, 'Failed to delete students', 500);
  }
};

export const exportStudents = async (req, res) => {
  try {
    const { year = '', department = '', section = '' } = req.query;
    const query = {};
    if (year) query.year = year;
    if (department) query.department = department.toUpperCase();
    if (section) query.section = section.toUpperCase();

    const students = await Student.find(query).sort({ registerNumber: 1 });
    const exportData = students.map((s) => ({
      'Register Number': s.registerNumber,
      'Student Name': s.studentName,
      'Parent Mobile Number': s.parentMobile,
      'Year': s.year || '1',
      'Department': s.department || 'CSE',
      'Section': s.section || 'A',
      'Class Incharge': s.classIncharge || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    logger.error('Export error:', error);
    return ApiError(res, 'Failed to export students', 500);
  }
};

export const getStudentCount = async (req, res) => {
  try {
    const count = await Student.countDocuments();
    return ApiSuccess(res, 'Student count fetched', { count });
  } catch (error) {
    return ApiError(res, 'Failed to get student count', 500);
  }
};
