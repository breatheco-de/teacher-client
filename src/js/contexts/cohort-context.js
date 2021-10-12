import React from "react";
import BC from "../utils/api.js";
import { Session } from "bc-react-session";
import { Notify } from "bc-react-notifier";

export const CohortContext = React.createContext(null);

const getState = ({ getStore, setStore }) => {
	return {
		store: {
			error: null,
			duration_in_days: 0,
			syllabus: [],
			students: [],
			replits: null
		},
		actions: {
			saveCohortAttendancy: (cohortSlug, attendancy) => {
				const { students } = getStore();
				const { currentCohort } = Session.getPayload();
				return new Promise((resolve, reject) => {
					if (attendancy.length == 0) {
						reject(new Error("No attendancy to report"));
						Notify.error("No attendancy to report");
					} else
						BC.activity()
							.addBulk(
								cohortSlug,
								students.map(({ user }) => {
									const attended = attendancy.find(a => a.user.id === user.id);
									return {
										user_id: user.id,
										user_agent: "bc/teacher",
										cohort: cohortSlug,
										day: currentCohort.cohort.current_day.toString(),
										slug: typeof attended === "undefined" || !attended ? "classroom_unattendance" : "classroom_attendance",
										data: `{ "cohort": "${cohortSlug}", "day": "${currentCohort.cohort.current_day}"}`
									};
								})
							)
							.then(resp => {
								Notify.success("The Attendancy has been reported");
								resolve(true);
							})
							.catch(err => {
								Notify.error("There was an error reporting the attendancy");
								reject(new Error("There was an error reporting the attendancy"));
							});
				});
			},
			getAttendance: (cohortSlug, day) => {
				console.log("Get attendance");
				return new Promise((resolve, reject) =>
					BC.activity()
						.getAttendance(cohortSlug)
						.then(activities => {
							const activitiesForDay = activities.filter(act => act.day == day);
							if (activitiesForDay.length === 0) resolve(activitiesForDay);
							else reject(new Error("Attendancy was already reported for day " + day));
						})
						.catch(err => reject(new Error("Could not fetch previous attendancy for validation purposes")))
				);
			}
		}
	};
};

const Store = PassedComponent => {
	class StoreWrapper extends React.Component {
		constructor(props) {
			super(props);
			this.state = getState({
				getStore: () => this.state.store,
				setStore: updatedStore =>
					this.setState({
						store: Object.assign(this.state.store, updatedStore)
					})
			});
			window.store = this.state.store;
		}

		componentDidMount() {
			const { currentCohort } = Session.getPayload();
			const syllabus = currentCohort.cohort.syllabus_version
				? currentCohort.cohort.syllabus_version.syllabus
				: currentCohort.cohort.syllabus_version;
			BC.syllabus()
				.get(syllabus, currentCohort.cohort.syllabus_version.version)
				.then(_d => {
					const data = typeof _d.json === "string" ? JSON.parse(_d.json) : _d.json;
					let dayNumber = 1;

					if (Array.isArray(data.weeks)) data.days = [].concat.apply([], data.weeks.map(week => week.days));
					const syllabus = data.days.filter(d => d !== null).map(d => {
						d.isWeekend = d.label.toLowerCase().includes("weekend");
						d.dayNumber = null;
						if (!d.isWeekend) {
							if (d.partial == "am") d.dayNumber = dayNumber + d.partial;
							else {
								d.dayNumber = dayNumber + (d.partial || "");
								dayNumber++;
							}
							if (!d.label.includes("Day")) {
								d.technologies = [d.label];
								d.label = "Day " + d.dayNumber;
							}
						}
						return d;
					});
					this.setState({
						store: Object.assign(this.state.store, { syllabus, duration_in_days: _d.duration_in_days })
					});
				})
				.catch(data => {
					if (typeof data.pending === "undefined") console.error(data);
					else console.warn(data.msg);
				});

			BC.cohort()
				.getStudents(currentCohort.cohort.slug)
				.then(resp => {
					this.setState({
						store: Object.assign(this.state.store, { students: resp.filter(u => u.role === "STUDENT") })
					});
				})
				.catch(data => {
					if (typeof data.pending === "undefined") console.error(data);
					else {
						console.warn(data.msg);
						this.setState({
							store: Object.assign(this.state.store, { error: data })
						});
					}
				});
		}

		render() {
			return (
				<CohortContext.Provider value={this.state}>
					<PassedComponent {...this.props} />
				</CohortContext.Provider>
			);
		}
	}
	return StoreWrapper;
};

export default Store;
