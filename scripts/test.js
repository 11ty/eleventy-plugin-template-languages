// Runs tests only for workspaces whose `engines.node` matches the current Node version.
import fs from "node:fs";
import path from "node:path";
import { run } from "node:test";
import { spec } from "node:test/reporters";
import semver from "semver";

const TEST_FILE = /^(test(-.*)?|.*[.\-_]test)\.[cm]?js$/;

function findTestFiles(dir, inTestDir = false) {
	let files = [];
	for (let entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name.startsWith(".")) {
			continue;
		}
		let fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findTestFiles(fullPath, inTestDir || entry.name === "test"));
		} else if (/\.[cm]?js$/.test(entry.name) && (inTestDir || TEST_FILE.test(entry.name))) {
			files.push(fullPath);
		}
	}
	return files;
}

const { workspaces } = JSON.parse(fs.readFileSync("package.json", "utf8"));
let files = [];

for (let workspace of workspaces) {
	let pkg = JSON.parse(fs.readFileSync(path.join(workspace, "package.json"), "utf8"));
	let range = pkg.engines?.node;
	if (range && !semver.satisfies(process.version, range)) {
		console.log(`Skipping ${workspace}: requires Node ${range}, running ${process.version}`);
		continue;
	}
	files.push(...findTestFiles(path.resolve(workspace)));
}

run({ files, concurrency: true })
	.on("test:fail", () => {
		process.exitCode = 1;
	})
	.pipe(new spec())
	.pipe(process.stdout);
