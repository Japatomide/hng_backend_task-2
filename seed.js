import "dotenv/config";
import mongoose from "mongoose";
import Profile from "./models/Profile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read seed data from JSON file
const seedDataPath = path.join(__dirname, "seed_data.json");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding");

    // Check if seed file exists
    if (!fs.existsSync(seedDataPath)) {
      console.error(`Seed file not found at ${seedDataPath}`);
      console.log(
        "Please place your profiles JSON file as seed_data.json in the root directory",
      );
      process.exit(1);
    }

    const rawData = fs.readFileSync(seedDataPath, "utf8");
    let profiles = JSON.parse(rawData);

    // Handle both array and { profiles: [...] } structure
    if (profiles.profiles && Array.isArray(profiles.profiles)) {
      profiles = profiles.profiles;
    }

    if (!Array.isArray(profiles)) {
      console.error("Seed data must be an array of profile objects");
      process.exit(1);
    }

    console.log(`Loaded ${profiles.length} profiles from seed file`);

    // Use bulkWrite with upsert to avoid duplicates based on unique 'name' field
    const bulkOperations = [];

    for (const profile of profiles) {
      // Ensure required fields exist
      if (
        !profile.name ||
        !profile.gender ||
        !profile.age ||
        !profile.country_id
      ) {
        console.warn(`Skipping invalid profile: ${profile.name || "unknown"}`);
        continue;
      }

      // Prepare profile data (remove _id if exists, let Mongoose handle)
      const profileData = {
        name: profile.name,
        gender: profile.gender.toLowerCase(),
        gender_probability: profile.gender_probability || 0.95,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id.toUpperCase(),
        country_name: profile.country_name,
        country_probability: profile.country_probability || 0.9,
        created_at: profile.created_at
          ? new Date(profile.created_at)
          : new Date(),
      };

      // If profile has an id field, use it; otherwise let schema generate UUID v7
      if (
        profile.id &&
        profile.id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        profileData.id = profile.id;
      }

      bulkOperations.push({
        updateOne: {
          filter: { name: profile.name },
          update: { $setOnInsert: profileData },
          upsert: true,
        },
      });
    }

    if (bulkOperations.length === 0) {
      console.error("No valid profiles to seed");
      process.exit(1);
    }

    const result = await Profile.bulkWrite(bulkOperations, { ordered: false });

    console.log(`Seeding completed:`);
    console.log(`  - Upserted: ${result.upsertedCount} new profiles`);
    console.log(`  - Matched: ${result.matchedCount} existing profiles`);
    console.log(`  - Modified: ${result.modifiedCount} profiles`);

    // Verify total count
    const totalCount = await Profile.countDocuments();
    console.log(`Total profiles in database: ${totalCount}`);

    await mongoose.disconnect();
    console.log("Seeding finished, database disconnected");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();
