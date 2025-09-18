# Quick Server Start Guide

## Steps to Start the Backend Server

1. **Open terminal in the earena_Backend directory:**
   ```bash
   cd earena_Backend
   ```

2. **Verify .env file exists:**
   ```bash
   # On Windows
   type .env
   
   # On Mac/Linux  
   cat .env
   ```
   
   You should see the MongoDB URI and other settings.

3. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Expected Output

When successful, you should see:
```
🔧 Environment Debug:
NODE_ENV: development
PORT: 8000
MONGODB_URI: Set
JWT_SECRET: Set

✅ MongoDB connected !! DB HOST: honda-service-shard-00-02.1jxo30d.mongodb.net
✅ Server is running on port: 8000
```

## If You Still Get MongoDB Connection Error

The error might be due to:

1. **Network/Internet connection** - MongoDB Atlas requires internet
2. **MongoDB Atlas credentials** - The credentials in .env might be expired
3. **IP Whitelist** - Your IP might not be whitelisted in MongoDB Atlas

### Alternative: Use Local MongoDB

If you have MongoDB installed locally, you can change the MONGODB_URI in .env to:
```
MONGODB_URI=mongodb://localhost:27017/earena_dev
```

### Test Connection

Once the server starts successfully, test it by opening:
http://localhost:8000/api/tournaments

You should see a JSON response (might be empty array if no tournaments exist).

## Troubleshooting

- **"MONGODB_URI: NOT SET"** - .env file not loading correctly
- **"Connection refused"** - MongoDB server not accessible
- **"Authentication failed"** - Wrong MongoDB credentials
- **"Network timeout"** - Internet connection or firewall issue