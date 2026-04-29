// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Register.css';

const API = 'https://bus-project-i6od.onrender.com/api'

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  
  const [studentFields, setStudentFields] = useState({
    studentIdCard: null,
    studentIdCardPreview: null,
    studentIdCardName: '',
    studentIdNumber: '',
    department: '',
    semester: '',
    enrollmentYear: ''
  });
  
  const [driverFields, setDriverFields] = useState({
    driverLicense: null,
    driverLicensePreview: null,
    driverLicenseName: '',
    licenseNumber: '',
    experience: '',
    vehicleType: '',
    phoneNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle student field changes
  const handleStudentFieldChange = (e) => {
    const { name, value } = e.target;
    setStudentFields(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle driver field changes
  const handleDriverFieldChange = (e) => {
    const { name, value } = e.target;
    setDriverFields(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle Student ID Card Upload
  const handleStudentIdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, studentIdCard: 'Please upload JPEG, PNG, JPG, or PDF file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, studentIdCard: 'File size should be less than 5MB' }));
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setStudentFields(prev => ({
        ...prev,
        studentIdCard: file,
        studentIdCardPreview: previewUrl,
        studentIdCardName: file.name
      }));
      setErrors(prev => ({ ...prev, studentIdCard: '' }));
    }
  };

  // Handle Driver License Upload
  const handleDriverLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, driverLicense: 'Please upload JPEG, PNG, or JPG file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, driverLicense: 'File size should be less than 5MB' }));
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setDriverFields(prev => ({
        ...prev,
        driverLicense: file,
        driverLicensePreview: previewUrl,
        driverLicenseName: file.name
      }));
      setErrors(prev => ({ ...prev, driverLicense: '' }));
    }
  };

  // Remove uploaded files
  const removeStudentIdPreview = () => {
    setStudentFields(prev => ({
      ...prev,
      studentIdCard: null,
      studentIdCardPreview: null,
      studentIdCardName: ''
    }));
  };

  const removeDriverLicensePreview = () => {
    setDriverFields(prev => ({
      ...prev,
      driverLicense: null,
      driverLicensePreview: null,
      driverLicenseName: ''
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Common validations
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Student specific validations
    if (formData.role === 'student') {
      if (!studentFields.studentIdCard) {
        newErrors.studentIdCard = 'Student ID card is required';
      }
      if (!studentFields.studentIdNumber) {
        newErrors.studentIdNumber = 'Student ID number is required';
      }
      if (!studentFields.department) {
        newErrors.department = 'Department is required';
      }
      if (!studentFields.semester) {
        newErrors.semester = 'Semester is required';
      }
    }
    
    // Driver specific validations
    if (formData.role === 'driver') {
      if (!driverFields.driverLicense) {
        newErrors.driverLicense = 'Driver license is required';
      }
      if (!driverFields.licenseNumber) {
        newErrors.licenseNumber = 'License number is required';
      }
      if (!driverFields.experience) {
        newErrors.experience = 'Years of experience is required';
      }
      if (!driverFields.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^\d{10}$/.test(driverFields.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Map 'student' role to 'passenger' for the backend
    const backendRole = formData.role === 'student' ? 'passenger' : formData.role;

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: backendRole,
    };

    // Add student-specific fields to payload
    if (formData.role === 'student') {
      payload.phone = '';
      payload.rollNumber = studentFields.studentIdNumber;
      payload.department = studentFields.department;
      payload.year = studentFields.semester ? Math.ceil(parseInt(studentFields.semester) / 2) : null;
      payload.semester = studentFields.semester;
      payload.enrollmentYear = studentFields.enrollmentYear;
    }

    // Add driver-specific fields
    if (formData.role === 'driver') {
      payload.phone = driverFields.phoneNumber;
      payload.licenseNumber = driverFields.licenseNumber;
      payload.experience = parseInt(driverFields.experience) || 0;
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(prev => ({ ...prev, email: data.error || 'Registration failed.' }));
        return;
      }

      // Save session and redirect based on role
      setAuth(data.user, data.token);
      setRegistrationSuccess(true);

      setTimeout(() => {
        const role = data.user.role;
        if (role === 'driver') navigate('/driver', { replace: true });
        else if (role === 'admin') navigate('/admin', { replace: true });
        else navigate('/passenger', { replace: true });
      }, 1500);

    } catch (err) {
      setErrors(prev => ({ ...prev, email: 'Cannot connect to server. Make sure the backend is running on port 3001.' }));
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="logo">
              <i className="bi bi-bus-front"></i>
              
            </div>
            <h4>Create Account</h4>
            <p>Join the Real-Time Bus Tracking System</p>
          </div>

          {/* Success Message */}
          {registrationSuccess && (
            <div className="success-alert">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <strong>Registration Successful!</strong>
                <p>Your account has been created. You can now login.</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {/* Name Field */}
            <div className="form-group">
              <label>
                <i className="bi bi-person"></i>
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className={errors.name ? 'error' : ''}
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label>
                <i className="bi bi-envelope"></i>
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={errors.email ? 'error' : ''}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label>
                <i className="bi bi-person-badge"></i>
                Register As <span className="required">*</span>
              </label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${formData.role === 'student' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                >
                  <i className="bi bi-mortarboard"></i>
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${formData.role === 'driver' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'driver' }))}
                >
                  <i className="bi bi-truck"></i>
                  <span>Driver</span>
                </button>
              </div>
            </div>

            {/* Student Specific Fields */}
            {formData.role === 'student' && (
              <div className="dynamic-fields">
                <div className="section-title">
                  <i className="bi bi-mortarboard"></i>
                  <span>Student Information</span>
                </div>

                {/* Student ID Card Upload */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-card-image"></i>
                    Student ID Card <span className="required">*</span>
                  </label>
                  <div className="file-upload-area">
                    {!studentFields.studentIdCardPreview ? (
                      <>
                        <input
                          type="file"
                          id="studentIdCard"
                          accept="image/*,.pdf"
                          onChange={handleStudentIdUpload}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="studentIdCard" className="upload-label">
                          <i className="bi bi-cloud-upload"></i>
                          <p>Click to upload ID card</p>
                          <small>JPEG, PNG, JPG, PDF (Max 5MB)</small>
                        </label>
                      </>
                    ) : (
                      <div className="file-preview">
                        {studentFields.studentIdCardPreview && (
                          studentFields.studentIdCard?.type === 'application/pdf' ? (
                            <div className="pdf-preview">
                              <i className="bi bi-file-pdf"></i>
                              <span>{studentFields.studentIdCardName}</span>
                            </div>
                          ) : (
                            <img 
                              src={studentFields.studentIdCardPreview} 
                              alt="Student ID Card"
                            />
                          )
                        )}
                        <button
                          type="button"
                          className="remove-file"
                          onClick={removeStudentIdPreview}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.studentIdCard && <span className="error-message">{errors.studentIdCard}</span>}
                </div>

                {/* Student ID Number */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-card-text"></i>
                    Student ID Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentIdNumber"
                    className={errors.studentIdNumber ? 'error' : ''}
                    value={studentFields.studentIdNumber}
                    onChange={handleStudentFieldChange}
                    placeholder="e.g., STU-2024-001"
                  />
                  {errors.studentIdNumber && <span className="error-message">{errors.studentIdNumber}</span>}
                </div>

                {/* Department */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-building"></i>
                    Department <span className="required">*</span>
                  </label>
                  <select
                    name="department"
                    className={errors.department ? 'error' : ''}
                    value={studentFields.department}
                    onChange={handleStudentFieldChange}
                  >
                    <option value="">Select Department</option>
                    <option value="computer">Computer Science</option>
                    <option value="electronics">Electronics Engineering</option>
                    <option value="mechanical">Mechanical Engineering</option>
                    <option value="civil">Civil Engineering</option>
                    <option value="business">Business Administration</option>
                    <option value="arts">Arts & Humanities</option>
                  </select>
                  {errors.department && <span className="error-message">{errors.department}</span>}
                </div>

                {/* Semester */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-book"></i>
                    Semester <span className="required">*</span>
                  </label>
                  <select
                    name="semester"
                    className={errors.semester ? 'error' : ''}
                    value={studentFields.semester}
                    onChange={handleStudentFieldChange}
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                  </select>
                  {errors.semester && <span className="error-message">{errors.semester}</span>}
                </div>

                {/* Enrollment Year */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-calendar"></i>
                    Enrollment Year
                  </label>
                  <select
                    name="enrollmentYear"
                    value={studentFields.enrollmentYear}
                    onChange={handleStudentFieldChange}
                  >
                    <option value="">Select Year</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                  </select>
                </div>
              </div>
            )}

            {/* Driver Specific Fields */}
            {formData.role === 'driver' && (
              <div className="dynamic-fields">
                <div className="section-title">
                  <i className="bi bi-truck"></i>
                  <span>Driver Information</span>
                </div>

                {/* Driver License Upload */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-credit-card"></i>
                    Driver License <span className="required">*</span>
                  </label>
                  <div className="file-upload-area">
                    {!driverFields.driverLicensePreview ? (
                      <>
                        <input
                          type="file"
                          id="driverLicense"
                          accept="image/*"
                          onChange={handleDriverLicenseUpload}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="driverLicense" className="upload-label">
                          <i className="bi bi-cloud-upload"></i>
                          <p>Click to upload driver license</p>
                          <small>JPEG, PNG, JPG (Max 5MB)</small>
                        </label>
                      </>
                    ) : (
                      <div className="file-preview">
                        <img 
                          src={driverFields.driverLicensePreview} 
                          alt="Driver License"
                        />
                        <button
                          type="button"
                          className="remove-file"
                          onClick={removeDriverLicensePreview}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.driverLicense && <span className="error-message">{errors.driverLicense}</span>}
                </div>

                {/* License Number */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-card-text"></i>
                    License Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    className={errors.licenseNumber ? 'error' : ''}
                    value={driverFields.licenseNumber}
                    onChange={handleDriverFieldChange}
                    placeholder="e.g., DL-1234567890"
                  />
                  {errors.licenseNumber && <span className="error-message">{errors.licenseNumber}</span>}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-telephone"></i>
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className={errors.phoneNumber ? 'error' : ''}
                    value={driverFields.phoneNumber}
                    onChange={handleDriverFieldChange}
                    placeholder="10-digit mobile number"
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>

                {/* Years of Experience */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-clock-history"></i>
                    Years of Experience <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="experience"
                    className={errors.experience ? 'error' : ''}
                    value={driverFields.experience}
                    onChange={handleDriverFieldChange}
                    placeholder="Years of driving experience"
                    min="0"
                    max="50"
                  />
                  {errors.experience && <span className="error-message">{errors.experience}</span>}
                </div>

                {/* Vehicle Type */}
                <div className="form-group">
                  <label>
                    <i className="bi bi-bus-front"></i>
                    Preferred Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={driverFields.vehicleType}
                    onChange={handleDriverFieldChange}
                  >
                    <option value="">Select Vehicle Type</option>
                    <option value="standard">Standard Bus (40 seats)</option>
                    <option value="mini">Mini Bus (25 seats)</option>
                    <option value="electric">Electric Bus</option>
                    <option value="luxury">Luxury Coach</option>
                  </select>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="form-group">
              <label>
                <i className="bi bi-lock"></i>
                Password <span className="required">*</span>
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={errors.password ? 'error' : ''}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min 6 characters)"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>
                <i className="bi bi-lock-fill"></i>
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={errors.confirmPassword ? 'error' : ''}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`bi bi-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* Terms and Conditions */}
            <div className="terms">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a></span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="register-btn">
              <i className="bi bi-person-plus"></i>
              Create Account
            </button>

            {/* Login Link */}
            <div className="login-link">
              <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;