import createSchema from 'pz-server/src/graphql/schema-creator';

var graphqlServer = require('express-graphql');

module.exports = function startGraphQLServer(app: IApp) {
    const Schema = createSchema(app.services.remoteApp);

    // Expose a GraphQL endpoint
    app.use('/i/graphql', graphqlServer(request => ({
        graphiql: true,
        pretty: true,
        schema: Schema,
        context: {
            hasSession: !!request.user,
            user: request.user,
            sessionAccessToken: request.user && request.user.accessToken ?
                request.user.accessToken.id : null
        }
    })));
};