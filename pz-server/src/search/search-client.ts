import elasticSearchConfig from 'pz-server/src/search/elasticsearch-config';
import {
    IDocumentUpdateResult,
    IDocumentPath,
    ITypePath,
    ISearchQuery,
    ISearchResults,
    IPath,
    ISearchSchema
} from 'pz-server/src/search/search';

var elasticsearch = require('elasticsearch');

export default class SearchClient {
    public elasticClient;
    
    constructor() {
        this.elasticClient = new elasticsearch.Client(elasticSearchConfig.client);
    }
    
    search(query: ISearchQuery, path?: IPath): Promise<ISearchResults> {
        if (path) {
            return this.elasticClient.search(Object.assign({}, path, {body: query}));
        } else {
            return this.elasticClient.search(query);
        }
    }
    
    createDocument(path: ITypePath, document: any): Promise<IDocumentUpdateResult> {
        return this.elasticClient.create({
            index: path.index,
            type: path.type,
            body: document
        });
    }
    
    updateDocument(path: IDocumentPath, document: any): Promise<IDocumentUpdateResult> {
        return this.elasticClient.update({
            index: path.index,
            type: path.type,
            id: path.id,
            body: {
                doc: document
            }
        });
    }
    
    createOrUpdate(path: ITypePath, query: ISearchQuery, document: any) {
        return (Promise.resolve()
            .then(() => this.search(query, path))
                
            .then((results) => {
                const resultCount = results.hits.total;
                
                if (resultCount === 1) {
                    
                    const matchedDocument = results.hits.hits[0];
                    const existingPath = {
                        index: matchedDocument._index,
                        type: matchedDocument._type,
                        id: matchedDocument._id
                    };
                    
                    return this.updateDocument(existingPath, document);
                    
                } else if (resultCount < 1) {

                    return this.createDocument(path, document);
                    
                } else {
                    
                    throw new Error('Ambiguous createOrUpdate query matches more than one result');
                    
                }
            })
        );
    }
    
    destroyDocument(path: IDocumentPath) {
        return this.elasticClient.delete({
            index: path.index,
            type: path.type,
            id: path.id,
        });
    }
    
    destroyDocumentByQuery(path: ITypePath, query: ISearchQuery) {
        return (Promise.resolve()
            .then(() => this.search(query, path))

            .then((results) => {
                const resultCount = results.hits.total;
                
                if (resultCount < 1) {
                    return;
                }

                if (resultCount === 1) {
                    const matchedDocument = results.hits.hits[0];
                    
                    const fullPath = {
                        index: matchedDocument._index,
                        type: matchedDocument._type,
                        id: matchedDocument._id
                    };

                    return this.destroyDocument(fullPath);

                } else {

                    throw new Error('Ambiguous createOrUpdate query matches more than one result');

                }
            })
        );
    }

    resetIndex(index: string, body: {} = {}): Promise<any> {
        return (Promise.resolve()
            .then(() => this.elasticClient.indices.delete({index}))
            .catch(() => { /* That's ok, let's keep going */ })

            .then(() => this.elasticClient.indices.create({index, body}))
            .catch(error => {
                console.error('Error while resetting index', error);
                throw error;
            })
        );
    }
    
    resetIndexFromSchema(schema: ISearchSchema) {
        return this.resetIndex(schema.index, {
            settings: schema.settings || {},
            mappings: schema.typeMappings || {}
        });
    }
}
