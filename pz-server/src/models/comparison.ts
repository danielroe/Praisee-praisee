import {ICommunityItemInstance} from 'pz-server/src/models/community-item';

module.exports = function (Comparison: ICommunityItemInstance) {
    Comparison.type = 'comparison';
};
