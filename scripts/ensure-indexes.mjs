import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  console.error("MONGODB_URI and MONGODB_DB must be set");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const bookings = client.db(dbName).collection("bookings");
  await bookings.createIndex(
    { slotId: 1 },
    { unique: true, partialFilterExpression: { cancelledAt: null } },
  );
  await bookings.createIndex(
    { email: 1 },
    { unique: true, partialFilterExpression: { cancelledAt: null } },
  );
  console.log("bookings indexes ensured");
} finally {
  await client.close();
}
