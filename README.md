# 🏢 ResaleSense: HDB Property Valuation & Analytics Platform

## 📖 Overview
ResaleSense is a comprehensive, full-stack web application designed to provide accurate, real-time valuations and insights for HDB resale flats in Singapore. Built as part of the NTU SC2006 Software Engineering module, the system leverages a three-tier microservice architecture to decouple machine learning predictions from the primary web server operations.

## 🏛️ System Architecture
The application is strictly designed following the **Boundary-Control-Entity (BCE)** architectural pattern to ensure high cohesion and low coupling across three distinct microservices:

* **Frontend (React.js / TypeScript):** The **Boundary** layer. It provides an interactive User Interface, featuring dynamic map filtering via Leaflet, automated pagination, and responsive property dashboards.
* **Main Backend (Node.js / Express):** The **Control & Entity** layer. It handles business logic, REST API routing, user authentication (JWT), and database operations. It relies on the Factory and Strategy design patterns to interface with a MongoDB database (populated with 5 years of historical HDB data).
* **Prediction Service (Python / Flask):** A dedicated, external microservice that houses a pre-trained **Gradient Boosting Machine Learning Model**. The Node.js controller makes `POST` requests to this service, which calculates real-time distances to amenities (MRTs, schools) via the OneMap API to return a highly accurate fair market valuation.

## ✨ Key Features
* **Dynamic Valuation Tool:** Calculates current estimated fair market value using a high-accuracy ML model (R-squared > 98%).
* **Interactive Geospatial Map:** Allows users to visualize property distributions and filter by town, price, and flat type.
* **Community Discussion & Polling:** Authenticated users can vote on whether a property is under-valued or over-valued and leave moderated remarks.
* **Admin Dashboard:** Role-based access control for administrators to moderate community remarks and manage user statuses.
* **Property Comparison:** Side-by-side analytical comparison of multiple selected HDB listings.

---

## 🚀 Quick Start Guide (Setup Instructions)
*(The following instructions outline how to initialize the database, backend, Python service, and frontend).*

## 1.  Prerequisites (Before You Start)

Make sure you have these tools installed. If you're on a Mac, we recommend using [Homebrew](https://brew.sh/) to install them.

* **Node.js (v16+)**: Includes `npm`.
    * *Check version:* `node -v`
* **Python (v3.9+)**:
    * *Check version:* `python3 -V` (Use `python3`, not `python`)
* **Git**:
    * *Check version:* `git --version` [cite: 1745]
* **MongoDB**: The database must be **installed and running**.
    * *Mac Quick Install:*
        1.  `brew install mongodb-community`
        2.  `brew services start mongodb-community` (This runs it in the background)
    * *Check if running:* Run `brew services list`. You should see `mongodb-community` listed as "started".
    * (You can also use MongoDB Atlas [cite: 1743] or Docker, but Homebrew is fastest for local setup.)

---

## 2. One-Time Setup

You only need to do these steps once.

### Step 1: Clone and Install Dependencies

These commands are run from your main terminal.

```bash
# 1. Clone the project repository
git clone <your-repository-url> 
cd ResaleSense-Project 

# 2. Install the root 'concurrently' package
npm install 

# 3. Install Backend dependencies (from the root folder)
npm install --prefix ResaleSense-Backend 

# 4. Install Frontend dependencies (from the root folder)
npm install --prefix resalesense-frontend 
Step 2: Configure the Backend (.env)
The backend needs to know how to connect to your MongoDB database.
Bash
# 1. From the root 'ResaleSense-Project' folder, copy the example .env file
cp ResaleSense-Backend/.env.example ResaleSense-Backend/.env 

# 2. Open the new file: ResaleSense-Backend/.env
Inside this file, change this line:
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
...to this (if you used the Homebrew install):
MONGODB_URI=mongodb://localhost:27017/resalesense
(If you're using MongoDB Atlas, paste your cloud connection string here instead.)
Step 3: Configure the Python Service (Virtual Environment)
This creates a self-contained Python environment so it doesn't mess with your main system.
Bash
# 1. Navigate into the Python folder
cd ResaleSense-Prediction-Service 

# 2. Create the virtual environment (use python3 for Mac)
python3 -m venv venv 

# 3. Activate the environment
.\venv\Scripts\activate
# (Your terminal prompt should now show '(venv)' at the start)

# 4. Install the required Python libraries
pip install -r requirements.txt 

# 5. Go back to the root folder
cd .. 
________________________________________
3. 🏃 How to Run the Application
You have two options. The first is easy, the second is better for debugging.
Option A: The Easy Way (One Terminal)
This uses concurrently to run all three services in one terminal.
Bash
# 1. From the root 'ResaleSense-Project' folder, run:
npm start 
You will see output from all three services mixed together2. Wait for all three "server is running" messages 3, then open the app.
Option B: The "Pro" Way (Three Terminals)
This is highly recommended if npm start fails. It lets you clearly see errors from each service.
Open 3 separate terminals in the root ResaleSense-Project folder.
•	Terminal 1: Start the Backend
Bash
npm run start --prefix ResaleSense-Backend
# Wait for: [Node.js] Backend server is running on http://localhost:4000
•	Terminal 2: Start the Frontend
Bash
npm run start --prefix resalesense-frontend
# Wait for: [React] Compiled successfully!
•	Terminal 3: Start the Python Service
Bash
cd ResaleSense-Prediction-Service
source venv/bin/activate
python3 server.py
# Wait for: [Python] * Running on http://localhost:5000
Accessing the App
Once all services are running, open your browser to:
http://localhost:3000
________________________________________
4. 👑 Creating an Admin User
To use the /admin page, you must create an admin account.
1.	Stop the app (press Ctrl+C in the terminal(s)).
2.	Navigate to the backend folder:
Bash
cd ResaleSense-Backend 
3.	Run the admin creation script:
Bash
node createAdmin.js 
4.	Follow the prompts to enter a name, email, and password6.
5.	Go back to the root folder:
Bash
cd .. 
6.	Restart the app (npm start). You can now log in with your new admin credentials8.
________________________________________
5. ⚠️ Troubleshooting for Macs
This section is to help if things go wrong.
•	Problem: "App loads but I see Error: Failed to fetch..." or "Backend crashes with ECONNREFUSED"
o	Solution: Your MongoDB database is not running. Run brew services list in your terminal. If mongodb-community is not "started" (green), run brew services start mongodb-community.
•	Problem: "The npm start command fails or one service crashes."
o	Solution: Use Option B: The "Pro" Way (3 terminals) to run each service. The terminal for the failing service will show you the real error message.
•	Problem: "Python errors" or "Model not found."
o	Solution: Make sure you are in the ResaleSense-Prediction-Service folder and that (venv) is visible in your terminal prompt. If not, run source venv/bin/activate again.
•	Problem: "Command not found: python"
o	Solution: Your Mac uses python3 and pip3. Always use python3 when running commands (like python3 -m venv venv) and pip when installing (like pip install -r requirements.txt, after venv is active).

## 👥 The Team
This project was developed collaboratively by our software engineering team. 

* **[Lim Li Hang]** 
* **[Terashima Shuma]** 
* **[Phee Si Hui, Cheryl]** 
* **[Tang Xinyue]** 
* **[Muhammad Izzat Bin Ramlee]** 
* **[Joshua Raphael Koh Chee Chien]** 

*A special thanks to the NTU SC2006 teaching staff for their guidance throughout the software development lifecycle.*
