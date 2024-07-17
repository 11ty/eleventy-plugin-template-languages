export function render({ name, content }) {
	return (
		<body>
			<h1>{name}</h1>
			<div>
				{content}
			</div>
		</body>
	);
}
