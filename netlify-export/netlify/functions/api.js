const mongoose = require('mongoose');

// Important: Use your MongoDB Connection String placeholder here
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jpbank:jpbank123@cluster0.xbylnfl.mongodb.net/?appName=Cluster0";

let conn = null;

exports.handler = async function(event, context) {
  // Prevent Netlify from waiting for the DB connection to close
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Connect to MongoDB using Mongoose
    if (conn == null) {
      conn = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      
      // Define User Schema
      if (!mongoose.models.User) {
        mongoose.model('User', new mongoose.Schema({
          accountID: String,
          pin: String,
          name: String,
          balance: Number,
          role: String
        }));
      }
    }

    const User = mongoose.model('User');

    // Handle POST requests (e.g., Login)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      if (body.action === 'login') {
        // Example DB Query (Uncomment when connected to real DB)
        // const user = await User.findOne({ accountID: body.accountID });
        // if (!user) throw new Error("User not found");

        // Returning proper JSON response with statusCode 200
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            success: true, 
            accountID: body.accountID, 
            balance: 10000, 
            name: "JP Bank Client",
            role: "user"
          })
        };
      }
    }

    // Default response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "JP Bank API is running successfully." })
    };

  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    // Return proper JSON error to avoid 'Unexpected end of JSON'
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Database connection failed. Please try again later.' })
    };
  }
};
