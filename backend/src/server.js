require("dotenv").config();

// JWT_SECRET is loaded from environment variables and remains stable across restarts

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});