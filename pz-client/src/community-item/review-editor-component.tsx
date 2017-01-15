import * as React from 'react';
import * as Relay from 'react-relay';

import CreateCommunityItemMutation from 'pz-client/src/community-item/create-community-item-mutation';
import classNames from 'classnames';

import EditRating from 'pz-client/src/community-item/widgets/edit-rating-component';

import ReviewTopicSelector from 'pz-client/src/community-item/widgets/review-topic-selector-component';
import GoogleTagManager from 'pz-client/src/support/google-tag-manager';
import CommunityItemEditor, {IEditorData} from 'pz-client/src/community-item/community-item-editor.component';

interface IProps {
    relay: any

    viewer: {
        id: any

        topic: {
            id: any
            serverId: number
            name: string
        }
    }

    topic?: {
        id: any
        name: string
        isCategory: boolean
    }

    fromTopic?: {
        id: any
    }

    className?: string

    autoFocus?: boolean
}

class ReviewCommunityItemEditor extends React.Component<IProps, any> {
    state = {
        rating: null,
        hasSelectedTopic: false,
        newTopicName: null
    };

    render() {
        const classes = classNames('review-editor', this.props.className);

        return (
            <div className={classes}>
                {this._renderTopicSelector()}
                {this._renderRating()}
                {this._renderCommunityItemEditor()}
            </div>
        );
    }

    private _getTopic(): {id: any, name: string} | null {
        return this.props.topic || (this.state.hasSelectedTopic && this.props.viewer.topic);
    }

    private _canChangeTopic() {
        return !this.props.topic;
    }

    private _hasSelectedTopic() {
        return this.props.topic || this.state.hasSelectedTopic;
    }

    private _renderTopicSelector() {
        if (this.props.topic) {
            return;
        }

        if (this._hasSelectedTopic()) {
            return;
        }

        return (
            <ReviewTopicSelector
                onTopicSelected={this._selectTopic.bind(this)}
                onNewTopicSelected={this._selectNewTopic.bind(this)}
                autoFocus={this.props.autoFocus}
            />
        );
    }

    private _renderRating() {
        const topic = this._getTopic();

        if (!this._hasSelectedTopic()) {
            return;
        }

        const topicName = topic ? topic.name : this.state.newTopicName;

        const clearTopicButton = this._canChangeTopic() && (
            <button
                className="clear-topic-button"
                onClick={this._clearSelectedTopic.bind(this)}
            />
        );

        return (
            <div className="editor-rating">
                <EditRating rating={this.state.rating} onChange={this._setRating.bind(this)} />

                <div className="editor-rating-label">
                    How would you rate <span className="selected-topic">{topicName}</span>?
                    {clearTopicButton}
                </div>
            </div>
        );
    }

    private _renderCommunityItemEditor() {
        if (!this._hasSelectedTopic()) {
            return;
        }

        if (!this.state.rating) {
            return;
        }

        return (
            <CommunityItemEditor
                alwaysShowSubmitButton={true}
                summaryPlaceholder="Write a summary for your review"
                viewer={this.props.viewer}
                topic={null}
                getMutationForSave={this._createReviewMutation.bind(this)}
            />
        )
    }

    private _setRating(rating: number) {
        if (!this.state.rating) {
            GoogleTagManager.triggerSetReviewRating();
        }

        this.setState({rating});
    }

    private _createReviewMutation(editorData: IEditorData) {
        const topic = this._getTopic();
        const newTopicName = this.state.newTopicName;

        if (!topic && !newTopicName) {
            throw new Error('No topic available');
        }

        GoogleTagManager.triggerReviewPost();

        const {summary, bodyData} = editorData;

        let reviewDetails: any = {
            reviewRating: this.state.rating
        };

        if (topic) {
            reviewDetails.reviewedTopicId = topic.id;
        } else {
            reviewDetails.newReviewedTopic = newTopicName;
        }

        const additionalTopicIds = this.props.fromTopic ? [this.props.fromTopic.id] : [];

        const mutation = new CreateCommunityItemMutation({
            type: 'Review',
            viewer: this.props.viewer,
            summary,
            bodyData,
            topicIds: additionalTopicIds,
            reviewDetails
        });

        return mutation;
    }

    private _selectTopic(serverId: number) {
        this.setState({hasSelectedTopic: true, newTopicName: null});
        this.props.relay.setVariables({selectedTopicServerId: serverId});
    }

    private _selectNewTopic(topicName: string) {
        this.setState({hasSelectedTopic: true, newTopicName: topicName});
        this.props.relay.setVariables({selectedTopicServerId: null});
    }

    private _clearSelectedTopic() {
        this.setState({
            hasSelectedTopic: false,
            newTopicName: null,
            rating: null
        });

        this.props.relay.setVariables({selectedTopicServerId: null});
    }
}

export default Relay.createContainer(ReviewCommunityItemEditor, {
    initialVariables: {
        selectedTopicServerId: null
    },

    fragments: {
        viewer: () => Relay.QL`
            fragment on Viewer {
                ${CreateCommunityItemMutation.getFragment('viewer')}
                ${CommunityItemEditor.getFragment('viewer')}
                
                lastCreatedCommunityItem {
                    routePath
                }
                
                topic(serverId: $selectedTopicServerId) {
                    id
                    serverId
                    name
                }
            }
        `,

        topic: () => Relay.QL`
            fragment on Topic {
                id
                name
            }
        `,

        fromTopic: () => Relay.QL`
            fragment on Topic {
                id
            }
        `
    }
});
