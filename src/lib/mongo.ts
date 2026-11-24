import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}
if (!dbName) {
  throw new Error("MONGODB_DB is not set");
}

const globalWithMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

function connect(connectionString: string): Promise<MongoClient> {
  const promise = new MongoClient(connectionString).connect();
  promise.catch(() => {
    globalWithMongo.mongoClientPromise = undefined;
  });
  return promise;
}

export async function getDb(): Promise<Db> {
  globalWithMongo.mongoClientPromise ??= connect(uri as string);
  const client = await globalWithMongo.mongoClientPromise;
  return client.db(dbName);
}
