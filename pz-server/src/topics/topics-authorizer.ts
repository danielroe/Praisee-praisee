import {
    authorizer,
    TOptionalUser
} from 'pz-server/src/support/authorization';

import {ITopics, ITopic} from 'pz-server/src/topics/topics';

export interface IAuthorizedTopics extends ITopics {
}

class AuthorizedTopics {
    private _user: TOptionalUser;
    private _topics: ITopics;

    constructor(user: TOptionalUser, topics: ITopics) {
        this._user = user;
        this._topics = topics;
    }

    findAll() {
        return this._topics.findAll();
    }

    findById(id: number) {
        return this._topics.findById(id);
    }
}

export default authorizer<IAuthorizedTopics>(AuthorizedTopics);
