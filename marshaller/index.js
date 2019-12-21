'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
/**
 * Arguments:-
 * i -> input file  (default -> stdin)
 * o -> output file (default -> stdout)
 * r -> reverse
 */
const argv = require('yargs').argv;

const filename = argv.i;
const order = argv.r ? 'unmarshall' : 'marshall';
if (filename) {
    fs.readFile(filename, 'utf8', (err, json) => {
        if (err) {
            console.error(err);
            process.exit(2);
        } else {
            writeBack(
                conv(json), argv.o
            );
        }
    });
} else {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let input = '';
    process.stdin.on('data', chunk => {
        input += chunk;
    })
    process.stdin.on('end', () => {
        writeBack(
            conv(input), argv.o
        );
    })
}

/**
 * Write to file, defaulting to stdout
 * @param {Object} returnData: Stringified data
 * @param {string} output: filename to write back to
 */
const writeBack = (returnData, output) => {
    if (output) {
        fs.writeFile(output, returnData, err => {
            if (err) {
                process.exit(4);
            } else {
                console.log('Marshall success');
            }
        })
    } else {
        console.log(returnData);
    }
}

/**
 * 
 * @param {string} json: Stringified JSON data
 */
const conv = json => {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
        let i;
        try {
            for (i = 0; i < parsed.length; ++i) {
                parsed[i] = AWS.DynamoDB.Converter[order](parsed[i]);
            }
            return JSON.stringify(parsed);
        } catch (e) {
            console.error(e);
            process.exit(8);
        }
    } else {
        try {
            return JSON.stringify(
                AWS.DynamoDB.Converter[order](parsed)
            );
        } catch (e) {
            console.error(e);
            process.exit(8);
        }
    }
}

/**
 * Exit codes:-
 * 1 -> input filename not specified
 * 2 -> unable to read input file
 * 4 -> unable to write to output file
 * 8 -> unable to (un)marshall the input
 */
