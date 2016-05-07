var pzPath = require('pz-support/pz-path');

var paths = {
    publicDir: function(additionalPath) {
        return pzPath('pz-client', 'build/public', additionalPath);
    },
    
    publicScriptsDir: function(additionalPath) {
        return paths.publicDir('scripts');
    },
    
    publicStylesDir: function(additionalPath) {
        return paths.publicDir('styles');
    }
};

module.exports = paths;
