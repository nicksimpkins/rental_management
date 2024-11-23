import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LandlordDashboard = () => {
  const [landlordData, setLandlordData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLandlordData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        console.log('Fetching data for userId:', userId); // Debug log
        
        const response = await axios.get(`http://localhost:3005/landlord/${userId}`);
        console.log('Landlord data response:', response.data); // Debug log
        
        if (response.data.success) {
          setLandlordData(response.data.landlord);
        } else {
          setError(response.data.message || 'Failed to load landlord data');
        }
      } catch (err) {
        console.error('Error fetching landlord data:', err);
        setError('Failed to load landlord data');
      } finally {
        setLoading(false);
      }
    };

    fetchLandlordData();
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
          </div>

          {/* Personal Information */}
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{landlordData?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{landlordData?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{landlordData?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium">{landlordData?.licenseNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{landlordData?.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax ID</p>
                <p className="font-medium">{landlordData?.taxID || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Property Overview */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Property Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Properties</p>
                <p className="text-2xl font-bold text-blue-800">
                  {landlordData?.totalProperties || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Units</p>
                <p className="text-2xl font-bold text-green-800">
                  {landlordData?.totalUnits || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;