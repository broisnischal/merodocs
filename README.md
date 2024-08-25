# Visitor Management System

## Description

The Visitor Management System is a software solution designed to streamline the process of visitor registration, tracking, and management within an organization. This system provides a digital platform for managing visitor information, enhancing security, and improving overall visitor experience.

## Installment and Scripts

This repository contains essential scripts for managing and developing your project. Follow these steps to get started:

1. After cloning the project, run `npm install` to set up dependencies.

2. Generate Prisma client by running `npm run db:generate`

3. Seed your database using `npm run db:seed`.

4. Once the database is seeded, you can choose from various scripts to run your project:

`npm run dev`: Start your application in development mode with hot-reloading and type-checking.
`npm run start`: Start your application in production mode.


5. For building the project:

`npm run build`: Build the project using the default Nest compiler.
`npm run build:swc`: Build the project using SWC compiler with type-checking.


6. For linting and fixing code issues:

`npm run lint`: Lint your TypeScript files and automatically fix issues.


7. For database management:

`npm run db:studio`: Open Prisma Studio to interact with your database.
`npm run create:migration`: Create a new Prisma migration.
`npm run run:migration`: Run Prisma migrations in development.
`npm run sync:migration`: Apply Prisma migrations without generating SQL migration files.

## System Architecture

**Description:**

- **Client**: Represents the user interface.
- **Cloudflare**: Provides content delivery and security services.
- **NGINX**: Serves as a web server and reverse proxy.
- **API Gateway**: Manages API requests and routes.
- **Server**: Handles application logic and business operations.
- **Image**: Manages image-related tasks and storage.
- **Cloudfront**: Content delivery network for faster content distribution.
- **S3 Bucket**: Object storage for media and files.
- **Prisma**: ORM for database interactions.
- **Database**: Stores application data.
- **Firebase**: Provides notifications services.
- **Sparrow SMS**: Integrates SMS functionalities.

## Authors and Acknowledgments

**Authors:** Ujjwal Bhatta, Rojan Rana Magar, Nischal Dahal
**Acknowledgments:** Sandip Dulal (CTO) and the entire frontend, QA team, and designer.

## License

AITC
