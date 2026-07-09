# StockMapper - Render Deployment Guide

## Quick Deploy to Render

### Option 1: One-Click Deploy (Easiest)
Click this button to deploy directly from your GitHub repository:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Deploy via Render Dashboard

1. **Sign in to Render**
   - Go to https://render.com
   - Sign up or log in with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `two-n/stockmapper`
   - Allow Render to access the repository

3. **Configure the Service**
   - **Name**: `stockmapper` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
   
4. **Set Environment Variables**
   - `DATA_DOMAIN` = `nyse`
   - `CANNED_DATA` = `true`
   - `NODE_ENV` = `production`
   
5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Your app will be live at: `https://stockmapper.onrender.com` (or similar)

### What's Already Configured

✅ `package.json` - Added start script and Node version
✅ `render.yaml` - Auto-configuration file for Render
✅ News cache - 986 stocks with news data
✅ Time-series cache - All stock data pre-cached
✅ Heatmap data - 1,405 stocks ready to display

### After Deployment

Your app will be accessible at a URL like:
- `https://stockmapper.onrender.com`

**Note**: Render's free tier may spin down after inactivity. First request may take 30 seconds.

### Troubleshooting

- **Build fails**: Check that all dependencies install correctly
- **App won't start**: Verify environment variables are set
- **Port issues**: Render automatically sets PORT, the app uses it via `process.env.PORT`

## Local Development

To run locally in demo mode:
```bash
DATA_DOMAIN=nyse CANNED_DATA=true PORT=3000 node app.js
```

Then visit: http://localhost:3000
