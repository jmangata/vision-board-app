import {
  defineRailway,
  github,
  group,
  postgres,
  preserve,
  project,
  service,
} from "railway/iac";

const REPO = "jmangata/vision-board-app";

export default defineRailway(() => {
  const db = postgres("postgres");

  const api = service("api", {
    source: github(REPO, {
      branch: "main",
      rootDirectory: "backend",
      checkSuites: true,
    }),
    build: "npm run prisma:generate",
    preDeploy: "npm run migrate:deploy && npm run seed",
    start: "node index.js",
    healthcheck: "/api/health",
    env: {
      NODE_ENV: "production",
      DATABASE_URL: db.env.DATABASE_URL,
      JWT_EXPIRES_IN: "7d",
      ALLOWED_ORIGINS: "https://${{web.RAILWAY_PUBLIC_DOMAIN}}",
      FRONTEND_URL: "https://${{web.RAILWAY_PUBLIC_DOMAIN}}",
      JWT_SECRET: preserve(),
      CLOUDINARY_CLOUD_NAME: preserve(),
      CLOUDINARY_API_KEY: preserve(),
      CLOUDINARY_API_SECRET: preserve(),
      UNSPLASH_ACCESS_KEY: preserve(),
      GROQ_API_KEY: preserve(),
      SMTP_HOST: preserve(),
      SMTP_PORT: preserve(),
      SMTP_USER: preserve(),
      SMTP_PASS: preserve(),
      MAIL_FROM: preserve(),
    },
  });

  const web = service("web", {
    source: github(REPO, {
      branch: "main",
      rootDirectory: "frontend",
      checkSuites: true,
    }),
    healthcheck: "/health",
    env: {
      NODE_ENV: "production",
      VITE_API_URL: "https://${{api.RAILWAY_PUBLIC_DOMAIN}}/api",
    },
  });

  return project("vision-board-app", {
    resources: [group("Vision Board", [db, api, web])],
  });
});
