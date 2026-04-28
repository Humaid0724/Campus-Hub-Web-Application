# Campus Hub

A centralized web platform connecting campus tools and resources for Heriot-Watt University Dubai students.

## Overview

Campus Hub reduces fragmentation in student life by bringing essential tools into one place — events, task management, academic calendar, lost & found, and a student resource exchange.

## Features

- **Events with RSVP** — Browse and register for campus events
- **Task Manager** — Track personal to-dos and deadlines
- **Academic Calendar** — Key dates and schedules at a glance
- **Lost & Found** — Report and claim lost items on campus
- **Student Resource Exchange** — Share notes, books, and resources
- **Admin Notices** — Official announcements in one feed

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | JavaScript (HTML/CSS) |
| Backend    | Node.js               |
| Database   | MySQL                 |
| Version Control | Git              |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Humaid0724/campus-hub.git

# Navigate to project directory
cd campus-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Update .env with your database credentials

# Run migrations
npm run migrate

# Start development server
npm start
