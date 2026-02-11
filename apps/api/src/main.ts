import { buildApp } from "./app";
import { env } from "./config/env";

const start = async (): Promise<void> => {
  const app = await buildApp();

  await app.listen({
    host: "0.0.0.0",
    port: env.port
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
