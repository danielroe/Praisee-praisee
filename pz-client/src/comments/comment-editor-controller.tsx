import * as React from 'react';
import * as Relay from 'react-relay';

import EditorComponent from 'pz-client/src/editor/editor.component';
import CommunityItemContent from 'pz-client/src/editor/community-item-content.component';
import serializeEditorState from 'pz-client/src/editor/serialize-editor-state';

interface IProps {
    relay: any
    onSave: Function
    onEditing: Function
}

class Editor extends React.Component<IProps, any> {
    state = {
        editorContent: null,
        enableCommentEditor: false
    };

    render() {
        return (
            <div className="comment-editor">
                { this.state.enableCommentEditor
                    ? (<form className="editor-form" onSubmit={this._saveComment.bind(this) }>
                        <EditorComponent
                            placeholder="Share your thoughts..."
                            onChange={this._updateEditor.bind(this) }
                            />

                        <button type="submit">Save</button>
                        <button onClick={this._toggleEditor.bind(this, false)}>Cancel</button>
                    </form>)
                    : (<input type="text" className="reply-button" onClick={this._toggleEditor.bind(this, true)} value="Reply" />)
                }
            </div>
        );
    }

    private _toggleEditor(event, showEditor) {
        this.setState({ enableCommentEditor: showEditor });
        
        if(this.props.onEditing){
            this.props.onEditing(showEditor);
        }
    }

    private _saveComment(event) {
        event.preventDefault();

        if(this.props.onSave){
            this.props.onSave(serializeEditorState(this.state.editorContent));
        }

        this.setState({ enableCommentEditor: false });
        
        if(this.props.onEditing){
            this.props.onEditing(false);
        }
    }

    private _updateEditor(editorContent) {
        this.setState({ editorContent });
    }
}

export let CreateCommentEditor = Relay.createContainer(Editor, {
    fragments: {
        comment: () => Relay.QL`
            fragment on Comment {
                id
            }
        `,
        communityItem: () => Relay.QL`
            fragment on CommunityItem {
                id
            }
        `
    }
});

export var UpdateItemEditor = Relay.createContainer(Editor, {
    fragments: {
        comment: () => Relay.QL`
            fragment on Comment {
                id,
                body
            }
        `
    }
});
