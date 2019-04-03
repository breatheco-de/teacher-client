import React from "react";
import { Redirect, Switch, Route, withRouter } from "react-router";
import { PropTypes } from "prop-types";
import { logout, fetchInstructions } from "../actions.js";
import "../../styles/home.css";
import { List, Panel, Sidebar, MenuItem, TimeLine, CheckBox, Button, DropLink, Loading, MarkdownParser } from "@breathecode/ui-components";
import { Session } from "bc-react-session";
import { CohortContext } from "../contexts/cohort-context.jsx";
import Popover from "../components/Popover.jsx";

export const Dashboard = properties => {
	const { currentCohort } = Session.getPayload();
	if (typeof currentCohort == "undefined" || !currentCohort || currentCohort.length > 1) return <Redirect to="/dashboard" />;
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

const Menu = withRouter(({ onClick, mode, cohort, match }) => {
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
			<CohortContext.Consumer>
				{({ store }) => (
					<TimeLine
						height="100%"
						days={store.syllabus}
						selectedOption={match.params.day_number}
						onClick={day => !day.isWeekend && onClick({ mode: "syllabus", path: `/cohort/${cohort}/d/${day.dayNumber}` })}
					/>
				)}
			</CohortContext.Consumer>
		);

	return <div className="alert alert-danger">Invalid Menu Type: {mode}</div>;
});
Menu.propTypes = {
	cohort: PropTypes.string.isRequired,
	match: PropTypes.object,
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
		const { currentCohort } = Session.getPayload();
		return (
			<CohortContext.Consumer>
				{({ store, actions }) => (
					<div className="m-0 p-0">
						<h1>Attendance for day {currentCohort.current_day}</h1>
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
						<Button
							type="info"
							className="w-100 mt-4"
							label="Send Attendancy Report"
							onClick={() => actions.saveCohortAttendancy(currentCohort.profile_slug, this.state.rsvp)}
						/>
					</div>
				)}
			</CohortContext.Consumer>
		);
	}
}

class DayView extends React.Component {
	constructor() {
		super();
		this.state = {
			instructions: null,
			day: null
		};
		this.loading = false;
	}

	loadInstructions(day) {
		const { currentCohort } = Session.getPayload();
		if (typeof currentCohort.profile_slug !== "undefined" && !this.loading) {
			this.loading = true;
			fetchInstructions(currentCohort.profile_slug, day.dayNumber).then(instructions => {
				this.loading = false;
				this.setState({ instructions, day });
			});
		}
	}
	render() {
		const { match } = this.props;
		return (
			<CohortContext.Consumer>
				{({ store }) => {
					const day = store.syllabus.find(d => d.dayNumber == match.params.day_number);
					if (typeof day == "undefined") return <Loading />;
					if (day && (!this.state.day || day.dayNumber !== this.state.day.dayNumber)) this.loadInstructions(day);
					return (
						<div className="dayview p-0 pl-3">
							<div className="description">
								<h3>
									<span className="badge badge-secondary">{day.label}</span>{" "}
									{Array.isArray(day.technologies) && day.technologies.join(",")}
								</h3>
								<p>{day.instructions || day.teacher_instructions}</p>
								{day.project && (
									<p className="info-bar">
										{day.project.instructions || day.project.url ? (
											<a
												rel="noopener noreferrer"
												target="_blank"
												href={day.project.instructions || day.project.url}
												className="a">
												Project: {day.project.title || day.project}
											</a>
										) : (
											<span>Project: {day.project.title || day.project}</span>
										)}
										{day.project.solution && (
											<a
												className="btn btn-sm btn-light ml-2"
												rel="noopener noreferrer"
												target="_blank"
												href={day.project.solution}>
												Solution
											</a>
										)}
									</p>
								)}
								{Array.isArray(day["key-concepts"]) && (
									<p className="info-bar">
										<Popover
											body={
												<ul className="bc-popover">
													{day["key-concepts"].map((k, i) => (
														<li key={i}>{k}</li>
													))}
												</ul>
											}>
											<span className="a">Key Concepts</span>
										</Popover>
									</p>
								)}
								{Array.isArray(day["replits"]) && (
									<p className="info-bar">
										<DropLink
											dropdown={day["replits"].map(r => ({
												label: r.title,
												url: `https://assets.breatheco.de/apps/replit/?r=${r.slug}`
											}))}
											onSelect={opt => window.open(opt.url)}>
											Replits
										</DropLink>
									</p>
								)}
								{Array.isArray(day["assignments"]) && (
									<p className="info-bar">
										<DropLink
											dropdown={day["assignments"].map(a => ({
												label: a,
												url: `https://projects.breatheco.de/d/${a}#readme`
											}))}
											onSelect={opt => window.open(opt.url)}>
											Assignments
										</DropLink>
									</p>
								)}
							</div>
							<div className="instructions">
								<MarkdownParser source={this.state.instructions} />
							</div>
						</div>
					);
				}}
			</CohortContext.Consumer>
		);
	}
}
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
				footer={() => (
					<div className="sidebar-footer">
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								logout();
							}}>
							<i className="fa fa-power-off" />
						</a>
					</div>
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
