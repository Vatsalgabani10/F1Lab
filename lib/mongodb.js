import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "f1lab";

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

let client;
let clientPromise;

function getClientPromise() {
  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === "development") {
    global._f1labMongoClientPromise ??= new MongoClient(uri).connect();
    clientPromise = global._f1labMongoClientPromise;
    return clientPromise;
  }

  client = new MongoClient(uri);
  clientPromise = client.connect();
  return clientPromise;
}

export async function getDb() {
  const mongoClient = await getClientPromise();
  return mongoClient.db(dbName);
}
