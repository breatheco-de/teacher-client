import React from "react";
import { Redirect, Switch, Route } from "react-router";
import { PropTypes } from "prop-types";
import { logout } from "../actions.js";
import "../../styles/home.css";
import { List, Panel, Sidebar, MenuItem, TimeLine, CheckBox, Button } from "@breathecode/ui-components";
import { Session } from "bc-react-session";
import { Context } from "../store/cohortContext.jsx";

export const Dashboard = properties => {
	const { currentCohort } = Session.getPayload();
	if (typeof currentCohort == "undefined" || !currentCohort) return <Redirect to="/dashboard" />;
	else return <Redirect to={`/cohort/${currentCohort.slug}`} />;
};

export const ChooseCohort = properties => {
	const payload = Session.getPayload();
	return (
		<Panel className="choose-view" style={{ padding: "10px" }} zDepth={1}>
			<div className="col-10 col-sm-6 mx-auto pt-5">
				<h3>Please choose a course to launch:</h3>
				<List className="courses">
					{payload.cohorts.map((cohort, i) => (
						<li key={i}>
							<button
								className="btn btn-light ml-3 float-right"
								onClick={() => {
									Session.setPayload({
										currentCohort: cohort
									});
									properties.history.push("/cohort/" + cohort.slug);
								}}>
								<i className="fas fa-external-link-alt" /> launch this course
							</button>
							<span className="cohort-name h4">{cohort.profile_slug}</span>
							<p className="cohort-description m-0">Cohort: {cohort.name}</p>
						</li>
					))}
				</List>
				<div className="text-center">
					<a className="btn btn-light" href="#" onClick={() => logout()}>
						or go ahead and logout
					</a>
				</div>
			</div>
		</Panel>
	);
};

const Menu = ({ onClick, mode, cohort }) => {
	if (mode == "home")
		return (
			<ul className="px-3">
				<MenuItem label="Syllabus" iconName="graduationCap" collapsed={false} onClick={() => onClick({ mode: "syllabus" })} />
				<MenuItem
					label="Attendancy"
					iconName="graduationCap"
					collapsed={false}
					onClick={() => onClick({ mode: "home", path: `/cohort/${cohort}/attendance` })}
				/>
			</ul>
		);
	if (mode == "syllabus")
		return (
			<Context.Consumer>
				{({ store }) => (
					<TimeLine
						height="100%"
						days={store.syllabus}
						onClick={day => onClick({ mode: "syllabus", path: `/cohort/${cohort}/d/${day.dayNumber}` })}
					/>
				)}
			</Context.Consumer>
		);

	return <div className="alert alert-danger">Invalid Menu Type: {mode}</div>;
};
Menu.propTypes = {
	cohort: PropTypes.string.isRequired,
	mode: PropTypes.string.isRequired,
	onClick: PropTypes.func.isRequired
};

class AttendancyView extends React.Component {
	constructor() {
		super();
		this.state = {
			rsvp: []
		};
	}
	render() {
		return (
			<Context.Consumer>
				{({ store, actions }) => (
					<div className="m-0 p-0">
						<ul className="m-0 p-0">
							{store.students.map((s, i) => (
								<li key={i}>
									<CheckBox
										label={s.full_name}
										checked={this.state.rsvp.find(std => std.id === s.id) || false}
										onClick={checked =>
											checked
												? this.setState({ rsvp: this.state.rsvp.concat([s]) })
												: this.setState({ rsvp: this.state.rsvp.filter(sdt => sdt !== s.id) })
										}
									/>
								</li>
							))}
						</ul>
						<Button label="Send Attendancy Report" onClick={() => actions.saveAttendancy(this.state.attendancy)} />
					</div>
				)}
			</Context.Consumer>
		);
	}
}

const DayView = ({ match }) => (
	<Context.Consumer>
		{({ store }) => {
			const day = store.syllabus.find(d => d.dayNumber == match.params.day_number);
			if (typeof day === "undefined") return <h2>Day not found</h2>;
			return (
				<div className="row">
					<div className="col-12">
						<h2>
							<span className="badge">{day.label}</span> {day.technologies.join(",")}
						</h2>
						<p>{day.instructions || day.teacher_instructions}</p>
					</div>
				</div>
			);
		}}
	</Context.Consumer>
);
DayView.propTypes = {
	history: PropTypes.object,
	match: PropTypes.object
};

export class CohortView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			sidebarOpen: false,
			sidebarMode: "home"
		};
	}

	render() {
		return (
			<Sidebar
				menu={() => (
					<Menu
						cohort={this.props.match.params.cohort_slug}
						mode={this.state.sidebarMode}
						onClick={opt =>
							typeof opt.path == "undefined" || !opt.path ? this.setState({ sidebarMode: opt.mode }) : this.props.history.push(opt.path)
						}
					/>
				)}
				onBrandClick={() => this.setState({ sidebarMode: "home" })}>
				<Switch>
					<Route exact path={this.props.match.path + "/attendance"} component={AttendancyView} />
					<Route exact path={this.props.match.path + "/d/:day_number"} component={DayView} />
					<Route exact path={this.props.match.path} render={() => <h1>Welcome</h1>} />
					<Route render={() => <h1>Not found</h1>} />
				</Switch>
			</Sidebar>
		);
	}
}

CohortView.propTypes = {
	history: PropTypes.object,
	match: PropTypes.object
};
