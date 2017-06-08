'use strict';

const fs = require('fs');

const projectFilePath = process.argv[3];
const vpcFilePath = process.argv[2];

const project = JSON.parse(fs.readFileSync(projectFilePath));
const vpc = JSON.parse(fs.readFileSync(vpcFilePath));

project.vpc = vpc;
fs.writeFileSync(projectFilePath, JSON.stringify(project, null, 2));
