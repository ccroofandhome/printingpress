# 🚀 Cloud Deployment Guide

## Overview
This guide will help you deploy your trading bot to the cloud for global access.

**Backend (FastAPI) → Render**  
**Frontend (Next.js) → Vercel**

---

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Render Account** (free tier available)
3. **Vercel Account** (free tier available)

---

## 🎯 Step 1: Deploy Backend to Render

### 1.1 Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 1.2 Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `trading-bot-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend` (if your repo has the backend in a subfolder)

5. Click "Create Web Service"
6. Wait for deployment (2-3 minutes)
7. Copy the URL (e.g., `https://your-app-name.onrender.com`)

---

## 🎯 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `bot-trader`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Set Environment Variables
In your Vercel project settings, add:
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: Your Render backend URL (e.g., `https://your-app-name.onrender.com`)

### 2.3 Deploy
1. Click "Deploy"
2. Wait for deployment (1-2 minutes)
3. Copy your frontend URL (e.g., `https://your-app-name.vercel.app`)

---

## 🔧 Step 3: Test Your Deployment

### 3.1 Test Backend
```bash
curl https://your-backend-url.onrender.com/
# Should return: {"status": "ok"}
```

### 3.2 Test Frontend
1. Open your Vercel URL in a browser
2. Check that the app loads correctly
3. Test bot controls and API calls

---

## 🌐 Step 4: Access Your App

### URLs
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-backend-url.onrender.com`

### Features Available
✅ Access from any device (phone, laptop, tablet)  
✅ 24/7 availability  
✅ Automatic HTTPS  
✅ Free tier hosting  
✅ Automatic deployments on code changes  

---

## 🔄 Step 5: Continuous Deployment

### Automatic Updates
- Push changes to GitHub
- Render and Vercel will automatically redeploy
- No manual intervention needed

### Environment Variables
Update these in your cloud dashboards as needed:
- `NEXT_PUBLIC_API_URL` (Vercel)
- Any API keys or secrets (Render)

---

## 🛠️ Troubleshooting

### Common Issues

**1. Backend not responding**
- Check Render logs for errors
- Verify the start command is correct
- Ensure all dependencies are in `requirements.txt`

**2. Frontend can't connect to backend**
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check CORS settings in backend
- Test backend URL directly

**3. Build failures**
- Check build logs in Vercel/Render
- Ensure all dependencies are properly specified
- Verify file paths are correct

### Support
- **Render**: [docs.render.com](https://docs.render.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

---

## 🎉 Success!

Your trading bot is now accessible from anywhere in the world! 

**Next Steps:**
- Share the frontend URL with your team
- Set up monitoring and alerts
- Consider upgrading to paid tiers for better performance
- Add custom domain names for professional appearance 