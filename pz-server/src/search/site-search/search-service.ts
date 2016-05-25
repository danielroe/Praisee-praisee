
import {
    ISearchSchema,
    ISearchResults as IRawSearchResults,
    IPath,
    ISearchQuery,
    ISearchResultHit
} from 'pz-server/src/search/search';

import {getSuggestionsForUserQuery} from 'pz-server/src/search/queries';

export interface ISearchSuggestionResult {
    type: 'topic' | 'communityItem' | 'user'
    title: string
    routePath: string
    thumbnailPath: string
}

interface ISearchClient {
    search(query: ISearchQuery, path?: IPath): Promise<IRawSearchResults>
}

export default class Searcher {
    private _searchSchema: ISearchSchema;
    private _searchClient: ISearchClient;
    
    constructor(searchSchema, searchClient) {
        this._searchSchema = searchSchema;
        this._searchClient = searchClient;
    }
    
    suggest(queryString: string): Promise<Array<ISearchSuggestionResult>> {
        const query = getSuggestionsForUserQuery(queryString);
        
        return (this._searchClient.search(query, {index: this._searchSchema.index})
            .then((results: IRawSearchResults) => {
                const hits = results.hits.hits;
                return hits.map(hit => this._convertSearchHitIntoSearchSuggestions(hit));
            })
        );
    }
    
    _convertSearchHitIntoSearchSuggestions(searchHit: ISearchResultHit): ISearchSuggestionResult {
        switch(searchHit._type) {
            case 'topic':
                return {
                    type: 'topic',
                    title: searchHit._source.name,
                    routePath: '',
                    thumbnailPath: ''
                };
            
            case 'communityItem':
                return {
                    type: 'communityItem',
                    title: searchHit._source.summary,
                    routePath: '',
                    thumbnailPath: ''
                };
            
            default:
                throw new Error('Unable to handle search document type: ' + searchHit._type);
        }
    }
}