import { pool } from "./server/db";

async function fixUsersSequence() {
  const client = await pool.connect();
  try {
    // Get the maximum ID from the users table
    const result = await client.query(
      "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM users"
    );
    const nextId = result.rows[0].next_id;

    // Reset the sequence to the correct value
    await client.query(
      `SELECT setval(pg_get_serial_sequence('users', 'id'), $1, false)`,
      [nextId]
    );

    console.log(`Users sequence reset to ${nextId}`);
    console.log("Fix completed successfully!");
  } catch (error) {
    console.error("Error fixing users sequence:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixUsersSequence();
