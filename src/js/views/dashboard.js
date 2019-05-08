import React from "react";
import { Redirect, Switch, Route, withRouter, Link } from "react-router";
import { PropTypes } from "prop-types";
import BC from "../utils/api.js";
import { logout, fetchInstructions, updateCohortDay } from "../actions.js";
import IFrameView from "./iframe.js";
import {
	List,
	Panel,
	Anchor,
	Sidebar,
	MenuItem,
	TimeLine,
	CheckBox,
	Button,
	DropLink,
	Loading,
	MarkdownParser,
	Icon
} from "@breathecode/ui-components";
import { Session } from "bc-react-session";
import { CohortContext } from "../contexts/cohort-context";
import Popover from "../components/Popover";

export const RedirectView = properties => {
	const { payload, active } = Session.get();
	if (!active || typeof payload.cohorts == "undefined") return <Redirect to="/login" />;
	else if (typeof payload.currentCohort == "undefined" || !payload.currentCohort || payload.currentCohort.length > 1)
		return <Redirect to="/choose" />;
	else return <Redirect to={`/cohort/${payload.currentCohort.slug}`} />;
};

export const ChooseCohort = properties => {
	const payload = Session.getPayload();
	if (typeof payload.cohorts == "undefined") return <Redirect to="/login" />;
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
									BC.streaming()
										.getCohort(cohort.slug)
										.then(streaming => {
											cohort.streaming = streaming;
											Session.setPayload({
												currentCohort: cohort
											});
											properties.history.push("/cohort/" + cohort.slug);
										})
										.catch(() => {
											cohort.streaming = null;
											Session.setPayload({
												currentCohort: cohort
											});
											properties.history.push("/cohort/" + cohort.slug);
										});
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

const Menu = withRouter(({ onClick, mode, cohort, match, history }) => {
	if (mode == "home") {
		const { currentCohort, bc_id, access_token, assets_token } = Session.getPayload();
		return (
			<ul className="px-3">
				<MenuItem label="Syllabus" iconName="graduationCap" collapsed={false} onClick={() => onClick({ mode: "syllabus" })} />
				<MenuItem
					label="Attendancy"
					iconName="graduationCap"
					collapsed={false}
					onClick={() => onClick({ mode: "home", path: `/cohort/${cohort}/attendance` })}
				/>
				<MenuItem label="Replits" iconName="code" collapsed={false} onClick={() => history.push(`/cohort/${cohort}/replits`)} />
				<MenuItem
					label="Code"
					iconName="code"
					collapsed={false}
					onClick={() => window.open("https://assets.breatheco.de/apps/new-project")}
				/>
				{currentCohort.streaming && (
					<MenuItem
						label="Live Class"
						iconName="youtube"
						collapsed={false}
						onClick={() => window.open(`https://assets.breatheco.de/apps/streaming-qr?cohort=${cohort}`)}
					/>
				)}
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
class AttendancyView extends React.Component {
	constructor() {
		super();
		this.state = {
			rsvp: [],
			changeDay: false,
			currentDay: 1,
			currentCohort: null
		};
	}
	componentDidMount() {
		const { currentCohort } = Session.getPayload();
		this.setState({ currentCohort, currentDay: currentCohort.current_day });
	}
	render() {
		if (!this.state.currentCohort) return <Loading show={true} />;
		return (
			<CohortContext.Consumer>
				{({ store, actions }) => (
					<div className="m-0">
						<h1>
							Attendance for day:
							{this.state.changeDay ? (
								<div className="input-group mb-3 d-inline-block" style={{ width: "200px" }}>
									<input
										type="number"
										style={{ minWidth: "60px" }}
										min={0}
										className="form-control d-inline-block"
										value={this.state.currentDay}
										onChange={e => this.setState({ currentDay: e.target.value })}
									/>
									<div
										className="input-group-append d-inline-block"
										onClick={() =>
											updateCohortDay(this.state.currentCohort.id, this.state.currentDay).then(() =>
												this.setState({ currentDay: this.state.currentDay, changeDay: false })
											)
										}>
										<span className="input-group-text bg-success">
											<i className="fas fa-check" />
										</span>
									</div>
									<div className="input-group-append d-inline-block" onClick={() => this.setState({ changeDay: false })}>
										<span className="input-group-text">
											<i className="fas fa-times" />
										</span>
									</div>
								</div>
							) : (
								<span className="badge badge-light editable" onClick={() => this.setState({ changeDay: true })}>
									{this.state.currentDay} <i className="fas fa-pencil-alt" />
								</span>
							)}
						</h1>
						<ul className="m-0 p-0">
							{store.students.map((s, i) => (
								<li key={i}>
									<CheckBox
										label={`${s.first_name} ${s.last_name ? s.last_name : ""}`}
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
							type="primary"
							className="w-100 mt-4"
							label="Send Attendancy Report"
							onClick={() => actions.saveCohortAttendancy(this.state.currentCohort.profile_slug, this.state.rsvp)}
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
			fetchInstructions(currentCohort.profile_slug, day.dayNumber)
				.then(instructions => {
					this.loading = false;
					this.setState({ instructions, day });
				})
				.catch(e => {
					this.loading = false;
					this.setState({ instructions: "# ☢ There was a problem loading this day" });
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
		const { currentCohort, bc_id, access_token, assets_token } = Session.getPayload();
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
						<Switch>
							<Route exact path={this.props.match.path + "/attendance"} component={AttendancyView} />
							<Route exact path={this.props.match.path + "/d/:day_number"} component={DayView} />
							<Route
								exact
								path={this.props.match.path + "/replits"}
								render={() => (
									<IFrameView
										src={`https://assets.breatheco.de/apps/replit-maker/?cohort=${
											currentCohort.slug
										}&teacher=${bc_id}&bc_token=${access_token}&access_token=${assets_token}`}
									/>
								)}
							/>
							<Route
								exact
								path={this.props.match.path}
								render={() => (
									<div>
										{!store.replits && (
											<div className="alert alert-danger">
												You need to set the cohort replits before continuing with the class.
												<Button onClick={() => this.props.history.push(`/cohort/${currentCohort.slug}/replits`)}>
													Click here to upload the replit links
												</Button>
												.
											</div>
										)}
										<h1>
											{currentCohort.name} <span className="badge badge-secondary">day {currentCohort.current_day}</span> 🤓
										</h1>
										<p>Here are a few extra resources you may need during your classes: </p>
										<ul>
											<li>
												<a
													target="_blank"
													rel="noopener noreferrer"
													href="https://docs.google.com/document/d/1EkyC3aF9Ga0A5chiukH8MeWVGc1XBaknvaaxmr8rUSw/edit">
													🎖The Academic department guidelines
												</a>
											</li>
											<li>
												<a target="_blank" rel="noopener noreferrer" href="https://projects.breatheco.de">
													🚴‍♀️Pool of projects for the students
												</a>
											</li>
											<li>
												<a target="_blank" rel="noopener noreferrer" href="https://content.breatheco.de/lesson/">
													📖 Ugly list of all the lessons at the academy
												</a>
											</li>
											<li>
												<a target="_blank" rel="noopener noreferrer" href="https://breatheco.de/en/assets/">
													📃 Additional assets for the students
												</a>
											</li>
										</ul>
									</div>
								)}
							/>
							<Route render={() => <h1>Not found</h1>} />
						</Switch>
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
