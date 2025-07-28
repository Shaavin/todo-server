# Todo Server

This project is built with:

- [Express.js](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Docker](https://docs.docker.com/)
- [Jest](https://jestjs.io/)/[Supertest](https://github.com/forwardemail/supertest?tab=readme-ov-file#supertest)

## Getting started

Make sure you have a `.env` file at the root of your project with the following line:

```sh
DATABASE_URL="mysql://root:my_secret_root_pw@todo_mysql:3306/todo_db"
```

An `.env.example` file is provided for your convenience.

This project is virtualized with Docker, using an Express.js API and a MySQL database. To run the container for local development, run the command:

```sh
docker-compose up
```

The API will be hosted at <http://localhost:8080/>, and the container also provides access to Prisma Studio (an in-browswer database visualization tool) at <http://localhost:5555/>.

For rapid e2e testing, there is a bash script located at `test/test-e2e.sh`. You may need to `cd` into `/test` and give this script executable permissions, like so:

```sh
cd test
chmod +x test-e2e.sh
./test-e2e.sh
```

This will run all the e2e tests located within the `/test` subdirectory.
