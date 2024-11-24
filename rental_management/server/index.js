const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'admin',
  password: 'XXXX',
  database: 'PropertyManagementSystem',
  port: 3306
};

const pool = mysql.createPool(dbConfig);

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });

  try {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(`
        SELECT u.*, ut.typeName as userType 
        FROM User u 
        JOIN UserType ut ON u.userTypeID = ut.userTypeID 
        WHERE u.email = ? AND u.password = ?
      `, [email, password]);

      connection.release();
      console.log('Query result:', users); // Debug log

      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const user = users[0];
      const token = jwt.sign(
        {
          userId: user.userID,
          userType: user.userType,
          email: user.email
        },
        'your-secret-key',
        { expiresIn: '24h' }
      );

      console.log('Successful login for:', user.email); // Debug log
      
      res.json({
        success: true,
        token,
        user: {
          id: user.userID,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.get('/landlord/:userId', async (req, res) => {
  console.log('Fetching landlord data for userId:', req.params.userId); // Debug log
  
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          u.name,
          u.email,
          u.phone,
          l.landlordID,
          l.licenseNumber,
          l.companyName,
          l.taxID,
          COUNT(DISTINCT p.propertyID) as totalProperties,
          COUNT(DISTINCT u2.unitID) as totalUnits
        FROM User u
        JOIN Landlord l ON u.userID = l.userID
        LEFT JOIN Property p ON l.landlordID = p.ownerID
        LEFT JOIN Unit u2 ON p.propertyID = u2.propertyID
        WHERE u.userID = ?
        GROUP BY u.userID, l.landlordID
      `, [req.params.userId]);

      connection.release();
      console.log('Query result:', rows); // Debug log

      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Landlord not found' 
        });
      }

      res.json({
        success: true,
        landlord: rows[0]
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error fetching landlord details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching landlord details',
      error: error.message 
    });
  }
});

app.get('/tenant/:userId', async (req, res) => {
  console.log('Fetching tenant data for userId:', req.params.userId);
  
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT 
          u.name,
          u.email,
          u.phone,
          t.tenantID,
          t.contactDetails,
          t.leaseStatus,
          l.leaseID,
          l.startDate,
          l.endDate,
          l.rentAmount,
          l.securityDeposit,
          un.unitID,           -- Added unitID
          un.unitNumber,
          un.size,
          p.address,
          p.type as propertyType,
          GROUP_CONCAT(DISTINCT mr.description) as maintenanceRequests,
          GROUP_CONCAT(DISTINCT mr.status) as requestStatuses,
          COUNT(DISTINCT pay.paymentID) as totalPayments,
          SUM(CASE WHEN pay.status = 'Paid' THEN pay.amount ELSE 0 END) as totalPaidAmount
        FROM User u
        JOIN Tenant t ON u.userID = t.userID
        JOIN TenantUnit tu ON t.tenantID = tu.tenantID    -- Added TenantUnit join
        JOIN Unit un ON tu.unitID = un.unitID            -- Changed to join through TenantUnit
        LEFT JOIN Property p ON un.propertyID = p.propertyID
        LEFT JOIN Lease l ON t.tenantID = l.tenantID
        LEFT JOIN MaintenanceRequest mr ON t.tenantID = mr.tenantID
        LEFT JOIN Payment pay ON l.leaseID = pay.leaseID
        WHERE u.userID = ?
        GROUP BY u.userID, t.tenantID, l.leaseID, un.unitID
      `, [req.params.userId]);

      // Get recent payments
      const [payments] = await connection.execute(`
        SELECT 
          p.paymentID,
          p.paymentDate,
          p.amount,
          p.status
        FROM Payment p
        JOIN Lease l ON p.leaseID = l.leaseID
        JOIN Tenant t ON l.tenantID = t.tenantID
        JOIN User u ON t.userID = u.userID
        WHERE u.userID = ?
        ORDER BY p.paymentDate DESC
        LIMIT 5
      `, [req.params.userId]);

      // Get maintenance requests
      const [requests] = await connection.execute(`
        SELECT 
          mr.requestID,
          mr.description,
          mr.status,
          mr.priority,
          mr.submissionDate
        FROM MaintenanceRequest mr
        JOIN Tenant t ON mr.tenantID = t.tenantID
        JOIN User u ON t.userID = u.userID
        WHERE u.userID = ?
        ORDER BY mr.submissionDate DESC
        LIMIT 5
      `, [req.params.userId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Debug log to verify data
      console.log('Tenant data being sent:', {
        ...rows[0],
        recentPayments: payments,
        maintenanceRequests: requests
      });

      res.json({
        success: true,
        tenant: {
          ...rows[0],
          recentPayments: payments,
          maintenanceRequests: requests
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenant details',
      error: error.message
    });
  }
});

app.get('/maintenance/:userId', async (req, res) => {
  console.log('Fetching maintenance person data for userId:', req.params.userId);
  
  try {
    const connection = await pool.getConnection();
    try {
      // Get maintenance person details and assigned requests
      const [rows] = await connection.execute(`
        SELECT 
          u.name,
          u.email,
          u.phone,
          mp.maintenancePersonID,
          mp.skills,
          mp.certifications,
          mp.availability
        FROM User u
        JOIN MaintenancePerson mp ON u.userID = mp.userID
        WHERE u.userID = ?
      `, [req.params.userId]);

      if (rows.length === 0) {
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: 'Maintenance person not found' 
        });
      }

      // Get assigned maintenance requests
      const [requests] = await connection.execute(`
        SELECT 
          mr.requestID,
          mr.description,
          mr.status,
          mr.priority,
          mr.submissionDate,
          u.name as tenantName,
          p.address as propertyAddress,
          un.unitNumber
        FROM MaintenanceRequest mr
        JOIN Tenant t ON mr.tenantID = t.tenantID
        JOIN User u ON t.userID = u.userID
        JOIN UnitMaintenanceRequest umr ON mr.requestID = umr.requestID
        JOIN Unit un ON umr.unitID = un.unitID
        JOIN Property p ON un.propertyID = p.propertyID
        WHERE mr.maintenancePersonID = ?
        ORDER BY 
          CASE 
            WHEN mr.status = 'Pending' THEN 1
            WHEN mr.status = 'In Progress' THEN 2
            ELSE 3
          END,
          CASE 
            WHEN mr.priority = 'High' THEN 1
            WHEN mr.priority = 'Medium' THEN 2
            ELSE 3
          END,
          mr.submissionDate DESC
      `, [rows[0].maintenancePersonID]);

      // Get completed requests stats
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as totalRequests,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedRequests,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgressRequests,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pendingRequests
        FROM MaintenanceRequest
        WHERE maintenancePersonID = ?
      `, [rows[0].maintenancePersonID]);

      connection.release();

      res.json({
        success: true,
        maintenancePerson: {
          ...rows[0],
          requests,
          stats: stats[0]
        }
      });

    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error fetching maintenance person details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching maintenance person details',
      error: error.message 
    });
  }
});

app.post('/maintenance-request', async (req, res) => {
  console.log('Received request body:', req.body);
  const { tenantId, description, priority, unitId } = req.body;

  // Validate required fields
  if (!tenantId || !description || !priority || !unitId) {
    console.error('Missing required fields:', { tenantId, description, priority, unitId });
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      receivedData: { tenantId, description, priority, unitId }
    });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert maintenance request
      const [result] = await connection.execute(`
        INSERT INTO MaintenanceRequest 
        (tenantID, description, status, priority, submissionDate) 
        VALUES (?, ?, 'Pending', ?, CURDATE())
      `, [tenantId, description, priority]);

      const requestId = result.insertId;
      console.log('Created request with ID:', requestId);

      // Insert into UnitMaintenanceRequest with explicit column specification
      const [unitResult] = await connection.execute(`
        INSERT INTO UnitMaintenanceRequest 
        (unitID, requestID) 
        VALUES (?, ?)
      `, [unitId, requestId]);

      console.log('Created UnitMaintenanceRequest with ID:', unitResult.insertId);

      // Get the created request details
      const [requests] = await connection.execute(`
        SELECT 
          mr.requestID,
          mr.description,
          mr.status,
          mr.priority,
          mr.submissionDate,
          umr.unitMaintenanceRequestID
        FROM MaintenanceRequest mr
        JOIN UnitMaintenanceRequest umr ON mr.requestID = umr.requestID
        WHERE mr.requestID = ?
      `, [requestId]);

      await connection.commit();
      connection.release();

      console.log('Successfully created maintenance request:', requests[0]);
      res.json({
        success: true,
        request: requests[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance request',
      error: error.message
    });
  }
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Test database connection
  pool.getConnection()
    .then(connection => {
      console.log('Database connected successfully');
      connection.release();
    })
    .catch(err => {
      console.error('Database connection failed:', err);
    });
});