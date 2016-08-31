import {IAppRepositoryAuthorizers} from 'pz-server/src/app/repositories';
import {AuthorizationError} from 'pz-server/src/support/authorization';
import {ITypes} from 'pz-server/src/graphql/types';
import * as graphqlRelay from 'graphql-relay';
import * as graphql from 'graphql';
import {IVote} from 'pz-server/src/votes/votes';
import convertTextToData from 'pz-server/src/content/text-to-data-converter';

var {
    GraphQLBoolean,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLSchema,
    GraphQLString
} = graphql;

var {
    connectionDefinitions,
    fromGlobalId,
    nodeDefinitions,
    connectionArgs,
    globalId,
    connectionFromArray,
    connectionFromPromisedArray,
    globalIdField,
    mutationWithClientMutationId
} = graphqlRelay;

export default function CommunityItemTypes(repositoryAuthorizers: IAppRepositoryAuthorizers, nodeInterface, types: ITypes) {
    const communityItemsAuthorizer = repositoryAuthorizers.communityItems;
    const usersAuthorizer = repositoryAuthorizers.users;
    const votesAuthorizer = repositoryAuthorizers.votes;

    const CommunityItemType = new GraphQLObjectType({
        name: 'CommunityItem',

        fields: () => ({
            id: globalIdField('CommunityItem'),

            type: {
                type: new GraphQLNonNull(GraphQLString)
            },

            summary: {
                type: GraphQLString
            },

            body: {
                type: GraphQLString
            },

            bodyData: {
                type: GraphQLString,
                resolve: (source) => JSON.stringify(source.bodyData)
            },

            createdAt: {
                type: GraphQLString
            },

            udpdatedAt: {
                type: GraphQLString
            },

            user: {
                type: types.OtherUserType,
                resolve: async (communityItem, _, {user: currentUser}) => {
                    const user = await usersAuthorizer
                        .as(currentUser)
                        .findOtherUserById(communityItem.userId)

                    return user;
                }
            },

            comments: {
                type: new GraphQLList(types.CommentType),
                resolve: async (communityItem, _, {user}) => {

                    const comments = await communityItemsAuthorizer
                        .as(user)
                        .findAllComments(communityItem.id);

                    return comments;
                }
            },
            currentUserVote: {
                type: GraphQLBoolean,
                resolve: async ({id}, __, {user}) => {
                    if (!user) return null;

                    let data = await votesAuthorizer
                        .as(user)
                        .findCurrentUserVoteForParent("CommunityItem", id);

                    if (!data || data instanceof (AuthorizationError))
                        return null;

                    let vote = data as IVote;
                    return vote.isUpVote;
                }
            },

            votes: {
                type: types.VoteAggregateType,
                resolve: async ({id}, _, {user}) => {
                    let aggregate = await votesAuthorizer
                        .as(user)
                        .getAggregateForParent("CommunityItem", id);

                    if (!aggregate || aggregate instanceof (AuthorizationError))
                        return null;

                    return aggregate;
                }
            },
        }),

        interfaces: [nodeInterface]
    });

    const CommunityItemConnection = connectionDefinitions({
        name: "CommunityItem",
        nodeType: CommunityItemType
    });

    const InputContentDataType = new GraphQLInputObjectType({
        name: 'InputContentData',

        fields: {
            type: { type: new GraphQLNonNull(GraphQLString) },
            version: { type: new GraphQLNonNull(GraphQLString) },
            value: { type: new GraphQLNonNull(GraphQLString) },
            isJson: { type: GraphQLBoolean, defaultValue: false }
        }
    });

    type TInputContentData = string | {
        type: string
        version: string
        isJson: boolean
        value: any
    }

    const parseInputContentData = (inputContentData: TInputContentData) => {
        if (typeof inputContentData === 'string') {
            return convertTextToData(inputContentData);

        } else {

            return {
                type: inputContentData.type,
                version: inputContentData.version,
                value: inputContentData.isJson ?
                    JSON.parse(inputContentData.value) : inputContentData.value,
            };
        }
    };

    const CreateCommunityItemMutation = mutationWithClientMutationId({
        name: 'CreateCommunityItem',

        inputFields: {
            type: { type: new GraphQLNonNull(GraphQLString) },
            summary: { type: new GraphQLNonNull(GraphQLString) },
            body: { type: GraphQLString },
            bodyData: { type: InputContentDataType }
        },

        outputFields: () => ({

            viewer: {
                type: types.ViewerType,
                resolve: () => ({ id: 'viewer' })
            }
        }),

        mutateAndGetPayload: async ({type, summary, body, bodyData}, context) => {
            const parsedBodyData = parseInputContentData(body || bodyData);

            const communityItem = await communityItemsAuthorizer.as(context.user).create({
                recordType: 'CommunityItem',
                type,
                summary,
                bodyData: parsedBodyData
            });

            if (communityItem instanceof AuthorizationError) {
                return { communityItem: null };
            }

            return { communityItem };
        },
    });

    const CreateCommunityItemVoteMutation = mutationWithClientMutationId({
        name: 'CreateCommunityItemVote',
        inputFields: {
            communityItemId: {
                type: new GraphQLNonNull(GraphQLString)
            },
            isUpVote: {
                type: new GraphQLNonNull(GraphQLBoolean)
            }
        },
        outputFields: () => ({
            vote: {
                type: types.VoteType,
                resolve: async ({ vote }) => {
                    return vote;
                }
            },
            communityItem: {
                type: CommunityItemType,
                resolve: async ({ communityItemId, user }) => {
                    return await communityItemsAuthorizer.as(user).findById(communityItemId);
                }
            }
        }),
        mutateAndGetPayload: async ({communityItemId, isUpVote}, {user}) => {
            let {id} = fromGlobalId(communityItemId);

            const vote = await votesAuthorizer.as(user).create({
                recordType: 'Vote',
                parentId: id,
                parentType: 'CommunityItem',
                isUpVote: isUpVote
            });

            if (vote instanceof AuthorizationError) {
                return { vote: null, communityItemId: id };
            }

            return { vote, user, communityItemId: id };
        }
    })

    const DeleteCommunityItemVoteMutation = mutationWithClientMutationId({
        name: 'DeleteCommunityItemVote',
        inputFields: {
            communityItemId: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        outputFields: () => ({
            error: {
                type: GraphQLString
            },
            vote: {
                type: types.VoteType,
                resolve: async ({ vote }) => {
                    return vote;
                }
            },
            communityItem: {
                type: CommunityItemType,
                resolve: async ({ communityItemId, user }) => {
                    return await communityItemsAuthorizer.as(user).findById(communityItemId);
                }
            }
        }),
        mutateAndGetPayload: async ({communityItemId, isUpVote}, {user}) => {
            let {id} = fromGlobalId(communityItemId);

            const voteResult = await votesAuthorizer.as(user).findCurrentUserVoteForParent("CommunityItem", id);

            if (voteResult instanceof AuthorizationError) {
                return { error: 'You are not authorized to do this', vote: null, communityItemId: id };
            }
            else {
                let deleteResult = await votesAuthorizer.as(user).destroy(voteResult);

                return { error: null, vote: null, communityItemId: id };
            }
        }
    });

    const UpdateCommunityItemVoteMutation = mutationWithClientMutationId({
        name: 'UpdateCommunityItemVote',
        inputFields: {
            communityItemId: {
                type: new GraphQLNonNull(GraphQLString)
            },
            isUpVote: {
                type: new GraphQLNonNull(GraphQLBoolean)
            }
        },
        outputFields: () => ({
            vote: {
                type: types.VoteType,
                resolve: async ({ vote }) => {
                    return vote;
                }
            },
            communityItem: {
                type: CommunityItemType,
                resolve: async ({ communityItemId, user }) => {
                    return await communityItemsAuthorizer.as(user).findById(communityItemId);
                }
            }
        }),
        mutateAndGetPayload: async ({communityItemId, isUpVote}, {user}) => {
            let {id} = fromGlobalId(communityItemId);

            const findVoteResult = await votesAuthorizer.as(user).findCurrentUserVoteForParent(
                'CommunityItem',
                id);

            if (findVoteResult instanceof AuthorizationError) {
                return { vote: null, communityItemId: id };
            }
            else {
                findVoteResult.isUpVote = isUpVote;
                const updateVoteResult = await votesAuthorizer.as(user).update(findVoteResult);

                if (findVoteResult instanceof AuthorizationError) {
                    return { vote: null, communityItemId: id };
                }
                else {
                    return { vote: updateVoteResult, user, communityItemId: id };
                }
            }
        }
    })
    return {
        CommunityItemType,
        CommunityItemConnection,
        CreateCommunityItemMutation,
        CreateCommunityItemVoteMutation,
        DeleteCommunityItemVoteMutation,
        UpdateCommunityItemVoteMutation
    };
}