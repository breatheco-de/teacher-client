import React from "react";
import { login, remind } from "../actions.js";
import { Forgot } from "@breathecode/ui-components";
import Login from "../components/Login";

export const LoginView = propers => (
	<Login
		onSubmit={(username, password) => login(username, password, propers.history)}
		logoURL={process.env.LOGO_URL}
		appName={"Teacher"}
		onForgot={() => propers.history.push("/forgot")}
	/>
);
export const ForgotView = propers => (
	<Forgot
		onSubmit={username => remind(username)}
		logoURL={process.env.LOGO_URL}
		appName={"Teacher"}
		onBackToLogin={() => propers.history.push("/login")}
	/>
);
