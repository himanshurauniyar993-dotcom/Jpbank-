import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';

// --- Error Handling for Process ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jpbank';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

let isDbConnected = false;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    isDbConnected = true;
  })
  .catch((err) => {
    console.error('MongoDB connection error. Falling back to in-memory mock DB for preview purposes.', err.message);
    isDbConnected = false;
  });

// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
  accountID: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passport: { type: String, default: '' },
  phone: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  pin: { type: String }, // Legacy
  password: { type: String },
  transactionPin: { type: String },
  role: { type: String, enum: ['user', 'officer'], default: 'user' },
  contact: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  tickType: { type: String, enum: ['', 'golden', 'blue', 'brown'], default: '' },
  isBanned: { type: Boolean, default: false },
});

const transactionSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // accountID
  receiver: { type: String, required: true }, // accountID
  amount: { type: Number, required: true },
  type: { type: String, enum: ['transfer', 'reward', 'fine'], required: true },
  remark: { type: String, default: '' },
  date: { type: Date, default: Date.now },
});

const userDomainSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // accountID
  username: { type: String, required: true },
  subdomain: { type: String, required: true },
  recordType: { type: String, required: true }, // 'CNAME' or 'A'
  targetValue: { type: String, required: true },
  status: { type: String, default: 'ACTIVE' }, // 'RESERVED', 'ACTIVE', 'PENDING'
  customRecords: [String],
  date: { type: Date, default: Date.now },
});

const jpPoliceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  location: { type: String, required: true },
  againstName: { type: String, default: '' },
  phone: { type: String, required: true },
  cause: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Resolved', 'Ignored', 'Closed', 'Take down'], default: 'Pending' },
  date: { type: Date, default: Date.now },
});

const maintenanceSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  isEnabled: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const UserDomain = mongoose.model('UserDomain', userDomainSchema);
const JpPolice = mongoose.model('JpPolice', jpPoliceSchema);
const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

// --- In-Memory Mock DB (Fallback) ---
let mockUsers: any[] = [];
let mockTransactions: any[] = [];
let mockUserDomains: any[] = [];
let mockJpPolice: any[] = [];
let mockMaintenance: any[] = [];

// Helper to interact with DB or Mock
const db = {
  User: {
    findOne: async (query: any) => isDbConnected ? User.findOne(query).exec() : mockUsers.find(u => Object.keys(query).every(k => u[k] === query[k])),
    find: async (query: any = {}) => {
      if (isDbConnected) return User.find(query).exec();
      return mockUsers.filter(u => {
        return Object.keys(query).every(k => {
          const qVal = query[k];
          if (qVal && typeof qVal === 'object') {
            if (qVal.$in) return qVal.$in.includes(u[k]);
            if (qVal.$or) return qVal.$or.some((sub: any) => Object.keys(sub).every(sk => u[sk] === sub[sk]));
          }
          return u[k] === qVal;
        });
      });
    },
    create: async (data: any) => {
      if (isDbConnected) {
        const u = new User(data);
        return u.save();
      }
      mockUsers.push(data);
      return data;
    },
    updateOne: async (query: any, update: any) => {
      if (isDbConnected) return User.updateOne(query, update).exec();
      const user = mockUsers.find(u => Object.keys(query).every(k => u[k] === query[k]));
      if (user) {
        if (update.$inc) {
          for (const key in update.$inc) {
            user[key] = (user[key] || 0) + update.$inc[key];
          }
        }
        if (update.$set) {
          Object.assign(user, update.$set);
        }
      }
      return { modifiedCount: user ? 1 : 0 };
    },
    deleteOne: async (query: any) => {
      if (isDbConnected) return User.deleteOne(query).exec();
      const index = mockUsers.findIndex(u => Object.keys(query).every(k => u[k] === query[k]));
      if (index !== -1) {
        mockUsers.splice(index, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
  },
  Transaction: {
    find: async (query: any = {}) => {
      if (isDbConnected) return Transaction.find(query).sort({ date: -1 }).exec();
      return mockTransactions
        .filter(t => {
          return Object.keys(query).every(k => {
            const qVal = query[k];
            if (qVal && typeof qVal === 'object') {
              if (qVal.$in) return qVal.$in.includes(t[k]);
            }
            return t[k] === qVal;
          });
        })
        .map(t => {
          if (!t._id) {
            const dateObj = t.date instanceof Date ? t.date : new Date(t.date);
            t._id = dateObj.getTime().toString(36) + Math.random().toString(36).substr(2, 5);
          }
          return t;
        })
        .sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });
    },
    findOne: async (query: any) => {
      if (isDbConnected) return Transaction.findOne(query).exec();
      const t = mockTransactions.find(t => Object.keys(query).every(k => t[k] === query[k]));
      if (!t) return null;
      if (!t._id) {
        const dateObj = t.date instanceof Date ? t.date : new Date(t.date);
        t._id = dateObj.getTime().toString(36) + Math.random().toString(36).substr(2, 5);
      }
      return t;
    },
    findById: async (id: string) => {
      if (isDbConnected) return Transaction.findById(id).exec();
      // Try exact ID match first, then fallback to loose time-based match
      let t = mockTransactions.find(t => t._id === id);
      if (!t) {
        t = mockTransactions.find(t => {
          const dateObj = t.date instanceof Date ? t.date : new Date(t.date);
          return dateObj.getTime().toString(36) === id;
        });
      }
      if (!t) return null;
      if (!t._id) {
        const dateObj = t.date instanceof Date ? t.date : new Date(t.date);
        t._id = dateObj.getTime().toString(36) + Math.random().toString(36).substr(2, 5);
      }
      return t;
    },
    create: async (data: any) => {
      if (isDbConnected) {
        const t = new Transaction(data);
        return t.save();
      }
      const newT = { ...data, _id: Math.random().toString(36).substring(2, 11), date: new Date() };
      mockTransactions.push(newT);
      return newT;
    },
    deleteMany: async (query: any = {}) => {
      if (isDbConnected) return Transaction.deleteMany(query).exec();
      const count = mockTransactions.length;
      mockTransactions = [];
      return { deletedCount: count };
    }
  },
  UserDomain: {
    find: async (query: any = {}) => isDbConnected ? UserDomain.find(query).exec() : mockUserDomains.filter(d => Object.keys(query).every(k => d[k] === query[k])),
    create: async (data: any) => {
      if (isDbConnected) {
        const d = new UserDomain(data);
        return d.save();
      }
      const newD = { ...data, _id: Math.random().toString(36).substr(2, 9), date: new Date(), customRecords: [] };
      mockUserDomains.push(newD);
      return newD;
    },
    updateOne: async (query: any, update: any) => {
      if (isDbConnected) return UserDomain.updateOne(query, update).exec();
      const domain = mockUserDomains.find(d => Object.keys(query).every(k => d[k] === query[k]));
      if (!domain) return { modifiedCount: 0 };

      if (update.$set) {
        Object.assign(domain, update.$set);
      }
      if (update.$push) {
        for (const key in update.$push) {
          if (!domain[key]) domain[key] = [];
          domain[key].push(update.$push[key]);
        }
      }
      if (update.$pull) {
        for (const key in update.$pull) {
          if (domain[key]) {
            const pullQuery = update.$pull[key];
            domain[key] = domain[key].filter((item: any) => {
              return !Object.keys(pullQuery).every(k => item[k] === pullQuery[k]);
            });
          }
        }
      }
      return { modifiedCount: 1 };
    },
    deleteOne: async (query: any) => {
      if (isDbConnected) return UserDomain.deleteOne(query).exec();
      const initialLength = mockUserDomains.length;
      mockUserDomains = mockUserDomains.filter(d => !Object.keys(query).every(k => d[k] === query[k]));
      return { deletedCount: initialLength - mockUserDomains.length };
    }
  },
  JpPolice: {
    find: async (query: any = {}) => isDbConnected ? JpPolice.find(query).sort({ date: -1 }).exec() : mockJpPolice.filter(p => Object.keys(query).every(k => p[k] === query[k])).sort((a, b) => b.date.getTime() - a.date.getTime()),
    create: async (data: any) => {
      if (isDbConnected) {
        const p = new JpPolice(data);
        return p.save();
      }
      const newP = { ...data, _id: Math.random().toString(36).substr(2, 9), date: new Date() };
      mockJpPolice.push(newP);
      return newP;
    },
    updateOne: async (query: any, update: any) => {
      if (isDbConnected) return JpPolice.updateOne(query, update).exec();
      const complaint = mockJpPolice.find(p => Object.keys(query).every(k => p[k] === query[k]));
      if (complaint && update.$set) {
        Object.assign(complaint, update.$set);
      }
      return { modifiedCount: complaint ? 1 : 0 };
    },
    deleteOne: async (query: any) => {
      if (isDbConnected) {
        if (query._id) return JpPolice.findByIdAndDelete(query._id).exec();
        return JpPolice.deleteOne(query).exec();
      }
      const initialLength = mockJpPolice.length;
      mockJpPolice = mockJpPolice.filter(p => !Object.keys(query).every(k => String(p[k]) === String(query[k])));
      return { deletedCount: initialLength - mockJpPolice.length };
    }
  },
  Maintenance: {
    find: async (query: any = {}) => isDbConnected ? Maintenance.find(query).exec() : mockMaintenance.filter(m => Object.keys(query).every(k => m[k] === query[k])),
    updateOne: async (query: any, update: any, options: any = {}) => {
      if (isDbConnected) return Maintenance.updateOne(query, update, options).exec();
      let m = mockMaintenance.find(item => Object.keys(query).every(k => item[k] === query[k]));
      if (!m && options.upsert) {
        m = { ...query, isEnabled: false };
        mockMaintenance.push(m);
      }
      if (m) {
        if (update.$set) Object.assign(m, update.$set);
      }
      return { modifiedCount: m ? 1 : 0 };
    }
  }
};

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Use originalUrl to be more certain about the path
  const url = req.originalUrl || req.url || '';
  const isApiRequest = url.toLowerCase().includes('/api/');

  if (!token) {
    console.log(`[Auth] Missing token for ${url}`);
    if (isApiRequest) {
      return res.status(401).json({ error: 'Authentication required: Please log in again.' });
    }
    return res.status(401).send('Authentication required');
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log(`[Auth] Invalid token for ${url}: ${err.message}`);
      if (isApiRequest) {
        return res.status(403).json({ 
          error: 'Forbidden: Session expired or invalid.',
          details: err.message === 'jwt expired' ? 'session_expired' : 'invalid_token'
        });
      }
      return res.status(403).send('Forbidden: Invalid Session');
    }
    req.user = user;
    next();
  });
};

const requireOfficer = async (req: any, res: any, next: any) => {
  const user = await db.User.findOne({ accountID: req.user.accountID });
  if (user && user.role === 'officer') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized Access: Central Officer Credentials Required' });
  }
};

// --- API Routes ---

// --- JP Police Routes ---
app.post('/api/police/complaints', authenticateToken, async (req: any, res) => {
  try {
    const { location, phone, cause, againstName } = req.body;
    if (!location || !phone || !cause || !againstName) {
      return res.status(400).json({ error: 'Location, phone, cause, and Complaint Against Name are required.' });
    }

    const user = await db.User.findOne({ accountID: req.user.accountID });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate random 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    const newComplaint = await db.JpPolice.create({
      userId: user.accountID,
      username: user.username,
      location,
      againstName: againstName || '',
      phone,
      cause,
      code,
      status: 'Pending'
    });

    res.status(201).json({ message: 'Complaint filed successfully.', data: newComplaint });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/police/complaints', authenticateToken, async (req: any, res) => {
  try {
    const complaints = await db.JpPolice.find({ userId: req.user.accountID });
    res.json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/police/complaints/:id/takedown', authenticateToken, async (req: any, res) => {
  try {
    if (isDbConnected && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid complaint ID format' });
    }

    const complaints = await db.JpPolice.find({ _id: req.params.id, userId: req.user.accountID });
    const complaint = complaints && complaints.length > 0 ? complaints[0] : null;
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found or you do not have permission to take it down.' });
    }

    if (complaint.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending complaints can be taken down.' });
    }

    await db.JpPolice.updateOne({ _id: complaint._id }, { $set: { status: 'Take down' } });
    res.json({ message: 'Complaint taken down successfully.' });
  } catch (error: any) {
    console.error('Error taking down complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Officer Routes for JP Police
app.get('/api/officer/complaints', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const complaints = await db.JpPolice.find({});
    res.json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/officer/complaints/:id/status', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Resolved', 'Ignored', 'Closed', 'Take down'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await db.JpPolice.find({ _id: req.params.id }).then(res => res[0]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    await db.JpPolice.updateOne({ _id: complaint._id }, { $set: { status } });
    res.json({ message: 'Status updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/delete/:code', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    if (!isDbConnected) {
      // Fallback for mock DB if MongoDB is not connected
      const initialLength = mockJpPolice.length;
      mockJpPolice = mockJpPolice.filter(p => String(p.code) !== String(req.params.code));
      if (mockJpPolice.length === initialLength) {
        return res.status(404).json({ error: 'ID galat hai ya Record nahi mila' });
      }
      return res.status(200).json({ message: 'Success' });
    }

    const result = await JpPolice.deleteOne({ code: req.params.code });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ID galat hai ya Record nahi mila' });
    }
    res.status(200).json({ message: 'Success' });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.delete('/delete-complaint/:id', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    console.log(`[Backend API] Received DELETE request for ID/Code: ${req.params.id}`);
    
    if (isDbConnected) {
      console.log(`[Backend API] Connected to DB, attempting deleteOne({ code: '${req.params.id}' })`);
      // Try deleting by code first, then fallback to _id if it's a valid ObjectId
      let result = await JpPolice.deleteOne({ code: req.params.id });
      
      if (result.deletedCount === 0 && req.params.id.length === 24) {
        console.log(`[Backend API] Not found by code, attempting deleteOne({ _id: '${req.params.id}' })`);
        result = await JpPolice.deleteOne({ _id: req.params.id });
      }

      console.log(`[Backend API] Delete result:`, result);

      if (result.deletedCount === 0) {
        console.error('[Backend API] Error: Document not found with that Code or ID');
        return res.status(404).json({ error: '404: Document not found with that Code or ID' });
      }
    } else {
      console.log(`[Backend API] Using mock DB`);
      const initialLength = mockJpPolice.length;
      mockJpPolice = mockJpPolice.filter(p => String(p.code) !== String(req.params.id) && String(p._id) !== String(req.params.id));
      if (mockJpPolice.length === initialLength) {
        console.error('[Backend API] Error: Document not found in mock DB');
        return res.status(404).json({ error: '404: Document not found' });
      }
    }
    
    console.log(`[Backend API] Successfully deleted complaint`);
    res.status(200).json({ message: 'Complaint deleted successfully.' });
  } catch (error: any) {
    console.error(`[Backend API] MongoDB Error:`, error);
    res.status(500).json({ error: `MongoDB Error: ${error.message}` });
  }
});

app.delete('/api/officer/complaints/:id', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    console.log(`Attempting to delete complaint with ID: ${req.params.id}`);
    
    if (isDbConnected) {
      const deleted = await JpPolice.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Complaint not found or already deleted.' });
      }
    } else {
      const initialLength = mockJpPolice.length;
      mockJpPolice = mockJpPolice.filter(p => String(p._id) !== String(req.params.id));
      if (mockJpPolice.length === initialLength) {
        return res.status(404).json({ error: 'Complaint not found or already deleted.' });
      }
    }
    
    res.json({ message: 'Complaint deleted successfully.' });
  } catch (error: any) {
    console.error(`Error deleting complaint:`, error);
    res.status(500).json({ error: error.message });
  }
});

const syncWithDeSEC = async (userId: string) => {
  if (!userId) return;
  const desecToken = process.env.DESEC_TOKEN;
  const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
  
  if (!desecToken) {
    console.warn('[Sync] deSEC Token missing, skipping sync');
    return;
  }

  console.log(`[Sync] Starting sync for user: ${userId}`);

  try {
    const desecRes = await axios.get(`https://desec.io/api/v1/domains/${desecDomain}/rrsets/`, {
      headers: { 'Authorization': `Token ${desecToken}` },
      timeout: 8000 // Increased timeout
    });

    if (!Array.isArray(desecRes.data)) {
      console.error('[Sync] deSEC response data is not an array:', desecRes.data);
      return;
    }

    // Create a set of active subname+type combinations
    const activeRecords = new Set(desecRes.data.map((r: any) => `${r.subname}:${r.type}`));
    const activeSubnames = new Set(desecRes.data.map((r: any) => r.subname));
    
    const userDomains = await db.UserDomain.find({ userId });
    
    for (const domain of userDomains) {
      // Check if main domain record exists
      if (!activeSubnames.has(domain.subdomain)) {
        console.log(`[Sync] Domain ${domain.subdomain} not found on deSEC, removing from local DB`);
        await db.UserDomain.deleteOne({ _id: domain._id });
        continue;
      }
      
      // Check custom records
      if (domain.customRecords && domain.customRecords.length > 0) {
        const validRecords = domain.customRecords.filter((recordStr: string) => {
          try {
            const record = JSON.parse(recordStr);
            return activeRecords.has(`${record.subname}:${record.type}`);
          } catch (e) { return false; }
        });
        
        if (validRecords.length !== domain.customRecords.length) {
          console.log(`[Sync] Some custom records for ${domain.subdomain} were missing on deSEC, updating local DB`);
          await db.UserDomain.updateOne(
            { _id: domain._id },
            { $set: { customRecords: validRecords } }
          );
        }
      }
    }
    console.log(`[Sync] Finished sync for user: ${userId}`);
  } catch (e: any) {
    console.error('[Sync] Failed to sync with deSEC:', e.response?.data || e.message);
  }
};

// Get User Domains
app.get('/api/my-domains', authenticateToken, async (req: any, res) => {
  try {
    console.log(`[API] GET /api/my-domains - User: ${req.user.accountID}`);
    // Fire and forget sync to keep it fast
    syncWithDeSEC(req.user.accountID).catch(e => console.error('Background sync failed:', e));

    const domains = await db.UserDomain.find({ userId: req.user.accountID });
    res.json(domains);
  } catch (error: any) {
    console.error(`[API] Error in /api/my-domains:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Fast Domain Status Check (for 1/1 button)
app.get('/api/domain-status', authenticateToken, async (req: any, res) => {
  try {
    console.log(`[API] GET /api/domain-status - User: ${req.user.accountID}`);
    const domains = await db.UserDomain.find({ userId: req.user.accountID });
    res.json({ count: domains.length, hasDomain: domains.length > 0 });
  } catch (error: any) {
    console.error(`[API] Error in /api/domain-status:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Alias for backward compatibility if needed
app.get('/api/domains', authenticateToken, async (req: any, res) => {
  try {
    await syncWithDeSEC(req.user.accountID);

    const domains = await db.UserDomain.find({ userId: req.user.accountID });
    res.json(domains);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register Domain via deSEC
app.post('/api/register-bank', authenticateToken, async (req: any, res) => {
  try {
    const existingDomains = await db.UserDomain.find({ userId: req.user.accountID });
    if (existingDomains && existingDomains.length >= 1) {
      return res.status(400).json({ error: 'You can only register one domain.' });
    }

    const { subdomain, recordType, targetValue } = req.body;
    if (!subdomain || !recordType || !targetValue) {
      return res.status(400).json({ error: 'Subdomain, record type, and target are required.' });
    }

    const user = await db.User.findOne({ accountID: req.user.accountID });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
    if (!desecToken) {
      return res.status(500).json({ error: 'deSEC credentials are not configured.' });
    }

    let finalTarget = targetValue;
    if (recordType === 'CNAME' && !finalTarget.endsWith('.')) {
      finalTarget += '.';
    }

    // Call deSEC API
    const response = await axios.post(
      `https://desec.io/api/v1/domains/${desecDomain}/rrsets/`,
      {
        subname: subdomain,
        type: recordType,
        ttl: 3600,
        records: [finalTarget]
      },
      {
        headers: {
          'Authorization': `Token ${desecToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save to database
    const newDomain = await db.UserDomain.create({
      userId: user.accountID,
      username: user.username,
      subdomain,
      recordType,
      targetValue: finalTarget,
      status: 'RESERVED',
      customRecords: []
    });

    res.status(201).json({ message: 'Domain registered successfully.', data: newDomain });
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || error.response?.data || error.message;
    res.status(500).json({ error: `Failed to register domain: ${JSON.stringify(errorMsg)}` });
  }
});

// Update Domain Target
app.put('/api/domains/:id', authenticateToken, async (req: any, res) => {
  try {
    const { targetValue } = req.body;
    const domain = await db.UserDomain.find({ _id: req.params.id, userId: req.user.accountID }).then(res => res[0]);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
    let finalTarget = targetValue;
    if ((domain.recordType === 'CNAME' || domain.recordType === 'MX') && !finalTarget.endsWith('.')) {
      finalTarget += '.';
    }

    // deSEC API - Update RRset using PUT with POST fallback
    const subname = domain.subdomain === '@' ? '' : domain.subdomain;
    try {
      await axios.put(
        `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${subname}/${domain.recordType}/`,
        {
          subname: subname,
          type: domain.recordType,
          records: [finalTarget],
          ttl: 3600
        },
        { headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' } }
      );
    } catch (putError: any) {
      if (putError.response?.status === 404) {
        // If RRset doesn't exist, create it with POST
        await axios.post(
          `https://desec.io/api/v1/domains/${desecDomain}/rrsets/`,
          {
            subname: subname,
            type: domain.recordType,
            records: [finalTarget],
            ttl: 3600
          },
          { headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' } }
        );
      } else {
        throw putError;
      }
    }

    await db.UserDomain.updateOne({ _id: domain._id }, { $set: { targetValue: finalTarget, status: 'ACTIVE' } });
    res.json({ message: 'Domain updated successfully.' });
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    res.status(500).json({ error: `Failed to update domain: ${JSON.stringify(errorMsg)}` });
  }
});

// Delete Domain
app.delete('/api/domains/:id', authenticateToken, async (req: any, res) => {
  try {
    const domain = await db.UserDomain.find({ _id: req.params.id, userId: req.user.accountID }).then(res => res[0]);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';

    // Delete main record
    let success = false;
    try {
      const response = await axios.delete(
        `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${domain.subdomain}/${domain.recordType}/`,
        { headers: { 'Authorization': `Token ${desecToken}` } }
      );
      if (response.status === 204) {
        success = true;
      }
    } catch (e: any) { 
      console.error('deSEC delete error', e.response?.data);
      if (e.response?.status === 404) {
        success = true; // Already deleted from deSEC
      }
    }

    if (success) {
      // Delete custom records
      for (const record of (domain.customRecords || [])) {
        try {
          await axios.delete(
            `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${record.subname}/${record.type}/`,
            { headers: { 'Authorization': `Token ${desecToken}` } }
          );
        } catch (e: any) { console.error('deSEC custom record delete error', e.response?.data); }
      }

      await db.UserDomain.deleteOne({ _id: domain._id });
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete domain from deSEC.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add Custom Record
app.post('/api/domains/:id/records', authenticateToken, async (req: any, res) => {
  try {
    const { type, subname, value, ttl } = req.body;
    
    if (type !== 'TXT') {
      return res.status(400).json({ error: 'Only TXT records are allowed as custom records.' });
    }
    
    // Validate ID to avoid Cast Error
    if (isDbConnected && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid domain ID format' });
    }

    const domain = await db.UserDomain.find({ _id: req.params.id, userId: req.user.accountID }).then(res => res[0]);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    if (domain.customRecords && domain.customRecords.length >= 1) {
      return res.status(400).json({ error: 'Maximum 1 custom record allowed.' });
    }

    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
    
    let finalValue = value;
    // Rule 3: Auto-Dot for CNAME
    if (type === 'CNAME' && !finalValue.endsWith('.')) finalValue += '.';
    // Rule 2: Double Quote Wrapper for TXT
    if (type === 'TXT' && !finalValue.startsWith('"')) finalValue = `"${finalValue}"`;
    
    // Rule 1: Force/Default TTL
    const finalTtl = ttl ? parseInt(ttl) : 3600;

    let fullSubname;
    if (type === 'TXT' && subname) {
      fullSubname = subname;
    } else {
      fullSubname = subname ? `${subname}.${domain.subdomain}` : domain.subdomain;
    }
    fullSubname = fullSubname === '@' ? '' : fullSubname;

    // deSEC API - Update RRset using PUT with POST fallback
    try {
      await axios.put(
        `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${fullSubname}/${type}/`,
        {
          subname: fullSubname,
          type: type,
          ttl: finalTtl,
          records: [finalValue]
        },
        { 
          headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    } catch (putError: any) {
      if (putError.response?.status === 404) {
        await axios.post(
          `https://desec.io/api/v1/domains/${desecDomain}/rrsets/`,
          {
            subname: fullSubname,
            type: type,
            ttl: finalTtl,
            records: [finalValue]
          },
          { 
            headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' },
            timeout: 5000
          }
        );
      } else {
        throw putError;
      }
    }

    // MongoDB - Push as stringified JSON to avoid Cast Error
    const recordObj = { 
      _id: Math.random().toString(36).substr(2, 9),
      type, 
      subname: fullSubname, 
      value: finalValue,
      ttl: finalTtl
    };
    const recordString = JSON.stringify(recordObj);
    
    await db.UserDomain.updateOne({ _id: domain._id }, { $push: { customRecords: recordString } });

    res.json({ message: 'Record added successfully.', record: recordObj });
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    res.status(500).json({ error: `Failed to add record: ${JSON.stringify(errorMsg)}` });
  }
});

// Edit Custom Record
app.put('/api/domains/:id/records/:recordId', authenticateToken, async (req: any, res) => {
  try {
    const { value, ttl } = req.body;
    
    if (isDbConnected && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid domain ID format' });
    }

    const domain = await db.UserDomain.find({ _id: req.params.id, userId: req.user.accountID }).then(res => res[0]);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const recordIndex = domain.customRecords.findIndex((rStr: string) => {
      try {
        const r = JSON.parse(rStr);
        return r._id === req.params.recordId;
      } catch (e) { return false; }
    });
    if (recordIndex === -1) return res.status(404).json({ error: 'Record not found' });

    const record = JSON.parse(domain.customRecords[recordIndex]);
    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
    
    let finalValue = value;
    // Rule 3: Auto-Dot for CNAME
    if (record.type === 'CNAME' && !finalValue.endsWith('.')) finalValue += '.';
    // Rule 2: Double Quote Wrapper for TXT
    if (record.type === 'TXT' && !finalValue.startsWith('"')) finalValue = `"${finalValue}"`;

    // Rule 1: Force/Default TTL
    const finalTtl = ttl ? parseInt(ttl) : 3600;

    const subname = record.subname === '@' ? '' : record.subname;

    // deSEC API - Update RRset using PUT with POST fallback
    try {
      await axios.put(
        `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${subname}/${record.type}/`,
        {
          subname: subname,
          type: record.type,
          records: [finalValue],
          ttl: finalTtl
        },
        { 
          headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
    } catch (putError: any) {
      if (putError.response?.status === 404) {
        await axios.post(
          `https://desec.io/api/v1/domains/${desecDomain}/rrsets/`,
          {
            subname: subname,
            type: record.type,
            records: [finalValue],
            ttl: finalTtl
          },
          { 
            headers: { 'Authorization': `Token ${desecToken}`, 'Content-Type': 'application/json' },
            timeout: 5000
          }
        );
      } else {
        throw putError;
      }
    }

    record.value = finalValue;
    record.ttl = finalTtl;
    domain.customRecords[recordIndex] = JSON.stringify(record);
    await db.UserDomain.updateOne({ _id: domain._id }, { $set: { customRecords: domain.customRecords } });

    res.json({ message: 'Record updated successfully.', record });
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    res.status(500).json({ error: `Failed to update record: ${JSON.stringify(errorMsg)}` });
  }
});

// Delete Custom Record
app.delete('/api/domains/:id/records/:recordId', authenticateToken, async (req: any, res) => {
  try {
    if (isDbConnected && !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid domain ID format' });
    }

    const domain = await db.UserDomain.find({ _id: req.params.id, userId: req.user.accountID }).then(res => res[0]);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const recordStr = domain.customRecords.find((rStr: string) => {
      try {
        const r = JSON.parse(rStr);
        return r._id === req.params.recordId;
      } catch (e) { return false; }
    });
    if (!recordStr) return res.status(404).json({ error: 'Record not found' });
    const record = JSON.parse(recordStr);

    const desecToken = process.env.DESEC_TOKEN;
    const desecDomain = process.env.DESEC_DOMAIN || 'jpgov.dedyn.io';
    try {
      await axios.delete(
        `https://desec.io/api/v1/domains/${desecDomain}/rrsets/${record.subname}/${record.type}/`,
        { 
          headers: { 'Authorization': `Token ${desecToken}` },
          timeout: 5000
        }
      );
    } catch (e: any) { console.error('deSEC delete error', e.response?.data); }

    const updatedRecords = domain.customRecords.filter((rStr: string) => {
      try {
        const r = JSON.parse(rStr);
        return r._id !== req.params.recordId;
      } catch (e) { return true; }
    });
    await db.UserDomain.updateOne({ _id: domain._id }, { $set: { customRecords: updatedRecords } });

    res.json({ message: 'Record deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, password, transactionPin } = req.body;
    if (!nickname || !password || !transactionPin) return res.status(400).json({ error: 'Nickname, password, and transaction PIN are required.' });

    // Generate unique ID based on count
    const count = isDbConnected ? await User.countDocuments() : mockUsers.length;
    const username = `user${101 + count}`;
    // Use username as accountID to remove the JPB-XXX system
    const accountID = username;

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedTransactionPin = await bcrypt.hash(transactionPin, 10);
    const newUser = {
      nickname,
      accountID,
      username,
      email: `${username}@jpbank.com`, // Default email
      balance: 0, // Starting balance
      password: hashedPassword,
      transactionPin: hashedTransactionPin,
      role: 'user' // Force standard client
    };

    await db.User.create(newUser);
    
    const token = jwt.sign({ accountID, role: newUser.role }, JWT_SECRET);
    res.status(201).json({ 
      token, 
      accountID, 
      username: newUser.username,
      nickname, 
      role: newUser.role,
      profilePic: ''
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Support login with @username or just username
    const cleanUsername = username?.replace(/^@/, '');
    
    // ONLY search by username, remove JPB-XXX support
    const user = await db.User.findOne({ 
      username: cleanUsername 
    });
    
    if (!user) return res.status(400).json({ error: 'Invalid Username or Password.' });

    if (user.isBanned) {
      return res.status(403).json({ error: 'ACCOUNT IS LOCKED' });
    }

    const validPassword = await bcrypt.compare(password, user.password || user.pin || '');
    if (!validPassword) return res.status(400).json({ error: 'Invalid Username or Password.' });

    const token = jwt.sign({ accountID: user.accountID, role: user.role }, JWT_SECRET);
    res.json({ 
      token, 
      accountID: user.accountID, 
      username: user.username,
      nickname: user.nickname, 
      role: user.role,
      profilePic: user.profilePic || '',
      tickType: user.tickType || '',
      isBanned: user.isBanned || false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Current User
app.get('/api/user/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await db.User.findOne({ accountID: req.user.accountID });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ 
      accountID: user.accountID, 
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      passport: user.passport,
      phone: user.phone,
      balance: user.balance, 
      role: user.role,
      contact: user.contact,
      profilePic: user.profilePic,
      tickType: user.tickType || ''
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lookup User for Transfer
app.get('/api/user/lookup/:identifier', authenticateToken, async (req: any, res) => {
  try {
    const { identifier } = req.params;
    const cleanIdentifier = identifier.replace(/^@/, '');
    
    const user = await db.User.findOne({
      $or: [
        { username: cleanIdentifier },
        { phone: identifier }
      ]
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      nickname: user.nickname,
      username: user.username,
      tickType: user.tickType || '',
      profilePic: user.profilePic
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const { contact, profilePic, nickname } = req.body;
    const user = await db.User.findOne({ accountID: req.user.accountID });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (contact !== undefined) updateData.contact = contact;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (nickname !== undefined) {
      if (nickname.length > 18) {
        return res.status(400).json({ error: 'Nickname must be max 18 characters' });
      }
      updateData.nickname = nickname;
    }

    await db.User.updateOne({ accountID: req.user.accountID }, { $set: updateData });
    const updatedUser = await db.User.findOne({ accountID: req.user.accountID });
    
    res.json({
      accountID: updatedUser.accountID,
      username: updatedUser.username,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      passport: updatedUser.passport,
      phone: updatedUser.phone,
      balance: updatedUser.balance,
      role: updatedUser.role,
      contact: updatedUser.contact,
      profilePic: updatedUser.profilePic
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Current User
app.delete('/api/user/me', authenticateToken, async (req: any, res) => {
  try {
    const result = await db.User.deleteOne({ accountID: req.user.accountID });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'Account deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change Transaction PIN
app.put('/api/user/change-pin', authenticateToken, async (req: any, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current and new PIN are required.' });
    }

    const user = await db.User.findOne({ accountID: req.user.accountID });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const validPin = await bcrypt.compare(currentPin, user.transactionPin || user.pin || '');
    if (!validPin) return res.status(400).json({ error: 'Invalid current PIN.' });

    const hashedNewPin = await bcrypt.hash(newPin, 10);
    await db.User.updateOne({ accountID: user.accountID }, { $set: { transactionPin: hashedNewPin } });

    res.json({ message: 'Transaction PIN updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer Money
app.post('/api/transaction/transfer', authenticateToken, async (req: any, res) => {
  try {
    const { receiverID, amount, transactionPin, remark } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });

    const sender = await db.User.findOne({ accountID: req.user.accountID });
    
    // Support lookup by username (case-sensitive) or phone
    const receiverQuery: any = {
      $or: [
        { username: receiverID.replace(/^@/, '') },
        { phone: receiverID }
      ]
    };
    
    const receiver = await db.User.findOne(receiverQuery);

    if (!sender || !receiver) return res.status(404).json({ error: 'Recipient account not found.' });
    if (sender.accountID === receiver.accountID) return res.status(400).json({ error: 'Cannot transfer to yourself.' });

    const validPin = await bcrypt.compare(transactionPin, sender.transactionPin || sender.pin || '');
    if (!validPin) return res.status(400).json({ error: 'Invalid Transaction PIN.' });

    if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient Reserves.' });

    // Perform transfer
    await db.User.updateOne({ accountID: sender.accountID }, { $inc: { balance: -amount } });
    await db.User.updateOne({ accountID: receiver.accountID }, { $inc: { balance: amount } });

    await db.Transaction.create({
      sender: sender.accountID,
      receiver: receiver.accountID,
      amount,
      type: 'transfer',
      remark: remark || ''
    });

    res.json({ message: 'Transaction Successful.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Transaction History
app.get('/api/transaction/history', authenticateToken, async (req: any, res) => {
  try {
    const accountID = req.user.accountID;
    const isOfficer = req.user.role === 'officer';
    
    let transactions;
    if (isOfficer) {
      transactions = await db.Transaction.find();
    } else {
      const sent = await db.Transaction.find({ sender: accountID });
      const received = await db.Transaction.find({ receiver: accountID });
      transactions = [...sent, ...received].sort((a, b) => b.date.getTime() - a.date.getTime());
      
      const uniqueIds = new Set();
      transactions = transactions.filter(t => {
        const id = t._id ? t._id.toString() : t.date.getTime().toString();
        if (uniqueIds.has(id)) return false;
        uniqueIds.add(id);
        return true;
      });
    }
    
    // Get unique IDs involved in these transactions
    const uniqueAccountIDs = new Set<string>();
    transactions.forEach((t: any) => {
      if (t.sender) uniqueAccountIDs.add(t.sender);
      if (t.receiver) uniqueAccountIDs.add(t.receiver);
    });

    const involvedUsers = await db.User.find({
      accountID: { $in: Array.from(uniqueAccountIDs) }
    });

    const userData: Record<string, { username: string, profilePic: string, tickType: string, nickname: string, email: string, phone: string }> = {};
    involvedUsers.forEach((u: any) => {
      userData[u.accountID] = {
        username: u.username,
        profilePic: u.profilePic || '',
        tickType: u.tickType || '',
        nickname: u.nickname || '',
        email: u.email || '',
        phone: u.phone || ''
      };
    });

    const mappedTransactions = transactions.map((t: any) => {
      const senderData = userData[t.sender] || { username: t.sender, profilePic: '', tickType: '', nickname: '', email: '', phone: '' };
      const receiverData = userData[t.receiver] || { username: t.receiver, profilePic: '', tickType: '', nickname: '', email: '', phone: '' };
      return {
        ...(t.toObject ? t.toObject() : t),
        senderUsername: senderData.username,
        senderProfilePic: senderData.profilePic,
        senderTickType: senderData.tickType,
        senderNickname: senderData.nickname,
        senderEmail: senderData.email,
        senderPhone: senderData.phone,
        receiverUsername: receiverData.username,
        receiverProfilePic: receiverData.profilePic,
        receiverTickType: receiverData.tickType,
        receiverNickname: receiverData.nickname,
        receiverEmail: receiverData.email,
        receiverPhone: receiverData.phone
      };
    });
    
    res.json(mappedTransactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Transaction Details
app.get('/api/transaction/:id', authenticateToken, async (req: any, res) => {
  console.log(`[Transaction API] Fetching details for ID: ${req.params.id} requested by ${req.user.accountID}`);
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'Invalid transaction ID sequence.' });
    }

    const t = await db.Transaction.findById(id);
    if (!t) {
      console.warn(`[Transaction API] Transaction NOT FOUND for ID: ${id}`);
      return res.status(404).json({ error: 'Transaction record not found.' });
    }

    // Check permissions: either owner or receiver or officer
    const isOfficer = req.user.role === 'officer';
    const isSender = t.sender === req.user.accountID;
    const isReceiver = t.receiver === req.user.accountID;

    if (!isOfficer && !isSender && !isReceiver) {
      console.warn(`[Transaction API] ACCESS DENIED for user ${req.user.accountID} on transaction ${id}`);
      return res.status(403).json({ error: 'Secure Access restricted to transaction participants.' });
    }

    const allUsers = await db.User.find({
      accountID: { $in: [t.sender, t.receiver] }
    });
    
    const userData: Record<string, any> = {};
    allUsers.forEach((u: any) => {
      userData[u.accountID] = {
        username: u.username,
        profilePic: u.profilePic || '',
        tickType: u.tickType || '',
        nickname: u.nickname || '',
        email: u.email || '',
        phone: u.phone || ''
      };
    });

    const senderData = userData[t.sender] || { username: t.sender, profilePic: '', tickType: '', nickname: '', email: '', phone: '' };
    const receiverData = userData[t.receiver] || { username: t.receiver, profilePic: '', tickType: '', nickname: '', email: '', phone: '' };

    const plainT = t.toObject ? t.toObject() : t;
    const mapped = {
      ...plainT,
      senderUsername: senderData.username,
      senderProfilePic: senderData.profilePic,
      senderTickType: senderData.tickType,
      senderNickname: senderData.nickname,
      senderEmail: senderData.email,
      senderPhone: senderData.phone,
      receiverUsername: receiverData.username,
      receiverProfilePic: receiverData.profilePic,
      receiverTickType: receiverData.tickType,
      receiverNickname: receiverData.nickname,
      receiverEmail: receiverData.email,
      receiverPhone: receiverData.phone
    };
    
    console.log(`[Transaction API] Successfully returned details for ID: ${id}`);
    res.json(mapped);
  } catch (error: any) {
    console.error(`[Transaction API] ERROR:`, error);
    res.status(500).json({ error: 'System error while fetching transaction details: ' + error.message });
  }
});

// Officer: Get All Users
app.get('/api/officer/users', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const users = await db.User.find({});
    res.json(users.map((u: any) => ({ 
      accountID: u.accountID, 
      username: u.username,
      nickname: u.nickname,
      email: u.email,
      passport: u.passport,
      phone: u.phone,
      balance: u.balance,
      tickType: u.tickType || '',
      isBanned: u.isBanned || false,
      profilePic: u.profilePic || ''
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Create JPBank Account
app.post('/api/officer/create-account', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { nickname, username, phone, email, profilePic, password, transactionPin, passport } = req.body;
    
    if (!nickname || !username || !phone || !email || !password || !transactionPin) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (username.length > 18) {
      return res.status(400).json({ error: 'Username must be max 18 characters' });
    }
    if (nickname.length > 18) {
      return res.status(400).json({ error: 'Nickname must be max 18 characters' });
    }

    // Phone validation: +81 or +91 followed by 10 digits
    const phoneRegex = /^(\+81|\+91)\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone must be +81 or +91 followed by 10 digits' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email already exists
    const existingUser = await db.User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    // Use username as accountID to remove the JPB-XXX system
    const accountID = username;

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedTransactionPin = await bcrypt.hash(transactionPin, 10);
    const newUser = {
      nickname,
      username,
      phone,
      email,
      profilePic: profilePic || '',
      passport: passport || '',
      accountID,
      balance: 0,
      password: hashedPassword,
      transactionPin: hashedTransactionPin,
      role: 'user',
      contact: phone
    };

    await db.User.create(newUser);
    res.status(201).json({ message: 'Account created successfully', accountID, username });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Update User Tick
app.put('/api/officer/update-tick', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { targetID, tickType } = req.body;
    if (!['', 'golden', 'blue', 'brown'].includes(tickType)) {
      return res.status(400).json({ error: 'Invalid tick type.' });
    }

    const target = await db.User.findOne({ accountID: targetID });
    if (!target) return res.status(404).json({ error: 'Account not found.' });

    await db.User.updateOne({ accountID: target.accountID }, { $set: { tickType } });

    res.json({ message: `Action: Tick updated for ${target.nickname}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Adjust Balance (Reward/Fine)
app.post('/api/officer/adjust', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { targetID, amount, type, remark } = req.body; // type: 'reward' or 'fine'
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });
    if (!['reward', 'fine'].includes(type)) return res.status(400).json({ error: 'Invalid adjustment type.' });

    const target = await db.User.findOne({ accountID: targetID });
    if (!target) return res.status(404).json({ error: 'Account not found.' });

    const adjustment = type === 'reward' ? amount : -amount;
    
    // Allow negative balances for fines if needed, or block it
    if (type === 'fine' && target.balance < amount) {
      return res.status(400).json({ error: 'Insufficient Reserves for this fine.' });
    }

    await db.User.updateOne({ accountID: target.accountID }, { $inc: { balance: adjustment } });

    await db.Transaction.create({
      sender: 'CENTRAL_OFFICER',
      receiver: target.accountID,
      amount,
      type,
      remark: remark || ''
    });

    res.json({ message: `Transaction: ${type} applied.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Update User Account (All fields)
app.put('/api/officer/users/:accountID', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { nickname, username, phone, email, profilePic, passport, balance, tickType, password, transactionPin, isBanned } = req.body;
    const target = await db.User.findOne({ accountID: req.params.accountID });
    
    if (!target) return res.status(404).json({ error: 'Account not found.' });

    const updateData: any = {};
    if (nickname !== undefined) {
      if (nickname.length > 18) {
        return res.status(400).json({ error: 'Nickname must be max 18 characters' });
      }
      updateData.nickname = nickname;
    }
    if (username !== undefined) {
      if (username.length > 18) {
        return res.status(400).json({ error: 'Username must be max 18 characters' });
      }
      updateData.username = username;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (passport !== undefined) updateData.passport = passport;
    if (balance !== undefined) updateData.balance = balance;
    if (tickType !== undefined) updateData.tickType = tickType;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (transactionPin) {
      updateData.transactionPin = await bcrypt.hash(transactionPin, 10);
    }

    await db.User.updateOne({ accountID: target.accountID }, { $set: updateData });

    res.json({ message: 'Account updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Delete User Account
app.delete('/api/officer/users/:accountID', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const result = await db.User.deleteOne({ accountID: req.params.accountID });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Account not found.' });
    res.json({ message: 'Account deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Maintenance Mode APIs
app.get('/api/maintenance', async (req, res) => {
  try {
    const status = await db.Maintenance.find({});
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/officer/maintenance', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { page, isEnabled } = req.body;
    await db.Maintenance.updateOne({ page }, { $set: { isEnabled } }, { upsert: true });
    res.json({ message: `Maintenance mode for ${page} updated.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Officer: Nuke All Transactions
app.delete('/api/officer/nuke-transactions', authenticateToken, requireOfficer, async (req: any, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required for verification.' });
    }

    const user = await db.User.findOne({ accountID: req.user.accountID });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password. Nuke aborted.' });
    }

    const result = await db.Transaction.deleteMany({});
    res.json({ message: 'All transactions have been nuked successfully.', deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for undefined API routes to avoid falling through to Vite (returning HTML)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API Endpoint Not Found: ${req.method} ${req.originalUrl}` });
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
