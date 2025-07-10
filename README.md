# Money Machine - AI Trading Bot

A full-stack trading dashboard with AI-powered strategy creation and real-time analytics.

## 🚀 Quick Deploy to Replit

### 1. Fork/Clone this repository
- Click "Fork" on GitHub or clone the repository

### 2. Create a new Repl
- Go to [replit.com](https://replit.com)
- Click "Create Repl"
- Choose "Import from GitHub"
- Select your repository

### 3. Run the app
- Click the "Run" button
- The app will automatically install dependencies and start both servers
- Your app will be live at your Replit URL

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── saved_strategies.json
├── bot-trader/             # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages and routing
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities and config
│   └── package.json
├── .replit                # Replit configuration
├── replit.nix            # Environment setup
└── run.sh                # Startup script
```

## 🔧 Features

- **Real-time Trading Dashboard** with live price updates
- **AI Strategy Builder** for custom trading strategies
- **Paper Trading Mode** for risk-free testing
- **User Authentication** with secure login/logout
- **Strategy Management** - save, edit, and activate strategies
- **Performance Analytics** with interactive charts
- **Responsive Design** - works on desktop and mobile

## 🛠️ Local Development

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Next.js)
```bash
cd bot-trader
npm install
npm run dev
```

## 🌐 Deployment

### Replit (Recommended)
- Automatic deployment with the provided configuration files
- Free hosting with custom domain support
- Real-time collaboration

### Other Platforms
- **Vercel**: Deploy frontend to Vercel, backend to Render/Railway
- **Railway**: Full-stack deployment
- **Heroku**: Traditional deployment (requires Procfile)

## 🔐 Environment Variables

For local development, create a `.env` file in the `bot-trader` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

For Replit, the environment is automatically configured.

## 📊 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user

### Trading
- `GET /bot-status` - Get bot status
- `POST /start-trading` - Start trading bot
- `POST /stop-trading` - Stop trading bot
- `GET /get-exchange-config` - Get exchange configuration

### Strategies
- `GET /saved-strategies` - Get all saved strategies
- `POST /save-strategy` - Save a new strategy
- `POST /strategy-config` - Update strategy configuration

## 🎨 UI/UX Features

- **Dark Theme** with neon accents
- **Responsive Design** for all devices
- **Real-time Updates** with WebSocket support
- **Interactive Charts** with Recharts
- **Modern Animations** and transitions

## 🔄 Updates & Maintenance

- **Live Editing**: Make changes directly in Replit
- **Version Control**: Git integration for tracking changes
- **Auto-deploy**: Changes are automatically deployed
- **Rollback**: Easy to revert to previous versions

## 📞 Support

For issues or questions:
1. Check the logs in Replit console
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed

## 🚀 Next Steps

After deployment:
1. Create your first trading strategy
2. Test with paper trading mode
3. Configure your preferred trading pairs
4. Set up notifications and alerts

---

**Happy Trading! 🚀📈** 