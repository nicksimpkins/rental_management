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

app.get('/api/landlord/:userId', authenticateToken, async (req, res) => {
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

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Landlord not found' });
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
      message: 'Error fetching landlord details' 
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