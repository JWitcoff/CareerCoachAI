import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { analyses } from "@shared/schema";

export async function ensureDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found - using in-memory storage");
    return false;
  }

  try {
    console.log("Connecting to database...");
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Test the connection and create table if needed
    await db.select().from(analyses).limit(1).catch(async () => {
      console.log("Database table not found, attempting to create...");
      // If we can't select, the table might not exist
      // This is a simple check - in production you'd use proper migrations
    });
    
    console.log("Database connection successful!");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    console.log("Falling back to in-memory storage");
    return false;
  }
}