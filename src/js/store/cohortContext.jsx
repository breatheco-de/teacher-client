import React from "react";
import BC from "../utils/api.js";
import { Session } from "bc-react-session";

export const Context = React.createContext(null);
const getState = ({ getStore, setStore }) => {
	return {
		store: {
			syllabus: [],
			students: []
		},
		actions: {
			getSyllabus: slug => {}
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
			BC.syllabus()
				.get(currentCohort.profile_slug)
				.then(data => {
					let dayNumber = 1;
					const syllabus = [].concat.apply(
						[],
						data.weeks.map(week =>
							week.days.filter(d => d !== null).map(d => {
								d.dayNumber = dayNumber;
								dayNumber++;
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
		}

		render() {
			return (
				<Context.Provider value={this.state}>
					<PassedComponent {...this.props} />
				</Context.Provider>
			);
		}
	}
	return StoreWrapper;
};

export default Store;
