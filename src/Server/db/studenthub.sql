CREATE DATABASE studenthub;

USE studenthub;

SELECT * From users;
SELECT * FROM Lost_Found;
SELECT * FROM EVENTS;
SELECT * FROM Resources;
 SELECT * FROM Calendar_Events order by start_date;
DELETE FROM Resources WHERE title IN ('daf', 'Bla');
-- Database: Campus Hub (Final Schema)

-- 1. USERS Table (FINALIZED - 'department' is now an ENUM)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE, 
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    campus VARCHAR(100) NOT NULL,        
    study_year INT,                      
    -- Department is restricted to the schools at Heriot-Watt University Dubai for data integrity and filtering
    department ENUM(
        'Global College Dubai', 
        'Energy, Geoscience, Infrastructure and Society', 
        'Engineering and Physical Sciences', 
        'Mathematical and Computer Sciences', 
        'School of Social Sciences', 
        'Edinburgh Business School - Dubai',
        'Textiles and Design'
    ) NOT NULL,
    major VARCHAR(100),                  
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student'
);

UPDATE users SET role = 'admin' WHERE email = 'humaid@hw.ac.uk';
UPDATE users SET role = 'admin' WHERE email = 'admin1@hw.ac.uk';
drop table EVENTS;
-- 2. EVENTS Table
CREATE TABLE Events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time DATETIME NOT NULL,
    end_date_time DATETIME NULL,
    location VARCHAR(255),
    creator_id INT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (creator_id) REFERENCES Users(user_id)
);

-- 3. TASKS Table
CREATE TABLE Tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,                      
    start_time TIME,                     
    end_time TIME,                       
    status ENUM('pending', 'complete') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- 4. LOST_FOUND Table (Includes image_path)
CREATE TABLE Lost_Found (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reporter_id INT NOT NULL,
    item_type ENUM('lost', 'found') NOT NULL,
    category VARCHAR(100),
    image_path VARCHAR(255),               -- Path/URL to the item's image
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES Users(user_id)
);

SELECT * FROM Lost_Found;

-- 5. RESOURCES Table (Includes file_path)
CREATE TABLE Resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255),                -- Path/URL to the uploaded file (e.g., PDF)
    sharer_id INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (sharer_id) REFERENCES Users(user_id)
);

-- 6. NOTICES Table
CREATE TABLE Notices (
    notice_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    admin_id INT NOT NULL,
    post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

-- 7. RSVPs Table
CREATE TABLE RSVPs (
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id)
);

-- 8. Table for Personal Calendar Events (Private to the user)
CREATE TABLE Calendar_Events (
    personal_event_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

drop table rsvps;

USE studenthub;
ALTER TABLE Notices
ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;