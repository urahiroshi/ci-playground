const gql = require('graphql-tag');
const { ApolloClient } = require('apollo-client');
const { createHttpLink } = require('apollo-link-http');
const { setContext } = require('apollo-link-context');
const { InMemoryCache } = require('apollo-cache-inmemory');
const fetch = require('node-fetch');

async function callApi({ uri, token, user, repository }) {
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    };
  });
  const httpLink = createHttpLink({ uri, fetch });
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
  return client.query({
    query: gql`{
      repository(owner: "${user}", name: "${repository}") { 
        pullRequests(first: 10, states: [MERGED]) {
          nodes {
            title
          }
        }
      }
    }`
  });
}

callApi({
  uri: 'https://api.github.com/graphql',
  token: process.env.GRAPHQL_API_TOKEN,
  user: process.env.GITHUB_USER,
  repository: process.env.GITHUB_REPOSITORY
}).then((result) => {
  console.log(JSON.stringify(result));
});
