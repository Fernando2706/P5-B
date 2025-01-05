import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import {typeDefs} from "./schema.ts";
import { resolvers } from "./resolvers.ts";

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000, },
});

console.log(`Running a GraphQL API server at ${url}`);