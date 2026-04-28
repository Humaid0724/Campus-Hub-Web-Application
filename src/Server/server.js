// Import required modules

const express = require("express");

const cors = require("cors");

const mysql = require("mysql2");

const bcrypt = require("bcrypt");

const multer = require("multer");

const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000; // Allow port to be configurable

// --- Middleware ---

app.use(cors()); // Enable Cross-Origin Resource Sharing

app.use(express.json()); // Essential middleware to parse JSON request bodies

app.use("/uploads", express.static("uploads")); // Serve static files from uploads folder

// --- Database Connection ---

const db = mysql.createConnection({
  host: "localhost",

  user: "root",

  password: "A@bcd123",

  database: "studenthub",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);

    return;
  }

  console.log("Connected to MySQL database as id", db.threadId);
});

// ===== MULTER IMAGE UPLOAD SETUP =====

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/lost-and-found/"); // folder to store images
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // rename file
  },
});

const upload = multer({ storage });

// --- USER AUTH & PROFILE API ---

/**

 * @route   POST /register

 * @desc    Register a new user

 * @access  Public

 * @body    { first_name, last_name, campus, department, major, study_year, email, password }

 */

app.post("/register", (req, res) => {
  // 1. Destructure all expected fields from the request body

  const {
    first_name,

    last_name,

    campus,

    department,

    major,

    study_year,

    email,

    password, // Plain-text password from client
  } = req.body;

  // 2. --- SERVER-SIDE VALIDATION ---

  if (
    !first_name ||
    !last_name ||
    !campus ||
    !department ||
    !major ||
    !study_year ||
    !email ||
    !password
  ) {
    console.error(
      "Validation Failed: Missing fields. Data received:",

      req.body
    );

    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!email.endsWith("@hw.ac.uk")) {
    return res

      .status(400)

      .json({ message: "Please use your Heriot-Watt University email" });
  }

  // 3. Check if email already exists

  const checkEmailSql = "SELECT email FROM Users WHERE email = ?";

  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error("DB Error (Select):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 4. --- PASSWORD HASHING ---

    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error("Hashing error:", hashErr);

        return res.status(500).json({ message: "Error processing password" });
      }

      // 5. Insert the new user into the database

      const insertUserSql = `

        INSERT INTO Users

          (first_name, last_name, campus, department, major, study_year, email, password_hash)

        VALUES

          (?, ?, ?, ?, ?, ?, ?, ?)

      `;

      const values = [
        first_name,

        last_name,

        campus,

        department,

        major,

        study_year,

        email,

        hashedPassword,
      ];

      db.query(insertUserSql, values, (err2, results2) => {
        if (err2) {
          console.error("Database insert error:", err2);

          return res.status(500).json({ message: "Error registering user" });
        }

        console.log("User registered successfully:", email);

        res.status(201).json({ message: "Registration successful" });
      });
    });
  });
});

/**

 * @route   POST /login

 * @desc    Authenticate a user and get role

 * @access  Public

 * @body    { email, password }

 */

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  // 1. Find the user by email

  const sql = "SELECT * FROM Users WHERE email = ?";

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("DB Error (Login):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    // 2. Compare submitted password with the stored hash

    bcrypt.compare(password, user.password_hash, (cmpErr, isMatch) => {
      if (cmpErr) {
        return res.status(500).json({ message: "Error verifying password" });
      }

      if (isMatch) {
        // 3. Passwords match! Send success response.

        console.log(`User ${email} logged in with role: ${euser.rol}`);

        return res.json({
          message: "Login successful",

          role: user.role,

          id: user.user_id, // Send ID for profile lookups

          email: user.email,
        });
      } else {
        // 4. Passwords did not match

        return res.status(401).json({ message: "Invalid email or password" });
      }
    });
  });
});

/**

 * @route   GET /user/:id

 * @desc    Get a user's profile information (for the form)

 * @access  Private

 * @param   :id (User ID)

 */

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  // *** FIXED SQL QUERY (no leading space) ***

  const sql = `SELECT user_id, email, first_name, last_name, campus, department, major, study_year, role

FROM Users

WHERE user_id = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Error (Get User):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(results[0]);
  });
});

/**

 * @route   PUT /user/:id

 * @desc    Update a user's profile information (from the form)

 * @access  Private

 * @param   :id (User ID)

 * @body    { first_name, last_name, campus, department, major, study_year }

 */

app.put("/user/:id", (req, res) => {
  const userId = req.params.id;

  const { first_name, last_name, campus, department, major, study_year } =
    req.body;

  // *** FIXED SQL QUERY (no leading space) ***

  const sql = `UPDATE Users

  SET first_name = ?, last_name = ?, campus = ?, department = ?, major = ?, study_year = ?

  WHERE user_id = ?`;

  const values = [
    first_name,

    last_name,

    campus,

    department,

    major,

    study_year,

    userId,
  ];

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error("Profile update error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  });
});

// --- NEW: USER DASHBOARD API ---

// (These routes populate the new dashboard sections on the profile page)

/**

 * @route   GET /user/:id/tasks

 * @desc    Get future personal calendar events to show as "Tasks"

 * @access  Private

 */

app.get("/user/:id/tasks", (req, res) => {
  const userId = req.params.id;

  // Fetch personal events occurring today or in the future

  const sql = `

    SELECT personal_event_id AS task_id, title, start_date AS due_date, 'pending' AS status

    FROM Calendar_Events

    WHERE user_id = ?

    AND start_date >= CURDATE()

    ORDER BY start_date ASC

  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Error (Get Tasks):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   GET /user/:id/events

 * @desc    Get all events a user has RSVP'd to

 * @access  Private

 */

app.get("/user/:id/events", (req, res) => {
  const userId = req.params.id;

  // Fixed column name: changed 'e.date_time' to 'e.start_date_time'

  const sql = `

    SELECT e.title, e.start_date_time, e.location, e.event_id

    FROM Events e

    JOIN RSVPs r ON e.event_id = r.event_id

    WHERE r.user_id = ?

    ORDER BY e.start_date_time ASC`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Error (Get Events):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   GET /user/:id/lostfound

 * @desc    Get all lost/found items reported by a user (for dashboard)

 * @access  Private

 */

app.get("/user/:id/lostfound", (req, res) => {
  const userId = req.params.id;

  // Select items where this user is the reporter and item is not resolved

  const sql =
    "SELECT * FROM Lost_Found WHERE reporter_id = ? AND is_resolved = 0 ORDER BY report_date DESC";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Error (Get LostFound):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results); // Send back the array of items
  });
});

// --- EVENTS API ---

/**

 * @route   POST /events

 * @desc    Create a new event

 * @access  Private (must be logged in)

 * @body    { title, description, start_date_time, end_date_time, location, creator_id }

 */

app.post("/events", (req, res) => {
  const {
    title,

    description,

    start_date_time, // 'YYYY-MM-DDTHH:MM'

    end_date_time, // 'YYYY-MM-DDTHH:MM'

    location,

    creator_id,
  } = req.body;

  // 1. Server-side validation

  if (!title || !description || !start_date_time || !location || !creator_id) {
    console.error("Event creation failed: Missing fields.", req.body);

    return res.status(400).json({ message: "Missing required fields" });
  }

  // 2. === NEW LOGIC: Check the user's role ===

  const checkRoleSql = "SELECT role FROM Users WHERE user_id = ?";

  db.query(checkRoleSql, [creator_id], (err, users) => {
    if (err) {
      console.error("DB Error (Check Role):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: "Creator not found" });
    }

    // 3. Determine approval status

    const userRole = users[0].role;

    const is_approved = userRole === "admin" ? 1 : 0; // Admin events are auto-approved

    // 4. Insert the event

    const insertSql = `

      INSERT INTO Events

        (title, description, start_date_time, end_date_time, location, creator_id, is_approved)

      VALUES

        (?, ?, ?, ?, ?, ?, ?)

    `;

    const values = [
      title,

      description,

      start_date_time,

      end_date_time || null,

      location,

      creator_id,

      is_approved,
    ];

    db.query(insertSql, values, (err, results) => {
      if (err) {
        console.error("Database insert error (Events):", err);

        return res.status(500).json({ message: "Error creating event" });
      }

      if (is_approved) {
        console.log("Admin event created & auto-approved:", title);

        res.status(201).json({ message: "Event created and auto-approved" });
      } else {
        console.log("Student event created, awaiting approval:", title);

        res.status(201).json({
          message:
            "Event created successfully! It will be visible after approval.",
        });
      }
    });
  });
});

/**

 * @route   GET /events/approved

 * @desc    (STUDENT) Get all events that are approved

 * @access  Public

 */

app.get("/events/approved", (req, res) => {
  // === UPDATED SQL QUERY ===

  const sql = `

    SELECT E.*, CONCAT(U.first_name, ' ', U.last_name) AS creator_name

    FROM Events E

    JOIN Users U ON E.creator_id = U.user_id

    WHERE E.is_approved = 1

    ORDER BY E.start_date_time ASC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Error (Get Approved Events):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   GET /events/pending

 * @desc    (ADMIN) Get all events awaiting approval

 * @access  Admin

 */

app.get("/events/pending", (req, res) => {
  // === UPDATED SQL QUERY ===

  const sql = `

    SELECT E.*, CONCAT(U.first_name, ' ', U.last_name) AS creator_name

    FROM Events E

    JOIN Users U ON E.creator_id = U.user_id

    WHERE E.is_approved = 0

    ORDER BY E.start_date_time ASC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Error (Get Pending Events):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   PUT /events/:id/approve

 * @desc    (ADMIN) Approve a specific event

 * @access  Admin

 */

app.put("/events/:id/approve", (req, res) => {
  const eventId = req.params.id;

  const sql = "UPDATE Events SET is_approved = 1 WHERE event_id = ?";

  db.query(sql, [eventId], (err, results) => {
    if (err) {
      console.error("DB Error (Approve Event):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event approved successfully" });
  });
});

/**

 * @route   DELETE /events/:id

 * @desc    (ADMIN) Delete/Reject a specific event

 * @access  Admin

 */

app.delete("/events/:id", (req, res) => {
  const eventId = req.params.id;

  // 1. Delete all related RSVPs first (to avoid Foreign Key Violation)

  const deleteRsvpsSql = "DELETE FROM RSVPs WHERE event_id = ?";

  db.query(deleteRsvpsSql, [eventId], (err, rsvpResults) => {
    if (err) {
      console.error("DB Error (Delete RSVPs):", err);

      return res

        .status(500)

        .json({ message: "Database error during RSVP cleanup" });
    }

    // 2. Now delete the Event itself

    const deleteEventSql = "DELETE FROM Events WHERE event_id = ?";

    db.query(deleteEventSql, [eventId], (err2, eventResults) => {
      if (err2) {
        console.error("DB Error (Delete Event):", err2);

        return res

          .status(500)

          .json({ message: "Database error during event deletion" });
      }

      if (eventResults.affectedRows === 0) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Success message

      res.json({
        message: "Event deleted/rejected successfully",

        rsvps_deleted: rsvpResults.affectedRows,
      });
    });
  });
});

// LOST & FOUND API

// GET all LOST items

app.get("/lostfound/lost", (req, res) => {
  const sql = `

    SELECT LF.*, U.email AS reporter_email

    FROM Lost_Found LF

    JOIN Users U ON LF.reporter_id = U.user_id

    WHERE LF.item_type = 'lost' AND LF.is_resolved = 0

    ORDER BY LF.report_date DESC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lost items fetch error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

// GET all FOUND items

app.get("/lostfound/found", (req, res) => {
  const sql = `

    SELECT LF.*, U.email AS reporter_email

    FROM Lost_Found LF

    JOIN Users U ON LF.reporter_id = U.user_id

    WHERE LF.item_type = 'found' AND LF.is_resolved = 0

    ORDER BY LF.report_date DESC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Found items fetch error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

// POST new lost/found item

app.post("/lostfound", upload.single("image"), (req, res) => {
  // DEBUG LOGS — these tell us what the backend is really receiving

  console.log("LOST&FOUND BODY:", req.body);

  console.log("LOST&FOUND FILE:", req.file);

  const { title, description, reporter_id, item_type, category } = req.body;

  const image_path = req.file ? req.file.filename : null;

  const sql = `INSERT INTO Lost_Found (title, description, reporter_id, item_type, category, image_path)

  VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,

    [title, description, reporter_id, item_type, category, image_path],

    (err, result) => {
      if (err) {
        console.error("Insert lost-found error:", err);

        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Item reported successfully" });
    }
  );
});

// --- MULTER FOR RESOURCES (PDF, DOCS, etc.) ---

// We need a separate storage config for resources

const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resources/"); // New folder for resource files
  },

  filename: (req, file, cb) => {
    // Keep the original file name

    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadResource = multer({ storage: resourceStorage });

// --- CALENDAR & RSVP API ---

// 1. RSVP to a Global Event

app.post("/events/rsvp", (req, res) => {
  const { user_id, event_id } = req.body;

  // INSERT IGNORE prevents duplicate entries if the user RSVPs twice

  const sql = "INSERT IGNORE INTO RSVPs (user_id, event_id) VALUES (?, ?)";

  db.query(sql, [user_id, event_id], (err, result) => {
    if (err) {
      // This is the message we need to see in the terminal for debugging

      console.error("RSVP Error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    // If successful, result.affectedRows is 1 (new RSVP) or 0 (already RSVP'd)

    res.json({ message: "RSVP successful! Event added to your calendar." });
  });
});

// 2. Create a Personal Calendar Event

app.post("/calendar/personal", (req, res) => {
  const { user_id, title, start, end } = req.body;

  const sql =
    "INSERT INTO Calendar_Events (user_id, title, start_date, end_date) VALUES (?, ?, ?, ?)";

  db.query(sql, [user_id, title, start, end], (err, result) => {
    if (err) {
      console.error("Personal Event Error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Personal event added." });
  });
});

// 3. Delete a Personal Calendar Event

app.delete("/calendar/personal/:id", (req, res) => {
  const eventId = req.params.id;

  const sql = "DELETE FROM Calendar_Events WHERE personal_event_id = ?";

  db.query(sql, [eventId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.json({ message: "Event deleted" });
  });
});

// Un-RSVP (Remove global event from personal calendar)

app.delete("/events/rsvp/:userId/:eventId", (req, res) => {
  const { userId, eventId } = req.params;

  const sql = "DELETE FROM RSVPs WHERE user_id = ? AND event_id = ?";

  db.query(sql, [userId, eventId], (err, result) => {
    if (err) {
      console.error("Un-RSVP Error:", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Removed from calendar" });
  });
});

// 4. GET Full Calendar (Merges RSVPs + Personal Events)

app.get("/calendar/:userId", (req, res) => {
  const userId = req.params.userId;

  // Query 1: Get Global Events the user RSVP'd to

  const rsvpSql = `

    SELECT

      e.event_id AS id,

      e.title,

      e.start_date_time AS start,

      e.end_date_time AS end,

      'global' AS type

    FROM Events e

    JOIN RSVPs r ON e.event_id = r.event_id

    WHERE r.user_id = ?`;

  // Query 2: Get Personal Events

  const personalSql = `

    SELECT

      personal_event_id AS id,

      title,

      start_date AS start,

      end_date AS end,

      'personal' AS type

    FROM Calendar_Events

    WHERE user_id = ?`;

  // Execute both and combine

  db.query(rsvpSql, [userId], (err, globalEvents) => {
    if (err) {
      console.error("Calendar Fetch Error (Global):", err);

      return res.status(500).json({ message: "Error fetching calendar" });
    }

    db.query(personalSql, [userId], (err2, personalEvents) => {
      if (err2) {
        console.error("Calendar Fetch Error (Personal):", err2);

        return res.status(500).json({ message: "Error fetching calendar" });
      }

      // Combine arrays

      const combined = [...globalEvents, ...personalEvents];

      res.json(combined);
    });
  });
});

// --- RESOURCES API ---

/**

 * @route   POST /resources

 * @desc    Share a new resource (with file upload)

 * @access  Private

 */

// Use uploadResource.single('file') as middleware

app.post("/resources", uploadResource.single("file"), (req, res) => {
  console.log("RESOURCE BODY:", req.body);

  console.log("RESOURCE FILE:", req.file);

  const { title, description, sharer_id } = req.body;

  // Get file path if it exists, otherwise null

  const file_path = req.file ? req.file.filename : null;

  if (!title || !sharer_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check user role to see if it should be auto-approved

  const checkRoleSql = "SELECT role FROM Users WHERE user_id = ?";

  db.query(checkRoleSql, [sharer_id], (err, users) => {
    if (err || users.length === 0) {
      return res.status(404).json({ message: "Sharer user not found" });
    }

    const userRole = users[0].role;

    // Admin uploads are auto-approved

    const is_approved = userRole === "admin" ? 1 : 0;

    const sql = `

      INSERT INTO Resources (title, description, file_path, sharer_id, is_approved)

      VALUES (?, ?, ?, ?, ?)

    `;

    db.query(
      sql,

      [title, description, file_path, sharer_id, is_approved],

      (err, result) => {
        if (err) {
          console.error("Insert resource error:", err);

          return res.status(500).json({ message: "Database error" });
        }

        const message = is_approved
          ? "Resource shared and auto-approved."
          : "Resource submitted! It will be visible after admin approval.";

        res.status(201).json({ message: message });
      }
    );
  });
});

/**

 * @route   GET /resources/approved

 * @desc    Get all approved resources

 * @access  Public

 */

app.get("/resources/approved", (req, res) => {
  const sql = `

    SELECT R.*, CONCAT(U.first_name, ' ', U.last_name) AS sharer_name

    FROM Resources R

    JOIN Users U ON R.sharer_id = U.user_id

    WHERE R.is_approved = 1

    ORDER BY R.upload_date DESC

  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.json(results);
  });
});

/**

 * @route   GET /resources/pending

 * @desc    (ADMIN) Get all pending resources

 * @access  Admin

 */

app.get("/resources/pending", (req, res) => {
  const sql = `

    SELECT R.*, CONCAT(U.first_name, ' ', U.last_name) AS sharer_name

    FROM Resources R

    JOIN Users U ON R.sharer_id = U.user_id

    WHERE R.is_approved = 0

    ORDER BY R.upload_date ASC

  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.json(results);
  });
});

/**

 * @route   PUT /resources/:id/approve

 * @desc    (ADMIN) Approve a resource

 * @access  Admin

 */

app.put("/resources/:id/approve", (req, res) => {
  const resourceId = req.params.id;

  const sql = "UPDATE Resources SET is_approved = 1 WHERE resource_id = ?";

  db.query(sql, [resourceId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource approved" });
  });
});

/**

 * @route   DELETE /resources/:id

 * @desc    (ADMIN) Delete/Reject a resource

 * @access  Admin

 */

app.delete("/resources/:id", (req, res) => {
  const resourceId = req.params.id;

  const sql = "DELETE FROM Resources WHERE resource_id = ?";

  db.query(sql, [resourceId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted" });
  });
});

// --- NOTICES API ---

/**

 * @route   GET /notices

 * @desc    Get all notices (for students and admins)

 * @access  Public

 */

app.get("/notices", (req, res) => {
  // Join with Users table to get the email of the admin who posted

  const sql = `

    SELECT N.*, U.email AS admin_email

    FROM Notices N

    JOIN Users U ON N.admin_id = U.user_id

    ORDER BY N.pinned DESC, N.post_date DESC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Error (Get Notices):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   POST /notices

 * @desc    (ADMIN) Create a new notice

 * @access  Admin

 * @body    { title, content, admin_id }

 */

app.post("/notices", (req, res) => {
  const { title, content, admin_id } = req.body;

  if (!title || !content || !admin_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = "INSERT INTO Notices (title, content, admin_id) VALUES (?, ?, ?)";

  db.query(sql, [title, content, admin_id], (err, results) => {
    if (err) {
      console.error("DB Error (Create Notice):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({
      message: "Notice created successfully",

      noticeId: results.insertId,
    });
  });
});

/**

 * @route   DELETE /notices/:id

 * @desc    (ADMIN) Delete a notice

 * @access  Admin

 */

app.delete("/notices/:id", (req, res) => {
  const noticeId = req.params.id;

  const sql = "DELETE FROM Notices WHERE notice_id = ?";

  db.query(sql, [noticeId], (err, results) => {
    if (err) {
      console.error("DB Error (Delete Notice):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json({ message: "Notice deleted successfully" });
  });
});

/**

 * @route   PUT /notices/:id/pin

 * @desc    (ADMIN) Toggle the pin status of a notice

 * @access  Admin

 * @body    { pinned } (true or false)

 */

app.put("/notices/:id/pin", (req, res) => {
  const noticeId = req.params.id;

  const { pinned } = req.body; // { "pinned": true }

  // Convert boolean to 1 or 0 for SQL

  const pinStatus = pinned ? 1 : 0;

  const sql = "UPDATE Notices SET pinned = ? WHERE notice_id = ?";

  db.query(sql, [pinStatus, noticeId], (err, results) => {
    if (err) {
      console.error("DB Error (Update Pin):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json({ message: "Pin status updated successfully" });
  });
});

// ADMIN — RESOLVE ITEM

app.put("/lostfound/:id/resolve", (req, res) => {
  const sql = "UPDATE Lost_Found SET is_resolved=TRUE WHERE item_id=?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.json({ message: "Item resolved" });
  });
});

// ADMIN — DELETE ITEM

app.delete("/lostfound/:id", (req, res) => {
  const sql = "DELETE FROM Lost_Found WHERE item_id=?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    res.json({ message: "Item deleted" });
  });
});

/**

 * @route GET /dashboard/stats/:userId

 * @desc  Get dashboard numbers for a user (student or admin)

 * @access Private

 */

app.get("/dashboard/stats/:userId", (req, res) => {
  const userId = req.params.userId;

  // 1️⃣ First check the user's role

  const roleSql = `SELECT role FROM Users WHERE user_id = ?`;

  db.query(roleSql, [userId], (err, roleResult) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (roleResult.length === 0)
      return res.status(404).json({ message: "User not found" });

    const userRole = roleResult[0].role;

    //  ADMIN DASHBOARD STATS

    if (userRole === "admin") {
      // NEW QUERY 1: Department Distribution (for trends widget)

      const departmentStatsSql = `

    SELECT department, COUNT(*) AS count

    FROM Users

    WHERE role = 'student'

    GROUP BY department

    ORDER BY count DESC

  `;

      const queries = {
        // pending events to approve

        upcomingEvents: `SELECT COUNT(*) AS count FROM Events WHERE is_approved = 0`,

        // only THIS admin's pending tasks

        pendingTasks: `SELECT COUNT(*) AS count

                       FROM Calendar_Events

                       WHERE user_id = ?

                       AND start_date >= NOW()`,

        pendingResources: `SELECT COUNT(*) AS count FROM Resources WHERE is_approved = 0`,

        // total notices

        newNotices: `SELECT COUNT(*) AS count FROM Notices`,
      };

      db.query(queries.upcomingEvents, (e1, r1) => {
        db.query(queries.pendingTasks, [userId], (e2, r2) => {
          db.query(queries.pendingResources, (e3, r3) => {
            db.query(queries.newNotices, (e4, r4) => {
              // Execute the new department stats query

              db.query(departmentStatsSql, (e5, r5) => {
                // <--- Executes departmentStatsSql

                if (e5) {
                  console.error("DB Error (Dept Stats):", e5);

                  // Return error but still include other data if possible

                  return res.status(500).json({ message: "Database error" });
                }

                res.json({
                  upcomingEvents: r1[0].count, // pending events count

                  pendingTasks: r2[0].count, // this admin's tasks count

                  pendingResources: r3[0].count, // resources to approve count

                  newNotices: r4[0].count, // notices total count

                  // THIS IS THE TRENDS DATA:

                  departmentStats: r5,
                });
              });
            });
          });
        });
      });

      return;
    }

    //  STUDENT DASHBOARD STATS

    const studentQueries = {
      upcomingEvents: `

    SELECT COUNT(*) AS count

    FROM Events

    WHERE is_approved = 1

  `,

      // Student pending tasks = future personal calendar events

      pendingTasks: `

    SELECT COUNT(*) AS count

    FROM Calendar_Events

    WHERE user_id = ?

    AND start_date >= NOW()

  `,

      rsvps: `

    SELECT COUNT(*) AS count

    FROM RSVPs

    WHERE user_id = ?

  `,

      unreadNotices: `

    SELECT COUNT(*) AS count

    FROM Notices

  `,
    };

    db.query(studentQueries.upcomingEvents, (e1, r1) => {
      db.query(studentQueries.pendingTasks, [userId], (e2, r2) => {
        db.query(studentQueries.rsvps, [userId], (e3, r3) => {
          db.query(studentQueries.unreadNotices, (e4, r4) => {
            res.json({
              upcomingEvents: r1[0].count,

              pendingTasks: r2[0].count,

              rsvps: r3[0].count,

              newNotices: r4[0].count,
            });
          });
        });
      });
    });
  });
});

// --- NEW: USER ROSTER & MANAGEMENT API ---

/**

 * @route   GET /users/roster

 * @desc    Get all registered users (for Admin roster)

 * @access  Admin

 */

app.get("/users/roster", (req, res) => {
  // Select non-sensitive fields and order by role (admins first)

  const sql = `

    SELECT user_id, email, first_name, last_name, role, department  

    FROM Users

    ORDER BY role DESC, last_name ASC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Error (Get Roster):", err);

      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

/**

 * @route   PUT /users/:id/promote

 * @desc    Promote a user to admin role

 * @access  Admin

 * @param   :id (User ID)

 */

app.put("/users/:id/promote", (req, res) => {
  const userId = req.params.id;

  // Ensure we only update if they are currently a student

  const sql =
    "UPDATE Users SET role = 'admin' WHERE user_id = ? AND role = 'student'";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Error (Promote User):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      // This covers both "not found" and "already admin"

      return res

        .status(400)

        .json({ message: "User not found or is already an admin" });
    }

    res.json({ message: "User promoted to admin successfully" });
  });
});

/**

 * @route   DELETE /users/:id

 * @desc    Delete a user (only non-admins)

 * @access  Admin

 * @param   :id (User ID)

 */

app.delete("/users/:id", (req, res) => {
  const userId = req.params.id;

  // CRUCIAL: Only allow deletion if the user is a 'student' to protect admins.

  const sql = "DELETE FROM Users WHERE user_id = ? AND role = 'student'";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      // Catch FK violation if user has posted content/RSVP'd

      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        console.error("DB Error (Delete User - FK):", err);

        return res.status(409).json({
          message:
            "Cannot delete user: user has posted content (FK constraint).",
        });
      }

      console.error("DB Error (Delete User):", err);

      return res.status(500).json({ message: "Database error" });
    }

    if (results.affectedRows === 0) {
      // This covers "not found" and "is admin"

      return res.status(400).json({
        message: "User not found or is an admin and cannot be deleted.",
      });
    }

    res.json({ message: "User deleted successfully" });
  });
});

// --- Start Server ---

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
