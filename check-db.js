const { Client } = require("pg");
const bcrypt = require("bcryptjs");

(async () => {
  const client = new Client({
    host: "localhost",
    port: 5432,
    database: "ThesisManagement",
    user: "postgres",
    password: "Admin123",
  });
  await client.connect();

  // Generate correct hash for "Password"
  const correctHash = bcrypt.hashSync("Password", 12);
  console.log("Correct hash for 'Password':", correctHash);

  // Verify it works
  const verified = bcrypt.compareSync("Password", correctHash);
  console.log("Verify 'Password' matches hash:", verified);

  // Get seed account IDs
  const seedEmails = [
    "admin@uef.edu.vn",
    "hod@uef.edu.vn",
    "lecturer1@uef.edu.vn",
    "lecturer2@uef.edu.vn",
    "lecturer3@uef.edu.vn",
    "staff@uef.edu.vn",
    "2251010001@uef.edu.vn",
    "2251010002@uef.edu.vn",
    "2251010003@uef.edu.vn",
    "2251010004@uef.edu.vn",
  ];

  // Update all seed accounts with correct hash
  for (const email of seedEmails) {
    await client.query("UPDATE \"Users\" SET \"PasswordHash\" = $1, \"MustChangePassword\" = $2 WHERE \"Email\" = $3", [correctHash, false, email]);
    console.log(`Updated: ${email}`);
  }

  // Verify
  const res = await client.query("SELECT \"Email\", \"PasswordHash\", \"MustChangePassword\" FROM \"Users\" WHERE \"Email\" = ANY($1) ORDER BY \"Email\"", [seedEmails]);
  console.log("\nVerification:");
  for (const row of res.rows) {
    const matches = bcrypt.compareSync("Password", row.PasswordHash);
    console.log(`${row.Email}: matches='${matches}' mustChange=${row.MustChangePassword}`);
  }

  await client.end();
  console.log("\nDone!");
})().catch(e => { console.error(e.message); process.exit(1); });
