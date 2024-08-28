const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

// MySQL Connection Setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// Add School API
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  
  // Input validation
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  
  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding school.' });
    }
    res.status(201).json({ message: 'School added successfully.', schoolId: result.insertId });
  });
});
app.get('/',(req,res)=>{
    res.send("Api is running")
})
// List Schools API
app.get('/listSchools', (req, res) => {
  const { userLatitude, userLongitude } = req.query;
  
  if (!userLatitude || !userLongitude) {
    return res.status(400).json({ message: 'User latitude and longitude are required.' });
  }
  
  const query = 'SELECT id, name, address, latitude, longitude FROM schools';
  db.query(query, (err, schools) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching schools.' });
    }
    
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const toRad = (value) => (value * Math.PI) / 180;
      const R = 6371; // Radius of the Earth in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    
    // Sort schools by distance
    const sortedSchools = schools.map((school) => ({
      ...school,
      distance: calculateDistance(
        parseFloat(userLatitude),
        parseFloat(userLongitude),
        school.latitude,
        school.longitude
      ),
    })).sort((a, b) => a.distance - b.distance);
    
    res.json(sortedSchools);
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
