require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("MySQL connected successfully via Sequelize");
    } catch (error) {
        console.error("Startup error: Failed to connect to MySQL database.");
        console.error("Error details:", error.message);
        if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
            console.error(
                "HINT: Neither DB_HOST nor DATABASE_URL is set. When deploying on Render, configure your MySQL database credentials in the Render Dashboard Environment tab."
            );
        }
        process.exitCode = 1;
        return;
    }

    app.listen(PORT, HOST, () => {
        console.log(`Server running at http://${HOST}:${PORT}`);
    });
}

startServer();
