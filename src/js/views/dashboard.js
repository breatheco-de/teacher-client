import React, { Fragment } from "react";
import { Redirect, Switch, Route, withRouter, Link } from "react-router";
import { PropTypes } from "prop-types";
import BC from "../utils/api.js";
import { logout, fetchInstructions, updateCohortDay } from "../actions.js";
import IFrameView from "./iframe.js";
import { List, Panel, Anchor, Sidebar, MenuItem, TimeLine, Button, DropLink, Loading, MarkdownParser, Icon } from "@breathecode/ui-components";
import { Session } from "bc-react-session";
import { CohortContext } from "../contexts/cohort-context";
import Popover from "../components/Popover";

export const RedirectView = properties => {
	const { payload, active } = Session.get();
	if (!active || typeof payload.cohorts == "undefined") return <Redirect to="/login" />;
	else if (
		typeof payload.currentCohort == "undefined" ||
		!payload.currentCohort ||
		payload.currentCohort.length == 0 ||
		payload.currentCohort.length > 1
	)
		return <Redirect to="/choose" />;
	else return <Redirect to={`/cohort/${payload.currentCohort.cohort.slug}`} />;
};

export const ChooseCohort = properties => {
	const payload = Session.getPayload();
	if (typeof payload.cohorts == "undefined") return <Redirect to="/login" />;

	return (
		<Panel className="choose-view" style={{ padding: "10px" }} zDepth={1}>
			<div className="col-10 col-md-8 mx-auto pt-5">
				<h3>Please choose a course to launch:</h3>
				<List className="courses">
					{payload.cohorts.filter(c => c.role != "STUDENT").map((c, i) => (
						<li key={i}>
							<button
								className="btn btn-light ml-3 float-right"
								onClick={() => {
									Session.setPayload({
										currentCohort: c
									});
									properties.history.push("/cohort/" + c.cohort.slug);
								}}>
								<i className="fas fa-external-link-alt" /> launch this course
							</button>
							<span className="cohort-name h4">{c.cohort.syllabus_version.name}</span>
							<p className="cohort-description m-0">Cohort: {c.cohort.name}</p>
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

const Menu = withRouter(({ onClick, mode, cohort, match, history }) => {
	if (mode == "home") {
		const { currentCohort, bc_id, token } = Session.getPayload();
		return (
			<ul className="px-3">
				<MenuItem label="Syllabus" iconName="graduationCap" collapsed={false} onClick={() => onClick({ mode: "syllabus" })} />
				<MenuItem
					label="Attendancy"
					iconName="graduate"
					collapsed={false}
					onClick={() => onClick({ mode: "home", path: `/cohort/${cohort}/attendance` })}
				/>
				<MenuItem
					label="Assignments"
					iconName="calendarCheck"
					collapsed={false}
					onClick={() => history.push(`/cohort/${cohort}/assignments`)}
				/>
				<MenuItem label="Code new project" iconName="code" collapsed={false} onClick={() => history.push(`/cohort/${cohort}/new-project`)} />
			</ul>
		);
	} else if (mode == "syllabus")
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

const CheckBox = ({ checked, onClick, label }) => (
	<div className="d-flex" onClick={() => onClick && onClick(!checked)}>
		<div>{checked ? <i className="far fa-check-square mr-2" /> : <i className="far fa-square mr-2" />}</div>
		<div>{label}</div>
	</div>
);
CheckBox.propTypes = {
	checked: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
	label: PropTypes.string
};

class CurrentDayModal extends React.Component {
	constructor() {
		super();
		this.state = { class: "danger", message: null, loading: false };
	}
	render() {
		const { currentDay, onChange, onSubmit, maxCurrentDay, currentCohort } = this.props;
		return (
			<div className="modal show d-block" role="dialog">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Please confirm the new cohort day</h5>
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body">
							{this.state.message && <div className={"alert alert-" + this.state.class}>{this.state.message}</div>}
							<input
								type="number"
								style={{ minWidth: "60px" }}
								min={1}
								max={maxCurrentDay}
								className="form-control d-inline-block"
								value={currentDay}
								onChange={e => onChange(e.target.value)}
							/>
						</div>
						<div className="modal-footer">
							<button
								type="button"
								disabled={this.state.loading}
								onClick={() => {
									this.setState({ class: "secondary", message: "Updating cohort day...", loading: true });
									updateCohortDay(currentCohort, currentDay)
										.then(data => {
											this.setState({ class: "secondary", message: "Reporting attendancy...", loading: true });
											this.props
												.getAttendance(currentCohort.cohort.slug, currentDay)
												.then(activities => onSubmit(true))
												.catch(error => this.setState({ class: "danger", message: error.message, loading: false }));
										})
										.catch(error => this.setState({ class: "danger", message: error.message, loading: false }));
								}}
								className="btn btn-primary">
								{this.state.loading ? "Loading..." : "Confirm"}
							</button>
							<button type="button" onClick={() => onSubmit(false)} className="btn btn-secondary" data-dismiss="modal">
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
CurrentDayModal.propTypes = {
	currentDay: PropTypes.number.isRequired,
	maxCurrentDay: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
	getAttendance: PropTypes.func.isRequired,
	currentCohort: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired
};

class AttendancyView extends React.Component {
	constructor() {
		super();
		this.state = {
			rsvp: [],
			currentDay: 1,
			dayDialogOpened: false,
			currentCohort: null
		};
	}
	componentDidMount() {
		const { currentCohort } = Session.getPayload();
		this.setState({ currentCohort, currentDay: currentCohort.cohort.current_day });
	}
	render() {
		if (!this.state.currentCohort) return <Loading show={true} />;
		return (
			<Fragment>
				<CohortContext.Consumer>
					{({ store, actions }) => (
						<div className="m-0">
							<h1>
								Attendance for day:
								<span className="badge badge-light editable" onClick={() => this.setState({ dayDialogOpened: true })}>
									{this.state.currentDay}
								</span>
							</h1>
							<span
								className="a text-primary pointer"
								onClick={() => this.props.history.push(`/cohort/${this.state.currentCohort.cohort.slug}/attendance/history`)}>
								Review previous attendancy
							</span>
							<ul className="m-5 p-0">
								{store.students.map((s, i) => {
									console.log(this.state.rsvp);
									const checked = this.state.rsvp.find(std => std.user.id === s.user.id) || false;
									const rsvp = this.state.rsvp.filter(sdt => sdt.user.id != s.user.id);
									return (
										<li key={i}>
											<CheckBox
												label={`${s.profile_academy.first_name} ${
													s.profile_academy.last_name ? s.profile_academy.last_name : ""
												}`}
												checked={checked}
												onClick={isCheck => this.setState({ rsvp: isCheck ? rsvp.concat(s) : rsvp })}
											/>
										</li>
									);
								})}
							</ul>
							<Button
								type="primary"
								className="w-100 mt-4"
								label="Send Attendancy Report"
								onClick={() => this.setState({ dayDialogOpened: true })}
							/>
							{this.state.dayDialogOpened && (
								<CurrentDayModal
									currentDay={this.state.currentDay}
									maxCurrentDay={store.duration_in_days}
									currentCohort={this.state.currentCohort}
									minCurrentDay={this.state.currentDay}
									getAttendance={actions.getAttendance}
									onChange={day => this.setState({ currentDay: day })}
									onSubmit={valid =>
										!valid
											? this.setState({ dayDialogOpened: false })
											: actions
													.saveCohortAttendancy(this.state.currentCohort.cohort.slug, this.state.rsvp)
													.then(() => this.setState({ dayDialogOpened: false }))
									}
								/>
							)}
						</div>
					)}
				</CohortContext.Consumer>
			</Fragment>
		);
	}
}
AttendancyView.propTypes = {
	history: PropTypes.object,
	match: PropTypes.object
};

class DayView extends React.Component {
	constructor() {
		super();
		this.state = {
			day: null,
			errorLoadingSyllabus: false
		};
		this.loading = false;
	}

	render() {
		const { currentCohort, bc_id, token } = Session.getPayload();
		const { match } = this.props;
		return (
			<CohortContext.Consumer>
				{({ store }) => {
					const day = store.syllabus.find(d => d.dayNumber == match.params.day_number);
					if (typeof day == "undefined") return <Loading />;

					return (
						<div className="dayview p-0 pl-3">
							<div className="description">
								<h3>
									<span className="badge badge-secondary">{day.label}</span>{" "}
									{Array.isArray(day.technologies) && day.technologies.join(",")}
								</h3>
								<p>{day.teacher_instructions || day.instructions}</p>
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
												url: `https://assets.breatheco.de/apps/replit/?r=${r.slug}&c=${
													currentCohort.cohort.slug
												}&token=${token}`
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
												label: a.title || a.slug || a,
												url: a.url || `https://projects.breatheco.de/d/${a.slug || a}#readme`
											}))}
											onSelect={opt => window.open(opt.url)}>
											Assignments
										</DropLink>
									</p>
								)}
								{Array.isArray(day["lessons"]) && (
									<p className="info-bar">
										<DropLink
											dropdown={day["lessons"].map(l => ({
												label: l.title || l,
												url: `https://content.breatheco.de/lesson/${l.slug || l}`
											}))}
											onSelect={opt => window.open(opt.url)}>
											Lessons
										</DropLink>
									</p>
								)}
							</div>
							<div className="instructions">
								<MarkdownParser source={day.extended_instructions} />
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
		const { currentCohort, bc_id, token, email } = Session.getPayload();
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
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								this.props.history.push("/choose");
							}}>
							<Icon type="exchange" />
						</a>
					</div>
				)}
				onBrandClick={() => {
					this.setState({ sidebarMode: "home" });
					this.props.history.push("/");
				}}>
				<CohortContext.Consumer>
					{({ store }) => (
						<>
							{store.error && <div className="alert alert-danger">{store.error.msg || store.error}</div>}
							<Switch>
								<Route exact path={this.props.match.path + "/attendance"} component={AttendancyView} />
								<Route exact path={this.props.match.path + "/d/:day_number"} component={DayView} />
								<Route
									exact
									path={this.props.match.path + "/attendance/history"}
									render={() => (
										<IFrameView
											src={`https://attendance.breatheco.de/?cohort_slug=${
												currentCohort.cohort.slug
											}&teacher=${bc_id}&token=${token}&academy=${currentCohort.cohort.academy.id}`}
										/>
									)}
								/>
								<Route
									exact
									path={this.props.match.path + "/new-project"}
									render={() => <IFrameView src={`https://assets.breatheco.de/apps/new-project/?email=${email}&token=${token}`} />}
								/>
								<Route
									exact
									path={this.props.match.path + "/assignments"}
									render={() => (
										<IFrameView src={`https://assignments.breatheco.de/?cohort=${currentCohort.cohort.id}&token=${token}`} />
									)}
								/>
								<Route
									exact
									path={this.props.match.path}
									render={() => (
										<div>
											<h1>
												{currentCohort.cohort.name}{" "}
												<span className="badge badge-secondary">day {currentCohort.cohort.current_day}</span> 🤓
											</h1>
											<p>Here are a few extra resources you may need during your classes: </p>
											<ul>
												<li>
													<a
														target="_blank"
														rel="noopener noreferrer"
														href="https://www.notion.so/4geeksacademy/Mentor-training-433451eb9dac4dc680b7c5dae1796519">
														🎖 Teacher Guidelines and best practices
													</a>
												</li>
												<li>
													<a target="_blank" rel="noopener noreferrer" href="https://projects.breatheco.de">
														🚴‍♀️Pool of projects for the students
													</a>
												</li>
												<li>
													<a target="_blank" rel="noopener noreferrer" href="https://content.breatheco.de/">
														📖 Ugly list of all the lessons at the academy
													</a>
												</li>
												<li>
													<a target="_blank" rel="noopener noreferrer" href="https://breatheco.de/en/assets/">
														📃 Additional assets for the students
													</a>
												</li>
											</ul>
											<p className="mt-3 alert alert-warning">
												<strong> ⚠️ Important</strong> All intellectual property rights are reserved. You may access all{" "}
												{"BreatheCode's"} content for your own personal use subjected to restrictions set in{" "}
												<a href="https://breatheco.de/terms-and-conditions/" target="_blank" rel="noopener noreferrer">
													these terms and conditions
												</a>
												.
											</p>
										</div>
									)}
								/>
								<Route render={() => <h1>Not found</h1>} />
							</Switch>
						</>
					)}
				</CohortContext.Consumer>
			</Sidebar>
		);
	}
}

CohortView.propTypes = {
	history: PropTypes.object,
	match: PropTypes.object
};
