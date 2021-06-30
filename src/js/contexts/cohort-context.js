import React from "react";
import BC from "../utils/api.js";
import { Session } from "bc-react-session";
import { Notify } from "bc-react-notifier";

export const CohortContext = React.createContext(null);

const getState = ({ getStore, setStore }) => {
	return {
		store: {
			error: null,
			syllabus: [],
			students: [],
			replits: null
		},
		actions: {
			saveCohortAttendancy: (cohortSlug, attendancy) => {
				const { students } = getStore();
				const { currentCohort } = Session.getPayload();
				if (attendancy.length == 0) Notify.error("No attendancy to report");
				else
					BC.activity()
						.addBulk(
							students.map(({ user }) => {
								const attended = attendancy.find(a => a.id === user.id);
								return {
									id: user.id,
									email: user.email,
									user_agent: "bc/teacher",
									cohort: cohortSlug,
									day: currentCohort.cohort.current_day.toString(),
									slug: typeof attended === "undefined" || !attended ? "classroom_unattendance" : "classroom_attendance",
									data: `{ "cohort": "${cohortSlug}", "day": "${currentCohort.cohort.current_day}"}`
								};
							})
						)
						.then(resp => Notify.success("The Attendancy has been reported"))
						.catch(err => Notify.error("There was an error reporting the attendancy"));
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
		}

		componentDidMount() {
			const { currentCohort } = Session.getPayload();
			const syllabus = currentCohort.cohort.syllabus.certificate
				? currentCohort.cohort.syllabus.certificate.slug
				: currentCohort.cohort.syllabus;
			BC.syllabus()
				.get(syllabus, currentCohort.cohort.syllabus.version)
				.then(_d => {
					const data = _d.json;
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
						store: Object.assign(this.state.store, { syllabus })
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
						store: Object.assign(this.state.store, { students: resp })
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
