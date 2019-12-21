'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
/**
 * Arguments:-
 * i -> input file  (default -> stdin)
 * o -> output file (default -> stdout)
 * r -> reverse
 * s -> no of objects per file
 * t -> table name
 * a -> action (PUT)
 */
/**
 * Usage:- node marshaller.js -i input.json -o output.json -s 25 -t tableName -a PUT
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
            const resp = conv(json, {
                splits: argv.s || 1,
                action: argv.a,
                tableName: argv.t
            });
            if (Array.isArray(resp)) {
                writeBack(
                    resp, argv.o
                );
            }
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
        const resp = conv(input, {
            splits: argv.s || 1,
            action: argv.a,
            tableName: argv.t
        });
        writeBack(
            resp, argv.o
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
        let i;
        for (i = 0; i < returnData.length; ++i) {
            const fileNameRegex = /\.(?=\w*$)/;
            const outputName = fileNameRegex.test(output) ? output.replace(fileNameRegex, `_${i}.`) : `${output}_${i}`;
            fs.writeFile(outputName, JSON.stringify(returnData[i]), err => {
                if (err) {
                    process.exit(4);
                } else {
                    console.log('Marshall success');
                }
            })
        }
    } else {
        console.log(JSON.stringify(returnData));
    }
}

/**
 * 
 * @param {string} json: Stringified JSON data
 * @param {object} config: conversion configuration settings
 */
const conv = (json, {
    splits,
    action,
    tableName
}) => {
    const parsed = JSON.parse(json);
    switch (action) {
        case 'PUT': action = 'PutRequest'; break;
        default: action = null; break;
    }
    if (Array.isArray(parsed)) {
        let i, j, index = 0, tmp,
            convertedValue,
            result = [];
        const count = splits || parsed.length;
        try {
            for (i = 0; i < Math.ceil(parsed.length / count); ++i) {
                result.push([]);
                for (j = 0; j < count && index < parsed.length; ++j, ++index) {
                    convertedValue = AWS.DynamoDB.Converter[order](parsed[index]);
                    if (action) {
                        tmp = {};
                        tmp[action] = {
                            Item: convertedValue
                        };
                        result[i].push(tmp);
                    } else {
                        result[i].push(convertedValue);
                    }
                }
            }
            if (tableName) {
                result = result.map(res => {
                    tmp = {};
                    tmp[tableName] = res;
                    return tmp;
                });
            }
            return splits ? result : result[0];
        } catch (e) {
            console.error(e);
            process.exit(8);
        }
    } else {
        try {
            return AWS.DynamoDB.Converter[order](parsed);
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
