# Portfolio Website

A modern, full-stack portfolio website with an interactive 3D frontend and a robust backend API for managing portfolio content.

**🌐 Live Demo:** [prabhasn.dev](https://prabhasn.dev)

## Overview

This portfolio is a comprehensive web application that showcases professional profile, education, skills, projects, certifications, hackathons, and achievements. It features an interactive 3D canvas-based interface with smooth animations and a complete admin panel for content management.

## Features

### Frontend
- **Interactive 3D Visualizations**: Multiple canvas-based 3D scenes (AbstractScene, JourneyScene, MathScene, Backdrop, Nebula)
- **Responsive Design**: Mobile-friendly interface that works seamlessly across all devices
- **Smooth Animations**: Hero tilt effects, parallax scrolling, and smooth transitions
- **Admin Dashboard**: Complete content management system for updating portfolio data
- **Type Picker**: Switch between different 3D visualization themes
- **Dynamic Content Loading**: Fetches all data from the backend API

### Backend
- **Express.js API**: RESTful API with proper error handling and validation
- **Authentication**: JWT-based admin authentication with bcrypt password hashing
- **Database**: MySQL for persistent data storage
- **Security**: Helmet for HTTP headers, CORS configuration, rate limiting, input validation with Zod
- **File Uploads**: Image upload to Cloudinary with multer
- **Email**: Nodemailer integration for contact form notifications
- **Rate Limiting**: Request limiting to prevent abuse
- **Health Checks**: Monitoring endpoint for server status

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **3D Graphics**: Three.js
- **Routing**: React Router DOM
- **Styling**: Custom CSS with animations

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: MySQL
- **Authentication**: JWT + bcryptjs
- **File Storage**: Cloudinary
- **Validation**: Zod
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon

## Project Structure

```
PortFolio/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components (Navbar, Hero, About, etc.)
│   │   ├── admin/              # Admin dashboard components
│   │   ├── AbstractScene.jsx    # 3D abstract visualization
│   │   ├── JourneyScene.jsx     # Journey/timeline 3D scene
│   │   ├── MathScene.jsx        # Mathematical 3D visualization
│   │   ├── Backdrop.jsx         # Background effects
│   │   ├── Nebula.jsx           # Nebula visualization
│   │   ├── App.jsx              # Main application component
│   │   ├── api.js               # API client functions
│   │   ├── effects.js           # Custom effects and animations
│   │   └── styles.css           # Global styles
│   └── package.json
│
├── backend/                     # Node.js backend API
│   ├── routes/                 # API routes
│   │   ├── public.js           # Public API endpoints
│   │   ├── contact.js          # Contact form endpoint
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── admin.js            # Admin endpoints
│   │   └── upload.js           # File upload endpoints
│   ├── middleware/             # Express middleware
│   ├── server.js               # Main server file
│   ├── createAdmin.js          # Admin user creation script
│   └── package.json
│
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- Cloudinary account (for image uploads)
- Email credentials (for contact notifications)

### Installation

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your environment variables:
```
DATABASE_HOST=your_mysql_host
DATABASE_USER=your_mysql_user
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=portfolio_db
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ALLOWED_ORIGIN=http://localhost:5173,https://prabhasn.dev
TRUST_PROXY=1
PORT=5000
```

4. Create admin user:
```bash
npm run create-admin
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Documentation

### Public Endpoints

- `GET /api/profile` - Get profile information
- `GET /api/education` - Get education details
- `GET /api/skills` - Get skills list
- `GET /api/projects` - Get projects
- `GET /api/certificates` - Get certifications
- `GET /api/hackathons` - Get hackathon participations
- `GET /api/achievements` - Get achievements
- `POST /api/contact` - Submit contact form

### Admin Endpoints (Requires Authentication)

- `POST /api/admin/auth/login` - Login to admin panel
- `GET/POST /api/admin/profile` - Manage profile
- `GET/POST /api/admin/education` - Manage education
- `GET/POST /api/admin/skills` - Manage skills
- `GET/POST /api/admin/projects` - Manage projects
- `GET/POST /api/admin/certificates` - Manage certifications
- `GET/POST /api/admin/hackathons` - Manage hackathons
- `GET/POST /api/admin/achievements` - Manage achievements
- `POST /api/admin/upload` - Upload images

## Features in Detail

### 3D Visualizations
The portfolio includes several interactive 3D scenes powered by Three.js:

- **Abstract Scene**: Floating geometric shapes with interactive mouse following
- **Journey Scene**: Timeline-based visualization of career progression
- **Math Scene**: Mathematical concepts visualized in 3D space
- **Nebula**: Particle-based space visualization
- **Backdrop**: Dynamic background effects

### Admin Panel
Complete content management interface allowing you to:
- Update personal profile information
- Manage education history
- Add/edit skills and proficiencies
- Showcase projects with descriptions and links
- Upload and manage project images
- Add certifications and achievements
- Log hackathon participations

### Security Features
- JWT-based authentication
- Password hashing with bcryptjs
- Request rate limiting
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection prevention

## Deployment

The portfolio is designed to be deployed on services like:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Render, Railway, Heroku, or any Node.js hosting

Ensure environment variables are properly set in your deployment platform.

## Contributing

Feel free to fork this project and customize it for your own portfolio!

## License

ISC

## Contact

Visit [prabhasn.dev](https://prabhasn.dev) for more information.
