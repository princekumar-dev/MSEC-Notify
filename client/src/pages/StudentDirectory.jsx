import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiX,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiUsers,
  FiPhone,
  FiUpload,
  FiFile,
  FiDatabase,
} from 'react-icons/fi';
import { studentService } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import HighlightText from '../components/HighlightText';
import ConfirmDialog from '../components/ConfirmDialog';
import BackToTop from '../components/BackToTop';

const StudentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({
    registerNumber: '',
    studentName: '',
    parentMobile: '',
    year: '1',
    department: 'CSE',
    section: 'A',
    classIncharge: '',
  });
  const [saving, setSaving] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importUploading, setImportUploading] = useState(false);
  const [importClassDetails, setImportClassDetails] = useState({
    year: '',
    department: '',
    section: '',
    classIncharge: '',
  });

  const { page, limit, nextPage, prevPage } = usePagination();

  useEffect(() => {
    fetchStudents();
  }, [page, search, filterYear, filterDept, filterSection]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getStudents({
        page,
        limit,
        search,
        year: filterYear,
        department: filterDept,
        section: filterSection,
      });
      if (res.success) {
        setStudents(res.data.students);
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to fetch students from directory');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await studentService.exportStudents();
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'MSEC_Student_Directory.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Directory exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleEdit = (student) => {
    setEditModal(student);
    setEditForm({
      registerNumber: student.registerNumber,
      studentName: student.studentName,
      parentMobile: student.parentMobile,
      year: student.year || '1',
      department: student.department || 'CSE',
      section: student.section || 'A',
      classIncharge: student.classIncharge || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const res = await studentService.updateStudent(editModal._id, editForm);
      if (res.success) {
        toast.success('Student record updated successfully');
        setEditModal(null);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await studentService.deleteStudent(deleteTarget._id);
      toast.success('Student record removed from directory');
      setDeleteTarget(null);
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const onDropImport = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    setImportFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropImport,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const handleImportUpload = async () => {
    if (!importClassDetails.year) {
      toast.error('Please select an Academic Year');
      return;
    }
    if (!importClassDetails.department) {
      toast.error('Please select a Department');
      return;
    }
    if (!importClassDetails.section) {
      toast.error('Please select a Section');
      return;
    }
    if (!importFile) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    try {
      setImportUploading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('year', importClassDetails.year);
      formData.append('department', importClassDetails.department);
      formData.append('section', importClassDetails.section);
      formData.append('classIncharge', importClassDetails.classIncharge);

      const res = await studentService.uploadStudents(formData);
      if (res.success) {
        toast.success(`Successfully imported ${res.data.imported} students for Year ${importClassDetails.year} ${importClassDetails.department}-${importClassDetails.section}!`);
        setShowImportModal(false);
        setImportFile(null);
        setImportClassDetails({ year: '', department: '', section: '', classIncharge: '' });
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImportUploading(false);
    }
  };

  const handleDownloadImportTemplate = () => {
    const dept = importClassDetails.department || 'CSE';
    const yr = importClassDetails.year || '1';
    const sec = importClassDetails.section || 'A';
    const template = [
      { 'Register Number': '311521104001', 'Student Name': 'Aaditya M', 'Parent Mobile Number': '919876543210' },
      { 'Register Number': '311521104002', 'Student Name': 'Bhavya S', 'Parent Mobile Number': '919876543211' },
      { 'Register Number': '311521104003', 'Student Name': 'Chandran K', 'Parent Mobile Number': '919876543212' },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `MSEC_Roster_${dept}_Y${yr}_Sec${sec}.xlsx`);
    toast.success('Sample Excel template downloaded');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await studentService.bulkDeleteStudents(selectedIds);
      toast.success(`Removed ${selectedIds.length} students from directory`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchStudents();
    } catch {
      toast.error('Failed to delete selected students');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title="Bulk Delete Students"
        message={`Permanently delete ${selectedIds.length} selected student records? This action cannot be undone.`}
        confirmText="Delete All"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message="Are you sure you want to delete this student record? This action cannot be undone."
        confirmText="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Import <span className="text-emerald-700">Students</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            {pagination.total} registered students in active class rosters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-mint font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FiPlus /> Import Class Roster
          </button>
          <button onClick={handleExport} className="btn-secondary font-bold">
            <FiDownload /> Export Excel
          </button>
          {selectedIds.length > 0 && (
            <button onClick={() => setShowBulkDeleteConfirm(true)} className="btn-danger">
              <FiTrash2 /> Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Class Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-mint-200 p-3.5 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="input-field text-xs font-bold text-slate-800"
          >
            <option value="">All Academic Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="input-field text-xs font-bold text-slate-800"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="AIDS">AI & DS</option>
            <option value="AIML">AI & ML</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="input-field text-xs font-bold text-slate-800"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>

          {(filterYear || filterDept || filterSection) && (
            <button
              onClick={() => {
                setFilterYear('');
                setFilterDept('');
                setFilterSection('');
              }}
              className="btn-secondary text-xs py-1.5 justify-center"
            >
              Clear Class Filters
            </button>
          )}
        </div>

        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, register number, or parent mobile..."
            className="input-field pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Student Directory Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-mint-200 shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent shadow-mint-glow" />
            <p className="text-xs font-mono text-slate-600 font-bold">Loading student directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-600 space-y-3">
            <FiUsers className="mx-auto text-teal-600" size={32} />
            <p className="text-base font-bold text-slate-900">No Students Found</p>
            <p className="text-xs text-slate-500">No students match the selected class or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700">Register Number</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700">Student Name</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700">Class & Section</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700">Parent Mobile</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans bg-white">
                {students.map((student, i) => (
                  <tr
                    key={student._id}
                    className={`hover:bg-mint-50/50 transition stagger-row ${
                      selectedIds.includes(student._id) ? 'bg-mint-100/50' : ''
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student._id)}
                        onChange={() => toggleSelect(student._id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-teal-800">
                      <HighlightText text={student.registerNumber} searchTerm={search} />
                    </td>
                    <td className="px-4 py-3 text-sm font-extrabold text-slate-900">
                      <HighlightText text={student.studentName} searchTerm={search} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-mint-50 text-teal-900 border border-mint-200">
                        Y{student.year || '1'} • {student.department || 'CSE'}-{student.section || 'A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        <FiPhone size={13} className="text-teal-700" />
                        <HighlightText text={student.parentMobile} searchTerm={search} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 text-slate-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg border border-transparent hover:border-teal-300 transition btn-bounce"
                          title="Edit student"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(student)}
                          className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-100 rounded-lg border border-transparent hover:border-rose-300 transition btn-bounce"
                          title="Delete student"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-mint-200 bg-mint-50/50">
            <p className="text-xs font-mono font-semibold text-slate-600">
              Showing Page <span className="text-teal-800 font-bold">{page}</span> of{' '}
              <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={nextPage}
                disabled={page >= pagination.totalPages}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg border-2 border-mint-300 shadow-2xl animate-slideUp space-y-5">
            <div className="flex items-center justify-between border-b border-mint-200 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                Edit Student Record
              </h3>
              <button
                onClick={() => setEditModal(null)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Register Number
                </label>
                <input
                  type="text"
                  value={editForm.registerNumber}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, registerNumber: e.target.value }))
                  }
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editForm.studentName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, studentName: e.target.value }))
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Parent Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.parentMobile}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, parentMobile: e.target.value }))
                  }
                  className="input-field font-mono"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Academic Year
                </label>
                <select
                  value={editForm.year}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, year: e.target.value }))
                  }
                  className="input-field font-bold"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Department
                </label>
                <select
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, department: e.target.value }))
                  }
                  className="input-field font-bold"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="AIDS">AI & DS</option>
                  <option value="AIML">AI & ML</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Section
                </label>
                <select
                  value={editForm.section}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, section: e.target.value }))
                  }
                  className="input-field font-bold"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Class Incharge
                </label>
                <input
                  type="text"
                  value={editForm.classIncharge}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, classIncharge: e.target.value }))
                  }
                  placeholder="e.g. Dr. K. Ramesh"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveEdit}
                className="btn-mint flex-1 justify-center font-bold"
                disabled={saving}
              >
                {saving ? <FiLoader className="animate-spin" /> : <FiCheck />}
                Save Changes
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Class Roster Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl border-2 border-mint-300 shadow-2xl animate-slideUp space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-mint-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-sm">
                  <FiUpload />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                    Import Class Roster
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload student spreadsheet and assign them to a class
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Target Class Details Form */}
            <div className="bg-mint-50/60 rounded-2xl p-4 border border-mint-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiDatabase className="text-emerald-700" size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Class & Section Metadata
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-white text-teal-900 border border-mint-200 shadow-2xs">
                  {importClassDetails.year && importClassDetails.department && importClassDetails.section
                    ? `Year ${importClassDetails.year} • ${importClassDetails.department}-${importClassDetails.section}`
                    : 'Select Class Details'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={importClassDetails.year}
                    onChange={(e) =>
                      setImportClassDetails((prev) => ({ ...prev, year: e.target.value }))
                    }
                    className="input-field text-xs font-bold"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Department *
                  </label>
                  <select
                    value={importClassDetails.department}
                    onChange={(e) =>
                      setImportClassDetails((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="input-field text-xs font-bold"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">CSE (Computer Science)</option>
                    <option value="IT">IT (Information Tech)</option>
                    <option value="AIDS">AIDS (AI & Data Science)</option>
                    <option value="AIML">AIML (AI & Machine Learning)</option>
                    <option value="ECE">ECE (Electronics & Comm)</option>
                    <option value="EEE">EEE (Electrical & Electronics)</option>
                    <option value="MECH">MECH (Mechanical Engg)</option>
                    <option value="CIVIL">CIVIL (Civil Engg)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Section *
                  </label>
                  <select
                    value={importClassDetails.section}
                    onChange={(e) =>
                      setImportClassDetails((prev) => ({ ...prev, section: e.target.value }))
                    }
                    className="input-field text-xs font-bold"
                  >
                    <option value="">Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Class Incharge (Optional)
                  </label>
                  <input
                    type="text"
                    value={importClassDetails.classIncharge}
                    onChange={(e) =>
                      setImportClassDetails((prev) => ({ ...prev, classIncharge: e.target.value }))
                    }
                    placeholder="e.g. Dr. Ramesh"
                    className="input-field text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Dropzone File Upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                  : importFile
                  ? 'border-emerald-400 bg-mint-50/50'
                  : 'border-mint-300 hover:border-emerald-500 bg-white hover:bg-mint-50/30'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center text-teal-700 text-xl">
                {importFile ? <FiFile /> : <FiUpload />}
              </div>
              {importFile ? (
                <div>
                  <p className="text-sm font-bold text-slate-900">{importFile.name}</p>
                  <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB • Ready to import</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Drag and drop your class Excel file here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Supports .xlsx and .xls spreadsheets up to 10MB</p>
                </div>
              )}
            </div>

            {/* Sample Template & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadImportTemplate}
                className="text-xs font-bold text-teal-800 hover:text-teal-900 underline flex items-center gap-1"
              >
                <FiDownload size={13} /> Download Sample Excel Template
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="btn-secondary flex-1 sm:flex-none justify-center text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportUpload}
                  disabled={!importFile || importUploading}
                  className="btn-mint flex-1 sm:flex-none justify-center font-bold text-xs disabled:opacity-50"
                >
                  {importUploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
                  Upload & Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default StudentDirectory;
