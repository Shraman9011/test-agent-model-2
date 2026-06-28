import React, { useState, useEffect, useCallback } from 'react';
import { getLeavePolicies, updateLeavePolicy } from '../api/client';
import { RetroactiveUpdateModal } from '../components/RetroactiveUpdateModal';
import { Settings, Save } from 'lucide-react';
import { Toast, ToastType } from '../components/Toast';

interface LeavePolicy {
  id: number;
  leave_type: number;
  leave_type_name: string;
  default_annual_days: string;
  is_active: boolean;
}

export function PolicyConfiguration(): React.JSX.Element {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for editing inputs
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [savingPolicyId, setSavingPolicyId] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await getLeavePolicies();
      const responseObj = response as { data?: LeavePolicy[]; results?: LeavePolicy[] };
      const data = Array.isArray(response) ? response : responseObj.data || responseObj.results || [];
      setPolicies(data);
      
      // Initialize edits state
      const initialEdits: Record<number, string> = {};
      data.forEach((p: LeavePolicy) => {
        initialEdits[p.id] = p.default_annual_days;
      });
      setEdits(initialEdits);
    } catch (error) {
      console.error('Failed to load leave policies', error);
      setToast({ message: 'Failed to load policies.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleEditChange = (id: number, value: string): void => {
    setEdits(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveClick = (policy: LeavePolicy): void => {
    if (edits[policy.id] === policy.default_annual_days) {
      setToast({ message: 'No changes made to this policy.', type: 'info' });
      return;
    }
    
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  const handleModalConfirm = async (applyRetroactively: boolean): Promise<void> => {
    if (!selectedPolicy) return;
    
    setIsModalOpen(false);
    setSavingPolicyId(selectedPolicy.id);
    
    try {
      await updateLeavePolicy(selectedPolicy.id, {
        default_annual_days: parseFloat(edits[selectedPolicy.id]),
        apply_retroactively: applyRetroactively
      });
      
      setToast({ message: 'Policy updated successfully.', type: 'success' });
      fetchPolicies();
    } catch (error) {
      console.error('Failed to update policy', error);
      setToast({ message: 'Failed to update policy.', type: 'error' });
    } finally {
      setSavingPolicyId(null);
      setSelectedPolicy(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-indigo-500" />
            System Policy Configuration
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure system-wide defaults for different leave types.
          </p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Leave Policies</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update the default annual days given to employees for each leave type.
          </p>
        </div>
        
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default Days (Annual)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {policies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                          No leave policies configured.
                        </td>
                      </tr>
                    ) : (
                      policies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {policy.leave_type_name || `Type ID: ${policy.leave_type}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {policy.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative rounded-md shadow-sm w-32">
                              <input
                                type="number"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 pl-3 pr-2"
                                value={edits[policy.id] || ''}
                                onChange={(e) => handleEditChange(policy.id, e.target.value)}
                                step="0.5"
                                min="0"
                                disabled={savingPolicyId === policy.id}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleSaveClick(policy)}
                              disabled={savingPolicyId === policy.id || edits[policy.id] === policy.default_annual_days}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Save className="h-4 w-4 mr-1.5" />
                              {savingPolicyId === policy.id ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPolicy && (
        <RetroactiveUpdateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPolicy(null);
          }}
          onConfirm={handleModalConfirm}
          leaveTypeName={selectedPolicy.leave_type_name || `Type ID: ${selectedPolicy.leave_type}`}
          newDays={parseFloat(edits[selectedPolicy.id] || '0')}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
