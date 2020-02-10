import React from "react";
import BC from "../utils/api.js";
import { Session } from "bc-react-session";
import { Notify } from "bc-react-notifier";

export const CohortContext = React.createContext(null);

const getState = ({ getStore, setStore }) => {
	return {
		store: {
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
							students.map(stud => {
								const attended = attendancy.find(a => a.id === stud.id);
								return {
									id: stud.id,
									email: stud.email,
									user_agent: "bc/teacher",
									cohort: cohortSlug,
									day: currentCohort.current_day.toString(),
									slug: typeof attended === "undefined" || !attended ? "classroom_unattendance" : "classroom_attendance",
									data: `{ "cohort": "${cohortSlug}", "day": "${currentCohort.current_day}"}`
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
			const full_slug =
				currentCohort.syllabus_slug && typeof currentCohort.syllabus_slug !== "undefined" && currentCohort.syllabus_slug !== ""
					? currentCohort.syllabus_slug
					: currentCohort.profile_slug;
			const [syllabus, version] = full_slug.split(".");
			BC.syllabus()
				.get(syllabus, version)
				.then(data => {
					let dayNumber = 1;
					const syllabus = [].concat.apply(
						[],
						data.weeks.map(week =>
							week.days.filter(d => d !== null).map(d => {
								d.isWeekend = d.label.toLowerCase().includes("weekend");
								d.dayNumber = null;
								if (!d.isWeekend) {
									if (d.partial == "am") d.dayNumber = dayNumber + d.partial;
									else {
										d.dayNumber = dayNumber + (d.partial || "");
										dayNumber++;
									}
								}
								return d;
							})
						)
					);
					this.setState({
						store: Object.assign(this.state.store, { syllabus })
					});
				})
				.catch(data => {
					if (typeof data.pending === "undefined") console.error(data);
					else console.warn(data.msg);
				});

			BC.cohort()
				.getStudents(currentCohort.slug)
				.then(resp => {
					this.setState({
						store: Object.assign(this.state.store, { students: resp.data })
					});
				})
				.catch(data => {
					if (typeof data.pending === "undefined") console.error(data);
					else console.warn(data.msg);
				});

			BC.replit()
				.byCohort(currentCohort.slug)
				.then(replits => {
					this.setState({
						store: Object.assign(this.state.store, { replits: replits })
					});
				})
				.catch(() => {
					console.error("Hello");
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
