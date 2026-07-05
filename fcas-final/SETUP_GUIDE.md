# 🎓 FCAS — Complete Setup & Integration Guide
## Faculty Career Advancement System — Final Merged Project

---

## 📁 Final Project Structure

```
fcas-final/
│
├── backend/                          ← Spring Boot 3.2 (Java 17)
│   ├── pom.xml
│   └── src/main/
│       ├── resources/
│       │   └── application.properties
│       └── java/com/faculty/app/
│           ├── FacultyApplication.java
│           ├── entity/
│           │   ├── User.java
│           │   ├── FacultyProfile.java      (NET/SET/SLET fields included)
│           │   ├── Application.java         (stores criteria version)
│           │   ├── Document.java
│           │   └── EligibilityCriteria.java (30+ configurable fields)
│           ├── repository/             (5 JPA repositories)
│           ├── service/
│           │   ├── EligibilityEngine.java          ← ZERO hardcoded rules
│           │   ├── EligibilityCriteriaService.java ← form save + Excel import
│           │   ├── FacultyService.java
│           │   ├── AdminService.java
│           │   ├── AuthService.java
│           │   ├── DocumentService.java
│           │   └── UserDetailsServiceImpl.java
│           ├── controller/             (4 controllers: Auth, Faculty, Admin, Criteria)
│           ├── dto/                    (AppDto.java, CriteriaDto.java)
│           ├── config/                 (Security, DataInitializer, ExceptionHandler)
│           └── security/               (JWT filter + utils)
│
└── frontend/                         ← React 18
    ├── package.json
    └── src/
        ├── App.js                     (all routes wired)
        ├── index.js / index.css
        ├── context/AuthContext.js
        ├── components/Sidebar.js      (all nav items including Criteria)
        ├── services/api.js            (authAPI + facultyAPI + adminAPI + criteriaAPI)
        └── pages/
            ├── Login.js
            ├── Register.js
            ├── faculty/
            │   ├── FacultyDashboard.js
            │   ├── ProfilePage.js       (UG/PG/PhD/NET/SET/SLET/Experience/Publications)
            │   ├── EligibilityPage.js
            │   ├── ApplyPage.js
            │   ├── MyApplications.js
            │   └── DocumentsPage.js
            └── admin/
                ├── AdminDashboard.js
                ├── AdminApplications.js
                ├── AdminApplicationDetail.js
                ├── AdminFaculty.js
                ├── AdminManage.js
                └── AdminCriteria.js   ← Form editor + Excel import + Version history
```

---

## ✅ Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17 or higher | https://adoptium.net |
| Apache Maven | 3.8+ | https://maven.apache.org |
| MySQL | 8.0+ | https://dev.mysql.com/downloads |
| Node.js | 16+ | https://nodejs.org |
| npm | 8+ | Included with Node.js |

Verify installations:
```bash
java -version        # should show 17+
mvn -version         # should show 3.8+
mysql --version      # should show 8.0+
node -v              # should show 16+
npm -v               # should show 8+
```

---

## 🗄️ STEP 1 — Set Up MySQL Database

Open MySQL terminal or MySQL Workbench and run:

```sql
-- Create the database
CREATE DATABASE faculty_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (recommended)
CREATE USER 'fcas_user'@'localhost' IDENTIFIED BY 'YourPassword123';
GRANT ALL PRIVILEGES ON faculty_db.* TO 'fcas_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
```

> ⚠️ If you use root directly, skip the user creation and just use root credentials below.

---

## ⚙️ STEP 2 — Configure Backend

Open this file in any text editor:
```
fcas-final/backend/src/main/resources/application.properties
```

Update these 3 lines:
```properties
spring.datasource.username=fcas_user        ← your MySQL username
spring.datasource.password=YourPassword123  ← your MySQL password

# Optional: change default admin credentials
app.admin.email=admin@college.edu
app.admin.password=Admin@123
app.admin.name=System Administrator
```

**Everything else can stay as-is for local development.**

---

## 🚀 STEP 3 — Run the Backend

Open a terminal, navigate to the backend folder:

```bash
cd fcas-final/backend
mvn spring-boot:run
```

**First run will:**
- Connect to MySQL and auto-create all tables (`ddl-auto=update`)
- Create default admin: `admin@college.edu` / `Admin@123`
- Seed default UGC eligibility criteria for all 4 posts

**Expected output:**
```
✅ Default admin created: admin@college.edu / Admin@123
✅ Default eligibility criteria seeded (UGC norms).
Started FacultyApplication in 4.2 seconds
```

Backend runs at: **http://localhost:8080**

> 💡 To run as a background process: `mvn spring-boot:run &`
> To stop: `Ctrl+C` or `kill` the process

---

## ⚛️ STEP 4 — Run the Frontend

Open a NEW terminal window, navigate to the frontend folder:

```bash
cd fcas-final/frontend
npm install          ← first time only (downloads dependencies)
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

Frontend runs at: **http://localhost:3000**

> The browser will open automatically. If not, go to http://localhost:3000 manually.

---

## 🔑 STEP 5 — First Login

Open **http://localhost:3000/login**

### Admin Login
```
Email:    admin@college.edu
Password: Admin@123
```
→ Redirects to `/admin` dashboard

### Register as Faculty
Click "Register" → fill in name, email, password, department  
→ Login → Redirects to `/dashboard`

---

## 🗺️ Complete Page Map

### Faculty (Role: ROLE_FACULTY)
| URL | Page | What to do |
|-----|------|-----------|
| `/dashboard` | Dashboard | Overview, stats, quick links |
| `/profile` | Academic Profile | Fill UG, PG, PhD, **NET/SET/SLET**, experience, publications |
| `/eligibility` | Eligibility Checker | Select post → instant eligibility check |
| `/apply` | Apply for Post | Select post → see result → submit application |
| `/my-applications` | My Applications | Track status, see admin remarks |
| `/documents` | Documents | Upload PDF/image certificates |

### Admin (Role: ROLE_ADMIN)
| URL | Page | What to do |
|-----|------|-----------|
| `/admin` | Dashboard | Stats overview |
| `/admin/applications` | All Applications | Filter, search, review |
| `/admin/applications/:id` | Application Detail | Full profile view + approve/reject with remarks |
| `/admin/faculty` | Faculty Members | View profiles, block/activate |
| `/admin/manage` | Admin Users | Create new admins |
| `/admin/criteria` | **Eligibility Criteria** | Configure rules via form or Excel |

---

## ⚙️ STEP 6 — Configure Eligibility Criteria (Admin)

Login as admin → go to **Admin Panel → ⚙️ Eligibility Criteria**

### Option A: Edit via Form
1. Click a post button (Assistant Professor, Associate Professor, etc.)
2. Configure each section:
   - **NET/SET/SLET** — choose NONE / REQUIRED / OR_PHD, tick which exams are accepted
   - **Education** — set min PG%, toggle PhD required
   - **Experience** — set teaching and total experience minimums
   - **API Score** — set minimum API score required
   - **Publication Minimums** — set per index and combined
   - **API Weights** — points per activity
   - **Bonus Points** — PhD, exam, PG% bonuses
3. Fill in the **Change Note** (required)
4. Click **💾 Save & Activate**

Changes take effect **immediately** for all new eligibility checks.

### Option B: Import from Excel
1. Click **Import from Excel** tab
2. Click **📥 Download Excel Template**
3. Open the downloaded `.xlsx` file
4. Edit values for each post (4 rows)
5. Save the file
6. Drag & drop or click to upload it back
7. Click **📊 Import & Activate All Posts**

### Option C: Roll Back
Click **🕑 Version History** tab → select a post → click **↺ Restore** on any old version.

---

## 🗂️ MySQL Tables Created Automatically

Spring Boot creates these tables on first run:

| Table | Purpose |
|-------|---------|
| `users` | Faculty and admin accounts |
| `faculty_profiles` | Complete academic profile per user |
| `eligibility_criteria` | All criteria versions (one active per post) |
| `applications` | Submitted career advancement applications |
| `documents` | Uploaded file metadata |

---

## 📂 File Upload Storage

Uploaded documents are stored in:
```
fcas-final/backend/uploads/{userId}/filename.pdf
```

This folder is created automatically. To change the path, edit `application.properties`:
```properties
app.upload.dir=uploads/
```

---

## 🔌 Full API Reference

### Auth (Public)
```
POST /api/auth/register   body: { name, email, password, employeeId, department, designation, phone }
POST /api/auth/login      body: { email, password }  → returns { token, id, name, email, role, ... }
```

### Criteria (Public read)
```
GET /api/criteria/active                  → active criteria for all 4 posts
GET /api/criteria/active/{postName}       → active criteria for one post
```

### Criteria (Admin only)
```
GET  /api/criteria/history/{postName}     → all versions for a post
POST /api/criteria/save                   → save new criteria (activates immediately)
POST /api/criteria/{id}/activate          → restore old version
POST /api/criteria/import/excel           → upload Excel file
GET  /api/criteria/template/excel         → download template
```

### Faculty (JWT required)
```
GET  /api/faculty/profile/exists
GET  /api/faculty/profile
POST /api/faculty/profile
GET  /api/faculty/eligibility?post=Associate Professor
POST /api/faculty/applications
GET  /api/faculty/applications
POST /api/faculty/documents/upload
GET  /api/faculty/documents
GET  /api/faculty/documents/{id}/download
DELETE /api/faculty/documents/{id}
```

### Admin (JWT + ROLE_ADMIN)
```
GET   /api/admin/dashboard
GET   /api/admin/applications?status=PENDING
PATCH /api/admin/applications/{id}/review
GET   /api/admin/faculty
GET   /api/admin/faculty/{userId}/profile
PATCH /api/admin/faculty/{id}/toggle
POST  /api/admin/create-admin
GET   /api/admin/admins
```

---

## 🐛 Common Issues & Fixes

### ❌ Backend won't start — "Access denied for user"
```
Fix: Check spring.datasource.username and spring.datasource.password in application.properties
     Ensure MySQL is running: sudo service mysql start (Linux) or start from MySQL Workbench (Windows)
```

### ❌ Backend won't start — "Port 8080 already in use"
```
Fix: Kill the process using port 8080
     Linux/Mac: lsof -ti:8080 | xargs kill
     Windows:   netstat -ano | findstr :8080  → taskkill /PID <pid> /F
     Or change port: server.port=8081 in application.properties
     Then also update BASE in frontend/src/services/api.js to http://localhost:8081/api
```

### ❌ Frontend won't start — "Module not found"
```
Fix: cd fcas-final/frontend && npm install
     If still failing: rm -rf node_modules && npm install
```

### ❌ Login fails — "Invalid credentials"
```
Fix: Make sure backend is running first.
     Default admin: admin@college.edu / Admin@123
     Check browser console for CORS errors → backend must be on port 8080
```

### ❌ CORS error in browser console
```
Fix: Ensure backend SecurityConfig allows http://localhost:3000
     The provided code already handles this.
     Do NOT open frontend as file:// — always use npm start
```

### ❌ File upload fails — "Permission denied"
```
Fix: Make sure the uploads/ folder is writable
     Linux/Mac: chmod 755 fcas-final/backend/uploads
```

### ❌ Eligibility check fails — "No active criteria"
```
Fix: Login as admin → go to /admin/criteria → criteria should be auto-seeded.
     If not, click a post and hit Save & Activate with any change note.
```

---

## 🔧 Running Both Together (Quick Reference)

```bash
# Terminal 1 — Backend
cd fcas-final/backend
mvn spring-boot:run

# Terminal 2 — Frontend
cd fcas-final/frontend
npm start
```

Open: http://localhost:3000

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | Admin@123 |
| Faculty | Register at /register | Your choice |

To change the default admin, edit `application.properties` before first run:
```properties
app.admin.email=principal@yourcollege.edu
app.admin.password=SecurePass@2025
app.admin.name=Dr. A. Sharma
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Spring Boot | 3.2.0 |
| Security | Spring Security + JWT (jjwt) | 0.11.5 |
| Database ORM | Spring Data JPA + Hibernate | — |
| Database | MySQL | 8.0+ |
| Excel Parsing | Apache POI | 5.2.5 |
| Frontend | React | 18.2 |
| Routing | React Router | 6.21 |
| HTTP Client | Axios | 1.6.2 |
| Java Version | Java | 17 |
