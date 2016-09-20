import * as React from 'react';
import * as Relay from 'react-relay';
import NotFoundError from 'pz-client/src/app/not-found-error.component';

import {
    appStateLoadingStatusType,
    TAppStateLoadingStatus
} from 'pz-client/src/app/client-app-router-container';

interface IContextTypes {
    notFoundHandler: Function
    appStateLoadingStatus: TAppStateLoadingStatus
}

export class App extends React.Component<any, any> {
    //set context stuff here

    static contextTypes: any = {
        notFoundHandler: React.PropTypes.func,
        appStateLoadingStatus: appStateLoadingStatusType,
        isLoadingSessionData: React.PropTypes.bool
    };

    static childContextTypes: any = {
        showNotFoundError: React.PropTypes.func,
        appViewerId: React.PropTypes.string
    };

    context: IContextTypes;

    getChildContext() {
        return {
            showNotFoundError: this._showNotFoundError.bind(this),
            appViewerId: this.props.viewer.id
        };
    }

    state = {
        showNotFoundError: false,
        notFoundErrorMessage: null
    };

    render() {
        let content = this.props.children;

        const appStateLoadingStatus = this.context.appStateLoadingStatus;
        const isReady = !appStateLoadingStatus || appStateLoadingStatus.ready;

        if (isReady && this.state.showNotFoundError) {
            content = this.state.notFoundErrorMessage;
        }

        return (
            <div className="app-namespace">
                {content}
            </div>
        );
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return nextContext.isLoadingSessionData === false;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.children !== this.props.children) {
            this.setState({
                showNotFoundError: false,
                notFoundErrorMessage: null
            });
        }
    }

    private _showNotFoundError(errorMessage?) {
        const notFoundErrorMessage = (
            <NotFoundError>
                {errorMessage}
            </NotFoundError>
        );

        if (this.context.notFoundHandler) {
            this.context.notFoundHandler(notFoundErrorMessage);

        } else {

            setTimeout(() => {
                this.setState({
                    showNotFoundError: true,
                    notFoundErrorMessage: notFoundErrorMessage
                });
            });
        }
    }
}

export default Relay.createContainer(App, {
    fragments: {
        viewer: () => Relay.QL`
            fragment on Viewer {
                id
                responseErrorsList{
                    id
                    message
                }
            }
        `
    }
});
