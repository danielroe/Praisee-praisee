var amqp = require('amqplib/callback_api');

export interface IWorker<WorkerRequest, WorkerResponse> {
    (message: WorkerRequest): Promise<WorkerResponse>
}

export interface IWorkerRequester<WorkerRequest, WorkerResponse> {
    channelName: string
    send(message: WorkerRequest): Promise<WorkerResponse>
    sendWithTimeout(message: WorkerRequest, timeoutMilliseconds: number): Promise<WorkerResponse>
}

export interface IWorkerServer {
    registerWorker<WorkerRequest, WorkerResponse>(channel: string, worker: IWorker<WorkerRequest, WorkerResponse>)
    start(): Promise<void>
}

export interface IWorkerClient {
    connect(): Promise<void>

    isConnected: boolean

    getRequester<WorkerRequest, WorkerResponse>(channelName: string): IWorkerRequester<WorkerRequest, WorkerResponse>
}

function translateInputMessage(inputMessage) {
    let messageJson;

    try {
        messageJson = JSON.parse(inputMessage.content.toString());
    } catch(error) {
        console.error(error);
        throw new Error('Failed to parse message: ' + inputMessage.content.toString());
    }

    return messageJson;
}

function translateOutputMessage(outputMessage) {
    return new Buffer(JSON.stringify(outputMessage) || '');
}

function createPromiseHandlersThatIgnoreMultipleCalls(resolve, reject) {
    let isHandled = false;

    return {
        resolve(value) {
            if (!isHandled) {
                isHandled = true;
                return resolve(value);
            }
        },

        reject(error) {
            if (!isHandled) {
                isHandled = true;
                return reject(error);
            }
        }
    }
}

export class AmqpWorkerServer implements IWorkerServer {
    private _channelWorkers = new Map();
    private _amqpServerUrl: string;
    private _connectingPromise = null;
    private _isStartingOrStarted = false;

    constructor(amqpServerUrl: string) {
        this._amqpServerUrl = amqpServerUrl;
    }

    registerWorker(channel, worker) {
        if (this._channelWorkers.has(channel)) {
            throw new Error('Cannot create worker for existing channel: ' + channel);
        }

        this._channelWorkers.set(channel, worker);
    }

    async connect() {
        if (this._connectingPromise) {
            return await this._connectingPromise;
        }

        this._connectingPromise = new Promise((resolve, reject) => {
            amqp.connect(this._amqpServerUrl, (error, connection) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(connection);
            });
        });

        return await this._connectingPromise;
    }

    async start() {
        if (!this._channelWorkers.size) {
            throw new Error('No workers defined for any channels');
        }

        if (this._isStartingOrStarted) {
            return;
        }

        this._isStartingOrStarted = true;

        const connection = await this.connect();

        this._channelWorkers.forEach((worker, channelName) => {
            this._listenForChannelWorker(connection, channelName, worker);
        });

        console.log('Worker started. Waiting for messages.');
    }

    private _listenForChannelWorker(connection, channelName, worker) {
        console.log('Creating worker channel: ', channelName);

        connection.createConfirmChannel((error, channel) => {
            if (error) {
                throw error;
            }

            channel.assertQueue(channelName, {durable: true});
            channel.prefetch(1);
            channel.consume(channelName, (message) => {
                (worker(translateInputMessage(message))
                    .then(response => {
                        channel.sendToQueue(
                            message.properties.replyTo,
                            translateOutputMessage(response),
                            {
                                correlationId: message.properties.correlationId,
                                contentType: 'application/json',
                                mandatory: true
                            }
                        );

                        channel.ack(message);
                    })
                    .catch(error => {
                        channel.nack(message);
                        throw error;
                    })
                );
            }, {noAck: false});
        });
    }
}

class AmqpWorkerRequester<T, U> implements IWorkerRequester<T, U> {
    public channelName;

    private _client;

    constructor(channelName: string, client: AmqpWorkerClient) {
        this.channelName = channelName;

        this._client = client;
    }

    send(message: T): Promise<U> {
        return this._sendWithOptions(message);
    }

    sendWithTimeout(message: T, timeout: number): Promise<U> {
        return this._sendWithOptions(message, {expiration: timeout.toString()});
    }

    _sendWithOptions(message: T, options = {}): Promise<U> {
        return new Promise((promiseResolver, promiseRejecter) => {
            const {resolve, reject} = createPromiseHandlersThatIgnoreMultipleCalls(
                promiseResolver, promiseRejecter
            );

            this._client.connection.createConfirmChannel((error, channel) => {
                if (error) {
                    reject(error);
                    return;
                }

                channel.on('error', (error) => {
                    reject(error);
                });

                channel.on('return', () => {
                    reject(new Error('Sending message failed to route to channel: ' + this.channelName));
                });

                channel.on('close', () => {
                    reject(new Error('Channel unexpectedly closed: ' + this.channelName));
                });

                channel.assertQueue('', {exclusive: true, autoDelete: true}, (error, queue) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    var correlationId = this._generateUuid();

                    channel.consume(queue.queue, (message) => {
                        if (message.properties.correlationId == correlationId) {
                            resolve(translateInputMessage(message));
                            channel.ack(message);
                        } else if (!message) {
                            reject(new Error('Request cancelled by message queue server'));
                        }

                    }, {}, (error, ok) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                    });

                    channel.sendToQueue(this.channelName,
                        translateOutputMessage(message),

                        Object.assign({
                            correlationId,
                            replyTo: queue.queue,
                            contentType: 'application/json',
                            mandatory: true
                        }, options)
                    );
                });
            });
        });
    }

    private _generateUuid() {
        return Math.random().toString() + Math.random().toString() + Math.random().toString();
    }
}

export class AmqpWorkerClient implements IWorkerClient {
    private _connection;
    private _amqpServerUrl: string;

    constructor(amqpServerUrl: string) {
        this._amqpServerUrl = amqpServerUrl;
    }

    connect() {
        return new Promise<void>((resolve, reject) => {
            amqp.connect(this._amqpServerUrl, (error, connection) => {
                if (error) {
                    reject(error);
                    return;
                }

                this._connection = connection;
                resolve();
            });
        });
    }

    get isConnected() {
        return !!this._connection;
    }

    get connection() {
        return this._connection;
    }

    getRequester<T, U>(channelName) {
        return new AmqpWorkerRequester<T, U>(channelName, this);
    }
}