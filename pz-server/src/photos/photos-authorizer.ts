import {
    authorizer,
    TOptionalUser,
    NotAuthenticatedError,
    AuthorizationError
} from 'pz-server/src/support/authorization';

import {IPhotos, IPhoto} from 'pz-server/src/photos/photos';

export interface IAuthorizedPhotos {
    findById(id: number): Promise<IPhoto>
    createUploadingPhoto(): Promise<IPhoto | AuthorizationError>
    updateToUploadedPhoto(id: number, photoServerPath: string): Promise<IPhoto | AuthorizationError>
}

class AuthorizedPhotos implements IAuthorizedPhotos {
    private _user: TOptionalUser;
    private _photos: IPhotos;

    constructor(user: TOptionalUser, photos: IPhotos) {
        this._user = user;
        this._photos = photos;
    }

    findById(id: number): Promise<IPhoto> {
        return this._photos.findById(id);
    }

    async createUploadingPhoto(): Promise<IPhoto | AuthorizationError> {
        if (!this._user) {
            return new NotAuthenticatedError();
        }

        return this._photos.createUploadingPhoto(this._user.id);
    }

    async updateToUploadedPhoto(id: number, photoServerPath: string): Promise<IPhoto | AuthorizationError> {
        if (!this._user) {
            return new NotAuthenticatedError();
        }

        // For now, this is only planned to be used in the same place as
        // `createUploadingPhoto` in the same request, so it's not expected to be
        // abused. If this precondition should change, a user check should be
        // performed first to determine if the user owns the photo.

        return this._photos.updateToUploadedPhoto(id, photoServerPath);
    }
}

export default authorizer<IAuthorizedPhotos>(AuthorizedPhotos);
