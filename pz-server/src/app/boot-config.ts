import modelConfig from 'pz-server/src/app/model-config';
import pzPath from 'pz-support/src/pz-path';

export default {
    appRootDir: pzPath('pz-server', 'src/app'),
    models: modelConfig,
    
    bootScripts: [
        pzPath('pz-server', 'src/search/search-initializer'), // Search initializer needs to come first
        pzPath('pz-server', 'src/app/auto-update-models'),
        pzPath('pz-server', 'src/app/dev-env-seeder'),
        pzPath('pz-server', 'src/remote-app/remote-app-initializer'),
        pzPath('pz-server', 'src/authentication/authentication-initializer'),
        pzPath('pz-server', 'src/graphql/graphql-initializer'),
        pzPath('pz-server', 'src/site/template-renderer'),
        pzPath('pz-server', 'src/search/site-search/search-route'),
        pzPath('pz-server', 'src/site/site-route'),
        pzPath('pz-server', 'src/site/static-assets')
    ]
};