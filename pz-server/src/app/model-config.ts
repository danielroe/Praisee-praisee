import {pzPath, pzBuildPath} from 'pz-support/src/pz-path';

export default {
    '_meta': {
        'sources': [
            'loopback/common/models',
            'loopback/server/models',
            'loopback-component-passport/lib/models',
            pzBuildPath('pz-server', 'src/models'),
            pzBuildPath('pz-server', 'src/search/models'),
            pzBuildPath('pz-server', 'src/url-slugs/models')
        ],
        'mixins': [
            'loopback/common/mixins',
            'loopback/server/mixins',
            pzPath('pz-root', 'node_modules/loopback-ds-timestamp-mixin'),
            pzBuildPath('pz-server', 'src/url-slugs/mixins')
        ]
    },
    
    // User
    'User': {
        'dataSource': 'vagrant-postgres',
        'public': true
    },
    'AccessToken': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    'ACL': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    'RoleMapping': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    'Role': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    'UserCredential': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    'UserIdentity': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    
    // Domain
    'CommunityItem': {
        'dataSource': 'memory-db', // This is an abstract model
        'public': false,
    },
    'Review': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Comparison': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Howto': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Question': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Topic': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Product': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Vote': {
        'dataSource': 'vagrant-postgres',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'UrlSlug': {
        'dataSource': 'vagrant-postgres',
        'public': false
    },
    
    // Search
    'SearchUpdateJob': {
        'dataSource': 'vagrant-postgres',
        'public': false
    }
}