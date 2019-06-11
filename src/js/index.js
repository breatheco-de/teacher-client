//import react into the bundle
import React from "react";
import ReactDOM from "react-dom";

//include your index.scss file into the bundle
import "../styles/index.scss";

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

//render your react application
ReactDOM.render(<Layout />, document.querySelector("#app"));
