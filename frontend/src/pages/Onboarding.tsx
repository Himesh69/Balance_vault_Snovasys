import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import {
  FileText,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  ShieldCheck,
  User,
  Home,
  Briefcase
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    legalName: '',
    dateOfBirth: '',
    phoneNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    idType: 'Passport',
    idNumber: '',
    occupation: '',
    sourceOfFunds: '',
  });

  const [status, setStatus] = useState<string>('DRAFT');
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadOnboarding() {
      try {
        const data = await apiRequest('/onboarding');
        if (data) {
          setFormData({
            legalName: data.legalName || user?.fullName || '',
            dateOfBirth: data.dateOfBirth || '',
            phoneNumber: data.phoneNumber || '',
            streetAddress: data.streetAddress || '',
            city: data.city || '',
            state: data.state || '',
            postalCode: data.postalCode || '',
            country: data.country || '',
            idType: data.idType || 'Passport',
            idNumber: data.idNumber || '',
            occupation: data.occupation || '',
            sourceOfFunds: data.sourceOfFunds || '',
          });
          setStatus(data.status || 'DRAFT');
          setReviewNotes(data.reviewNotes || null);
        }
      } catch (err: any) {
        console.error('Failed to load onboarding:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOnboarding();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveDraft = async () => {
    setMessage(null);
    setSaving(true);
    try {
      await apiRequest('/onboarding', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setMessage({ type: 'success', text: 'Draft saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      // First save draft with current values
      await apiRequest('/onboarding', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      // Then trigger submit transition
      const updated = await apiRequest('/onboarding/submit', {
        method: 'POST',
      });

      setStatus(updated.status);
      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Your application has been submitted for administrative review!',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = status === 'SUBMITTED' || status === 'APPROVED';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500">Loading onboarding data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Identity Verification & Onboarding
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete your identity verification to unlock your primary account.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
            {status === 'DRAFT' && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1" />
                DRAFT
              </span>
            )}
            {status === 'SUBMITTED' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center animate-pulse">
                <Clock className="w-3.5 h-3.5 mr-1" />
                PENDING REVIEW
              </span>
            )}
            {status === 'APPROVED' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                APPROVED
              </span>
            )}
            {status === 'REJECTED' && (
              <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold flex items-center">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                REJECTED
              </span>
            )}
          </div>
        </div>

        {/* State Machine Flow Visualizer */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-semibold text-slate-500">
            <div className={`flex flex-col items-center ${status === 'DRAFT' ? 'text-emerald-600 font-bold' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${status === 'DRAFT' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
              <span>Draft</span>
            </div>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <div className={`flex flex-col items-center ${status === 'SUBMITTED' ? 'text-blue-600 font-bold' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${status === 'SUBMITTED' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
              <span>Submitted</span>
            </div>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <div className={`flex flex-col items-center ${status === 'APPROVED' ? 'text-emerald-600 font-bold' : status === 'REJECTED' ? 'text-rose-600 font-bold' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${status === 'APPROVED' ? 'bg-emerald-600 text-white' : status === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
              <span>{status === 'REJECTED' ? 'Revision Needed' : 'Approved'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Rejection notice if rejected */}
      {status === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900">Application Requires Changes</h4>
              <p className="text-sm text-rose-800 mt-1">
                Reason from Reviewer: <span className="font-semibold italic">"{reviewNotes || 'Please correct the information and re-submit.'}"</span>
              </p>
              <p className="text-xs text-rose-700 mt-2">
                You can edit the form below and click "Re-submit Application" to proceed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        {/* Section 1: Personal Details */}
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-4 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                name="legalName"
                required
                disabled={isReadOnly}
                value={formData.legalName}
                onChange={handleChange}
                placeholder="Johnathan Doe"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                required
                disabled={isReadOnly}
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                disabled={isReadOnly}
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Residential Address */}
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-4 pb-2 border-b border-slate-100">
            <Home className="w-5 h-5 text-blue-600" />
            <span>Residential Address</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="streetAddress"
                required
                disabled={isReadOnly}
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="100 Financial Way, Suite 400"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                required
                disabled={isReadOnly}
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                disabled={isReadOnly}
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                disabled={isReadOnly}
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="10001"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Country *
              </label>
              <input
                type="text"
                name="country"
                required
                disabled={isReadOnly}
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Identity & Funds */}
        <div>
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-4 pb-2 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <span>Government ID & Source of Funds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Government ID Type *
              </label>
              <select
                name="idType"
                disabled={isReadOnly}
                value={formData.idType}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 bg-white"
              >
                <option value="Passport">Passport</option>
                <option value="National ID">National ID Card</option>
                <option value="Driver's License">Driver's License</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ID Number *
              </label>
              <input
                type="text"
                name="idNumber"
                required
                disabled={isReadOnly}
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="P987654321"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Occupation *
              </label>
              <input
                type="text"
                name="occupation"
                required
                disabled={isReadOnly}
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Software Engineer"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Source of Funds *
              </label>
              <input
                type="text"
                name="sourceOfFunds"
                required
                disabled={isReadOnly}
                value={formData.sourceOfFunds}
                onChange={handleChange}
                placeholder="Employment Salary / Investment"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving || submitting}
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition flex items-center justify-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="submit"
              disabled={saving || submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center shadow-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting
                ? 'Submitting...'
                : status === 'REJECTED'
                ? 'Re-submit Application'
                : 'Submit for Review'}
            </button>
          </div>
        )}

        {isReadOnly && (
          <div className="text-center p-4 bg-slate-50 rounded-xl text-sm text-slate-500">
            {status === 'SUBMITTED'
              ? 'Application submitted. Modifications are locked while under review.'
              : 'Onboarding approved. Identity verified.'}
          </div>
        )}
      </form>
    </div>
  );
};

