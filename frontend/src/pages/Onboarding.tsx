import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiRequest } from '../lib/api.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Panel } from '../components/ui/Panel.js';
import { Banner } from '../components/ui/Banner.js';
import { Stepper } from '../components/ui/Stepper.js';
import { DefinitionList } from '../components/ui/DefinitionList.js';

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
    idType: 'PASSPORT',
    idNumber: '',
    occupation: '',
    sourceOfFunds: '',
  });

  const [status, setStatus] = useState<string>('DRAFT');
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const steps = [
    { id: 'identity', title: 'Personal Identity', description: 'Legal name, birth date, contact' },
    { id: 'residence', title: 'Residential Address', description: 'Street, city, country of residence' },
    { id: 'regulatory', title: 'Regulatory Profile', description: 'Government ID & source of funds' },
  ];

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
            idType: data.idType || 'PASSPORT',
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
      setMessage({ type: 'success', text: 'Draft details saved successfully.' });
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
      // First save current draft to ensure all values are up to date
      await apiRequest('/onboarding', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      // Submit
      const updated = await apiRequest('/onboarding/submit', {
        method: 'POST',
      });
      setStatus(updated.status);
      await refreshUser();
      setMessage({
        type: 'success',
        text: 'Onboarding application submitted for administrator review.',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 text-left">
        <div className="h-8 w-48 bg-paper-sunk rounded-[2px] animate-pulse" />
        <div className="h-64 w-full bg-paper-sunk rounded-[2px] animate-pulse" />
      </div>
    );
  }

  // Final State: Submitted for review (PRD §7.2)
  if (status === 'SUBMITTED') {
    return (
      <div className="max-w-[640px] space-y-6 text-left">
        <div className="pb-4 border-b border-rule flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
              Application Under Review
            </h1>
            <p className="text-[13px] text-ink-soft mt-1">
              Your onboarding dossier has been locked and queued for administrator verification.
            </p>
          </div>
          <Badge variant="brass">PENDING REVIEW</Badge>
        </div>

        {message && (
          <Banner
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Ruled summary list (label ... value) of what was submitted per spec §7.2 */}
        <Panel hasDocumentHeader title="Submitted Dossier Summary">
          <DefinitionList
            items={[
              { label: 'Legal Name', value: formData.legalName },
              { label: 'Date of Birth', value: formData.dateOfBirth, isMono: true },
              { label: 'Phone Number', value: formData.phoneNumber, isMono: true },
              { label: 'Residential Address', value: `${formData.streetAddress}, ${formData.city}, ${formData.country}` },
              { label: 'Document Type', value: formData.idType, isMono: true },
              { label: 'Document Number', value: formData.idNumber, isMono: true },
              { label: 'Occupation', value: formData.occupation },
              { label: 'Source of Funds', value: formData.sourceOfFunds },
              { label: 'Current Status', value: 'SUBMITTED (Awaiting Admin Decision)' },
            ]}
          />
        </Panel>

        <p className="text-xs font-mono text-ink-faint">
          Audit Reference: Changes are disallowed while review is pending.
        </p>
      </div>
    );
  }

  // Approved State
  if (status === 'APPROVED') {
    return (
      <div className="max-w-[640px] space-y-6 text-left">
        <div className="pb-4 border-b border-rule flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
              Verification Approved
            </h1>
            <p className="text-[13px] text-ink-soft mt-1">
              Your account has been fully verified and primary double-entry accounts provisioned.
            </p>
          </div>
          <Badge variant="green">APPROVED</Badge>
        </div>

        <Panel hasDocumentHeader title="Verified Record">
          <DefinitionList
            items={[
              { label: 'Account Holder', value: formData.legalName },
              { label: 'Identification Ref', value: formData.idNumber, isMono: true },
              { label: 'Occupation', value: formData.occupation },
              { label: 'Verification Status', value: 'VERIFIED & ACTIVE' },
            ]}
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="pb-4 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] leading-[38px] font-medium text-ink">
            Onboarding Verification
          </h1>
          <p className="text-[13px] text-ink-soft mt-1">
            Complete the identity dossier to provision your account and ledger.
          </p>
        </div>
        <Badge variant={status === 'REJECTED' ? 'oxblood' : 'brass'}>
          {status}
        </Badge>
      </div>

      {/* Rejected State: Oxblood banner with reason (§7.2) */}
      {status === 'REJECTED' && (
        <Banner
          type="error"
          title="Application Requires Revision"
          message={
            <span>
              Administrator notes: "{reviewNotes || 'Please revise your details and resubmit.'}". You may edit the fields below and submit again.
            </span>
          }
        />
      )}

      {message && (
        <Banner
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Layout: Vertical Stepper on Left + Form Content on Right max 560px per §7.2 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Stepper */}
        <div className="md:col-span-4 bg-paper-raised border border-rule p-4 rounded-[2px]">
          <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-soft font-semibold block mb-3">
            Application Progress
          </span>
          <Stepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onSelectStep={(idx) => setCurrentStepIndex(idx)}
          />
        </div>

        {/* Right Form Panel (Max 560px) */}
        <div className="md:col-span-8 max-w-[560px]">
          <Panel hasDocumentHeader className="shadow-none">
            {/* Step 1: Personal Identity */}
            {currentStepIndex === 0 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-rule">
                  <h2 className="font-serif text-xl font-medium text-ink">
                    Personal Identity
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Enter your legal name and primary contact details as recorded on official documents.
                  </p>
                </div>

                <Input
                  label="Legal Full Name"
                  name="legalName"
                  required
                  value={formData.legalName}
                  onChange={handleChange}
                  placeholder="e.g. Jane Maria Doe"
                />

                <Input
                  label="Date of Birth (YYYY-MM-DD)"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />

                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 (555) 012-3456"
                />

                <div className="pt-4 flex items-center justify-between border-t border-rule">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveDraft}
                    loading={saving}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setCurrentStepIndex(1)}
                  >
                    Next: Residence →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Residence */}
            {currentStepIndex === 1 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-rule">
                  <h2 className="font-serif text-xl font-medium text-ink">
                    Residential Address
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Physical residential address for regulatory compliance.
                  </p>
                </div>

                <Input
                  label="Street Address"
                  name="streetAddress"
                  required
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="123 Financial District Way"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                  />
                  <Input
                    label="State / Province"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="NY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Postal Code"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="10005"
                  />
                  <Input
                    label="Country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="United States"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-rule">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCurrentStepIndex(0)}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSaveDraft}
                      loading={saving}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setCurrentStepIndex(2)}
                    >
                      Next: Profile →
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Regulatory & Financial Profile */}
            {currentStepIndex === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="pb-3 border-b border-rule">
                  <h2 className="font-serif text-xl font-medium text-ink">
                    Regulatory Profile & Submission
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Identification details required to satisfy anti-money laundering regulations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5 select-none">
                      Identification Type
                    </label>
                    <select
                      name="idType"
                      value={formData.idType}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-paper-raised border border-rule text-sm rounded-[2px] focus:outline-none focus:border-green"
                    >
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                      <option value="NATIONAL_ID">National ID</option>
                    </select>
                  </div>

                  <Input
                    label="ID Number"
                    name="idNumber"
                    required
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="e.g. A12345678"
                  />
                </div>

                <Input
                  label="Occupation"
                  name="occupation"
                  required
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Certified Accountant, Engineer"
                />

                <Input
                  label="Source of Funds"
                  name="sourceOfFunds"
                  required
                  value={formData.sourceOfFunds}
                  onChange={handleChange}
                  placeholder="e.g. Employment Salary, Business Revenue"
                />

                <div className="pt-4 flex items-center justify-between border-t border-rule">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCurrentStepIndex(1)}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSaveDraft}
                      loading={saving}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={submitting}
                    >
                      Submit for Review
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
