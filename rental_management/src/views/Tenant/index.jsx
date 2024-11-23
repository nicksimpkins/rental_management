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

        {/* Maintenance Requests Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Maintenance Requests</h2>
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
      </div>
    </div>
  );
};

export default TenantDashboard;