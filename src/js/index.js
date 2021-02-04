//import react into the bundle
import React from "react";
import ReactDOM from "react-dom";

//include your index.scss file into the bundle
import "@breathecode/ui-components/dist/main.css";
import "../styles/index.scss";
import { autoLogin } from "./actions";
//import your own components
import Layout from "./layout";

// Google tag manger
import TagManager from "react-gtm-module";

const tagManagerArgs = {
	gtmId: "GTM-574Z6C5",
	auth: "HXY0OFiOxShdVVBJHK5sbg",
	preview: "env-2"
};

TagManager.initialize(tagManagerArgs);

const app = document.querySelector("#app");
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

//if token comes in the URL we have to login with that token;
console.log("token", token);
if (token && typeof token != "undefined" && token != "")
	autoLogin(token)
		.then(() => {
			ReactDOM.render(<Layout />, app);
		})
		.catch(() => {
			ReactDOM.render(<div className="alert alert-danger text-center">Invalid Credentials</div>, app);
		});
//else normal rendering
else ReactDOM.render(<Layout />, app);
