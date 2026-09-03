import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  FiUpload,
  FiDownload,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiDatabase,
  FiTable,
} from 'react-icons/fi';
import { studentService } from '../services/api';

const StudentUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  // Class Selection Details
  const [classDetails, setClassDetails] = useState({
    year: '',
    department: '',
    section: '',
    classIncharge: '',
  });

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const mapped = data.map((row) => ({
          registerNumber: row['Register Number'] || row['registerNumber'] || row['RegNo'] || '',
          studentName: row['Student Name'] || row['studentName'] || row['Name'] || '',
          parentMobile: row['Parent Mobile Number'] || row['parentMobile'] || row['Mobile'] || row['Phone'] || '',
          year: row['Year'] || classDetails.year,
          department: row['Department'] || classDetails.department,
          section: row['Section'] || classDetails.section,
        }));

        setPreview(mapped);
        toast.success(`Loaded ${mapped.length} student records from sheet`);
      } catch {
        toast.error('Failed to parse Excel spreadsheet');
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [classDetails]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error('File size exceeds 10MB limit');
      } else {
        toast.error('Only .xlsx and .xls Excel files are supported');
      }
    },
  });

  const handleUpload = async () => {
    if (!classDetails.year) {
      toast.error('Please select an Academic Year');
      return;
    }
    if (!classDetails.department) {
      toast.error('Please select a Department');
      return;
    }
    if (!classDetails.section) {
      toast.error('Please select a Section');
      return;
    }
    if (!file) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', classDetails.year);
      formData.append('department', classDetails.department);
      formData.append('section', classDetails.section);
      formData.append('classIncharge', classDetails.classIncharge);

      const res = await studentService.uploadStudents(formData);
      if (res.success) {
        setResult(res.data);
        setErrors(res.data.errors || []);
        if (res.data.imported > 0) {
          toast.success(`Successfully imported ${res.data.imported} students for Year ${classDetails.year} ${classDetails.department}-${classDetails.section}!`);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      if (err.errors) setErrors(err.errors);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const dept = classDetails.department || 'CSE';
    const yr = classDetails.year || '1';
    const sec = classDetails.section || 'A';
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

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setErrors([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Upload <span className="text-emerald-700">Absentees & Class Roster</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            Select class details and upload student spreadsheet (.xlsx, .xls) to register class roster or mark absentees
          </p>
        </div>

        <button onClick={handleDownloadTemplate} className="btn-mint font-bold">
          <FiDownload /> Download Sample Excel
        </button>
      </div>

      {/* Class Details Selector Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-mint-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FiDatabase className="text-emerald-700" size={18} />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
              Target Class & Section Details
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-mint-50 text-teal-800 border border-mint-200">
            {classDetails.year && classDetails.department && classDetails.section
              ? `Year ${classDetails.year} • ${classDetails.department} - ${classDetails.section}`
              : 'Select Class Details'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year Dropdown */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 block font-mono">
              Academic Year (1 - 4) *
            </label>
            <select
              value={classDetails.year}
              onChange={(e) => setClassDetails((prev) => ({ ...prev, year: e.target.value }))}
              className="input-field font-bold text-slate-900"
            >
              <option value="">Select Academic Year</option>
              <option value="1">1st Year (I Year)</option>
              <option value="2">2nd Year (II Year)</option>
              <option value="3">3rd Year (III Year)</option>
              <option value="4">4th Year (IV Year)</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 block font-mono">
              Department / Branch *
            </label>
            <select
              value={classDetails.department}
              onChange={(e) => setClassDetails((prev) => ({ ...prev, department: e.target.value }))}
              className="input-field font-bold text-slate-900"
            >
              <option value="">Select Department</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="IT">IT (Information Tech)</option>
              <option value="AIDS">AI & Data Science</option>
              <option value="AIML">AI & Machine Learning</option>
              <option value="ECE">ECE (Electronics & Comm)</option>
              <option value="EEE">EEE (Electrical & Electronics)</option>
              <option value="MECH">MECH (Mechanical Engg)</option>
              <option value="CIVIL">CIVIL (Civil Engg)</option>
            </select>
          </div>

          {/* Section Dropdown */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 block font-mono">
              Section (A, B, C, D) *
            </label>
            <select
              value={classDetails.section}
              onChange={(e) => setClassDetails((prev) => ({ ...prev, section: e.target.value }))}
              className="input-field font-bold text-slate-900"
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Class Incharge Name */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 block font-mono">
              Class Incharge / Faculty (Optional)
            </label>
            <input
              type="text"
              value={classDetails.classIncharge}
              onChange={(e) => setClassDetails((prev) => ({ ...prev, classIncharge: e.target.value }))}
              placeholder="e.g. Dr. K. Ramesh"
              className="input-field font-semibold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        {...getRootProps()}
        className={`bg-white rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 border-2 border-dashed relative overflow-hidden group shadow-sm ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.01]'
            : 'border-mint-300 hover:border-emerald-400 hover:bg-mint-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-2xl bg-mint-100 border border-mint-300 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-emerald-200 transition-all text-emerald-800 shadow-sm">
          <FiUpload size={28} />
        </div>

        {isDragActive ? (
          <div>
            <p className="text-emerald-800 font-extrabold text-lg font-display">
              Release to drop Excel file here...
            </p>
            <p className="text-slate-600 text-xs mt-1 font-semibold">Ready for automatic schema parsing</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-900 font-extrabold text-lg font-display">
              Drag & drop your student Excel file here
            </p>
            <p className="text-slate-600 text-xs font-medium">
              or <span className="text-teal-700 font-bold underline underline-offset-4">click to browse</span> from your computer (Max: 10MB)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] font-mono text-slate-700 font-bold">
              <span>Required Columns:</span>
              <span className="px-2.5 py-1 rounded-lg bg-mint-100 border border-mint-300 text-slate-900">
                Register Number
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-mint-100 border border-mint-300 text-slate-900">
                Student Name
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-mint-100 border border-mint-300 text-slate-900">
                Parent Mobile Number
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected File Card */}
      {file && (
        <div className="bg-white rounded-2xl p-4 border border-mint-300 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-mint-100 border border-mint-300 flex items-center justify-center text-teal-800">
              <FiFile size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 font-mono">{file.name}</p>
              <p className="text-xs text-slate-600 mt-0.5 font-semibold">
                {(file.size / 1024).toFixed(1)} KB • <span className="text-emerald-800 font-bold">{preview?.length || 0} student rows</span> identified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              className="btn-teal font-bold"
              disabled={uploading || !preview}
            >
              {uploading ? <FiLoader className="animate-spin" /> : <FiDatabase />}
              Import into Database
            </button>
            <button
              onClick={clearFile}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Remove file"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {preview && preview.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden border border-mint-200 shadow-sm">
          <div className="p-4 border-b border-mint-200 flex items-center justify-between bg-mint-50/70">
            <div className="flex items-center gap-2">
              <FiTable className="text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-900 font-display">
                Spreadsheet Preview ({preview.length} Rows)
              </h3>
            </div>
            <span className="text-xs text-slate-600 font-mono font-bold">
              Showing first {Math.min(50, preview.length)} entries
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left">
              <thead className="table-header sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th className="px-4 py-3">Register Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Parent Mobile Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans bg-white">
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-mint-50/50 transition">
                    <td className="px-4 py-2.5 text-xs text-center font-mono text-slate-500 font-bold">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono font-bold text-teal-800">
                      {row.registerNumber || <span className="text-rose-600 italic font-bold">Missing</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-extrabold text-slate-900">
                      {row.studentName || <span className="text-rose-600 italic font-bold">Missing</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono font-bold text-slate-800">
                      {row.parentMobile || <span className="text-rose-600 italic font-bold">Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Results Summary Pods */}
      {result && (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-300 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-emerald-700" size={20} />
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              Batch Import Completed
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <p className="text-3xl font-black font-mono text-emerald-800">{result.imported}</p>
              <p className="text-xs uppercase tracking-wider font-extrabold text-emerald-900 mt-1">
                Imported / Updated
              </p>
            </div>
            <div className="bg-mint-50 p-4 rounded-xl border border-mint-300 text-center">
              <p className="text-3xl font-black font-mono text-mint-900">{result.duplicates}</p>
              <p className="text-xs uppercase tracking-wider font-extrabold text-mint-900 mt-1">
                Duplicates Skipped
              </p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <p className="text-3xl font-black font-mono text-rose-800">{result.validationErrors}</p>
              <p className="text-xs uppercase tracking-wider font-extrabold text-rose-900 mt-1">
                Validation Errors
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Errors Callout */}
      {errors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-rose-300 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2 font-display">
            <FiAlertCircle size={18} /> Spreadsheet Row Validation Exceptions
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {errors.map((err, i) => (
              <div
                key={i}
                className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs flex items-center justify-between"
              >
                <span className="text-rose-900 font-mono font-bold">Row {err.row}:</span>
                <span className="text-slate-800 font-medium">{err.errors?.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentUpload;

