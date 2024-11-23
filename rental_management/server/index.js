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
        LEFT JOIN Lease l ON t.tenantID = l.tenantID
        LEFT JOIN Unit un ON l.unitID = un.unitID
        LEFT JOIN Property p ON un.propertyID = p.propertyID
        LEFT JOIN MaintenanceRequest mr ON t.tenantID = mr.tenantID
        LEFT JOIN Payment pay ON l.leaseID = pay.leaseID
        WHERE u.userID = ?
        GROUP BY u.userID, t.tenantID, l.leaseID
      `, [req.params.userId]);

      connection.release();
      console.log('Query result:', rows);

      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tenant not found' 
        });
      }

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