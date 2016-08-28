import { IRepository, IRepositoryRecord } from 'pz-server/src/support/repository';

import {
    ICursorResults, TBiCursor
} from 'pz-server/src/support/cursors/cursors';

export interface IVote extends IRepositoryRecord {
    recordType: 'Vote'

    id?: number
    userId?: number
    isUpVote?: boolean
    communityItemId?: number
    createdAt?: Date
    updatedAt?: Date
}

export interface IVotes extends IRepository {
    findById(id: number): Promise<IVote>
    findAllByIds(ids: Array<number>): Promise<Array<IVote>>
    findSomeByUserId(cursor: TBiCursor, userId: number): Promise<ICursorResults<IVote>>
    findSomeByAffectedUserId(cursor: TBiCursor, affectedUserId: number): Promise<ICursorResults<IVote>>
    getAggregateForParent(vote: IVote): Promise<IVoteAggregate> 
    findOne(vote: IVote) : Promise<IVote>
    findMany(vote: IVote): Promise<Array<IVote>>
    isOwner(userId: number, voteId: number): Promise<boolean>
    create(vote: IVote, ownerId: number): Promise<IVote>
    update(vote: IVote): Promise<IVote>
    delete(vote: IVote): Promise<boolean>
}

export interface IVoteAggregate {
    upVotes: number,
    count: number
}