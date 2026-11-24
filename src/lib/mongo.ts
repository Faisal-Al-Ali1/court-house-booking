import { MongoClient, type Db, type IndexDescription } from "mongodb";

const BOOKINGS = "bookings";
const NAMESPACE_NOT_FOUND = 26;
const REQUIRED_UNIQUE_FIELDS = ["slotId", "email"] as const;

const globalWithMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
  bookingsIndexesVerified?: Promise<void>;
};

function requireEnv(name: "MONGODB_URI" | "MONGODB_DB"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function connect(connectionString: string): Promise<MongoClient> {
  const promise = new MongoClient(connectionString).connect();
  promise.catch(() => {
    if (globalWithMongo.mongoClientPromise === promise) {
      globalWithMongo.mongoClientPromise = undefined;
    }
  });
  return promise;
}

function isExpectedShape(index: IndexDescription): boolean {
  const filter = index.partialFilterExpression as Record<string, unknown> | undefined;
  return (
    index.unique === true &&
    filter !== undefined &&
    Object.keys(filter).length === 1 &&
    filter.cancelledAt === null
  );
}

function hasOnlyPartialUniqueIndex(indexes: IndexDescription[], field: string): boolean {
  const sameKey = indexes.filter((index) => {
    const keys = Object.keys(index.key);
    return keys.length === 1 && keys[0] === field;
  });
  return sameKey.length > 0 && sameKey.every(isExpectedShape);
}

async function readIndexes(db: Db): Promise<IndexDescription[]> {
  try {
    return await db.collection(BOOKINGS).indexes();
  } catch (error) {
    if ((error as { code?: unknown }).code === NAMESPACE_NOT_FOUND) {
      return [];
    }
    throw error;
  }
}

export async function assertBookingsIndexes(db: Db): Promise<void> {
  const indexes = await readIndexes(db);
  const missing = REQUIRED_UNIQUE_FIELDS.filter(
    (field) => !hasOnlyPartialUniqueIndex(indexes, field),
  );
  if (missing.length > 0) {
    throw new Error(
      `bookings has missing or conflicting unique partial indexes on: ${missing.join(", ")}. Run scripts/ensure-indexes.mjs`,
    );
  }
}

function verifyIndexesOnce(db: Db): Promise<void> {
  const promise = assertBookingsIndexes(db);
  promise.catch(() => {
    if (globalWithMongo.bookingsIndexesVerified === promise) {
      globalWithMongo.bookingsIndexesVerified = undefined;
    }
  });
  return promise;
}

export async function getDb(): Promise<Db> {
  const uri = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DB");
  globalWithMongo.mongoClientPromise ??= connect(uri);
  const client = await globalWithMongo.mongoClientPromise;
  const db = client.db(dbName);
  globalWithMongo.bookingsIndexesVerified ??= verifyIndexesOnce(db);
  await globalWithMongo.bookingsIndexesVerified;
  return db;
}
