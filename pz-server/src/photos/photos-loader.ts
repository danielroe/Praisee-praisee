import {IPhoto, IPhotos} from 'pz-server/src/photos/photos';
import DataLoader from 'dataloader';

export default class PhotosLoader implements IPhotos {
    private _photos: IPhotos;

    private _loader: DataLoader<number, IPhoto>;

    constructor(photos: IPhotos) {
        this._photos = photos;
        this._loader = new DataLoader(this._batcher.bind(this))
    }

    findById(id: number): Promise<IPhoto> {
        return this._loader.load(id);
    }

    findAllByIds(ids: Array<number>): Promise<Array<IPhoto>> {
        return this._loader.loadMany(ids);
    }

    createUploadingPhoto(userId: number): Promise<IPhoto> {
        return this._photos.createUploadingPhoto(userId);
    }

    updateToUploadedPhoto(id: number, photoServerPath: string): Promise<IPhoto> {
        return this._photos.updateToUploadedPhoto(id, photoServerPath);
    }

    private async _batcher(ids: Array<number>): Promise<Array<IPhoto>> {
        if (ids.length > 1) {
            return this._photos.findAllByIds(ids);
        } else {
            return [await this._photos.findById(ids[0])];
        }
    }
}