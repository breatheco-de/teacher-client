import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { PrivateRoute } from "bc-react-session";
import { Dashboard, ChooseCohort, CohortView } from "./views/dashboard.jsx";
import withCohort from "./store/cohortContext.jsx";
import { LoadBar } from "@breathecode/ui-components";
import { Notifier } from "bc-react-notifier";
import { LoginView, ForgotView } from "./views/auth.jsx";
//create your first component
export class Layout extends React.Component {
	render() {
		return (
			<div className="d-flex flex-column h-100">
				<LoadBar />
				<Notifier />
				<BrowserRouter>
					<Switch>
						<Route exact path="/login" component={LoginView} />
						<Route exact path="/forgot" component={ForgotView} />
						<PrivateRoute exact path="/choose" component={ChooseCohort} />
						<PrivateRoute path="/cohort/:cohort_slug" component={withCohort(CohortView)} />
						<PrivateRoute exact path="/" component={Dashboard} />
						<Route render={() => <h1>Not found!</h1>} />
					</Switch>
				</BrowserRouter>
			</div>
		);
	}
}

export default Layout;
