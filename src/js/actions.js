import { Session } from "bc-react-session";
import BC from "./utils/api.js";
import { setLoading } from "@breathecode/ui-components";
import { Notify } from "bc-react-notifier";

BC.setOptions({
	getToken: (type = "api") => {
		const session = Session.get();

		if (type == "assets") {
			const token = typeof session.payload != "undefined" ? session.payload.token : "";
			return "Token " + token;
		} else if (type == "api") {
			const token = typeof session.payload != "undefined" ? session.payload.token : "";
			return "Token " + token;
		}
	},
	sessionAcademy: () => {
		const session = Session.get();
		const user = session.payload;
		if (user.currentCohort && !Array.isArray(user.currentCohort)) return user.currentCohort.cohort.academy.id;
	},
	onLoading: setLoading,
	onLogout: () => logout()
});

export const login = async (username, password, history) => {
	const auth = await BC.credentials().autenticate(username, password, "bc/student");
	const data = await BC.admissions().me(auth.token);
	const user = {
		bc_id: auth.user_id,
		token: auth.token,
		email: auth.email,

		cohorts: data.cohorts,

		bio: null,
		avatar: data.avatar_url,
		show_tutorial: typeof data.profile == "undefined" || data.profile.show_tutorial,
		github: data.github,
		first_name: data.first_name || null,
		last_name: data.last_name || null,
		created_at: data.date_joined,
		full_name: data.first_name && data.last_name ? data.first_name + " " + data.first_name : data.full_name,
		currentCohort: !Array.isArray(data.cohorts) ? null : data.cohorts.length === 1 ? data.cohorts[0] : data.cohorts
	};
	Session.start({ payload: user, expiration: 3600 * 24 });

	history.push("/");
};

export const autoLogin = async token => {
	const data = await BC.admissions().me(token);
	const user = {
		bc_id: data.id,
		token: token,
		email: data.email,

		cohorts: data.cohorts,

		bio: null,
		avatar: data.avatar_url,
		show_tutorial: typeof data.profile == "undefined" || data.profile.show_tutorial,
		github: data.github,
		first_name: data.first_name || null,
		last_name: data.last_name || null,
		created_at: data.date_joined,
		full_name: data.first_name && data.last_name ? data.first_name + " " + data.first_name : data.full_name,
		currentCohort: !Array.isArray(data.cohorts) ? null : data.cohorts.length === 1 ? data.cohorts[0] : data.cohorts
	};
	Session.start({ payload: user, expiration: 3600 * 24 });

	if (window.location.href.includes("/login")) window.location.href = "/";

	return user;
};

export const logout = (history = null) => {
	Session.destroy();
	if (history) history.push("/login");
	else window.location.href = "/login";
};

export const remind = email => {
	return BC.credentials()
		.remind(email)
		.then(data => {
			return data;
		});
};

export const fetchInstructions = (slug, dayNumber, version = "1") => {
	return BC.syllabus()
		.getInstructions(slug, dayNumber, version)
		.then(data => {
			return data;
		});
};

export const updateCohortDay = (currentCohort, currentDay) => {
	return new Promise((resolve, reject) => {
		BC.cohort()
			.update(currentCohort.cohort.id, { current_day: currentDay })
			.then(data => {
				Session.setPayload({ currentCohort: { ...currentCohort, cohort: data.data || data } });
				resolve(data);
				return data;
			})
			.catch(error => reject(error));
	});
};
