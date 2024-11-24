import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  const num = parseFloat(amount);
  return !isNaN(num) ? `$${num.toFixed(2)}` : 'N/A';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

const TenantDashboard = () => {
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    description: '',
    priority: 'Low',
    error: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        console.log('Fetching data for userId:', userId);
        
        const response = await axios.get(`http://localhost:3005/tenant/${userId}`);
        console.log('Tenant data response:', response.data);
        
        if (response.data.success) {
          setTenantData(response.data.tenant);
        } else {
          setError(response.data.message || 'Failed to load tenant data');
        }
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        setError('Failed to load tenant data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setNewRequest(prev => ({ ...prev, error: '' }));
  
    // Debug log to check tenantData
    console.log('Current tenant data:', tenantData);
  
    // Validate required data
    if (!tenantData?.tenantID) {
      console.error('No tenant ID found');
      setNewRequest(prev => ({
        ...prev,
        error: 'Unable to submit request: Missing tenant information'
      }));
      setSubmitLoading(false);
      return;
    }
  
    const requestData = {
      tenantId: tenantData.tenantID,
      description: newRequest.description,
      priority: newRequest.priority,
      unitId: tenantData.unitID
    };
  
    // Debug log the request data
    console.log('Submitting request with data:', requestData);
  
    try {
      const response = await axios.post('http://localhost:3005/maintenance-request', requestData);
  
      console.log('Server response:', response.data);
  
      if (response.data.success) {
        // Add the new request to the existing requests
        const updatedRequests = [
          response.data.request,
          ...(tenantData.maintenanceRequests || [])
        ];
        setTenantData(prev => ({
          ...prev,
          maintenanceRequests: updatedRequests
        }));
        setIsModalOpen(false);
        setNewRequest({ description: '', priority: 'Low', error: '' });
      }
    } catch (err) {
      console.error('Error submitting request:', err.response?.data || err);
      setNewRequest(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to submit request. Please try again.'
      }));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Personal Information Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{tenantData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{tenantData?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{tenantData?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              <p className="font-medium">{tenantData?.contactDetails || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Lease Information Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Lease Information</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Property Address</p>
              <p className="font-medium">{tenantData?.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit Number</p>
              <p className="font-medium">{tenantData?.unitNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lease Status</p>
              <p className="font-medium">{tenantData?.leaseStatus || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="font-medium">{formatCurrency(tenantData?.rentAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lease Start Date</p>
              <p className="font-medium">{formatDate(tenantData?.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lease End Date</p>
              <p className="font-medium">{formatDate(tenantData?.endDate)}</p>
            </div>
          </div>
        </div>

        {/* Maintenance Requests Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Maintenance Requests</h2>
            <button
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit New Request
            </button>
          </div>
          <div className="px-6 py-4">
            {tenantData?.maintenanceRequests?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Description</th>
                      <th className="text-left py-3">Priority</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantData.maintenanceRequests.map((request) => (
                      <tr key={request.requestID} className="border-b">
                        <td className="py-3">{formatDate(request.submissionDate)}</td>
                        <td className="py-3">{request.description}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${request.priority === 'High' ? 'bg-red-100 text-red-800' : 
                             request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                             'bg-green-100 text-green-800'}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${request.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                             request.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                             'bg-yellow-100 text-yellow-800'}`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No maintenance requests</p>
            )}
          </div>
        </div>

        {/* Recent Payments Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Payments</h2>
          </div>
          <div className="px-6 py-4">
            {tenantData?.recentPayments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Amount</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantData.recentPayments.map((payment) => (
                      <tr key={payment.paymentID} className="border-b">
                        <td className="py-3">{formatDate(payment.paymentDate)}</td>
                        <td className="py-3">{formatCurrency(payment.amount)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                             payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                             'bg-red-100 text-red-800'}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No recent payments</p>
            )}
          </div>
        </div>

        {/* Maintenance Request Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Submit Maintenance Request</h3>
              </div>
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="4"
                    placeholder="Describe the issue..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest(prev => ({
                      ...prev,
                      priority: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {newRequest.error && (
                  <div className="text-red-500 text-sm">{newRequest.error}</div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {submitLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;