import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Create database connection with absolute path
const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Initialize the database with a table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

db.exec(`
  INSERT OR IGNORE INTO users (email, password)
  SELECT 'admin@arctic-geese.com', 'password@123'
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@arctic-geese.com'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    camera TEXT NOT NULL,
    zone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Query Functions
const queries = {

  getAllUsers: db.prepare(`
    SELECT * FROM users 
  `),
  getLoginInfo: db.prepare(`
    SELECT * FROM users 
    WHERE email  = ?
    AND password = ?
  `),
  // Insert new violation
  insertViolation: db.prepare(`
    INSERT INTO violations (image, date, time, camera, zone)
    VALUES (?, ?, ?, ?, ?)
  `),

  // Get all violations
  getAllViolations: db.prepare(`
    SELECT * FROM violations 
    ORDER BY date DESC, time DESC
  `),

  getLast5Violations: db.prepare(`
    SELECT * FROM violations 
    ORDER BY date DESC, 
             CASE 
                 WHEN substr(time, -2) = 'PM' AND substr(time, 1, 2) != '12' 
                 THEN printf('%02d:%02d', 
                     (CAST(substr(time, 1, 2) AS INTEGER) + 12) % 24, 
                     CAST(substr(time, 4, 2) AS INTEGER)
                 )
                 WHEN substr(time, -2) = 'AM' AND substr(time, 1, 2) = '12' 
                 THEN '00:00'
                 ELSE time
             END DESC
    LIMIT 5
  `),



  // Get violations by specific date
  getViolationsByDate: db.prepare(`
    SELECT * FROM violations 
    WHERE date = ? 
    ORDER BY time DESC
  `),

  getViolationsCountByDate: db.prepare(`
    SELECT COUNT(*) AS TotalViolations
    FROM violations 
    WHERE date = ? 
    ORDER BY time DESC
  `),

  // Get violations by camera
  getViolationsByCamera: db.prepare(`
    SELECT * FROM violations 
    WHERE camera = ? 
    ORDER BY date DESC, time DESC
  `),

  // Get violations by date range
  getViolationsByDateRange: db.prepare(`
    SELECT * FROM violations 
    WHERE date BETWEEN ? AND ? 
    ORDER BY date ASC, time ASC
  `),

  getViolationsCountByDateRange: db.prepare(`
    SELECT  COUNT(*) AS TotalViolations
    FROM violations 
    WHERE date BETWEEN ? AND ? 
    ORDER BY date ASC, time ASC
  `),

  getViolationsGroupedByDate: db.prepare(`
    SELECT COUNT(*) As violations,
    date
    FROM violations 
    WHERE date BETWEEN ? AND ?
    GROUP BY date 
    ORDER BY date ASC, time ASC
  `),

  // Get violations count by zone
  getViolationsByZone: db.prepare(`
    SELECT 
      zone, 
      COUNT(*) as count 
    FROM violations 
    GROUP BY zone 
    ORDER BY count DESC
  `),

  getViolationsByZoneForDate: db.prepare(`
    SELECT 
      zone, 
      COUNT(*) as count 
    FROM violations 
    WHERE date = ?
    GROUP BY zone 
    ORDER BY count DESC
  `),

  getViolationsByZoneForDateRange: db.prepare(`
    SELECT 
      zone, 
      COUNT(*) as count 
    FROM violations 
    WHERE date BETWEEN ? AND ? 
    GROUP BY zone 
    ORDER BY count DESC
  `),

  // Get violations count by hour
  getViolationsByHour: db.prepare(`
    SELECT 
      CASE 
        WHEN time LIKE '%AM' THEN 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '00'
                ELSE substr('0' || substr(time, 1, instr(time, ':') - 1), -2)
            END
        ELSE 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '12'
                ELSE substr('0' || (CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) + 12), -2)
            END
    END as hour,
    COUNT(*) as count
    FROM violations 
    
    GROUP BY hour 
    ORDER BY hour ASC
  `),

  getViolationsByHourForDate: db.prepare(`
    SELECT 
      CASE 
        WHEN time LIKE '%AM' THEN 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '00'
                ELSE substr('0' || substr(time, 1, instr(time, ':') - 1), -2) || ' AM'
            END
        ELSE 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '12'
                ELSE substr('0' || (CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) + 12), -2) || ' PM'
            END
    END as hour,
    COUNT(*) as count
    FROM violations 
    WHERE date = ?
    GROUP BY hour 
    ORDER BY count DESC
    `),

  getViolationsByHourForDateRange: db.prepare(`
    SELECT 
      CASE 
        WHEN time LIKE '%AM' THEN 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '00'
                ELSE substr('0' || substr(time, 1, instr(time, ':') - 1), -2) || ' AM'
            END
        ELSE 
            CASE 
                WHEN CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) = 12 THEN '12'
                ELSE substr('0' || (CAST(substr(time, 1, instr(time, ':') - 1) AS INTEGER) + 12), -2) || ' PM'
            END
    END as hour,
    COUNT(*) as count
    FROM violations 
    WHERE date BETWEEN ? AND ?
    GROUP BY hour 
    ORDER BY count DESC
    `)
};

// Helper functions to execute the queries
export const dbOperations = {
  // Insert a new violation
  insert: (violation: any) => {
    try {
      return queries.insertViolation.run(
        violation.image,
        violation.date,
        violation.time,
        violation.camera,
        violation.zone
      );
    } catch (error: any) {
      throw new Error(`Insert error: ${error.message}`);
    }
  },

  getAllUsers: () => {
    try {
      return queries.getAllUsers.all();
    } catch (error: any) {
      throw new Error(`Get all error: ${error.message}`);
    }
  },

  // Get all violations
  getAll: () => {
    try {
      return queries.getAllViolations.all();
    } catch (error: any) {
      throw new Error(`Get all error: ${error.message}`);
    }
  },

  getLast5Violations: () => {
    try {
      return queries.getLast5Violations.all();
    } catch (error: any) {
      throw new Error(`Get all error: ${error.message}`);
    }
  },

  // Get violations for a specific date
  getByDate: (date: any) => {
    try {
      return queries.getViolationsByDate.all(date);
    } catch (error: any) {
      throw new Error(`Get by date error: ${error.message}`);
    }
  },

  // Get violations for a specific camera
  getByCamera: (camera: any) => {
    try {
      return queries.getViolationsByCamera.all(camera);
    } catch (error: any) {
      throw new Error(`Get by camera error: ${error.message}`);
    }
  },

  // Get violations within a date range
  getByDateRange: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsByDateRange.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get by date range error: ${error.message}`);
    }
  },

  getVioationsCountByDateRange: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsCountByDateRange.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get by date range error: ${error.message}`);
    }
  },

  getVioationsGroupedByDate: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsGroupedByDate.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get by date range error: ${error.message}`);
    }
  },

  getVioationsCountByDate: (startDate: any) => {
    try {
      return queries.getViolationsCountByDate.all(startDate);
    } catch (error: any) {
      throw new Error(`Get by date range error: ${error.message}`);
    }
  },

  // Get violation counts by zone
  getCountsByZone: () => {
    try {
      return queries.getViolationsByZone.all();
    } catch (error: any) {
      throw new Error(`Get counts by zone error: ${error.message}`);
    }
  },

  getCountsByZoneForDate: (date: any) => {
    try {
      return queries.getViolationsByZoneForDate.all(date);
    } catch (error: any) {
      throw new Error(`Get counts by zone error: ${error.message}`);
    }
  },

  getCountsByZoneForDateRange: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsByZoneForDateRange.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get counts by zone error: ${error.message}`);
    }
  },

  // Get violation counts by hour
  getCountsByHour: () => {
    try {
      return queries.getViolationsByHour.all();
    } catch (error: any) {
      throw new Error(`Get counts by hour error: ${error.message}`);
    }
  },

  getCountsByHourForDate: (date: any) => {
    try {
      return queries.getViolationsByHourForDate.all(date);
    } catch (error: any) {
      throw new Error(`Get counts by hour error: ${error.message}`);
    }
  },

  getCountsByHourForDateRange: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsByHourForDateRange.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get counts by hour error: ${error.message}`);
    }
  },

  getViolationsByDateRange: (startDate: any, endDate: any) => {
    try {
      return queries.getViolationsByDateRange.all(startDate, endDate);
    } catch (error: any) {
      throw new Error(`Get counts by hour error: ${error.message}`);
    }
  },

  getLoginInfo: (email: any, password: any) => {
    try {
      return queries.getLoginInfo.all(email, password);
    } catch (error: any) {
      throw new Error(`Get counts by hour error: ${error.message}`);
    }
  },

  // getChartByDateRange: (startDate: any) => {
  //   try {
  //     return queries.getChartByDateRange.all(...startDate);
  //   } catch (error: any) {
  //     throw new Error(`Get counts by hour error: ${error.message}`);
  //   }
  // }

};
export default db;