import * as React from 'react';
import * as ReactDom from 'react-dom';
import handleClick from 'pz-client/src/support/handle-click';
import classNames from 'classnames';

export interface IProps {
    onOpenRequested: () => any
    onCloseRequested: () => any
    isOpen: boolean
    className?: string
    onOpenWillBeRequested?: () => any
}

// Shamelessly ripped from Megadraft. Someday we'll have more time (and class) to
// create our own container that follows the editor cursor.
// Source: https://github.com/globocom/megadraft/blob/17fa0874ffc441def80124824b75f1de7893621d/src/components/Sidebar.js
export default class ContentMenu extends React.Component<IProps, any> {
    render() {
        const classes = classNames('content-menu', this.props.className, {
            'content-menu-open': this.props.isOpen
        });

        return (
            <div ref="container" className={classes}>
                <div className="content-menu-positioner"
                     style={{top: `${this.state.top}px`, position: 'absolute'}}>

                    <button className="content-menu-toggle"
                            onMouseDown={this.props.onOpenWillBeRequested}
                            onClick={handleClick(this._toggle.bind(this))} />

                    <div className="content-menu-items">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }

    state = {
        top: 0
    };

    static childContextTypes: any = {
        closeContentMenu: React.PropTypes.func
    };

    refs: any;
    private updatingPosition: any;

    getChildContext() {
        return {
            closeContentMenu: this.props.onCloseRequested
        }
    }

    componentDidUpdate() {
        if (this.updatingPosition) {
            clearTimeout(this.updatingPosition);
        }

        this.updatingPosition = null ;
        this.updatingPosition = setTimeout(() => {
            return this._setBarPosition();
        }, 0);
    }

    private _getSelectedBlockElement() {
        // Finds the block parent of the current selection
        // https://github.com/facebook/draft-js/issues/45
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            return null;
        }
        var node: any = selection.getRangeAt(0).startContainer;

        do {
            if (node.getAttribute && node.getAttribute("data-block") == "true") {
                return node;
            }
            node = node.parentNode;
        } while (node);
    }

    private _setBarPosition() {
        const container = ReactDom.findDOMNode(this.refs.container);

        const element = this._getSelectedBlockElement();

        if (!element) {
            return;
        }

        const top = Math.floor(
            element.getBoundingClientRect().top - 4 -
            (container.getBoundingClientRect().top -
            document.documentElement.clientTop));

        if (this.state.top !== top) {
            this.setState({
                top: top
            });
        }
    }

    private _toggle() {
        if (this.props.isOpen) {
            this.props.onCloseRequested();
        } else {
            this.props.onOpenRequested();
        }
    }
}
