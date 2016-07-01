import pzPath from 'pz-support/src/pz-path';

export default {
    '_meta': {
        'sources': [
            'loopback/common/models',
            pzPath('pz-domain', 'src/models'),
            pzPath('pz-domain', 'models')
        ],
        'mixins': [
            'loopback/common/mixins',
            pzPath('pz-root', 'node_modules/loopback-ds-timestamp-mixin'),
            pzPath('pz-domain', 'src/mixins'),
            './mixins'
        ]
    },
    
    // User
    'User': {
        'dataSource': 'pz-remote', // This is an abstract model
        'public': false,
    },

    // Domain
    'CommunityItem': {
        'dataSource': 'memory-db', // This is an abstract model
        'public': false,
    },
    'Review': {
        'dataSource': 'pz-remote',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Comparison': {
        'dataSource': 'pz-remote',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Howto': {
        'dataSource': 'pz-remote',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Question': {
        'dataSource': 'pz-remote',
        'public': true,
        '$promise': {},
        '$resolved': true
    },
    'Topic': {
        'dataSource': 'pz-remote',
        'public': true
    },
    'Product': {
        'dataSource': 'pz-remote',
        'public': true
    },
    'Vote': {
        'dataSource': 'pz-remote',
        'public': true
    }
}
