# Hackathon Evaluation Management System (HEMS)

## Project Overview

The **Hackathon Evaluation Management System (HEMS)** is a web-based platform designed to streamline the complete hackathon evaluation process. It enables organizers, coordinators, judges, and administrators to efficiently manage teams, conduct multiple evaluation rounds, calculate scores, and publish results through a centralized dashboard.

The system aims to eliminate manual evaluation, reduce calculation errors, and provide a transparent, scalable, and organized judging workflow for hackathons of any size.

---

# Features

* Secure administrator dashboard
* Team registration and management
* Multi-round evaluation system
* Judge management
* Real-time score submission
* Automatic score calculation
* Round-wise qualification
* Leaderboard generation
* Winner selection
* Responsive user interface
* Centralized data management

---

# Project Structure

```
HEMS/
│
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# Tech Stack

## Frontend

* React.js
* JavaScript (ES6+)
* CSS3

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## ODM

* Mongoose

---

# Core Modules

### Dashboard

* Overview of hackathon statistics
* Team count
* Judge count
* Evaluation progress
* Qualified teams
* Live leaderboard

### Team Management

* Create teams
* Edit team details
* Delete teams
* View team information
* Search and filter teams

### Judge Management

* Add judges
* Assign judges
* Manage judge information
* Role-based access

### Evaluation

* Multi-round scoring
* Judge-wise score entry
* Automatic total calculation
* Score validation
* Comments and feedback

### Results

* Round-wise qualification
* Final rankings
* Leaderboard
* Winner declaration

### Settings

* Hackathon configuration
* Evaluation criteria
* Round management
* System preferences

---

# Technology Highlights

* RESTful API architecture
* Component-based frontend
* Modular backend architecture
* MongoDB database integration
* Mongoose data modeling
* Express middleware
* Scalable project structure
* Clean code organization

---

# Getting Started

## Prerequisites

* Node.js
* npm
* MongoDB

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Navigate into the project

```bash
cd HEMS
```

Install frontend dependencies

```bash
cd client
npm install
```

Install backend dependencies

```bash
cd ../server
npm install
```

---

## Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

## Running the Application

Start the backend server

```bash
cd server
npm run dev
```

Start the frontend

```bash
cd client
npm run dev
```

---

# Future Enhancements

* Authentication and authorization
* QR-based team verification
* Email notifications
* Live scoring dashboard
* Analytics and reports
* PDF scorecards
* Certificate generation
* Export to Excel and CSV
* Dark mode
* Audit logs

---

# Contributing

Contributions are welcome. Feel free to fork the repository, create a feature branch, and submit a pull request.

---

# License

This project is intended for educational and internal hackathon management purposes.
