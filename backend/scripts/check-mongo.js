const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGO_DB_NAME || "asset_array";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });

  try {
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    console.log(`MongoDB connection OK (${dbName})`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => undefined);
  }
}

void main();
