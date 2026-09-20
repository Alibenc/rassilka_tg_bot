import "dotenv/config";
import { Client } from "pg";

const bootstrap = async () => {
    const databaseUrl = process.env.DATABASE_URL!;

    const url = new URL(databaseUrl);
    const databaseName = url.pathname.slice(1);

    url.pathname = "/postgres";

    const client = new Client({
        connectionString: url.toString(),
    });

    await client.connect();

    const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [databaseName],
    );

    if (result.rowCount === 0) {
        await client.query(`CREATE DATABASE "${databaseName}"`);
        console.log(`Database "${databaseName}" created`);
    }

    await client.end();
}

bootstrap();