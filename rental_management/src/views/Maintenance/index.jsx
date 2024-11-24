import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

const MaintenanceDashboard = () => {
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        console.log('Fetching data for userId:', userId);
        
        const response = await axios.get(`http://localhost:3005/maintenance/${userId}`);
        console.log('Maintenance data response:', response.data);
        
        if (response.data.success) {
          setMaintenanceData(response.data.maintenancePerson);
        } else {
          setError(response.data.message || 'Failed to load maintenance data');
        }
      } catch (err) {
        console.error('Error fetching maintenance data:', err);
        setError('Failed to load maintenance data');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceData();
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
              <p className="font-medium">{maintenanceData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{maintenanceData?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{maintenanceData?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Availability</p>
              <p className="font-medium">{maintenanceData?.availability || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Skills and Certifications Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Skills & Certifications</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Skills</p>
              <p className="font-medium">{maintenanceData?.skills || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Certifications</p>
              <p className="font-medium">{maintenanceData?.certifications || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Request Statistics</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-800">
                  {maintenanceData?.stats?.totalRequests || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-800">
                  {maintenanceData?.stats?.completedRequests || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {maintenanceData?.stats?.inProgressRequests || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Pending</p>
                <p className="text-2xl font-bold text-red-800">
                  {maintenanceData?.stats?.pendingRequests || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Requests Card */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Assigned Maintenance Requests</h2>
          </div>
          <div className="px-6 py-4">
            {maintenanceData?.requests?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Description</th>
                      <th className="text-left py-3">Location</th>
                      <th className="text-left py-3">Tenant</th>
                      <th className="text-left py-3">Priority</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceData.requests.map((request) => (
                      <tr key={request.requestID} className="border-b">
                        <td className="py-3">{formatDate(request.submissionDate)}</td>
                        <td className="py-3">{request.description}</td>
                        <td className="py-3">
                          {request.propertyAddress}<br />
                          <span className="text-sm text-gray-500">Unit {request.unitNumber}</span>
                        </td>
                        <td className="py-3">{request.tenantName}</td>
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
              <p className="text-gray-500">No maintenance requests assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;