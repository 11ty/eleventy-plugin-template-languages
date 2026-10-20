import * as React from "react";

export function render({ name, content }) {
	return (
		<body>
			<h1>{name}</h1>
			<div dangerouslySetInnerHTML={{__html: content}}></div>
		</body>
	);
}
