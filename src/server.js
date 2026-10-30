require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

// Start Express server listening immediately on process.env.PORT and 0.0.0.0
const server = app.listen(PORT, HOST, () => {
    console.log(`[Startup] Server listening on http://${HOST}:${PORT}`);
    console.log(`[Startup] Swagger API Docs available at: http://${HOST}:${PORT}/api-docs/`);
    console.log(`[Startup] Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check database connectivity separately only after the application starts
    sequelize
        .authenticate()
        .then(async () => {
            console.log(`Database (${sequelize.getDialect()}) connected successfully via Sequelize`);
            try {
                // Automatically ensure all tables exist in the database
                await sequelize.sync();
                console.log("Database tables synchronized successfully.");
            } catch (syncErr) {
                console.error("Table sync notice:", syncErr.message);
            }
        })
        .catch((error) => {
            console.error("Database connection notice:", error.message);
            if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
                console.warn(
                    "HINT: When deploying on Render, configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL) in Render Dashboard > Environment tab."
                );
            }
        });
});

module.exports = server;
