import React, { Component } from "react";
import { Panel, Loading } from "@breathecode/ui-components";
import PropTypes from "prop-types";

export default class IFrameView extends Component {
	constructor() {
		super();
		this.state = {
			loading: true
		};
	}

	render() {
		return (
			<div className="p-0">
				<Loading show={this.state.loading} />
				<iframe
					onLoad={() => this.setState({ loading: false })}
					className="lesson-iframe"
					src={this.props.src}
					width="100%"
					style={{ height: "calc(100vh - 62px)" }}
					frameBorder="0"
				/>
			</div>
		);
	}
}

IFrameView.propTypes = {
	src: PropTypes.string.isRequired
};
