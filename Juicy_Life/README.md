# Juicy Life - Asli Phal Asli Taste 🍌

A complete fruit juice inventory, billing, vendor, and sales management web application built with Python Flask, HTML5, CSS3, and JavaScript.

---

## 🚀 Vercel Deployment Guide

This project is fully structured and pre-configured for seamless deployment on [Vercel](https://vercel.com).

### Quick Deployment Steps

1. **Push to GitHub / GitLab / Bitbucket**:
   Ensure this project directory is pushed to your Git repository.

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your repository (`Juicy_Life`).
   - Framework Preset: **Other** (detected automatically via `vercel.json`).
   - Root Directory: `./` (leave default).
   - Click **Deploy**.

3. **Deploy via Vercel CLI (Alternative)**:
   ```bash
   npm i -g vercel
   vercel
   ```

---

## 🛠️ Local Development

To run the application locally on your computer:

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Flask Server**:
   ```bash
   python app.py
   ```

3. **Open in Browser**:
   Navigate to `http://127.0.0.1:5000`

---

## 📁 Project Structure

```text
Juicy_Life/
├── api/
│   └── index.py            # Vercel Serverless Function entry point
├── static/
│   ├── images/             # Product bottles, logo & graphic assets
│   ├── script.js           # Client-side UI & localStorage logic
│   └── style.css           # Styling, responsive layout & themes
├── templates/
│   ├── base.html           # Master layout template & sidebar navigation
│   ├── billing.html        # Billing & receipt generation page
│   ├── dashboard.html      # Analytics, sales & profit dashboard
│   ├── landing.html        # Original customer-facing landing page ("/")
│   ├── login.html          # Admin authentication portal
│   ├── report.html         # Sales & wastage reports
│   ├── stock.html          # Fruit stock inventory management
│   └── vendor.html         # Vendor management & purchase entry
├── .gitignore              # Git ignore rules for Python & Vercel
├── .vercelignore           # Files excluded from Vercel deployment bundles
├── app.py                  # Main Flask application with routes & session handling
├── index.py                # Root WSGI alias entry point
├── package.json            # Deployment configuration metadata
├── requirements.txt        # Python package dependencies (Flask, Werkzeug)
├── vercel.json             # Vercel routing & Serverless Function configuration
└── README.md               # Project documentation
```

---

## 🔑 Login Credentials

- **Email**: `admin@gmail.com`
- **Password**: `7890`

---

## 💡 How the Vercel 404 Error Was Resolved

1. **Root Entrypoint**: All files were organized at the root level of the project rather than deeply nested subfolders.
2. **Serverless Routing (`vercel.json`)**: Configured Vercel rewrites to route requests (`/(.*)`) to the serverless function `/api/index.py` while letting static assets (`/static/(.*)`) be served directly by Vercel's high-speed CDN.
3. **Template & Static Bundling**: Configured `includeFiles` in `vercel.json` to ensure Jinja templates and static files are bundled with the serverless function.
4. **Landing Page Mapping**: Added `/`, `/index`, and `/index.html` routes to `landing()` in `app.py` to guarantee that visitors and automated checks accessing any standard home URL reach the original landing page with HTTP 200 OK.
