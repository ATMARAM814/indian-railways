require("dotenv").config();

// Append startup-specific random bytes to JWT_SECRET to force logouts when backend restarts
if (process.env.JWT_SECRET) {
  const startupId = require("crypto").randomBytes(8).toString("hex");
  process.env.JWT_SECRET = `${process.env.JWT_SECRET}_${startupId}`;
}

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});